# Render 배포 가이드

이 프로젝트는 client와 server를 분리하여 Render에 배포합니다.

## 1. 서버 배포 (Node.js)

### 1.1 Render에서 새 Web Service 생성
- **Name**: `waste-sorting-server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `server`

### 1.2 환경변수 설정
Render 대시보드에서 다음 환경변수들을 설정하세요:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=your_session_secret
CLIENT_URL=https://your-client-name.onrender.com
```

### 1.3 서버 URL 확인
배포 완료 후 서버 URL을 확인하세요 (예: `https://waste-sorting-server.onrender.com`)

## 2. 클라이언트 배포 (React)

### 2.1 Render에서 새 Static Site 생성
- **Name**: `waste-sorting-client`
- **Build Command**: `./build.sh`
- **Publish Directory**: `build`
- **Root Directory**: `client`

### 2.2 환경변수 설정
클라이언트에서 다음 환경변수를 설정하세요:

```
REACT_APP_API_URL=https://your-server-name.onrender.com
```

### 2.2 build.sh 실행 권한 설정
Render에서 build.sh 파일에 실행 권한을 부여해야 합니다. 
Render 대시보드의 Environment 섹션에서 다음 명령어를 추가하세요:

```
chmod +x build.sh
```

## 3. 배포 후 확인사항

1. **서버 상태 확인**: 서버 URL로 접속하여 API가 정상 작동하는지 확인
2. **클라이언트 상태 확인**: 클라이언트 URL로 접속하여 React 앱이 정상 로드되는지 확인
3. **API 연결 확인**: 클라이언트에서 서버 API를 정상적으로 호출하는지 확인

## 4. 문제 해결

### 4.1 CORS 오류
- 서버의 CORS 설정에서 클라이언트 URL이 올바르게 설정되었는지 확인
- `CLIENT_URL` 환경변수가 올바른 클라이언트 URL로 설정되었는지 확인

### 4.2 빌드 오류
- `build.sh` 파일에 실행 권한이 있는지 확인
- 모든 의존성이 올바르게 설치되었는지 확인

### 4.3 환경변수 오류
- 모든 필수 환경변수가 설정되었는지 확인
- 환경변수 이름이 정확한지 확인

## 5. 로컬 개발

로컬에서 개발할 때는:

```bash
# 루트 디렉토리에서
npm run install:all
npm run dev
```

이렇게 하면 client(포트 3000)와 server(포트 3001)가 동시에 실행됩니다. 