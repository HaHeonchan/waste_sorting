const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Router import
const analyzeRouter = require('../routes/analyze/analyze');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client')));
app.use('/analyze', express.static(path.join(__dirname, '../client/analyze')));

// Router
app.use('/analyze', analyzeRouter);

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 쓰레기 분류 시스템 페이지
app.get('/waste-sorting', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/analyze/waste-sorting.html'));
});

module.exports = app;