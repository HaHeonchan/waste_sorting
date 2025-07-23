# Controllers

쓰레기 분류 시스템의 컨트롤러 모듈들입니다. 이미지 분석 및 분류를 위한 핵심 로직을 담당합니다.

## 📁 폴더 구조

```
controllers/
├── analyze/                    # 이미지 분석 관련 컨트롤러
│   ├── analyze.js             # 메인 분석 컨트롤러
│   ├── cache.js               # 캐시 시스템
│   ├── cloudinary-storage.js  # Cloudinary 이미지 저장
│   ├── image-optimizer.js     # 이미지 최적화
│   ├── logo-detector.js       # 로고 및 텍스트 탐지
│   └── prompts.js             # GPT 프롬프트 정의
└── README.md                  # 이 파일
```

## 🔧 모듈 설명

### 1. analyze.js - 메인 분석 컨트롤러
- **역할**: 이미지 업로드 및 분석의 메인 컨트롤러
- **주요 기능**:
  - 이미지 업로드 처리 (Multer 사용)
  - Cloudinary 이미지 저장
  - 캐시 확인 및 저장
  - 이미지 최적화
  - Google Vision API + GPT 분석 통합
  - 임시 파일 정리

### 2. cloudinary-storage.js - Cloudinary 이미지 저장
- **역할**: 이미지를 Cloudinary 클라우드에 저장하고 관리
- **주요 기능**:
  - Cloudinary 이미지 업로드/삭제
  - 최적화된 이미지 URL 생성
  - 이미지 메타데이터 관리
  - MongoDB 적용을 위한 인터페이스 제공

### 3. cache.js - 캐시 시스템
- **역할**: 이미지 분석 결과를 캐시하여 성능 향상
- **주요 기능**:
  - MD5 해시 기반 이미지 캐시
  - 24시간 캐시 만료
  - 캐시 통계 및 정리
  - 파일 기반 저장

### 4. image-optimizer.js - 이미지 최적화
- **역할**: API 호출을 위한 이미지 크기 및 품질 최적화
- **주요 기능**:
  - Sharp 라이브러리를 사용한 이미지 리사이징
  - 텍스트 분석용 이미지 선명도 향상
  - 이미지 메타데이터 분석
  - 품질 비교 및 통계

### 5. logo-detector.js - 로고 및 텍스트 탐지
- **역할**: Google Vision API를 사용한 재활용 마크 및 텍스트 인식
- **주요 기능**:
  - 텍스트 탐지 (OCR)
  - 복합 텍스트 분석 (예: "뚜껑+라벨 : 플라스틱")
  - 재활용 키워드 매칭
  - 신뢰도 계산

### 6. prompts.js - GPT 프롬프트 정의
- **역할**: GPT 모델에 전달할 프롬프트 템플릿 정의
- **주요 프롬프트**:
  - `TEXT_BASED_ANALYSIS_PROMPT`: 텍스트 분석 결과 기반 분류
  - `DIRECT_IMAGE_ANALYSIS_PROMPT`: 이미지 직접 분석
  - `WASTE_ANALYSIS_PROMPT`: 기본 쓰레기 분석

## 🔄 분석 플로우

1. **이미지 업로드** → `analyze.js`
2. **캐시 확인** → `cache.js`
3. **Cloudinary 업로드** → `cloudinary-storage.js`
4. **이미지 최적화** → `image-optimizer.js`
5. **텍스트/로고 탐지** → `logo-detector.js`
6. **GPT 분석** → `prompts.js` + OpenAI API
7. **결과 캐시 저장** → `cache.js`
8. **임시 파일 정리** → `analyze.js`

## 🛠️ 사용법

### 기본 사용
```javascript
const analyzeController = require('./controllers/analyze/analyze');

// 분석 페이지 렌더링
app.get('/analyze', analyzeController.getAnalyzePage);

// 이미지 업로드 및 분석
app.post('/analyze/upload', analyzeController.uploadAndAnalyzeImage);
```

