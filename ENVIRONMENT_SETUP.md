# 환경변수 설정 가이드

## 🚨 중요: 환경변수 설정이 필요합니다!

현재 `.env` 파일이 없어서 서버가 제대로 작동하지 않을 수 있습니다. 다음 단계를 따라 환경변수를 설정해주세요.

## 📋 필수 환경변수

### 1. 기본 설정
```env
NODE_ENV=development
PORT=3001
```

### 2. OpenAI API (필수)
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
```
- [OpenAI API 키 발급](https://platform.openai.com/api-keys)에서 발급받으세요
- 이미지 분석 기능에 필수입니다

### 3. 데이터베이스 (선택사항)
```env
MONGODB_URI=mongodb://localhost:27017/waste_sorting
```
- MongoDB가 설치되어 있지 않다면 이 설정은 생략 가능합니다

### 4. 세션 시크릿 (권장)
```env
SESSION_SECRET=your_random_secret_key_here
```
- 임의의 긴 문자열을 사용하세요

## 📋 선택적 환경변수

### Cloudinary (이미지 저장용)
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Google OAuth (로그인용)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 🔧 설정 방법

### 1. .env 파일 생성
프로젝트 루트 디렉토리에 `.env` 파일을 생성하세요:

```bash
# Windows
echo. > .env

# macOS/Linux
touch .env
```

### 2. 환경변수 추가
`.env` 파일에 다음 내용을 추가하세요:

```env
# 서버 환경변수
NODE_ENV=development
PORT=3001

# OpenAI API (필수)
OPENAI_API_KEY=your_actual_openai_api_key_here

# MongoDB 연결 (선택사항)
MONGODB_URI=mongodb://localhost:27017/waste_sorting

# 세션 시크릿 (권장)
SESSION_SECRET=your_random_secret_key_here

# Cloudinary 설정 (선택사항)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 클라이언트 URL (프로덕션용)
CLIENT_URL=https://your-client-name.onrender.com
```

### 3. 환경변수 확인
설정이 완료되면 다음 명령어로 확인할 수 있습니다:

```bash
npm run check-env
```

## 🚀 서버 실행

환경변수 설정이 완료되면 다음 명령어로 서버를 실행할 수 있습니다:

```bash
# 전체 애플리케이션 실행 (클라이언트 + 서버)
npm run dev

# 서버만 실행
npm run server-only

# 클라이언트만 실행
npm run client-only
```

## 🔍 문제 해결

### 1. 환경변수 확인
테스트 페이지(`/test`)에서 "서버 진단 실행" 버튼을 클릭하여 서버 상태를 확인할 수 있습니다.

### 2. 로그 확인
서버 콘솔에서 환경변수 관련 로그를 확인할 수 있습니다:
```
🔧 환경변수 확인:
  - OPENAI_API_KEY: 설정됨
  - CLOUDINARY_CLOUD_NAME: your_cloudinary_cloud_name
  - NODE_ENV: development
```

### 3. 일반적인 문제들
- **"OPENAI_API_KEY가 설정되지 않았습니다"**: OpenAI API 키를 발급받아 설정하세요
- **"MongoDB 연결 실패"**: MongoDB가 설치되어 있지 않다면 무시해도 됩니다
- **"CORS 오류"**: 서버가 올바른 포트에서 실행되고 있는지 확인하세요

## 📞 도움말

문제가 지속되면 다음을 확인해주세요:
1. `.env` 파일이 프로젝트 루트에 있는지
2. 환경변수 값이 올바르게 설정되었는지
3. 서버를 재시작했는지
4. 브라우저 캐시를 지웠는지 