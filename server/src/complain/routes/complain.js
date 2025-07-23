const express = require('express');
const router = express.Router();
const controller = require('../controllers/complain');
const auth = require('../../auth/middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 업로드 폴더 생성
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

// ✅ 민원 목록 조회 (정렬 query 지원: sort=latest|oldest|likes)
router.get('/reports', controller.listReports);

// ✅ 민원 작성 (이미지 포함)
router.post('/reports', upload.single('image'), controller.createReport);

// ✅ 민원 수정 (이미지 포함)
router.put('/reports/:report_id', upload.single('image'), controller.updateReport);

// ✅ 민원 삭제
router.delete('/reports/:report_id', controller.deleteReport);

// ✅ 민원 추천 기능
router.post('/reports/:report_id/like', controller.likeReport);

// ✅ 신고 상세 정보 (신고 버튼 클릭 시 정보 반환용)
router.get('/reports/:report_id/report-info', controller.getReportInfo);

module.exports = router;
