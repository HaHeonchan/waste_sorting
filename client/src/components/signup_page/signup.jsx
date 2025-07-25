import React, { useState } from 'react';
import './signup.css';
import { FaUserPlus } from 'react-icons/fa';

function Signup() {
  const [form, setForm] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    console.log('가입 정보:', form);
    // 회원가입 처리 로직 여기에 추가
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-avatar" />
        <h2>회원가입</h2>
        <p className="signup-subtext">환경 보호에 함께 참여해보세요</p>
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="email"
            name="email"
            placeholder="이메일을 입력하세요"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="nickname"
            placeholder="닉네임을 입력하세요"
            value={form.nickname}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 입력하세요"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호를 다시 입력하세요"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
                required
              />
              서비스 이용약관에 동의합니다 *
            </label>
            <label>
              <input
                type="checkbox"
                name="agreePrivacy"
                checked={form.agreePrivacy}
                onChange={handleChange}
                required
              />
              개인정보 수집 및 이용에 동의합니다 *
            </label>
            <label>
              <input
                type="checkbox"
                name="agreeMarketing"
                checked={form.agreeMarketing}
                onChange={handleChange}
              />
              마케팅 수신에 동의합니다 (선택)
            </label>
          </div>
          <button type="submit" className="signup-btn">
            <FaUserPlus /> 회원가입
          </button>
        </form>
        <p className="login-link">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
