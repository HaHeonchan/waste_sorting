# Vercel 배포 체크리스트 ✅

## 배포 전 확인사항

### 1. 코드 수정 완료 ✅
- [x] vercel.json 설정 완료
- [x] 서버 코드 Vercel 환경 대응
- [x] 클라이언트 API 호출 수정
- [x] multer 설정 Vercel 대응
- [x] 정적 파일 서빙 설정

### 2. 환경변수 설정 (Vercel 대시보드에서)
- [ ] NODE_ENV=production
- [ ] MONGODB_URI=your_mongodb_connection_string
- [ ] SESSION_SECRET=your_session_secret
- [ ] CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
- [ ] CLOUDINARY_API_KEY=your_cloudinary_api_key
- [ ] CLOUDINARY_API_SECRET=your_cloudinary_api_secret
- [ ] GOOGLE_APPLICATION_CREDENTIALS=your_google_credentials_json

### 3. 클라이언트 환경변수 설정
- [ ] REACT_APP_API_URL=https://your-server-domain.vercel.app/api
- [ ] REACT_APP_AUTH_URL=https://your-server-domain.vercel.app/auth
- [ ] REACT_APP_ANALYZE_URL=https://your-server-domain.vercel.app/analyze

### 4. 외부 서비스 설정
- [ ] MongoDB Atlas 외부 접근 허용
- [ ] Cloudinary 계정 설정 확인
- [ ] Google Cloud Platform 서비스 계정 키 생성

## 배포 단계

### 1단계: 서버 배포
```bash
vercel --prod
```

### 2단계: 도메인 확인 후 클라이언트 환경변수 업데이트
- 배포된 서버 도메인 확인
- 클라이언트 환경변수에 실제 도메인 입력

### 3단계: 클라이언트 배포
```bash
vercel --prod
```

## 배포 후 확인사항

### 기능 테스트
- [ ] 메인 페이지 로딩
- [ ] 이미지 업로드 및 분석
- [ ] 민원 게시판 CRUD
- [ ] API 호출 정상 작동

### 에러 확인
- [ ] Vercel 로그 확인
- [ ] 브라우저 개발자 도구 에러 확인
- [ ] API 응답 상태 확인

## 문제 해결

### 404 에러
1. vercel.json 라우트 설정 확인
2. 빌드 로그 확인
3. 파일 경로 확인

### API 에러
1. 환경변수 설정 확인
2. CORS 설정 확인
3. MongoDB 연결 확인

### 파일 업로드 에러
1. Cloudinary 설정 확인
2. 파일 크기 제한 확인
3. multer 설정 확인 