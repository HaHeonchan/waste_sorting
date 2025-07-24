import React, { useState } from 'react';
import './Report.css';
import { FaMapMarkerAlt } from 'react-icons/fa';

export default function Report() {
  const [selectedType, setSelectedType] = useState('');

  const reportTypes = [
    { key: 'a', label: '담배꽁초', reward: '5,000원', emoji: '🚭' },
    { key: 'b', label: '대형폐기물', reward: '20,000원', emoji: '🧳' },
    { key: 'c', label: '쓰레기무단투기', reward: '10,000원', emoji: '🗑️' },
    { key: 'd', label: '기타', reward: '3,000원', emoji: '❗' },
  ];

  const mockReports = [
    {
      id: 1,
      type: '대형폐기물',
      content: 'dasf',
      date: '2025. 7. 24. 오후 4:09:16',
      reward: '20,000원',
    },
    {
      id: 2,
      type: '담배꽁초',
      content: 'dfsa',
      date: '2025. 7. 24. 오후 4:09:05',
      reward: '5,000원',
    },
  ];

  return (
    <div className="report-container">
      <div className="left-panel">
        <h2>새 민원 작성</h2>
        <p className="section-label">신고 유형 선택</p>
        <div className="report-types">
          {reportTypes.map((type) => (
            <div
              key={type.key}
              className={`report-type ${selectedType === type.key ? 'selected' : ''}`}
              onClick={() => setSelectedType(type.key)}
            >
              <div className="icon">{type.emoji}</div>
              <div className="label">{type.label}</div>
              <div className="reward">포상금: {type.reward}</div>
            </div>
          ))}
        </div>

        <p className="section-label">사진 첨부</p>
        <div className="photo-box">
          <div className="photo-icon">📷</div>
          <p>신고할 내용의 사진을 첨부해주세요</p>
          <button className="select-photo">사진 선택</button>
        </div>

        <input className="address-input" placeholder="주소를 입력하거나 현재 위치를 사용하세요" />
        <button className="gps-btn"><FaMapMarkerAlt /></button>

        <textarea className="description-input" placeholder="신고 내용을 자세히 설명해주세요" />

        <div className="button-row">
          <button className="submit-btn">민원 제출</button>
          <button className="cancel-btn">취소</button>
        </div>
      </div>

      <div className="right-panel">
        <h2>내 민원 목록</h2>
        {mockReports.map((report) => (
          <div className="report-card" key={report.id}>
            <div className="report-header">
              <span className="report-type">{report.type}</span>
              <span className="status">처리중</span>
            </div>
            <p className="report-content">{report.content}</p>
            <p className="report-date">{report.date}</p>
            <div className="report-footer">
              <span>👍 추천 0</span>
              <div className="report-actions">
                <button>✏ 수정</button>
                <button>🗑 삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
