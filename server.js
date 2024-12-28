const express = require("express");
const youtubeRouter = require("./routes/youtube"); // youtube.js 파일 가져오기
const cors = require("cors"); //cors 설정 추가

const app = express();
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 파싱

app.use("/youtube", youtubeRouter); // '/youtube' 경로와 youtube.js 연결

app.use(cors()); //cors 사용으로 웹과 통신

const PORT = 5000; // 포트는 5000 번 포트 사용
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
