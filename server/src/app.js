const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const passport = require('../config/passport'); // Passport 설정
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });



// Passport 설정
require('../config/passport');

const analyzeRouter = require('./routes/trashsort_ai/analyze.routes');
const wasteRouter = require('./routes/trashsort_ai/waste.routes');
const authRouter = require('./routes/usermanage/auth.routes');
const complainRoutes = require('./routes/complain/complain.routes');

const app = express();

// 📦 미들웨어
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🧠 세션 + 패스포트
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// 📁 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// 📂 정적 파일 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/analyze', express.static(path.join(__dirname, '../client')));
app.use('/complain', express.static(path.join(__dirname, '../client')));

// 📡 API 라우팅
app.use('/api', (req, res, next) => {
  req.upload = upload;
  next();
}, complainRoutes);

app.use('/analyze', analyzeRouter);
app.use('/api/waste', wasteRouter);
app.use('/auth', authRouter);

// 🏠 페이지 라우팅
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/waste-sorting', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/analyze/waste-sorting.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

module.exports = app;
