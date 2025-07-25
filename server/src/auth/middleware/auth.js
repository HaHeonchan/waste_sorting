const jwt = require('jsonwebtoken');

/**
 * 통합 인증 미들웨어
 * Passport 세션 기반 인증과 JWT 토큰 기반 인증을 모두 지원
 */
const authMiddleware = (req, res, next) => {
    // 1. 먼저 Passport 세션 인증 확인
    if (req.isAuthenticated()) {
        return next();
    }
    
    // 2. JWT 토큰 인증 확인
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(" ")[1];
        
        // JWT 시크릿 체크
        if (!process.env.JWT_SECRET) {
            console.error("[authMiddleware] JWT_SECRET 환경변수 누락!");
            return res.status(500).json({ msg: "Server misconfiguration (JWT_SECRET missing)" });
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { email, name, ... } 구조
            return next();
        } catch (err) {
            console.error("[authMiddleware] JWT 검증 실패:", err.message);
            // JWT 실패 시 세션 인증으로 계속 진행
        }
    }
    
    // 3. 개발 환경에서 테스트용 사용자 정보 설정 (선택사항)
    if (process.env.NODE_ENV === 'development' && req.headers['x-test-user']) {
        req.user = {
            user_id: 1,
            name: '테스트유저'
        };
        return next();
    }
    
    // 4. 모든 인증 방식 실패 시 401 Unauthorized 응답
    return res.status(401).json({ 
        message: '로그인이 필요합니다.',
        error: 'UNAUTHORIZED'
    });
};

module.exports = authMiddleware; 