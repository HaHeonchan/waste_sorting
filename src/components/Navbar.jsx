// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/" className="title">🌲 스마트 분리배출 도우미</Link>
      </div>
      <nav className="navbar-center">
        <Link to="/" className="nav-link">🏠 홈</Link>
        <Link to="/sortguide" className="nav-link">🔍 분리배출 안내</Link>
        <Link to="/incentive" className="nav-link">🛍️ 인센티브 관리</Link>
        <Link to="/report" className="nav-link">⚠️ 민원 제보</Link>
        <Link to="/mypage" className="nav-link">👤 마이페이지</Link>
      </nav>
      <div className="navbar-right">
        <Link to="/login" className="login-btn">➡ 로그인</Link>
      </div>
    </header>
  );
};

export default Navbar;
