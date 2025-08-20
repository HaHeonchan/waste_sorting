const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/stats');

// 통계 데이터 조회 라우트
router.get('/', getStats);

module.exports = router;
