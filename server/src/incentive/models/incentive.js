const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  activity_type: { type: String, required: true }, // 예: '무색페트'
  earned_point: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incentive', incentiveSchema);