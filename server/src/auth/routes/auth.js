const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const passport = require('passport');
const User     = require('../models/User');
const router   = express.Router();

// ===== 구글 OAuth 라우터 =====

// 구글 로그인 시작
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// 프론트엔드용 구글 로그인 (팝업 창용)
router.get('/google/popup', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// 구글 로그인 콜백 (팝업 창용으로 통일)
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/login?status=error&message=로그인 실패',
        failureFlash: true
    }),
    (req, res) => {
        if (req.isAuthenticated()) {
            // JWT 토큰 생성
            const token = jwt.sign(
                { email: req.user.email, name: req.user.name, id: req.user._id },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );
            
            const userInfo = {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                points: req.user.points,
                recycleCount: req.user.recycleCount,
                reportCount: req.user.reportCount,
                createdAt: req.user.createdAt,
                lastLogin: req.user.lastLogin
            };
            
            // 팝업 창용 응답 (postMessage로 부모 창에 전달)
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>로그인 완료</title>
                </head>
                <body>
                    <script>
                        console.log('Google login callback executed');
                        if (window.opener) {
                            console.log('Sending message to parent window');
                            window.opener.postMessage({
                                type: 'GOOGLE_LOGIN_SUCCESS',
                                user: ${JSON.stringify(userInfo)},
                                token: '${token}'
                            }, '*');
                            console.log('Message sent, closing window');
                            window.close();
                        } else {
                            console.log('No opener window, redirecting');
                            window.location.href = '/?login=success&message=성공적으로 로그인되었습니다.';
                        }
                    </script>
                    <p>로그인 처리 중...</p>
                </body>
                </html>
            `;
            res.send(html);
        } else {
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>로그인 실패</title>
                </head>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GOOGLE_LOGIN_ERROR',
                                error: '로그인 처리 중 오류가 발생했습니다.'
                            }, '*');
                            window.close();
                        } else {
                            window.location.href = '/login?status=error&message=로그인 처리 중 오류가 발생했습니다.';
                        }
                    </script>
                    <p>로그인 실패! 창이 자동으로 닫힙니다...</p>
                </body>
                </html>
            `;
            res.send(errorHtml);
        }
    }
);

// ===== 일반 로그인/회원가입 라우터 =====
// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name||!email||!password)
      return res.status(400).json({ msg: '모두 입력해주세요.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ msg: '이미 가입된 이메일입니다.' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    const token = jwt.sign({ email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email, points: user.points } });
  } catch (err) {
    res.status(500).json({ msg: '서버 에러', error: err.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  console.log('로그인 요청:', req.body);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: '가입되지 않은 이메일입니다.' });

    // 만약 비밀번호가 없는(소셜로그인) 유저라면
    if (!user.password) return res.status(400).json({ msg: '비밀번호로 로그인할 수 없는 계정입니다.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ msg: '비밀번호가 틀렸습니다.' });

    const token = jwt.sign({ email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email, points: user.points } });
  } catch (err) {
    res.status(500).json({ msg: '서버 에러', error: err.message });
  }
});


module.exports = router;
