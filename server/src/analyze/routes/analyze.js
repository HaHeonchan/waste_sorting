const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyze');

// 쓰레기 분류 관련 라우트
router.get('/', analyzeController.renderAnalyzePage);
router.post('/upload-analyze', analyzeController.uploadAndAnalyzeImage);

module.exports = router; 