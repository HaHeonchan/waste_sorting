const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['질문', '제보', '정보', '기타'],
    default: '기타'
  },
  image_url: {
    type: String,
    default: ''
  },
  likes: {
    type: Number,
    default: 0
  },
  liked_by: [{
    type: String  // 좋아요를 누른 사용자 ID 배열
  }],
  comment_count: {
    type: Number,
    default: 0
  },
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
PostSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Post', PostSchema); 