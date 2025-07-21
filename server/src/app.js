const express = require('express');
const app = express();
const incentivesRoutes = require('./routes/complain.routes');
const path = require('path');
const multer = require('multer');

// 1. 파일 업로드용 폴더(src/uploads) 및 multer 설정
const uploadDir = path.join(__dirname, 'uploads'); // src/uploads

// 업로드 폴더 없으면 생성(최초 1회)
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({ storage });

// 2. req.upload로 접근 가능하게 (라우터에서 사용)
app.set('upload', upload);

// 3. JSON 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. 정적 파일: client/index.html, 이미지 업로드
app.use('/complain',express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. API (multer upload 객체를 routes에서 사용)
app.use('/api', (req, res, next) => {
    req.upload = upload; // router에서 req.upload로 사용
    next();
}, incentivesRoutes);

module.exports = app;
