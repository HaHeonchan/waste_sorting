# 🧹 쓰레기 분류 시스템

OpenAI GPT-4 Vision API와 Google Vision API의 Logo Detection을 결합한 고정밀 이미지 기반 쓰레기 분류 시스템입니다.

## 🚀 기능

- 이미지 업로드 및 미리보기
- **Google Vision API Logo Detection**을 통한 분리수거 마크 탐지
- **OpenAI GPT-4 Vision API**를 통한 쓰레기 분류
- **이중 분석 시스템**으로 정확도 향상
- 4가지 카테고리 분류: 일반쓰레기, 재활용품, 음식물쓰레기, 유해폐기물
- 실시간 분석 결과 제공
- 분리수거 마크 탐지 결과 시각화
- 실시간 신뢰도 점수 제공
- 로고와 텍스트 기반 이중 검증 시스템

## 📋 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 API 키들을 설정하세요:
```
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json
PORT=3000
NODE_ENV=development
```

### 3. Google Vision API 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. Vision API 활성화
3. 서비스 계정 생성 및 키 다운로드
4. 다운로드한 JSON 파일을 `google-credentials.json`으로 이름 변경하여 프로젝트 루트에 저장

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 5. 브라우저에서 접속
```
http://localhost:3000
```

## 🔧 API 엔드포인트

### POST /analyze/upload-analyze
이미지를 업로드하고 Google Vision API와 OpenAI GPT-4 Vision API로 이중 분석합니다.

**요청:**
- Content-Type: multipart/form-data
- Body: image (이미지 파일)

**응답:**
```json
{
  "message": "이미지 분석 완료 (로고 탐지 포함)",
  "analysis": {
    "analysis": {
      "wasteType": "플라스틱",
      "subType": "PET병",
      "recyclingMark": "재활용 가능",
      "description": "투명한 플라스틱 병",
      "disposalMethod": "플라스틱 재활용함에 배출",
      "confidence": 0.95
    },
    "model": "gpt-4-vision-preview",
    "usage": {
      "total_tokens": 123
    }
  },
  "logoDetection": {
    "hasRecyclingMarks": true,
    "confidence": 0.92,
    "summary": "로고에서 분리수거 마크가 확인됨",
    "logos": [
      {
        "description": "recycle",
        "confidence": 0.95
      }
    ],
    "recyclingKeywords": ["plastic", "recycle"]
  }
}
```

## 📁 프로젝트 구조

```
waste_sorting/
├── client/
│   └── analyze/
│       ├── waste-sorting.html    # 분석 페이지 UI
│       ├── script.js             # 프론트엔드 JavaScript
│       └── styles.css            # 스타일시트
├── controllers/
│   └── analyze/
│       ├── analyze.js            # 메인 분석 컨트롤러
│       ├── logo-detector.js      # Google Vision API 로고 탐지
│       ├── image-optimizer.js    # 이미지 최적화
│       ├── cache.js              # 캐시 관리
│       └── prompts.js            # GPT 프롬프트
├── routes/
│   └── analyze/
│       └── analyze.js            # 분석 라우트
├── data/
│   └── waste-disposal-guides.json # 폐기물 처리 가이드
├── src/
│   └── app.js                    # Express 앱 설정
├── server.js                     # 서버 시작점
├── google-credentials.json       # Google Vision API 인증 정보
└── package.json
```

## 🛠️ 기술 스택

- **Backend:** Node.js, Express.js
- **AI:** OpenAI GPT-4 Vision API, Google Vision API
- **File Upload:** Multer
- **Image Processing:** Sharp
- **Frontend:** HTML, CSS, JavaScript

## 📝 사용법

1. 브라우저에서 `http://localhost:3000/analyze` 접속
2. "이미지 선택" 버튼 클릭
3. 분석할 쓰레기 이미지 선택
4. "분석하기" 버튼 클릭
5. Google Vision API와 GPT-4 Vision API의 이중 분석 결과 확인
6. 분리수거 마크 탐지 결과 및 신뢰도 확인

## ⚠️ 주의사항

- OpenAI API 키와 Google Cloud Vision API 키가 필요합니다
- 이미지 파일 크기는 5MB 이하여야 합니다
- 지원 형식: JPG, PNG, GIF, WebP
- API 사용량에 따라 비용이 발생할 수 있습니다
- Google Vision API는 분리수거 마크 탐지에 특화되어 있습니다

## 🔄 향후 개선 사항

- [x] Google Vision API 로고 탐지 통합
- [x] 분리수거 마크 탐지 기능
- [x] 이중 분석 시스템으로 정확도 향상
- [ ] 다국어 지원
- [ ] 모바일 앱 개발
- [ ] 분류 히스토리 저장
- [ ] 사용자 인증 시스템
- [ ] 실시간 카메라 분석
- [ ] 분리수거 마크 데이터베이스 확장
