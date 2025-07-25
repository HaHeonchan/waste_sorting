const express = require('express');
const router = express.Router();
const Incentive = require('../models/incentive');

// 포인트 적립
router.post('/earn', async (req, res) => {
  const { user_id, activity_type, earned_point } = req.body;
  try {
    const result = await Incentive.create({ user_id, activity_type, earned_point });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 포인트 사용
router.post('/use', async (req, res) => {
  const { user_id, exchange_type, used_point } = req.body;
  try {
    const result = await Incentive.create({ user_id, exchange_type, used_point });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 인센티브 내역 조회
router.get('/:userId', async (req, res) => {
  try {
    const data = await Incentive.find({ user_id: req.params.userId }).sort({ created_at: -1 });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 포인트 요약 (보유 포인트, 월간 적립 포인트 등)
router.get('/summary/:userId', async (req, res) => {
  const userId = req.params.userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const incentives = await Incentive.find({ user_id: userId });

    const earned = incentives.reduce((sum, i) => sum + (i.earned_point || 0), 0);
    const used = incentives.reduce((sum, i) => sum + (i.used_point || 0), 0);
    const monthEarned = incentives
      .filter(i => i.created_at >= startOfMonth)
      .reduce((sum, i) => sum + (i.earned_point || 0), 0);

    res.json({
      total_point: earned - used,
      this_month: monthEarned,
      can_exchange: earned - used
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;