const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  // 1. Authorization 헤더 체크
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No or invalid Authorization header' });
  }

  // 2. 토큰 추출
  const token = authHeader.split(' ')[1];

  // 3. JWT_SECRET 환경변수 체크
  if (!process.env.JWT_SECRET) {
    console.error('[authMiddleware] JWT_SECRET 환경변수 누락!');
    return res.status(500).json({ msg: 'Server misconfiguration (JWT_SECRET missing)' });
  }

  // 4. 토큰 검증
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // payload에 { email, name, ... }
    next();
  } catch (err) {
    console.error('[authMiddleware] JWT 검증 실패:', err.message);
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};
