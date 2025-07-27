const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

const User = mongoose.model('User');

// ===== 구글 OAuth 라우터 =====

// 구글 로그인 시작
router.get('/google', (req, res, next) => {
    console.log('🔍 Google OAuth 시작 요청:', {
        url: req.url,
        headers: req.headers,
        userAgent: req.get('User-Agent')
    });
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
});

// 프론트엔드용 구글 로그인 (팝업 창용)
router.get('/google/popup', (req, res, next) => {
    console.log('🔍 Google OAuth 팝업 요청:', {
        url: req.url,
        headers: req.headers,
        userAgent: req.get('User-Agent')
    });
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
});

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



// ===== 이메일/비밀번호 기반 인증 라우터 =====

// 로그인
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });

        // 보안: 아이디/비번 불일치 모두 동일 응답
        if (!user || user.password !== password) {
            return res.status(401).json({ msg: "로그인 실패: 아이디 또는 비밀번호를 확인하세요" });
        }

        // JWT 시크릿 없을 때 에러
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ msg: "서버 환경변수(JWT_SECRET) 미설정" });
        }

        // 마지막 로그인 시간 업데이트
        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { email: user.email, name: user.name, id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );
        
        // 토큰과 함께 사용자 정보도 반환
        res.json({ 
            token,
            name: user.name,
            id: user._id,
            points: user.points,
            recycleCount: user.recycleCount,
            reportCount: user.reportCount,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        });

    } catch (err) {
        console.error("로그인 에러:", err);
        res.status(500).json({ msg: "서버 오류" });
    }
});

// 회원가입
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 입력값 검증
        if (!name || !email || !password) {
            return res.status(400).json({ msg: "모든 필드를 입력하세요" });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(409).json({ msg: "이미 가입된 이메일입니다." });
        }

        await User.create({
            name,
            email,
            password,
            points: 0,
            recycleCount: 0,
            reportCount: 0,
        });

        res.json({ ok: true, msg: "회원가입 완료!" });

    } catch (err) {
        console.error("회원가입 에러:", err);
        res.status(500).json({ msg: "서버 오류" });
    }
});

// ===== 공통 라우터 =====

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
router.get('/user', async (req, res) => {
    try {
        // JWT 토큰에서 사용자 정보 확인
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(" ")[1];
            
            if (!process.env.JWT_SECRET) {
                return res.status(500).json({ msg: "서버 환경변수(JWT_SECRET) 미설정" });
            }
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                
                if (user) {
                    return res.json({
                        isAuthenticated: true,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            points: user.points,
                            recycleCount: user.recycleCount,
                            reportCount: user.reportCount,
                            createdAt: user.createdAt,
                            lastLogin: user.lastLogin
                        }
                    });
                }
            } catch (err) {
                console.error("JWT 검증 실패:", err);
            }
        }
        
        // Passport 세션 인증 확인
        if (req.isAuthenticated()) {
            return res.json({
                isAuthenticated: true,
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    points: req.user.points,
                    recycleCount: req.user.recycleCount,
                    reportCount: req.user.reportCount,
                    createdAt: req.user.createdAt,
                    lastLogin: req.user.lastLogin
                }
            });
        }
        
        res.json({ isAuthenticated: false });
    } catch (err) {
        console.error("사용자 정보 조회 에러:", err);
        res.status(500).json({ msg: "서버 오류" });
    }
});

module.exports = router; 