# Vercel 배포 가이드

## 배포 전 준비사항

### 1. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

#### 서버 환경 변수 (Vercel 프로젝트 설정 > Environment Variables)
- `MONGODB_URI`: MongoDB 연결 문자열
- `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 클라이언트 시크릿
- `OPENAI_API_KEY`: OpenAI API 키
- `CLOUDINARY_CLOUD_NAME`: Cloudinary 클라우드 이름
- `CLOUDINARY_API_KEY`: Cloudinary API 키
- `CLOUDINARY_API_SECRET`: Cloudinary API 시크릿
- `SESSION_SECRET`: 세션 시크릿 키

#### 클라이언트 환경 변수
- `REACT_APP_API_URL`: API 기본 URL (선택사항, 자동으로 설정됨)

### 2. MongoDB Atlas 설정
- MongoDB Atlas에서 데이터베이스를 생성하고 연결 문자열을 준비
- Network Access에서 모든 IP (0.0.0.0/0) 허용 또는 Vercel IP 허용

### 3. Google OAuth 설정
- Google Cloud Console에서 OAuth 2.0 클라이언트 생성
- 승인된 리디렉션 URI에 Vercel 도메인 추가

## 배포 단계

### 1. Vercel CLI 설치
```bash
npm i -g vercel
```

### 2. Vercel 로그인
```bash
vercel login
```

### 3. 프로젝트 배포
```bash
vercel
```

또는 GitHub 연동 후 자동 배포:
1. GitHub에 코드 푸시
2. Vercel 대시보드에서 "New Project" 클릭
3. GitHub 저장소 선택
4. 환경 변수 설정
5. 배포

## 배포 후 확인사항

1. **API 엔드포인트 확인**: `https://your-domain.vercel.app/api/health`
2. **프론트엔드 확인**: `https://your-domain.vercel.app`
3. **데이터베이스 연결 확인**: 로그에서 MongoDB 연결 상태 확인
4. **OAuth 로그인 테스트**: Google 로그인 기능 확인

## 문제 해결

### MongoDB 연결 실패
- MongoDB Atlas의 Network Access 설정 확인
- 연결 문자열 형식 확인

### CORS 오류
- 서버의 CORS 설정이 올바른지 확인
- 클라이언트의 API 호출 URL 확인

### 환경 변수 오류
- Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- 환경 변수 이름이 코드와 일치하는지 확인

## 파일 구조
```
waste_sorting/
├── api/
│   └── index.js          # Vercel 서버리스 함수
├── client/               # React 프론트엔드
├── server/               # Express 백엔드 (로컬 개발용)
├── vercel.json           # Vercel 배포 설정
└── DEPLOYMENT.md         # 이 파일
``` 