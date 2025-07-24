const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Authorization 헤더 체크
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: "No or invalid Authorization header" });
  }

  // 2. 토큰 추출
  const token = authHeader.split(" ")[1];

  // 3. 시크릿 체크 (환경변수 제대로 불러왔는지 디버깅)
  if (!process.env.JWT_SECRET) {
    console.error("[authMiddleware] JWT_SECRET 환경변수 누락!");
    return res.status(500).json({ msg: "Server misconfiguration (JWT_SECRET missing)" });
  }

  try {
    // 4. 토큰 검증 및 디코드
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { email, name, ... } 구조
    next();
  } catch (err) {
    console.error("[authMiddleware] JWT 검증 실패:", err.message);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
