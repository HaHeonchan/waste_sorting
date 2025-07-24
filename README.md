# 🗑️ Waste Sorting AI

AI 기반 쓰레기 분류 시스템 - React 프론트엔드와 Node.js 백엔드로 구성된 웹 애플리케이션입니다.

## 🚀 빠른 시작

### 개발 환경 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd waste_sorting

# 2. 백엔드 실행
cd server
npm install
npm run dev

# 3. 프론트엔드 실행 (새 터미널)
cd client
npm install
npm start
```

### Vercel 배포

자세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참조하세요.

```bash
# 백엔드 배포
./deploy-backend.sh

# 프론트엔드 배포
./deploy-frontend.sh
```

## 📁 프로젝트 구조

```
waste_sorting/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── config/         # 설정 파일
│   │   └── app.js          # 메인 앱
│   ├── public/             # 정적 파일
│   └── package.json
├── server/                 # Node.js 백엔드
│   ├── src/
│   │   ├── analyze/        # 쓰레기 분류 로직
│   │   ├── auth/           # 인증 시스템
│   │   ├── complain/       # 불만사항 관리
│   │   └── config/         # 설정 파일
│   ├── uploads/            # 업로드 파일
│   └── package.json
├── DEPLOYMENT_GUIDE.md     # 배포 가이드
├── deploy-backend.sh       # 백엔드 배포 스크립트
├── deploy-frontend.sh      # 프론트엔드 배포 스크립트
└── README.md
```

## 🛠️ 기술 스택

### 프론트엔드
- **React 19** - 사용자 인터페이스
- **React Router** - 라우팅
- **CSS3** - 스타일링

### 백엔드
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **MongoDB** - 데이터베이스
- **Mongoose** - ODM
- **Passport.js** - 인증
- **Multer** - 파일 업로드
- **Sharp** - 이미지 처리

### AI/ML
- **OpenAI API** - 쓰레기 분류 AI
- **Google Cloud Vision** - 이미지 분석
- **Cloudinary** - 이미지 저장

## 🔧 주요 기능

### 🗑️ 쓰레기 분류
- 이미지 업로드 및 분석
- AI 기반 쓰레기 종류 판별
- 분리수거 가이드 제공

### 👤 사용자 관리
- Google OAuth 로그인
- 사용자 세션 관리
- 개인화된 서비스

### 📝 불만사항 관리
- 쓰레기통 위치 신고
- 분리수거 관련 문의
- 관리자 피드백 시스템

## 🌐 API 엔드포인트

### 쓰레기 분류
- `POST /analyze` - 이미지 분석
- `GET /api/waste` - 쓰레기 정보 조회

### 인증
- `GET /auth/google` - Google 로그인
- `GET /auth/logout` - 로그아웃

### 불만사항
- `POST /api/report` - 신고 등록
- `GET /api/reports` - 신고 목록 조회

## 🔐 환경 변수

### 백엔드 (.env)
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/waste_sorting
SESSION_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 프론트엔드 (.env)
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_APP_NAME=Waste Sorting AI
```

## 🚀 배포

### Vercel 배포 (권장)

1. **백엔드 배포**
   ```bash
   cd server
   vercel --prod
   ```

2. **프론트엔드 배포**
   ```bash
   cd client
   vercel --prod
   ```

3. **환경 변수 설정**
   - Vercel 대시보드에서 각 프로젝트의 환경 변수 설정
   - CORS 설정 확인

### 기타 배포 옵션

- **Heroku** - 전체 스택 배포
- **AWS** - EC2 + S3 + RDS
- **Docker** - 컨테이너화 배포

## 🧪 테스트

```bash
# 백엔드 테스트
cd server
npm test

# 프론트엔드 테스트
cd client
npm test
```

## 📊 성능 모니터링

- **Vercel Analytics** - 웹사이트 성능
- **MongoDB Atlas** - 데이터베이스 모니터링
- **Google Analytics** - 사용자 행동 분석

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

- **이슈 리포트**: GitHub Issues
- **문의**: [이메일 주소]
- **문서**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🙏 감사의 말

- OpenAI API 팀
- Google Cloud Vision 팀
- React 및 Node.js 커뮤니티
- 모든 기여자들

---

**Made with ❤️ for a cleaner world** 