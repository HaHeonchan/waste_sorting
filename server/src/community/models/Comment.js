const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  liked_by: [{
    type: String  // 좋아요를 누른 사용자 ID 배열
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시 updated_at 자동 갱신
CommentSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Comment', CommentSchema); 