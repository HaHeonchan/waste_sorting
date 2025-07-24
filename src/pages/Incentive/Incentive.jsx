import React from "react";
import "./Incentive.css";

function Incentive() {
  return (
    <div className="incentive-container">
      <h1 className="incentive-title">인센티브 관리</h1>
      <p className="incentive-subtitle">
        분리배출로 포인트를 모으고 리워드를 받아보세요
      </p>

      {/* 보유 포인트 */}
      <div className="point-box">
        <div className="point-text">
          <h3>현재 보유 포인트</h3>
          <p className="point-amount">0 P</p>
          <p className="point-subtext">이번 달 적립 포인트</p>
        </div>
        <div className="point-icon">
          <i className="fas fa-coins"></i>
        </div>
      </div>

      {/* 적립 현황 */}
      <div className="category-boxes">
        <div className="category-box">
          <div className="category-icon glass"></div>
          <p>유리병<br /><span>/ 10개</span></p>
          <div className="progress-bar"><div></div></div>
          <p className="category-note">10개 더 모으면 500P 적립!</p>
        </div>
        <div className="category-box">
          <div className="category-icon paper"></div>
          <p>종이류<br /><span>/ 15개</span></p>
          <div className="progress-bar"><div></div></div>
          <p className="category-note">15개 더 모으면 300P 적립!</p>
        </div>
        <div className="category-box">
          <div className="category-icon plastic"></div>
          <p>플라스틱<br /><span>/ 20개</span></p>
          <div className="progress-bar"><div></div></div>
          <p className="category-note">20개 더 모으면 400P 적립!</p>
        </div>
      </div>

      {/* 리워드 스토어 */}
      <h2 className="store-title">리워드 스토어</h2>
      <div className="reward-store">
        {[
          { name: "스타벅스 기프티콘", desc: "아메리카노 Tall", point: "2000P" },
          { name: "편의점 기프티콘", desc: "5,000원권", point: "4500P" },
          { name: "에코백", desc: "친환경 장바구니", point: "1500P" },
          { name: "나무 한 그루 기부", desc: "환경 보호 캠페인", point: "3000P" },
        ].map((item, idx) => (
          <div className="reward-card" key={idx}>
            <div className="reward-image"></div>
            <p className="reward-name">{item.name}</p>
            <p className="reward-desc">{item.desc}</p>
            <p className="reward-point">{item.point}</p>
            <button className="disabled">포인트 부족</button>
          </div>
        ))}
      </div>

      {/* 교환 내역 */}
      <div className="exchange-history">
        <h2>교환 내역</h2>
        <p className="no-history">아직 교환 내역이 없습니다.</p>
      </div>
    </div>
  );
}

export default Incentive;
