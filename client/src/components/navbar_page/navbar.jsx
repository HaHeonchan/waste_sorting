import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

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
        <Link to="/login" className="login-btn mobile-login">➡ 로그인</Link>
      </nav>

      {/* 우측 로그인 버튼 */}
      <div className="navbar-right">
        <Link to="/login" className="login-btn desktop-login">➡ 로그인</Link>
      </div>
    </header>
  );
};

export default Navbar;