### Cloudinary 사용
```javascript
const { uploadAndStoreImage, getImageUrl } = require('./controllers/analyze/cloudinary-storage');

// 이미지 업로드
const result = await uploadAndStoreImage(imagePath, {
    folder: 'waste-sorting',
    tags: ['waste-analysis']
});

// 최적화된 URL 가져오기
const optimizedUrl = getImageUrl(result.cloudinaryId, {
    width: 800,
    height: 800,
    quality: 'auto'
});
```

## 📊 API 응답 형식

### 성공 응답
```json
{
  "message": "이미지 분석 완료",
  "wasteType": "플라스틱",
  "subType": "PET",
  "recyclingMark": "PET 1",
  "description": "투명한 플라스틱 병입니다.",
  "disposalMethod": "플라스틱 재활용함에 버리세요.",
  "confidence": 0.95,
  "analysisType": "text_based",
  "optimization": {
    "applied": true,
    "originalSize": 2048576,
    "optimizedSize": 512000
  },
  "cloudinary": {
    "id": "waste-sorting/image-123456",
    "url": "https://res.cloudinary.com/.../image.jpg",
    "optimizedUrl": "https://res.cloudinary.com/.../w_800,h_800,q_auto/image.jpg"
  }
}
```

### 에러 응답
```json
{
  "error": "이미지 분석 중 오류가 발생했습니다.",
  "details": "구체적인 에러 메시지"
}
```

## 🔧 환경 설정

### 필수 환경 변수
```bash
# OpenAI API 키
OPENAI_API_KEY=your_openai_api_key

# Google Vision API 인증 파일 경로 (선택사항)
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# Cloudinary 설정
CLOUDINARY_CLOUD_NAME=dogfzdt6c
CLOUDINARY_API_KEY=217249691364428
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```

### 의존성 패키지
```json
{
  "openai": "^4.0.0",
  "multer": "^1.4.5",
  "sharp": "^0.32.0",
  "@google-cloud/vision": "^3.0.0",
  "cloudinary": "^2.7.0"
}
```

## 🚀 성능 최적화

1. **캐시 시스템**: 동일한 이미지 재분석 방지
2. **Cloudinary CDN**: 전 세계 빠른 이미지 제공
3. **이미지 최적화**: API 호출 비용 절약
4. **비동기 처리**: 응답 시간 단축
5. **임시 파일 정리**: 디스크 공간 관리

## 🐛 디버깅

각 모듈은 상세한 로그를 출력합니다:
- 📁 파일 경로 정보
- ☁️ Cloudinary 업로드 상태
- 📊 이미지 정보 및 통계
- 🔍 분석 과정 상세 로그
- ✅ 성공/❌ 실패 상태 표시
- 📋 캐시 동작 로그

## 📝 주의사항

1. **파일 크기 제한**: 5MB (OpenAI API 제한)
2. **지원 형식**: 이미지 파일만 (JPG, PNG, GIF 등)
3. **API 키 보안**: 환경 변수로 관리
4. **임시 파일**: 분석 완료 후 자동 삭제
5. **캐시 만료**: 24시간 후 자동 삭제
6. **Cloudinary 제한**: 무료 계정의 경우 월 사용량 제한

## 🔮 MongoDB 적용 계획

현재 구조는 MongoDB 적용을 고려하여 설계되었습니다:

1. **cloudinary-storage.js**: `createImageRecord`, `updateImageRecord`, `deleteImageRecord` 함수 제공
2. **분리된 관심사**: 이미지 저장과 분석 결과 저장 분리
3. **확장 가능한 구조**: 새로운 저장소 추가 시 쉽게 교체 가능

MongoDB 적용 시:
- `createImageRecord` 함수에서 실제 MongoDB 저장 로직 구현
- `updateImageRecord` 함수에서 분석 결과 업데이트 로직 구현
- `deleteImageRecord` 함수에서 MongoDB 레코드 삭제 로직 구현 