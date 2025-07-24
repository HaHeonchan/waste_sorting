import React from 'react';
import './Mypage.css';

export default function MyPage() {
  return (
    <div className="mypage">
      <div className="mypage-header">
        <h1>마이페이지</h1>
        <p>내 활동 기록과 통계를 확인해보세요</p>
      </div>

      <div className="mypage-profile-card">
        <div className="mypage-profile-left">
          <div className="mypage-icon">♻️</div>
          <div className="mypage-user-info">
            <h2>익명</h2>
            <p>가입일: 2025. 7. 24.</p>
            <p>레벨: 환경 전문가 (Lv.1)</p>
          </div>
        </div>
        <div className="mypage-points">0 P<br /><span>보유 포인트</span></div>
      </div>

      <div className="mypage-summary-box">
        <div className="mypage-summary-item green">
          <div className="circle">🟢</div>
          <div className="count">0</div>
          <div className="label">분리배출 인증</div>
        </div>
        <div className="mypage-summary-item orange">
          <div className="circle">🟠</div>
          <div className="count">0</div>
          <div className="label">리워드 교환</div>
        </div>
        <div className="mypage-summary-item warning">
          <div className="circle">⚠️</div>
          <div className="count">2</div>
          <div className="label">민원 신고</div>
        </div>
        <div className="mypage-summary-item like">
          <div className="circle">👍</div>
          <div className="count">0</div>
          <div className="label">받은 추천</div>
        </div>
      </div>

      <div className="mypage-stats">
        <div className="mypage-stats-section">
          <h3>월별 분리배출 현황</h3>
          <ul>
            <li><span>2024.01</span><div className="bar"><div style={{ width: '80%' }} /></div><span>34건</span></li>
            <li><span>2023.12</span><div className="bar"><div style={{ width: '60%' }} /></div><span>28건</span></li>
            <li><span>2023.11</span><div className="bar"><div style={{ width: '90%' }} /></div><span>38건</span></li>
            <li><span>2023.10</span><div className="bar"><div style={{ width: '50%' }} /></div><span>24건</span></li>
          </ul>
        </div>

        <div className="mypage-stats-section">
          <h3>최근 활동 내역</h3>
          <ul className="activity-log">
            <li>
              ⚠️ <strong>대형폐기물 신고</strong><br />
              2025. 7. 24. 오후 4:09:16 <br />처리 중
            </li>
            <li>
              ⚠️ <strong>담배꽁초 신고</strong><br />
              2025. 7. 24. 오후 4:09:05 <br />처리 중
            </li>
          </ul>
        </div>
      </div>

      <div className="mypage-badges">
        <h3>획득 배지</h3>
        <div className="badges">
          <div>🏆<br />분리배출 마스터<br /><span>100회 달성</span></div>
          <div>🌱<br />환경 지킴이<br /><span>10회 신고</span></div>
          <div>🪴<br />신입 환경지킴이<br /><span>첫 인증</span></div>
          <div>👑<br />플래티넘 멤버<br /><span>500회 달성</span></div>
        </div>
      </div>

      <div className="mypage-footer-buttons">
        <button className="btn green">🎁 인센티브 관리</button>
        <button className="btn blue">⚠️ 민원 제보</button>
        <button className="btn orange">📸 사진 업로드</button>
      </div>
    </div>
  );
}
