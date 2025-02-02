const express = require("express");
const youtubeRouter = require("./routes/youtube"); // youtube.js 파일 가져오기
const cors = require("cors"); //cors 설정 추가

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // 허용할 클라이언트 URL
    methods: ["GET", "POST", "OPTIONS"], // 허용할 HTTP 메서드
    credentials: true, // 쿠키 포함 요청을 허용하려면 true로 설정
  })
); //cors 사용으로 웹과 통신

app.options("*", cors()); // 모든 OPTIONS 요청 허용

app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 파싱

app.use("/youtube", youtubeRouter); // '/youtube' 경로와 youtube.js 연결

const PORT = 5000; // 포트는 5000 번 포트 사용
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
