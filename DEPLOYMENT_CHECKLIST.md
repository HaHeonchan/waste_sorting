# Vercel 배포 전 체크리스트 ✅

## 📋 필수 확인 사항

### 1. 코드 준비 ✅
- [x] `vercel.json` 파일 생성 완료
- [x] 서버 코드 Vercel 환경 대응 완료
- [x] 클라이언트 빌드 설정 완료
- [x] API URL 설정 완료

### 2. 환경 변수 준비 ⚠️
- [ ] MongoDB Atlas 연결 문자열 준비
- [ ] OpenAI API 키 준비
- [ ] Cloudinary 계정 및 API 키 준비
- [ ] Google Cloud Vision API 키 준비
- [ ] Google OAuth 클라이언트 ID/Secret 준비
- [ ] 세션 시크릿 키 생성

### 3. 외부 서비스 설정 ⚠️
- [ ] MongoDB Atlas 데이터베이스 생성
- [ ] Cloudinary 계정 생성 및 설정
- [ ] Google Cloud 프로젝트 설정
- [ ] OpenAI API 계정 설정

### 4. 보안 확인 ✅
- [x] `.env` 파일이 `.gitignore`에 포함됨
- [x] API 키가 코드에 하드코딩되지 않음
- [x] 민감한 정보가 GitHub에 커밋되지 않음

## 🚀 배포 단계

### 1단계: GitHub 푸시
```bash
git add .
git commit -m "Vercel 배포 준비 완료"
git push origin main
```

### 2단계: Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "New Project" 클릭
3. GitHub 저장소 선택
4. **Root Directory**: 그대로 두기 (변경하지 않음)
5. **Framework Preset**: Other
6. **Build Command**: 비워두기
7. **Output Directory**: 비워두기

### 3단계: 환경 변수 설정
Vercel 프로젝트 설정 → Environment Variables에서 다음 변수들 추가:

#### 필수 환경 변수
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waste_sorting
OPENAI_API_KEY=sk-your-openai-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-super-secret-session-key
NODE_ENV=production
```

### 4단계: 배포 실행
- "Deploy" 버튼 클릭
- 빌드 로그 확인
- 배포 완료 후 도메인 확인

## 🔍 배포 후 확인 사항

### 1. 기본 동작 확인
- [ ] 메인 페이지 로딩: `https://your-domain.vercel.app/`
- [ ] API 헬스 체크: `https://your-domain.vercel.app/api/health`
- [ ] 쓰레기 분류 페이지: `https://your-domain.vercel.app/`
- [ ] 민원 게시판: `https://your-domain.vercel.app/complain`

### 2. 기능 테스트
- [ ] 이미지 업로드 및 분석
- [ ] 민원 작성 및 조회
- [ ] 데이터베이스 연결 확인
- [ ] 외부 API 연결 확인

### 3. 오류 확인
- [ ] Vercel 로그에서 오류 메시지 확인
- [ ] 브라우저 개발자 도구에서 오류 확인
- [ ] API 응답 상태 확인

## 🆘 문제 해결

### 일반적인 문제들
1. **환경 변수 누락**: Vercel 대시보드에서 환경 변수 재확인
2. **빌드 실패**: 로그 확인 후 코드 수정
3. **API 연결 실패**: 외부 서비스 설정 확인
4. **CORS 오류**: 도메인 설정 확인

### 디버깅 도구
- Vercel Function Logs
- 브라우저 개발자 도구
- `/api/health` 엔드포인트
- 환경 변수 확인 API

## 📞 지원

문제가 발생하면:
1. Vercel 로그 확인
2. 환경 변수 설정 재확인
3. 외부 서비스 연결 상태 확인
4. 필요시 코드 수정 후 재배포 