import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";
import { useAuth } from "../../contexts/AuthContext";
import { logout as logoutUser } from "../../utils/auth";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const { user, isAuthenticated, logout, error: authError } = useAuth();
  const [isDark, setIsDark] = useState(false);

  // 다크 모드 토글
  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    document.body.classList.toggle("dark", newMode);
    localStorage.setItem("darkMode", newMode);
  };

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setIsDark(saved);
    document.body.classList.toggle("dark", saved);
  }, []);

  useEffect(() => {
    if (authError) {
      console.warn('인증 에러:', authError);
      handleLogout();
    }
  }, [authError]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    try {
      logoutUser();
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 에러:', error);
      logout();
      window.location.href = '/';
    }
  };

  const getUserDisplayName = () => {
    if (!user) return '사용자';
    if (user.name) return user.name;
    if (user.displayName) return user.displayName;
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.length > 10 ? emailName.substring(0, 10) + '...' : emailName;
    }
    return '사용자';
  };

  return (
    <header className="navbar">
      {/* 좌측: 로고 + 다크 토글 + 햄버거 */}
      <div className="navbar-header">
        <div className="navbar-left">
          <Link to="/" className="navbar-title-link" onClick={() => setMenuOpen(false)}>
            <div className="navbar-title-container">
              <img src={require("./logo.png")} alt="로고" className="navbar-logo" />
              <span className="navbar-title">스마트 분리배출 플랫폼</span>
            </div>
          </Link>
          <div className={`theme-toggle-switch ${isDark ? "dark" : ""}`} onClick={toggleDarkMode}>
            <div className="toggle-circle" />
          </div>
        </div>

        <button className="hamburger" onClick={toggleMenu} style={{ position: 'relative' }}>
          <span
            className="hamburger-icon"
            style={{
              opacity: menuOpen ? 0 : 1,
              transform: menuOpen ? 'scale(0.8)' : 'scale(1)',
              transition: 'opacity 0.3s, transform 0.3s',
              position: 'absolute',
            }}
          >
            ☰
          </span>
          <span
            className="hamburger-icon"
            style={{
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'scale(1)' : 'scale(0.8)',
              transition: 'opacity 0.3s, transform 0.3s',
              position: 'absolute',
            }}
          >
            ☷
          </span>
        </button>
      </div>

      {/* 중앙 메뉴 */}
      <nav className={`navbar-center ${menuOpen ? "active" : ""}`}>
        <Link to="/" className="nav-link" onClick={closeMenu}>🏠 홈</Link>
        <Link to="/sortguide" className="nav-link" onClick={closeMenu}>🔍 분리배출 안내</Link>
        <Link to="/incentive" className="nav-link" onClick={closeMenu}>🛍️ 인센티브 관리</Link>
        {/* <Link to="/complain" className="nav-link" onClick={closeMenu}>⚠️ 민원 제보</Link> */}
        <Link to="/community" className="nav-link" onClick={closeMenu}>🌱 커뮤니티</Link>
        <Link to="/mypage" className="nav-link" onClick={closeMenu}>👤 마이페이지</Link>

        {isAuthenticated ? (
          <div className="user-info-mobile">
            <span className="user-name-mobile" title={user?.email || ''}>
              👤 {getUserDisplayName()}
            </span>
            <button onClick={handleLogout} className="logout-btn-mobile">🚪 로그아웃</button>
          </div>
        ) : (
          <Link to="/login" className="login-btn mobile-login" onClick={closeMenu}>➡ 로그인</Link>
        )}
      </nav>

      {/* 우측: 로그인/로그아웃 */}
      <div className="navbar-right">
        {isAuthenticated ? (
          <div className="user-info">
            <span className="user-name" title={user?.email || ''}>👤 {getUserDisplayName()}</span>
            <button onClick={handleLogout} className="logout-btn desktop-logout">🚪 로그아웃</button>
          </div>
        ) : (
          <Link to="/login" className="login-btn desktop-login">➡ 로그인</Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
