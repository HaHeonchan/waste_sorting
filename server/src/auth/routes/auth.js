const express = require('express');
const passport = require('passport');
const router = express.Router();

// 구글 로그인 시작
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// 프론트엔드용 구글 로그인 (팝업 창용)
router.get('/google/popup', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// 구글 로그인 콜백
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/login?status=error&message=로그인 실패',
        failureFlash: true
    }),
    (req, res) => {
        // 로그인 성공 시 적절한 페이지로 리다이렉트
        if (req.isAuthenticated()) {
            // 로그인 성공 페이지로 리다이렉트
            res.redirect('/login?status=success&message=성공적으로 로그인되었습니다.');
        } else {
            res.redirect('/login?status=error&message=로그인 처리 중 오류가 발생했습니다.');
        }
    }
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