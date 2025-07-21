# 🧹 쓰레기 분류 시스템

OpenAI GPT-4 Vision API를 활용한 이미지 기반 쓰레기 분류 시스템입니다.

## 🚀 기능

- 이미지 업로드 및 미리보기
- GPT-4 Vision API를 통한 쓰레기 분류
- 4가지 카테고리 분류: 일반쓰레기, 재활용품, 음식물쓰레기, 유해폐기물
- 실시간 분석 결과 제공

## 📋 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 OpenAI API 키를 설정하세요:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

### 3. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 4. 브라우저에서 접속
```
http://localhost:3000
```

## 🔧 API 엔드포인트

### POST /camera/upload-analyze
이미지를 업로드하고 GPT-4 Vision API로 분석합니다.

**요청:**
- Content-Type: multipart/form-data
- Body: image (이미지 파일)

**응답:**
```json
{
  "message": "이미지 분석 완료",
  "analysis": {
    "classification": "분류 결과 및 설명",
    "model": "gpt-4-vision-preview",
    "usage": {
      "total_tokens": 123
    }
  }
}
```

## 📁 프로젝트 구조

```
waste_sorting/
├── client/
│   └── index.html          # 프론트엔드 UI
├── controllers/
│   └── camera/
│       └── camera.js       # 카메라 컨트롤러
├── routes/
│   └── camera/
│       └── camera.js       # 카메라 라우트
├── src/
│   └── app.js             # Express 앱 설정
├── server.js              # 서버 시작점
└── package.json
```

## 🛠️ 기술 스택

- **Backend:** Node.js, Express.js
- **AI:** OpenAI GPT-4 Vision API
- **File Upload:** Multer
- **Frontend:** HTML, CSS, JavaScript

## 📝 사용법

1. 브라우저에서 `http://localhost:3000` 접속
2. "이미지 선택" 버튼 클릭
3. 분석할 쓰레기 이미지 선택
4. "분석하기" 버튼 클릭
5. GPT-4 Vision API의 분석 결과 확인

## ⚠️ 주의사항

- OpenAI API 키가 필요합니다
- 이미지 파일 크기는 10MB 이하여야 합니다
- 지원 형식: JPG, PNG, GIF
- API 사용량에 따라 비용이 발생할 수 있습니다

## 🔄 향후 개선 사항

- [ ] 분류 정확도 향상
- [ ] 다국어 지원
- [ ] 모바일 앱 개발
- [ ] 분류 히스토리 저장
- [ ] 사용자 인증 시스템
