// 📁 controllers/incentive.js

const Incentive = require('../models/incentive');

// ✅ 포인트 기준 테이블 (여기서 바로 정의)
const pointRules = {
  '무색페트': 300,
  '플라스틱': 250,
  '종이': 300,
  'PET': 250,
  'OTHER': 100,
  '알미늄': 600,
  '철': 100,
  'PP': 250,
  'PS': 250
};

// ✅ 프론트에서 전달된 type 기준으로 포인트 적립
exports.earnPoint = async (req, res) => {
  const { user_id, activity_type } = req.body;

  if (!user_id || !activity_type) {
    return res.status(400).json({ error: 'user_id와 activity_type이 필요합니다.' });
  }

  const point = pointRules[activity_type];
  if (!point) {
    return res.status(400).json({ error: `적립 가능한 항목이 아닙니다: ${activity_type}` });
  }

  try {
    const result = await Incentive.create({
      user_id,
      activity_type,
      earned_point: point
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('🔥 적립 실패:', err.message);
    res.status(500).json({ error: '포인트 적립 실패', details: err.message });
  }
};
