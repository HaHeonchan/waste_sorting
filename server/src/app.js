const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Passport 설정
require('./config/passport');

// Cloudinary 설정
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Router import
const analyzeRouter = require('./analyze/routes/analyze');
const wasteRouter = require('./analyze/routes/waste');
const authRouter = require('./auth/routes/auth');
const rewardRouter = require('./auth/routes/reward');
const complainRoutes = require('./complain/routes/complain');
const incentiveRoutes = require('./incentive/routes/incentive');

const app = express();

// 1. 업로드 디렉토리 설정 (src/uploads)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. multer 저장 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({ storage });

// CORS 설정
const corsOptions = {
  origin: function (origin, callback) {
    // 개발 환경에서는 모든 origin 허용
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // 프로덕션 환경에서 허용할 origin들
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'https://your-client-name.onrender.com',
      'https://your-client-name.vercel.app',
      'https://your-client-name.netlify.app'
    ].filter(Boolean);
    
    // origin이 없거나 허용된 origin에 포함되면 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS 차단된 origin:', origin);
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// 미들웨어 설정
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 응답 타임아웃 설정 (5분)
app.use((req, res, next) => {
  res.setTimeout(300000, () => {
    console.error('요청 타임아웃:', req.url);
    res.status(408).json({ error: '요청이 시간 초과되었습니다.' });
  });
  next();
});

// 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    },
    proxy: process.env.NODE_ENV === 'production'
}));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 정적 파일 서빙 - 새로운 폴더 구조에 맞게 수정
app.use(express.static(path.join(__dirname, '../../client/public')));
app.use('/analyze', express.static(path.join(__dirname, 'analyze/views/analyze')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/complain', express.static(path.join(__dirname, '../../client/public')));

// API 라우팅 (upload 미들웨어 추가해서 req.upload 사용 가능하게)
app.use('/api', (req, res, next) => {
    req.upload = upload;
    console.log('API 요청:', { method: req.method, url: req.url, path: req.path });
    next();
}, complainRoutes);

// 기존 라우터
app.use('/analyze', analyzeRouter);
app.use('/api/waste', wasteRouter);
app.use('/auth', authRouter);
app.use('/api/auth', rewardRouter);
app.use('/api/incentive', incentiveRoutes);

// React 앱 라우팅 - 모든 페이지를 index.html로 처리
app.get(['/', '/login', '/signup', '/mypage', '/incentive', '/complain', '/sortguide'], (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/public/index.html'));
});

// 쓰레기 분류 시스템 페이지 - 새로운 경로로 수정
app.get('/waste-sorting', (req, res) => {
    res.sendFile(path.join(__dirname, 'analyze/views/analyze/waste-sorting.html'));
});

// 환경변수 확인 엔드포인트 (디버깅용)
app.get('/api/debug/env', (req, res) => {
    const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        CLIENT_URL: process.env.CLIENT_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '설정됨' : '설정되지 않음',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '설정됨' : '설정되지 않음',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음',
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '설정됨' : '설정되지 않음',
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '설정됨' : '설정되지 않음',
        MONGODB_URI: process.env.MONGODB_URI ? '설정됨' : '설정되지 않음',
        SESSION_SECRET: process.env.SESSION_SECRET ? '설정됨' : '설정되지 않음',
        // 실제 값들도 확인 (보안을 위해 일부만)
        GOOGLE_CLIENT_ID_VALUE: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 10) + '...' : '없음',
        REACT_APP_API_URL_VALUE: process.env.REACT_APP_API_URL || '없음',
        timestamp: new Date().toISOString()
    };
    
    res.json({
        message: '환경변수 확인',
        environment: envInfo,
        serverTime: new Date().toISOString()
    });
});

// 서버 상태 확인 엔드포인트
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV
    });
});

module.exports = app;


