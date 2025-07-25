const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  activity_type: { type: String }, // 우유팩, 유리병 등
  earned_point: { type: Number },
  used_point: { type: Number },
  exchange_type: { type: String }, // 화장지, 기프티콘 등
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incentive', incentiveSchema);