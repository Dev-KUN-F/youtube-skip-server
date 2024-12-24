const express = require("express");
const youtubeRouter = require("./routes/youtube"); // youtube.js 파일 가져오기

const app = express();
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 데이터 파싱

app.use("/youtube", youtubeRouter); // '/youtube' 경로와 youtube.js 연결

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
