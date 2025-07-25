import React, { useState } from 'react';
import './signup.css';
import { FaUserPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../utils/auth';

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 비밀번호 확인
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    // 필수 약관 동의 확인
    if (!form.agreeTerms || !form.agreePrivacy) {
      setError('필수 약관에 동의해주세요.');
      setLoading(false);
      return;
    }

    // 비밀번호 길이 확인
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const result = await signup(form.nickname, form.email, form.password);
      
      if (result.success) {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        navigate('/login');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-avatar" />
        <h2>회원가입</h2>
        <p className="signup-subtext">환경 보호에 함께 참여해보세요</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="email"
            name="email"
            placeholder="이메일을 입력하세요"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="text"
            name="nickname"
            placeholder="닉네임을 입력하세요"
            value={form.nickname}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 입력하세요 (6자 이상)"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호를 다시 입력하세요"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
                required
                disabled={loading}
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
                disabled={loading}
              />
              개인정보 수집 및 이용에 동의합니다 *
            </label>
            <label>
              <input
                type="checkbox"
                name="agreeMarketing"
                checked={form.agreeMarketing}
                onChange={handleChange}
                disabled={loading}
              />
              마케팅 수신에 동의합니다 (선택)
            </label>
          </div>
          <button 
            type="submit" 
            className="signup-btn"
            disabled={loading}
          >
            <FaUserPlus /> {loading ? '가입 중...' : '회원가입'}
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
