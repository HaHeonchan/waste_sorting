# 🚀 Vercel 배포 가이드: 프론트엔드와 백엔드 분리

## 📋 목차
1. [개요](#개요)
2. [백엔드 배포](#백엔드-배포)
3. [프론트엔드 배포](#프론트엔드-배포)
4. [환경 변수 설정](#환경-변수-설정)
5. [CORS 설정](#cors-설정)
6. [배포 후 검증](#배포-후-검증)
7. [문제 해결](#문제-해결)

## 개요

이 가이드는 React 프론트엔드와 Node.js 백엔드를 Vercel에 별개의 프로젝트로 배포하는 방법을 설명합니다.

### 🎯 목표
- 프론트엔드와 백엔드를 완전히 분리
- 각각 독립적인 Git 저장소와 Vercel 프로젝트로 관리
- 두 프로젝트 간 안전한 통신 설정

## 백엔드 배포

### 1. 백엔드 저장소 준비

```bash
# 1. 새로운 Git 저장소 생성
mkdir waste-sorting-backend
cd waste-sorting-backend

# 2. 기존 server 폴더 내용을 새 저장소로 복사
cp -r ../waste_sorting/server/* .

# 3. Git 초기화 및 커밋
git init
git add .
git commit -m "Initial backend setup"
```

### 2. 백엔드 폴더 구조

```
waste-sorting-backend/
├── vercel.json          # Vercel 설정
├── server.js            # 서버 진입점
├── package.json         # 의존성 관리
├── env.example          # 환경 변수 예시
├── src/
│   ├── app.js           # Express 앱 설정
│   ├── config/          # 설정 파일들
│   ├── analyze/         # 분석 관련 라우트
│   ├── auth/            # 인증 관련 라우트
│   └── complain/        # 불만사항 관련 라우트
└── uploads/             # 업로드 파일 저장소
```

### 3. Vercel에 백엔드 배포

```bash
# 1. Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 2. Vercel 로그인
vercel login

# 3. 프로젝트 배포
vercel

# 4. 프로덕션 배포
vercel --prod
```

### 4. 백엔드 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수들을 설정:

```
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
SESSION_SECRET=your-super-secret-key
FRONTEND_URL=https://your-frontend-domain.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 프론트엔드 배포

### 1. 프론트엔드 저장소 준비

```bash
# 1. 새로운 Git 저장소 생성
mkdir waste-sorting-frontend
cd waste-sorting-frontend

# 2. 기존 client 폴더 내용을 새 저장소로 복사
cp -r ../waste_sorting/client/* .

# 3. Git 초기화 및 커밋
git init
git add .
git commit -m "Initial frontend setup"
```

### 2. 프론트엔드 폴더 구조

```
waste-sorting-frontend/
├── vercel.json          # Vercel 설정
├── package.json         # 의존성 관리
├── env.example          # 환경 변수 예시
├── public/
│   └── index.html       # 메인 HTML
└── src/
    ├── app.js           # React 앱
    ├── index.js         # 진입점
    ├── config/
    │   └── api.js       # API 설정
    └── components/      # React 컴포넌트들
```

### 3. Vercel에 프론트엔드 배포

```bash
# 1. Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 2. Vercel 로그인
vercel login

# 3. 프로젝트 배포
vercel

# 4. 프로덕션 배포
vercel --prod
```

### 4. 프론트엔드 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 다음 변수들을 설정:

```
REACT_APP_API_URL=https://your-backend-domain.vercel.app
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_APP_NAME=Waste Sorting AI
```

## 환경 변수 설정

### 백엔드 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `NODE_ENV` | 실행 환경 | `production` |
| `MONGODB_URI` | MongoDB 연결 문자열 | `mongodb+srv://...` |
| `SESSION_SECRET` | 세션 암호화 키 | `your-secret-key` |
| `FRONTEND_URL` | 프론트엔드 도메인 | `https://your-app.vercel.app` |

### 프론트엔드 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `REACT_APP_API_URL` | 백엔드 API URL | `https://your-backend.vercel.app` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth ID | `123456789.apps.googleusercontent.com` |

## CORS 설정

### 백엔드 CORS 설정 (이미 적용됨)

```javascript
// src/app.js에서
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://your-frontend-domain.vercel.app']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 프론트엔드 API 요청 설정

```javascript
// src/config/api.js에서
export const apiRequest = async (endpoint, options = {}) => {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함
    };

    const response = await fetch(endpoint, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    });

    return response.json();
};
```

## 배포 후 검증

### 1. 백엔드 API 테스트

```bash
# 헬스 체크
curl https://your-backend-domain.vercel.app/

# API 엔드포인트 테스트
curl https://your-backend-domain.vercel.app/api/waste
```

### 2. 프론트엔드 연결 테스트

브라우저 개발자 도구에서:

```javascript
// 콘솔에서 API 연결 테스트
fetch('https://your-backend-domain.vercel.app/api/waste')
  .then(response => response.json())
  .then(data => console.log('API 연결 성공:', data))
  .catch(error => console.error('API 연결 실패:', error));
```

### 3. 전체 기능 테스트

1. 프론트엔드 접속
2. 로그인 기능 테스트
3. 이미지 업로드 테스트
4. 쓰레기 분류 기능 테스트

## 문제 해결

### 자주 발생하는 문제들

#### 1. CORS 오류
```
Access to fetch at 'https://backend.vercel.app' from origin 'https://frontend.vercel.app' has been blocked by CORS policy
```

**해결 방법:**
- 백엔드 CORS 설정 확인
- `FRONTEND_URL` 환경 변수 설정 확인
- 프론트엔드 URL이 백엔드 CORS 허용 목록에 포함되어 있는지 확인

#### 2. 404 오류
```
GET https://backend.vercel.app/api/waste 404
```

**해결 방법:**
- 백엔드 라우트 경로 확인
- `vercel.json` 설정 확인
- 서버리스 함수 설정 확인

#### 3. 환경 변수 오류
```
process.env.REACT_APP_API_URL is undefined
```

**해결 방법:**
- Vercel 대시보드에서 환경 변수 설정 확인
- 변수명이 `REACT_APP_`으로 시작하는지 확인
- 배포 후 환경 변수 재설정

#### 4. MongoDB 연결 오류
```
MongoDB connection failed
```

**해결 방법:**
- MongoDB Atlas 설정 확인
- 네트워크 액세스 설정 확인
- 연결 문자열 형식 확인

### 디버깅 팁

1. **Vercel 로그 확인**
   ```bash
   vercel logs
   ```

2. **환경 변수 확인**
   ```bash
   # 백엔드에서
   console.log('Environment:', process.env.NODE_ENV);
   console.log('Frontend URL:', process.env.FRONTEND_URL);
   
   # 프론트엔드에서
   console.log('API URL:', process.env.REACT_APP_API_URL);
   ```

3. **네트워크 요청 모니터링**
   - 브라우저 개발자 도구 → Network 탭
   - 요청/응답 상태 확인
   - CORS 헤더 확인

## 🎉 완료!

이제 프론트엔드와 백엔드가 완전히 분리되어 각각 독립적으로 배포되고 통신할 수 있습니다.

### 다음 단계
1. 도메인 설정 (선택사항)
2. SSL 인증서 설정 (자동)
3. 성능 모니터링 설정
4. CI/CD 파이프라인 구축

### 유용한 링크
- [Vercel 공식 문서](https://vercel.com/docs)
- [Vercel CLI 문서](https://vercel.com/docs/cli)
- [CORS 설정 가이드](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) 