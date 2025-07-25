import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./navbar.css";
import { useAuth } from "../../contexts/AuthContext";
import { logout as logoutUser } from "../../utils/auth";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    logoutUser();
    logout();
  };

  return (
    <header className="navbar">
      {/* 좌측 텍스트 + 햄버거 버튼 */}
      <div className="navbar-header">
        <Link to="/" className="title">🌲 스마트 분리배출 도우미</Link>
        <button className="hamburger" onClick={toggleMenu}>☰</button>
      </div>

      {/* 중앙 메뉴 */}
      <nav className={`navbar-center ${menuOpen ? "active" : ""}`}>
        <Link to="/" className="nav-link">🏠 홈</Link>
        <Link to="/sortguide" className="nav-link">🔍 분리배출 안내</Link>
        <Link to="/incentive" className="nav-link">🛍️ 인센티브 관리</Link>
        <Link to="/complain" className="nav-link">⚠️ 민원 제보</Link>
        <Link to="/mypage" className="nav-link">👤 마이페이지</Link>
        {isAuthenticated ? (
          <button onClick={handleLogout} className="logout-btn mobile-logout">
            🚪 로그아웃
          </button>
        ) : (
          <Link to="/login" className="login-btn mobile-login">➡ 로그인</Link>
        )}
      </nav>

      {/* 우측 로그인/사용자 정보 */}
      <div className="navbar-right">
        {isAuthenticated ? (
          <div className="user-info">
            <span className="user-name">👤 {user?.displayName || user?.name || '사용자'}</span>
            <button onClick={handleLogout} className="logout-btn desktop-logout">
              🚪 로그아웃
            </button>
          </div>
        ) : (
          <Link to="/login" className="login-btn desktop-login">➡ 로그인</Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
