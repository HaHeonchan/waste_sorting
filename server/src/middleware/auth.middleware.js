module.exports = (req, res, next) => {
    // 실 서비스라면 JWT 등 실제 인증 추가
    // 여기선 테스트용으로 user_id 1번 할당
    req.user = { user_id: 1, name: '테스트유저' };
    next();
};
