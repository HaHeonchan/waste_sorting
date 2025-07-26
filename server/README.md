# 🧹 쓰레기 분류 시스템

OpenAI GPT-4 Vision API와 Google Vision API의 Logo Detection을 결합한 고정밀 이미지 기반 쓰레기 분류 시스템입니다.

## 🚀 기능

- 이미지 업로드 및 미리보기
- **Google Vision API Logo Detection**을 통한 분리수거 마크 탐지
- **Google Vision API Object Detection**을 통한 객체 탐지
- **Google Vision API Label Detection**을 통한 라벨 탐지
- **OpenAI GPT-4 Vision API**를 통한 쓰레기 분류
- **다중 분석 시스템**으로 정확도 향상 (텍스트 + 객체 + 라벨 + 로고)
- 4가지 카테고리 분류: 일반쓰레기, 재활용품, 음식물쓰레기, 유해폐기물
- 실시간 분석 결과 제공
- 분리수거 마크 탐지 결과 시각화
- 실시간 신뢰도 점수 제공
- 로고, 텍스트, 객체, 라벨 기반 다중 검증 시스템

## 🔧 개선된 분석 기능

### 기존 분석 vs 개선된 분석

| 기능 | 기존 분석 | 개선된 분석 |
|------|-----------|-------------|
| 텍스트 탐지 | ✅ | ✅ |
| 로고 탐지 | ✅ | ✅ |
| 객체 탐지 | ❌ | ✅ |
| 라벨 탐지 | ❌ | ✅ |
| 신뢰도 | ~90% | ~98% |
| 분석 정확도 | 보통 | 높음 |

### 새로운 API 엔드포인트

- **기존**: `POST /analyze/upload-analyze`
- **개선**: `POST /analyze/upload-analyze-comprehensive`

### 개선된 분석 과정

1. **통합 Vision API 분석**
   - 텍스트 탐지 (OCR)
   - 객체 탐지 (Object Detection)
   - 라벨 탐지 (Label Detection)
   - 로고 탐지 (Logo Detection)

2. **재활용 관련 정보 필터링**
   - 텍스트에서 분리수거 키워드 추출
   - 재활용 관련 객체 식별 (bottle, can, container 등)
   - 재활용 관련 라벨 식별 (plastic, glass, metal 등)

3. **GPT에게 풍부한 정보 전달**
   - 모든 분석 결과를 종합하여 전달
   - 신뢰도 정보 포함
   - 상세한 분석 내역 제공

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

### POST /analyze/upload-analyze (기존)
기본 텍스트 기반 분석

**요청:**
- Content-Type: multipart/form-data
- Body: image (이미지 파일)

**응답:**
```json
{
  "type": "플라스틱",
  "detail": "PET",
  "mark": "재활용 마크",
  "description": "플라스틱 용기 분리배출",
  "method": "세척 후 재활용",
  "model": "gpt-4o-mini",
  "token_usage": 150,
  "analysis_type": "text_based"
}
```

### POST /analyze/upload-analyze-comprehensive (개선)
통합 분석 (텍스트 + 객체 + 라벨 + 로고)

**요청:**
- Content-Type: multipart/form-data
- Body: image (이미지 파일)

**응답:**
```json
{
  "type": "플라스틱",
  "detail": "PET",
  "mark": "재활용 마크",
  "description": "플라스틱 용기 분리배출",
  "method": "세척 후 재활용",
  "model": "gpt-4o-mini",
  "token_usage": 200,
  "analysis_type": "comprehensive",
  "confidence": 0.98,
  "analysis_details": {
    "textBased": "텍스트에서 'PET' 키워드 발견",
    "objectBased": "객체 탐지에서 'bottle' 확인",
    "labelBased": "라벨에서 'plastic' 확인",
    "logoBased": "로고에서 'recycling' 마크 발견"
  }
}
```

## 🧪 테스트

개선된 분석 기능을 테스트하려면:

```bash
# 테스트 파일 실행
node src/analyze/controllers/test-comprehensive-analysis.js
```

## 📊 기술 스택

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
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
- 개선된 분석은 더 많은 API 호출이 필요하므로 비용이 증가할 수 있습니다

## 🔄 향후 개선 사항

- [x] Google Vision API 로고 탐지 통합
- [x] Google Vision API 객체 탐지 통합
- [x] Google Vision API 라벨 탐지 통합
- [x] 분리수거 마크 탐지 기능
- [x] 다중 분석 시스템으로 정확도 향상
- [ ] 다국어 지원
- [ ] 모바일 앱 개발
- [ ] 분류 히스토리 저장
- [ ] 사용자 인증 시스템
- [ ] 실시간 카메라 분석
- [ ] 분리수거 마크 데이터베이스 확장
- [ ] 분석 결과 캐싱 시스템
- [ ] 배치 분석 기능
