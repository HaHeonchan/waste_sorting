const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Reward = require('../models/Reward');

// 사용자 정보 조회
router.get('/user/info', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ msg: "사용자를 찾을 수 없습니다." });
        }
        res.json(user);
    } catch (err) {
        console.error("사용자 정보 조회 에러:", err);
        res.status(500).json({ msg: "서버 오류" });
    }
});

// 리워드 목록 조회
router.get('/reward/list', authMiddleware, async (req, res) => {
    try {
        const rewards = await Reward.find({ userEmail: req.user.email }).sort({ date: -1 });
        res.json(rewards);
    } catch (err) {
        console.error("리워드 목록 조회 에러:", err);
        res.status(500).json({ msg: "서버 오류" });
    }
});

// 리워드 교환
router.post('/reward/exchange', authMiddleware, async (req, res) => {
    try {
        const { item, points } = req.body;
        const userEmail = req.user.email;
        
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.json({ ok: false, msg: "유저를 찾을 수 없음" });
        }

        if (user.points < points) {
            return res.json({ ok: false, msg: "포인트 부족" });
        }
        
        const already = await Reward.findOne({ userEmail, item, received: true });
        if (already) {
            return res.json({ ok: false, msg: "이미 교환한 상품!" });
        }
        
        user.points -= points;
        await user.save();
        
        await Reward.create({
            userEmail,
            item,
            points,
            date: new Date().toISOString().slice(0, 10),
            received: true,
        });
        
        res.json({ ok: true, newPoints: user.points });
    } catch (err) {
        console.error("리워드 교환 에러:", err);
        res.status(500).json({ msg: "서버 오류" });
    }
});

module.exports = router; 