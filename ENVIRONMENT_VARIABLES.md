# 환경 변수 설정 가이드

## 🔧 Vercel 배포 시 필요한 환경 변수

### 필수 환경 변수 (배포 전 반드시 설정)

#### 1. 데이터베이스
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste_sorting
```

#### 2. OpenAI API
```
OPENAI_API_KEY=sk-your-openai-api-key
```

#### 3. Cloudinary (이미지 저장)
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### 4. Google Cloud Vision API (로고 탐지)
다음 중 하나의 방법 선택:

**방법 1: 서비스 계정 키 파일 경로**
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

**방법 2: 환경 변수로 직접 설정 (권장)**
```
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

#### 5. Google OAuth (소셜 로그인)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 6. 세션 보안
```
SESSION_SECRET=your-super-secret-session-key
```

### 선택적 환경 변수

#### 7. 개발 환경 설정
```
NODE_ENV=production
```

## 🚀 Vercel 설정 방법

1. **Vercel 대시보드** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 위의 환경 변수들을 **Production** 환경에 추가
4. **Preview** 환경에도 동일하게 추가 (선택사항)

## ⚠️ 주의사항

### Google Cloud Private Key 설정
- Private Key는 여러 줄로 구성되어 있으므로 **따옴표로 감싸야 함**
- `\n` 문자를 실제 줄바꿈으로 변환해야 함
- Vercel에서는 환경 변수 값에 줄바꿈이 포함될 수 있음

### 보안
- 모든 API 키는 **절대 GitHub에 커밋하지 마세요**
- `.env` 파일은 `.gitignore`에 포함되어 있음
- Vercel 환경 변수는 암호화되어 저장됨

## 🔍 환경 변수 확인 방법

배포 후 다음 API 엔드포인트로 환경 변수 설정을 확인할 수 있습니다:

```
GET /api/health
```

## 📝 로컬 개발용 .env 파일 예시

```env
# 데이터베이스
MONGODB_URI=mongodb://localhost:27017/waste_sorting

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Cloud Vision
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 세션
SESSION_SECRET=your-super-secret-session-key

# 환경
NODE_ENV=development
``` 