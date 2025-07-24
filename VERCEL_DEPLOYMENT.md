# Vercel 배포 가이드

## 배포 전 준비사항

### 1. 서버 환경변수 설정
Vercel 대시보드에서 다음 환경변수를 설정하세요:

**Project Settings > Environment Variables**에서 추가:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_APPLICATION_CREDENTIALS=your_google_credentials_json
```

### 2. 클라이언트 환경변수 설정
Vercel 대시보드에서 **Client** 프로젝트의 환경변수:

```
REACT_APP_API_URL=https://your-server-domain.vercel.app/api
REACT_APP_AUTH_URL=https://your-server-domain.vercel.app/auth
REACT_APP_ANALYZE_URL=https://your-server-domain.vercel.app/analyze
```

## 배포 단계

### 1. 서버 배포
```bash
# 서버 디렉토리에서
cd server
vercel --prod
```

### 2. 클라이언트 배포
```bash
# 클라이언트 디렉토리에서
cd client
vercel --prod
```

### 3. 루트에서 전체 배포
```bash
# 프로젝트 루트에서
vercel --prod
```

## 주의사항

1. **MongoDB 연결**: MongoDB Atlas를 사용하고 외부 접근을 허용해야 합니다.
2. **파일 업로드**: Cloudinary가 이미 설정되어 있으므로 Vercel에서도 정상 작동합니다.
3. **세션 관리**: Vercel에서는 서버리스 환경이므로 Redis나 MongoDB 세션 스토어를 사용하세요.
4. **Google Vision API**: Google Cloud Platform에서 서비스 계정 키를 생성하고 환경변수로 설정하세요.

## 문제 해결

### 404 에러가 발생하는 경우:
1. `vercel.json` 설정 확인
2. 라우트 경로 확인
3. 빌드 로그 확인

### API 호출이 실패하는 경우:
1. 환경변수 설정 확인
2. CORS 설정 확인
3. API 엔드포인트 경로 확인

### 파일 업로드가 실패하는 경우:
1. Cloudinary 환경변수 확인
2. 파일 크기 제한 확인
3. 업로드 디렉토리 권한 확인 