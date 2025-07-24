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

// 업로드 디렉토리 설정 (src/uploads)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정 - Vercel 환경에 맞게 수정
let upload;

if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    // Vercel 환경에서는 메모리 스토리지 사용 (Cloudinary로 즉시 업로드)
    upload = multer({ storage: multer.memoryStorage() });
} else {
    // 로컬 환경에서는 디스크 스토리지 사용
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    upload = multer({ storage: storage });
}

// 미들웨어 설정
app.use(cors());
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

// 모든 요청 로깅 (디버깅용)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Vercel: ${!!process.env.VERCEL}`);
    next();
});

// 정적 파일 서빙 - Vercel 환경에 맞게 수정
if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
  // Vercel 환경에서는 정적 파일을 서빙하지 않음 (Vercel이 처리)
} else {
  // 로컬 개발 환경에서만 정적 파일 서빙
  app.use(express.static(path.join(__dirname, '../../client/public')));
  app.use('/analyze', express.static(path.join(__dirname, 'analyze/views/analyze')));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/complain', express.static(path.join(__dirname, '../../client/public')));
}

// API 라우팅 (upload 미들웨어 추가해서 req.upload 사용 가능하게)
app.use('/api', (req, res, next) => {
    req.upload = upload;
    next();
}, complainRoutes);

// 기존 라우터
app.use('/analyze', analyzeRouter);
app.use('/api/waste', wasteRouter);
app.use('/auth', authRouter);

// 메인 페이지 - Vercel 환경에 맞게 수정
app.get('/', (req, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
        // Vercel 환경에서는 React 앱이 처리하므로 API 응답만
        res.json({ message: 'Waste Sorting API Server' });
    } else {
        res.sendFile(path.join(__dirname, '../../client/public/index.html'));
    }
});

// 쓰레기 분류 시스템 페이지 - Vercel 환경에 맞게 수정
app.get('/waste-sorting', (req, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
        // Vercel 환경에서는 React 앱이 처리
        res.json({ message: 'Waste Sorting Page' });
    } else {
        res.sendFile(path.join(__dirname, 'analyze/views/analyze/waste-sorting.html'));
    }
});

// 로그인 페이지
app.get('/login', (req, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
        // Vercel 환경에서는 React 앱이 처리
        res.json({ message: 'Login Page' });
    } else {
        res.sendFile(path.join(__dirname, '../../client/public/login.html'));
    }
});

// Vercel 환경에서 API가 아닌 모든 요청에 대한 처리
if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    app.get('*', (req, res) => {
        console.log(`404 - Path: ${req.path}, Method: ${req.method}`);
        
        // API 경로가 아닌 경우 React 앱이 처리하도록 함
        if (!req.path.startsWith('/api') && !req.path.startsWith('/auth') && 
            !req.path.startsWith('/analyze') && !req.path.startsWith('/uploads')) {
            res.status(404).json({ 
                error: 'Not Found', 
                message: 'This route should be handled by the React application',
                path: req.path,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({ 
                error: 'API endpoint not found',
                path: req.path,
                availableEndpoints: ['/api', '/auth', '/analyze', '/uploads']
            });
        }
    });
}

// ================== 디버깅용 코드 추가 ==================
app.get('/api/health', (req, res) => {
    console.log("Health check API called!");
    res.status(200).json({ 
        status: "ok", 
        message: "Server is alive!",
        environment: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        timestamp: new Date().toISOString()
    });
});
// ======================================================
  

module.exports = app;
