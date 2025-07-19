const express = require('express');
const router = express.Router();
const controller = require('../controllers/complain.controller');
const auth = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 폴더
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
    }
});
const upload = multer({ storage });

router.use(auth);

// 민원 목록 조회
router.get('/reports', controller.listReports);
// 민원 수정 (이미지 파일 업로드 포함)
router.put('/reports/:report_id', upload.single('image'), controller.updateReport);
// 민원 작성 (이미지 파일 업로드 포함)
router.post('/reports', upload.single('image'), controller.createReport);
// 민원 삭제
router.delete('/reports/:report_id', controller.deleteReport);

module.exports = router;
