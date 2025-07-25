// login.jsx
import React, { useState } from 'react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle } from '../../utils/auth';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const result = await loginWithEmail(formData.email, formData.password);
      
      if (result.success) {
        login(result.user);
        alert('로그인 성공!');
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle();
      if (result.success) {
        login(result.user);
        alert('구글 로그인 성공!');
        navigate('/');
      }
    } catch (err) {
      setError('구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-icon"></div>
        <h2 className="login-title">로그인</h2>
        <p className="login-sub">스마트 분리배출 도우미에 오신 것을 환영합니다</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleEmailLogin}>
          <div className="login-input-group">
            <label htmlFor="email">이메일</label>
            <input 
              type="email" 
              id="email" 
              name="email"
              placeholder="이메일을 입력하세요" 
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password">비밀번호</label>
            <div className="password-wrapper">
              <input 
                type="password" 
                id="password" 
                name="password"
                placeholder="비밀번호를 입력하세요" 
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="password-eye">👁️</span>
            </div>
          </div>

          <div className="login-options">
            <label><input type="checkbox" /> 로그인 상태 유지</label>
            <a href="#" className="find-password">비밀번호 찾기</a>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-divider">또는</div>

        <button 
          className="login-btn-google"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          구글로 로그인
        </button>

        <div className="signup-guide">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
