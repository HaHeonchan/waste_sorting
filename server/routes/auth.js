const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = mongoose.model('User');

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

    const token = jwt.sign(
      { email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({ token });

  } catch (err) {
    console.error("로그인 에러:", err);
    res.status(500).json({ msg: "서버 오류" });
  }
});

// 회원가입
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 입력값 검증 예시 (실무에서는 더 강력하게)
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

module.exports = router;
