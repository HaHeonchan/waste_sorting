const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const complainRoutes = require('./routes/complain.routes');

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

// 3. 요청 본문 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. 정적 파일 서빙 (이미지 등)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. 프론트엔드 정적 파일 서빙 (client 디렉토리)
app.use('/complain', express.static(path.join(__dirname, '../../client')));

// 6. API 라우팅 (upload 미들웨어 추가해서 req.upload 사용 가능하게)
app.use('/api', (req, res, next) => {
    req.upload = upload;
    next();
}, complainRoutes);

// 7. app 객체 export (서버에서 listsen 가능하게)
module.exports = app;
