/**
 * 인증 미들웨어
 * 사용자 로그인 상태를 확인하고 인증되지 않은 요청을 차단
 */

const authMiddleware = (req, res, next) => {
    // 세션에서 사용자 정보 확인
    if (req.isAuthenticated()) {
        // 인증된 사용자라면 다음 미들웨어로 진행
        return next();
    }
    
    // 개발 환경에서 테스트용 사용자 정보 설정 (선택사항)
    if (process.env.NODE_ENV === 'development' && req.headers['x-test-user']) {
        req.user = {
            user_id: 1,               // 숫자형 ID (Report 모델과 연동됨)
            name: '테스트유저'
        };
        return next();
    }
    
    // 인증되지 않은 사용자라면 401 Unauthorized 응답
    return res.status(401).json({ 
        message: '로그인이 필요합니다.',
        error: 'UNAUTHORIZED'
    });
};

module.exports = authMiddleware; 