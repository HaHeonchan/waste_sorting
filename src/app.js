const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Passport 설정
require('../config/passport');

// Router import
const analyzeRouter = require('../routes/analyze/analyze');
const wasteRouter = require('../routes/waste');
const authRouter = require('../routes/auth');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client')));
app.use('/analyze', express.static(path.join(__dirname, '../client/analyze')));

// Router
app.use('/analyze', analyzeRouter);
app.use('/api/waste', wasteRouter);
app.use('/auth', authRouter);

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 쓰레기 분류 시스템 페이지
app.get('/waste-sorting', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/analyze/waste-sorting.html'));
});

module.exports = app;