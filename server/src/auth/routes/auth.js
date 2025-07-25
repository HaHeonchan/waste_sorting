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

// 구글 로그인 콜백
router.get('/google/callback', (req, res, next) => {
    console.log('🔍 Google OAuth 콜백 요청:', {
        url: req.url,
        query: req.query,
        headers: req.headers,
        userAgent: req.get('User-Agent')
    });
    
    passport.authenticate('google', { 
        failureRedirect: '/login?status=error&message=로그인 실패',
        failureFlash: true
    })(req, res, next);
}, (req, res) => {
        // 로그인 성공 시 적절한 페이지로 리다이렉트
        if (req.isAuthenticated()) {
            // 팝업 창에서 로그인 성공 시 부모 창에 메시지 전송 후 창 닫기
            const successHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>로그인 성공</title>
                </head>
                <body>
                    <script>
                        // 부모 창에 로그인 성공 메시지 전송
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GOOGLE_LOGIN_SUCCESS',
                                user: {
                                    id: '${req.user._id}',
                                    name: '${req.user.name || req.user.displayName}',
                                    email: '${req.user.email}',
                                    profilePicture: '${req.user.profilePicture || ''}',
                                    points: ${req.user.points || 0},
                                    recycleCount: ${req.user.recycleCount || 0},
                                    reportCount: ${req.user.reportCount || 0}
                                }
                            }, '*');
                            window.close();
                        } else {
                            // 팝업이 아닌 경우 일반 리다이렉트
                            window.location.href = '/login?status=success&message=성공적으로 로그인되었습니다.';
                        }
                    </script>
                    <p>로그인 성공! 창이 자동으로 닫힙니다...</p>
                </body>
                </html>
            `;
            res.send(successHtml);
        } else {
            const errorHtml = `
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
        const { accountId, password } = req.body;
        const user = await User.findOne({ email: accountId });

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
router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            isAuthenticated: true,
            user: {
                id: req.user._id,
                displayName: req.user.displayName || req.user.name,
                email: req.user.email,
                profilePicture: req.user.profilePicture,
                points: req.user.points,
                recycleCount: req.user.recycleCount,
                reportCount: req.user.reportCount
            }
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

module.exports = router; 