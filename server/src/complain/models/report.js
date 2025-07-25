const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user_id: Number,
  title: String,
  content: String,
  reward: String,
  image_url: String,
  likes: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 업데이트 시 updated_at 자동 갱신
ReportSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Report', ReportSchema);
