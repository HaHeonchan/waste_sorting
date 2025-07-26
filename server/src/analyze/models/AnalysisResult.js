const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  analysisResult: {
    type: {
      type: String,
      required: false,
      default: '알 수 없음'
    },
    detail: {
      type: String,
      required: false,
      default: '알 수 없음'
    },
    mark: {
      type: String,
      required: false,
      default: '알 수 없음'
    },
    description: {
      type: String,
      required: false,
      default: '알 수 없음'
    },
    method: {
      type: String,
      required: false,
      default: '알 수 없음'
    },
    model: {
      type: String,
      required: false,
      default: '알 수 없음'
    },
    tokenUsage: {
      type: String,
      required: false,
      default: '알 수 없음'
    }
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['analyzed', 'uploaded'],
    default: 'analyzed'
  }
}, {
  timestamps: true
});

// 인덱스 추가
analysisResultSchema.index({ userId: 1, uploadedAt: -1 });
analysisResultSchema.index({ status: 1 });

module.exports = mongoose.model('AnalysisResult', analysisResultSchema); 