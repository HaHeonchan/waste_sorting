module.exports = (req, res, next) => {
    // TODO: 실제 서비스에서는 JWT 또는 세션 기반 인증으로 대체
    // 현재는 MongoDB 기반 테스트용으로 user_id만 고정 부여
    req.user = {
        user_id: 1,               // 숫자형 ID (Report 모델과 연동됨)
        name: '테스트유저'
    };
    next();
};
