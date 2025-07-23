const express = require('express');
const router = express.Router();
const analyzeController = require('../../controllers/analyze/analyze');

// 쓰레기 분류 관련 라우트
router.get('/', analyzeController.getAnalyzePage);
router.post('/upload-analyze', analyzeController.uploadAndAnalyzeImage);

// 디버깅용 엔드포인트
router.get('/check-env', analyzeController.checkEnvironment);
router.get('/test-cloudinary', analyzeController.testCloudinary);

module.exports = router; 