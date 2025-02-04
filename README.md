# 개요 
![youtube-skip-main](https://github.com/user-attachments/assets/da3fc582-3b61-4e04-9c43-4e3f6a0a12a9)
> 다보기엔 너무 지루한 유튜브영상을 텍스트로 요약해주는 웹서비스!

해당 프로젝트의 백엔드 서버 레포지토리 입니다.

## 작동법 
<details>
  <summary>작동법</summary>
 > node 서버와 whisper서버가 별도로 작동되니 두개의 터미널을 세팅하시는걸 추천 드립니다.
  
  ### Node 서버 라이브러리 설치 
  
  ```bash
 npm install #server 위치에서!

 
  ```
---

### Node 백엔드 서버 시동 

```bash
 node server.js #server 위치에서!
  ```

Node 서버 시동시 5000포트로 서버 시동
---

### Whisper 서버 가상환경 세팅 
```bash
activate.bat #server/whisper_server 위치에서!
```

---

### Whisper 서버 라이브러리 설치 
```bash
pip install -r requirements.txt #server/whisper_server 위치에서!
```

---

### Whisper 서버 시동
```bash
py whisper_server.py
```
Wishper 서버 시동시 5001포트로 서버 시동 
---






[프론트 서버 시동법](https://github.com/Dev-KUN-F/youtube-skip-front) 

</details>

## 기술 스택
### Node.js 서버
- Node.js
- Express.js
- axios
- cors
- openai
- multer

### Whisper 서버 

- Python
- Flask
- Whisper

