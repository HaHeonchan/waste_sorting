const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 기본 정보
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String // 구글 로그인 사용자는 비밀번호가 없을 수 있음
  },

  // 구글 OAuth 정보
  googleId: {
    type: String,
    sparse: true, // null 값 허용하되 unique 유지
    unique: true
  },
  displayName: {
    type: String
  },
  profilePicture: {
    type: String
  },

  // 포인트 및 활동 정보
  points: {
    type: Number,
    default: 0
  },
  recycleCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },

  // 타임스탬프
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

// 이메일과 구글 ID 중 하나는 반드시 있어야 함
userSchema.pre('save', function(next) {
  if (!this.email) {
    return next(new Error('이메일은 필수입니다.'));
  }
  if (!this.password && !this.googleId) {
    return next(new Error('비밀번호 또는 구글 ID 중 하나는 필요합니다.'));
  }
  next();
});

// 실제 로그인 성공 시, lastLogin 업데이트(이건 서비스단에서 직접!)
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

// 중복 모델 등록 방지! (핫리로드 환경 대비)
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
