const express = require('express');
const router = express.Router();
const {
  earnPoint,
  getIncentiveList,
  getPointSummary
} = require('../controllers/incentive');

// 포인트 적립 (자동, 프론트에서 분석 결과 보내는 방식)
router.post('/earn', earnPoint);

// 인센티브 내역 조회
router.get('/:userId', getIncentiveList);

// 포인트 요약 조회
router.get('/summary/:userId', getPointSummary);

module.exports = router;
