const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user_id: Number,
  title: String,
  content: String,
  reward: String,
  image_url: String,
  likes: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
