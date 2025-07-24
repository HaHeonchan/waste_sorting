import React from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>AI가 도와주는 스마트 분리배출</h1>
        <p>사진을 업로드하면 AI가 분리배출 방법을 알려드려요</p>
      </div>

      <div className="upload-box">
        <div className="upload-inner">
          <i className="upload-icon">📤</i>
          <h2>사진을 업로드해주세요</h2>
          <p>분리배출할 물건의 사진을 올려주시면 AI가 분석해드립니다</p>
          <button className="upload-button">📁 사진 선택</button>
        </div>
      </div>

      <div className="feature-cards">
        <div onClick={() => navigate('/sortguide')} className="card card-green">
          <div className="card-icon">🔍</div>
          <div className="card-title">분리배출 안내</div>
          <div className="card-desc">올바른 분리배출 방법을 확인하세요</div>
        </div>
        <div onClick={() => navigate('/incentives')} className="card card-orange">
          <div className="card-icon">🎁</div>
          <div className="card-title">인센티브 관리</div>
          <div className="card-desc">포인트를 모아보세요</div>
        </div>
        <div onClick={() => navigate('/complain')} className="card card-red">
          <div className="card-icon">🚨</div>
          <div className="card-title">민원 제보</div>
          <div className="card-desc">환경 오염을 신고하세요</div>
        </div>
        <div onClick={() => navigate('/mypage')} className="card card-blue">
          <div className="card-icon">👤</div>
          <div className="card-title">마이페이지</div>
          <div className="card-desc">내 활동 기록을 확인하세요</div>
        </div>
      </div>

      <div className="stats-box">
        <h2>오늘의 분리배출 현황</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number green">1,247</div>
            <div className="stat-label">총 분석 요청</div>
          </div>
          <div className="stat-item">
            <div className="stat-number green">98.5%</div>
            <div className="stat-label">AI 정확도</div>
          </div>
          <div className="stat-item">
            <div className="stat-number orange">856</div>
            <div className="stat-label">절약된 CO₂ (kg)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
