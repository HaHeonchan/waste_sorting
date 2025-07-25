// login.jsx
import React from 'react';
import './login.css';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-icon"></div>
        <h2 className="login-title">로그인</h2>
        <p className="login-sub">스마트 분리배출 도우미에 오신 것을 환영합니다</p>

        <div className="login-input-group">
          <label htmlFor="email">이메일</label>
          <input type="email" id="email" placeholder="이메일을 입력하세요" />
        </div>

        <div className="login-input-group">
          <label htmlFor="password">비밀번호</label>
          <div className="password-wrapper">
            <input type="password" id="password" placeholder="비밀번호를 입력하세요" />
            <span className="password-eye">👁️</span>
          </div>
        </div>

        <div className="login-options">
          <label><input type="checkbox" /> 로그인 상태 유지</label>
          <a href="#" className="find-password">비밀번호 찾기</a>
        </div>

        <button className="login-btn">로그인</button>

        <div className="login-divider">또는</div>

        <button className="login-btn-kakao">카카오로 로그인</button>
        <button className="login-btn-naver">네이버로 로그인</button>

        <div className="signup-guide">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
