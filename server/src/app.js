const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const dotenv = require('dotenv');

require('dotenv').config();
require('./auth/models/User');
require('./auth/models/Reward');

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
const authMiddleware = require('./auth/middleware/auth'); 
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
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL || 'https://your-client-name.onrender.com']
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        process.env.CLIENT_URL || 'http://localhost:3000'
      ].filter(Boolean), // undefined 값 제거
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
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
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
    next();
}, complainRoutes);

// 기존 라우터
app.use('/analyze', analyzeRouter);
app.use('/api/waste', wasteRouter);
app.use('/api/auth', authRouter);
app.use('/api/reward', authMiddleware, rewardRouter);
app.use('/api/incentive', incentiveRoutes);

// 메인 페이지 - 새로운 경로로 수정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/public/index.html'));
});

// 쓰레기 분류 시스템 페이지 - 새로운 경로로 수정
app.get('/waste-sorting', (req, res) => {
    res.sendFile(path.join(__dirname, 'analyze/views/analyze/waste-sorting.html'));
});

// 로그인 페이지
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/public/login.html'));
});

// 환경변수 확인 엔드포인트 (디버깅용)
app.get('/api/debug/env', (req, res) => {
    const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        CLIENT_URL: process.env.CLIENT_URL,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음',
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '설정됨' : '설정되지 않음',
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '설정됨' : '설정되지 않음',
        MONGODB_URI: process.env.MONGODB_URI ? '설정됨' : '설정되지 않음',
        SESSION_SECRET: process.env.SESSION_SECRET ? '설정됨' : '설정되지 않음',
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