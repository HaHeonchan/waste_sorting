const express = require('express');
const router = express.Router();
const controller = require('../controllers/complain');
// const auth = require('../../auth/middleware/auth'); // 임시 비활성화
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 임시 업로드 폴더 생성 (Cloudinary 업로드 후 삭제됨)
const tempUploadDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempUploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `complain_${Date.now()}_${Math.round(Math.random() * 1E9)}${ext}`);
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
        files: 1 // 최대 1개 파일
    },
    fileFilter: (req, file, cb) => {
        // 이미지 파일만 허용
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Multer 에러 핸들링 미들웨어
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: '파일 크기가 너무 큽니다 (최대 10MB)' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                message: '파일 개수가 초과되었습니다 (최대 1개)' 
            });
        }
        return res.status(400).json({ 
            message: '파일 업로드 에러', 
            error: error.message 
        });
    }
    
    if (error.message.includes('이미지 파일만 업로드 가능합니다')) {
        return res.status(400).json({ 
            message: error.message 
        });
    }
    
    next(error);
};

// router.use(auth); // 임시 비활성화

// 디버깅 미들웨어
router.use((req, res, next) => {
    console.log(`🔍 민원 API 요청: ${req.method} ${req.url}`);
    next();
});

// ✅ 민원 목록 조회 (정렬 query 지원: sort=latest|oldest|likes)
router.get('/reports', controller.listReports);

// ✅ 민원 작성 (이미지 포함) - Cloudinary 업로드
router.post('/reports', upload.single('image'), handleMulterError, controller.createReport);

// ✅ 민원 수정 (이미지 포함) - Cloudinary 업로드
router.put('/reports/:report_id', upload.single('image'), handleMulterError, controller.updateReport);

// ✅ 민원 삭제
router.delete('/reports/:report_id', controller.deleteReport);

// ✅ 민원 추천 기능
router.post('/reports/:report_id/like', controller.likeReport);

// ✅ 신고 상세 정보 (신고 버튼 클릭 시 정보 반환용)
router.get('/reports/:report_id/report-info', controller.getReportInfo);

module.exports = router;
