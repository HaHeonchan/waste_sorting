import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false); // 메뉴 닫기용 함수
  const handleLogout = () => {
    // 여기에 실제 로그아웃 처리 로직 추가 가능
    setIsLoggedIn(false);
    closeMenu();
    navigate("/");
  };

  return (
    <header className="navbar">
      {/* 좌측 텍스트 + 햄버거 버튼 */}
      <div className="navbar-header">
        <Link to="/" className="title" onClick={closeMenu}>🌲 스마트 분리배출 도우미</Link>
        <button className="hamburger" onClick={toggleMenu} style={{ position: 'relative' }}>
          <span className="hamburger-icon" style={{
            opacity: menuOpen ? 0 : 1,
            transform: menuOpen ? 'scale(0.8)' : 'scale(1)',
            transition: 'opacity 0.3s, transform 0.3s',
            position: 'absolute',
          }}>
            ☰
          </span>
          <span className="hamburger-icon" style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? 'scale(1)' : 'scale(0.8)',
            transition: 'opacity 0.3s, transform 0.3s',
            position: 'absolute',
          }}>
            ☷
          </span>
</button>

      </div>

      {/* 중앙 메뉴 */}
      <nav className={`navbar-center ${menuOpen ? "active" : ""}`}>
        <Link to="/" className="nav-link" onClick={closeMenu}>🏠 홈</Link>
        <Link to="/sortguide" className="nav-link" onClick={closeMenu}>🔍 분리배출 안내</Link>
        <Link to="/incentive" className="nav-link" onClick={closeMenu}>🛍️ 인센티브 관리</Link>
        <Link to="/complain" className="nav-link" onClick={closeMenu}>⚠️ 민원 제보</Link>
        <Link to="/mypage" className="nav-link" onClick={closeMenu}>👤 마이페이지</Link>
        {isLoggedIn ? (
          <button className="login-btn mobile-login" onClick={handleLogout}>⬅ 로그아웃</button>
        ) : (
          <Link to="/login" className="login-btn mobile-login" onClick={closeMenu}>➡ 로그인</Link>
        )}
      </nav>

      {/* 우측 로그인 버튼 */}
      <div className="navbar-right">
        {isLoggedIn ? (
          <button className="login-btn desktop-login" onClick={handleLogout}>⬅ 로그아웃</button>
        ) : (
          <Link to="/login" className="login-btn desktop-login">➡ 로그인</Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
