const express = require('express');
const router = express.Router();
const { 
  saveAnalysisResult, 
  getUserAnalysisResults, 
  getAnalysisResult, 
  deleteAnalysisResult,
  upload 
} = require('../controllers/analysis-result');
const authMiddleware = require('../../auth/middleware/auth');

// 분석 결과 저장 (이미지 파일 업로드 포함)
router.post('/save', authMiddleware, upload.single('image'), saveAnalysisResult);

// 사용자의 분석 결과 목록 조회
router.get('/user', authMiddleware, getUserAnalysisResults);

// 특정 분석 결과 조회
router.get('/:id', authMiddleware, getAnalysisResult);

// 분석 결과 삭제
router.delete('/:id', authMiddleware, deleteAnalysisResult);

module.exports = router; 