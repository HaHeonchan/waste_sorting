const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    item: {
        type: String,
        required: true
    },
    point: {
        type: Number,
        required: true
    },
    desc: {
        type: String
    },
    received: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Reward', rewardSchema); 