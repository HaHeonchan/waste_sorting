# Waste Sorting App - Vercel 배포 가이드

## 📋 프로젝트 구조

```
waste_sorting/
├── client/                 # React 프론트엔드
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                 # Node.js 백엔드
│   ├── src/
│   ├── server.js
│   └── package.json
├── vercel.json            # Vercel 배포 설정
└── package.json           # 루트 패키지 설정
```

## 🚀 Vercel 배포 설정

### 1. vercel.json 설정
프로젝트 루트에 `vercel.json` 파일이 있으며, 다음과 같이 설정되어 있습니다:

- **서버**: `server/server.js`를 Node.js 서버리스 함수로 빌드
- **클라이언트**: `client/package.json`을 정적 사이트로 빌드
- **라우팅**: API 요청은 서버로, 나머지는 React 앱으로 처리

### 2. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

```
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLOUD_CREDENTIALS=your_google_cloud_credentials
CLOUDINARY_URL=your_cloudinary_url
SESSION_SECRET=your_session_secret
```

### 3. 배포 단계

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "Vercel 배포 준비"
   git push origin main
   ```

2. **Vercel에서 프로젝트 임포트**
   - Vercel 대시보드에서 "New Project" 클릭
   - GitHub 저장소 선택
   - Root Directory를 프로젝트 루트로 설정 (변경하지 않음)

3. **빌드 설정 확인**
   - Framework Preset: Other
   - Build Command: 비워두기 (vercel.json이 처리)
   - Output Directory: 비워두기 (vercel.json이 처리)

4. **환경 변수 설정**
   - Settings → Environment Variables에서 위의 환경 변수들 추가

5. **배포**
   - "Deploy" 버튼 클릭

## 🔧 로컬 개발

```bash
# 모든 의존성 설치
npm run install:all

# 개발 서버 시작
npm run dev
```

## 📁 주요 파일 설명

- `vercel.json`: Vercel 배포 설정
- `server/server.js`: 서버 진입점 (Vercel에서 서버리스 함수로 실행)
- `client/src/config.js`: API URL 설정 (프로덕션/개발 환경 자동 감지)
- `client/public/_redirects`: SPA 라우팅 설정

## 🌐 배포 후 확인사항

1. **API 엔드포인트**: `https://your-domain.vercel.app/api/health`
2. **프론트엔드**: `https://your-domain.vercel.app/`
3. **쓰레기 분류**: `https://your-domain.vercel.app/`
4. **민원 게시판**: `https://your-domain.vercel.app/complain`

## ⚠️ 주의사항

- MongoDB 연결이 필요하므로 MongoDB Atlas 사용 권장
- 파일 업로드는 Cloudinary를 통해 처리
- Google Cloud Vision API 키 필요
- OpenAI API 키 필요 