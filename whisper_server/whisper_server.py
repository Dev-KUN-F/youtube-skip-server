from flask import Flask, request, jsonify
import whisper
import os

app = Flask(__name__)

# Whisper 모델 로드 (GPU 사용)
model = whisper.load_model("base", device="cuda")

# 오디오 저장 디렉토리
AUDIO_DIR = "../audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    audio_file = request.files["file"]
    file_path = os.path.join(AUDIO_DIR, audio_file.filename)

    try:
        # 오디오 파일 저장
        audio_file.save(file_path)

        # Whisper를 사용해 텍스트 변환
        result = model.transcribe(file_path)
        return jsonify({"text": result["text"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
