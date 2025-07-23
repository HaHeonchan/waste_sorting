const mongoose = require('mongoose');

const wasteItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['일반쓰레기', '재활용', '음식물쓰레기', '의류수거함', '폐건전지', '폐형광등']
    },
    description: {
        type: String,
        trim: true
    },
    disposalMethod: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 업데이트 시 updatedAt 자동 설정
wasteItemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('WasteItem', wasteItemSchema); 