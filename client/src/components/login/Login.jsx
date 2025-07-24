// login.jsx
import React from 'react';
import './Login.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState("");          // 이메일
    const [password, setPassword] = useState("");    // 비밀번호
    const [error, setError] = useState("");          // 에러메시지
    const navigate = useNavigate();                  // 페이지 이동용

const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", {
        accountId: email,
        password
      });
      localStorage.setItem("token", res.data.token);
      console.log("로그인 성공:", res.data);
      alert("로그인 성공!");
      navigate("/mypage");    // 로그인 성공시 마이페이지로 이동
    } catch (err) {
      setError("로그인 실패: 아이디 또는 비밀번호를 확인하세요");
    }
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 처리 로직
  };

  return (
    <div className="login-wrapper">
  <div className="login-container">
    <form onSubmit={handleLogin}>
      <div className="login-icon"></div>
      <h2 className="login-title">로그인</h2>
      <p className="login-sub">스마트 분리배출 도우미에 오신 것을 환영합니다</p>

      <div className="login-input-group">
        <label htmlFor="email">아이디</label>
        <input
          type="text"
          id="email"
          placeholder="아이디를 입력하세요"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="login-input-group">
        <label htmlFor="password">비밀번호</label>
        <div className="password-wrapper">
          <input
            type="password"
            id="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <span className="password-eye">👁️</span>
        </div>
      </div>

      <div className="login-options">
        <label>
          <input type="checkbox" /> 로그인 상태 유지
        </label>
        <a href="#" className="find-password">비밀번호 찾기</a>
      </div>

      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      <button className="login-btn" type="submit">로그인</button>

      <div className="login-divider">또는</div>
      <button className="login-btn-kakao" type="button">카카오로 로그인</button>
      <button className="login-btn-naver" type="button">네이버로 로그인</button>

      <div className="signup-guide">
        계정이 없으신가요? <Link to="/signup">회원가입</Link>
      </div>
    </form>
  </div>
</div>
  );
};

export default Login;