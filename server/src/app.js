const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Passport 설정
require('./config/passport');

// Router import
const analyzeRouter = require('./analyze/routes/analyze');
const wasteRouter = require('./analyze/routes/waste');
const authRouter = require('./auth/routes/auth');
const complainRoutes = require('./complain/routes/complain');

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

// 미들웨어 설정
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.vercel.app', 'https://*.vercel.app'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/auth', authRouter);

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

module.exports = app;
