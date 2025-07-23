🚮 TRASH_SORT
사진/민원 기반 분리수거 안내 및 신고, 인센티브 지급 시스템

💡 주요 기능
사진 기반 분리수거 안내: AI가 사진을 분석해 올바른 분리배출 방법 안내

쓰레기 민원 신고: 사진·내용과 함께 쓰레기 무단투기 등 신고

포상금/인센티브 안내: 신고 시 포상금 안내 및 추천 기능

유저 인증: JWT 기반 로그인/회원가입, 인증된 사용자만 민원 등록 가능

추천순/최신순 정렬: 신고 글을 다양한 기준으로 정렬 가능

🏗️ 프로젝트 구조
plaintext
복사
편집
TRASH_SORT/
├── client/                    # 프론트엔드 (React)
│   ├── node_modules/          
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # 리액트 컴포넌트 모음
│   │   ├── app.js             # 리액트 엔트리포인트
│   │   └── index.js           # 리액트 렌더러
│   ├── package.json           # 프론트 의존성
│   └── package-lock.json
├── server/                    # 백엔드 (Node.js + Express)
│   ├── config/
│   │   └── db.js              # DB 연결 설정 (MongoDB 등)
│   ├── src/
│   │   ├── controllers/
│   │   │   └── complain.controller.js # 민원 컨트롤러(로직)
│   │   ├── middleware/
│   │   │   └── auth.middleware.js    # 인증 미들웨어(JWT)
│   │   ├── models/
│   │   │   └── report.model.js       # 민원 DB 모델(Mongoose)
│   │   └── routes/
│   │       └── complain.routes.js    # 민원 관련 API 라우팅
│   ├── uploads/               # (선택) 업로드 파일 저장
│   ├── app.js                 # 익스프레스 앱 진입점
│   └── package.json           # 백엔드 의존성
├── .env                       # 환경 변수 파일 (DB_URL, JWT_SECRET 등)
├── docker-compose.yml         # Docker 컨테이너 설정
├── server.js                  # 서버 실행 엔트리포인트
├── README.md                  # 프로젝트 설명 (이 파일)
└── 기타(package-lock.json, .gitignore 등)
⚙️ 설치 및 실행 방법
필수 조건

Node.js 18.x 이상

Docker Desktop (MongoDB 컨테이너용)

npm, yarn 중 택1

클론 & 환경설정

bash
복사
편집
git clone https://github.com/your-id/TRASH_SORT.git
cd TRASH_SORT
cp .env.example .env # 환경 변수 설정 (직접 값 채우기)
백엔드(MongoDB) 컨테이너 실행

bash
복사
편집
docker-compose up -d
서버 & 클라이언트 설치/실행

bash
복사
편집
# 백엔드
cd server
npm install
npm start    # http://localhost:3001

# 프론트엔드
cd ../client
npm install
npm start    # http://localhost:3000
접속

프론트: http://localhost:3000

API: http://localhost:3001/api/complain 등

🛠️ 기술 스택
프론트엔드:

React (CRA)

JavaScript/JSX

백엔드:

Node.js, Express.js

MongoDB (Mongoose ODM)

JWT (인증)

Multer (이미지 업로드)

Docker, Docker Compose

기타:

concurrently (동시 실행)

dotenv, cors, morgan 등