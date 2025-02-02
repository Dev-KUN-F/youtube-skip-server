const dotenv = require("dotenv").config(); // .env 파일 로드
const express = require("express");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { exec } = require("child_process");
const axios = require("axios"); // Python 서버와 통신용
const FormData = require("form-data"); // FormData 생성용
const openai = require("openai"); // OpenAI API 사용

const router = express.Router();

const audioDir = path.join(__dirname, "../audio");
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);

// OpenAI API 설정
const openaiClient = new openai({
  apiKey: process.env.OPENAI_API_KEY, // 환경 변수에서 API 키 로드
});

// Python 서버 URL 설정
const pythonServerUrl = "http://127.0.0.1:5001";

router.post("/process", async (req, res) => {
  const videoUrl = req.body.videoUrl;
  if (!videoUrl) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  // YouTube 비디오 ID 추출
  const videoId = (() => {
    try {
      const parsedUrl = new URL(videoUrl);
      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.slice(1);
      } else if (parsedUrl.searchParams.has("v")) {
        return parsedUrl.searchParams.get("v");
      }
      return null;
    } catch (error) {
      console.error("Error parsing video URL:", error.message);
      return null;
    }
  })();
  console.log("Extracted videoId:", videoId);

  if (!videoId) {
    return res
      .status(400)
      .json({ error: "Invalid or unsupported YouTube URL" });
  }

  try {
    // 자막 다운로드 명령 실행
    const subtitleCommand = `yt-dlp --write-auto-sub --sub-lang ko --skip-download --output "${audioDir}/%(id)s" "${videoUrl}"`;
    console.log("Running subtitle command:", subtitleCommand);

    const execPromise = util.promisify(exec);
    await execPromise(subtitleCommand);

    // 다운로드된 자막 파일 확인
    const files = fs.readdirSync(audioDir);
    console.log("Directory contents:", files);

    const subtitleFile = files.find(
      (file) => file.startsWith(videoId) && file.endsWith(".ko.vtt")
    );

    let cleanedContent = ""; // cleanedContent 변수 초기화

    if (subtitleFile) {
      const subtitlePath = path.join(audioDir, subtitleFile);
      console.log("Subtitle file detected:", subtitlePath);

      // 원본 자막 데이터 읽기 및 정리
      const subtitleContent = fs
        .readFileSync(subtitlePath, "utf-8")
        .replace(/<[^>]*>/g, "") // HTML 태그 제거
        .trim();

      // 시간 정보와 align 정보를 제거하는 정규식
      cleanedContent = subtitleContent.replace(
        /(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}) align:start position:\d+%\n?/g,
        ""
      );
      console.log("Processed subtitle content:", cleanedContent);
      fs.unlinkSync(subtitlePath); // 사용 후 자막 파일 삭제
    } else {
      console.warn("Subtitle not found, proceeding to audio transcription...");

      // 자막이 없을 경우 음성 파일 추출
      const audioPath = await extractAudio(videoId, videoUrl);

      // Python 서버로 음성 파일 전송 및 Whisper 결과 수신
      cleanedContent = await processAudioWithPython(audioPath);
    }

    // 긴 텍스트를 처리하기 위해 청크로 나누어 요청
    const summary = await summarizeTextInChunks(cleanedContent);
    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Error processing request:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 음성 파일 추출
async function extractAudio(videoId, videoUrl) {
  try {
    const audioOutputPath = path.join(audioDir, `${videoId}.mp3`);
    const audioCommand = `yt-dlp -x --audio-format mp3 --output "${audioOutputPath}" "${videoUrl}"`;
    console.log("Running audio extraction command:", audioCommand);

    const execPromise = util.promisify(exec);
    await execPromise(audioCommand);

    console.log("Audio file extracted:", audioOutputPath);
    return audioOutputPath;
  } catch (error) {
    console.error("Error extracting audio:", error.message);
    throw new Error("Failed to extract audio from video.");
  }
}

// Python 서버에 음성 파일 전송
async function processAudioWithPython(audioPath) {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioPath)); // Python 서버에서 기대하는 "file" 키 사용

    const response = await axios.post(
      `${pythonServerUrl}/transcribe`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    console.log("Received response from Python server:", response.data);
    return response.data.text; // Python 서버에서 반환된 텍스트
  } catch (error) {
    console.error("Error processing audio with Python server:", error.message);
    throw new Error("Failed to process audio on Python server.");
  } finally {
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); // 사용 후 파일 삭제
  }
}

// 긴 텍스트를 청크로 나누기
function chunkText(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// OpenAI API로 요약 요청
async function summarizeTextInChunks(text) {
  const chunkSize = 3000; // 각 청크의 최대 크기 (토큰 수에 맞게 설정)
  const chunks = chunkText(text, chunkSize);
  const summaries = [];

  console.log(`Splitting text into ${chunks.length} chunks...`);

  for (const chunk of chunks) {
    const summary = await summarizeText(chunk);
    summaries.push(summary);
  }

  // 모든 청크의 요약을 합쳐서 반환
  return summaries.join("\n\n");
}

// 개별 청크 요약
async function summarizeText(text) {
  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `다음 텍스트를 한국어로 변역하고 중복된 내용은 하나로 통일, 간결하게 요약하고, 대화문이 아닌 정보문 형식으로 보기 쉽게 항목별로 나열후 줄바꿈을 적용해 주세요 :\n\n${text}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    if (
      response.choices &&
      response.choices[0] &&
      response.choices[0].message
    ) {
      return response.choices[0].message.content.trim(); // 요약 텍스트 반환
    } else {
      throw new Error("Unexpected API response format.");
    }
  } catch (error) {
    console.error("Error summarizing text:", error.message);
    throw new Error("Failed to summarize text.");
  }
}

module.exports = router;
