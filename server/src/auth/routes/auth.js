const express = require('express');
const passport = require('passport');
const router = express.Router();

// 구글 로그인 시작
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// 구글 로그인 콜백
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/login',
        successRedirect: '/'
    })
);

// 로그아웃
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: '로그아웃 중 오류가 발생했습니다.' });
        }
        res.redirect('/');
    });
});

// 현재 사용자 정보 확인
router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            isAuthenticated: true,
            user: {
                id: req.user._id,
                displayName: req.user.displayName,
                email: req.user.email,
                profilePicture: req.user.profilePicture
            }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

module.exports = router; 