import React, { useEffect, useState, useRef } from "react";
import "./incentive.css";
import { motion } from "framer-motion";
import axios from "axios";

function Incentive() {
  const [summary, setSummary] = useState({ total_point: 0, this_month: 0 });
  const [earnedList, setEarnedList] = useState([]);
  const [showStorePopup, setShowStorePopup] = useState(false);
  const [showBotPopup, setShowBotPopup] = useState(false);

  const userId = localStorage.getItem("userId");
  const earnedListRef = useRef(null); // ref 선언

  const scrollLeft = () => {
    earnedListRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };
  const scrollRight = () => {
    earnedListRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };


  useEffect(() => {
    setSummary({ total_point: 1800, this_month: 600 });
    setEarnedList([
      { activity_type: "무색페트", earned_point: 300, created_at: new Date().toISOString() },
      { activity_type: "플라스틱", earned_point: 250, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      { activity_type: "알루미늄", earned_point: 600, created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
      { activity_type: "종이팩", earned_point: 200, created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
      { activity_type: "캔류", earned_point: 150, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { activity_type: "유리병", earned_point: 300, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    ]);
  }, []);

  useEffect(() => {
    if (!userId) return;
    axios.get(`/api/incentives/summary/${userId}`).then((res) => setSummary(res.data));
    axios.get(`/api/incentives/${userId}`).then((res) => {
      const onlyEarned = res.data.filter((item) => item.earned_point > 0);
      setEarnedList(onlyEarned);
    });
  }, [userId]);

  const toggleStorePopup = () => setShowStorePopup(!showStorePopup);
  const toggleBotPopup = () => setShowBotPopup(!showBotPopup);

  return (
    <motion.div
      className="incentive-container"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="incentive-title">인센티브 관리</h1>
      <p className="incentive-subtitle">스마트 분리배출 사진을 찍으면 얻게 될 포인트를 확인할 수 있습니다</p>

      <div className="point-box">
        <div className="point-text">
          <h3>현재 보유 포인트</h3>
          <p className="point-amount">{summary.total_point} P</p>
          <p className="point-subtext">이번 달 적립 포인트: {summary.this_month} P</p>
        </div>
        <div className="point-icon">
          <i className="fas fa-coins"></i>
        </div>
      </div>

      <div className="recent-earned">
        <h2>최근 자동 적립 내역</h2>
        {earnedList.length === 0 ? (
          <p className="no-history">아직 적립된 내역이 없습니다.</p>
        ) : (
          <div className="earned-wrapper">
            <button className="arrow left" onClick={() => {
              document.querySelector(".earned-list").scrollBy({ left: -300, behavior: "smooth" });
            }}>←</button>

            <div className="earned-list">
              {earnedList.map((item, i) => (
                <div
                  className="earned-card"
                  data-point={
                    item.earned_point >= 400
                      ? "high"
                      : item.earned_point >= 200
                      ? "medium"
                      : "low"
                  }
                  key={i}
                >
                  <strong>{item.activity_type}</strong>
                  <span className="earned-point">+{item.earned_point}P</span>
                  <span className="earned-date">{new Date(item.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <button className="arrow right" onClick={() => {
              document.querySelector(".earned-list").scrollBy({ left: 300, behavior: "smooth" });
            }}>→</button>
          </div>
        )}
      </div>


      <div className="link-buttons">
        <button onClick={toggleStorePopup}>자원순환 이응 가게 소개</button>
        <button onClick={toggleBotPopup}>자원순환 이응봇 소개</button>
      </div>

      {showStorePopup && (
        <div className="popup-overlay" onClick={toggleStorePopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h3>
              <a href="https://www.sejong.go.kr/bbs/R0126/view.do?nttId=B000000126898Wo4lX1w&cmsNoStr=2735" target="_blank" rel="noopener noreferrer">
                자원순환 이응가게란? ↗️
              </a>
            </h3>
            <p>깨끗하게 분리한 재활용품을 가져오면 품목별 무게측정 후 여민전 포인트로 유가보상하는 가게입니다.</p>
            <ul>
              <li>배출장소 : 도담동/소담동 싱싱장터, 조치원읍 복합커뮤니티센터</li>
              <li>배출품목 : 플라스틱류, 종이팩, 캔류</li>
              <li>이용방법 : 세종 시티앱 설치 → 분리배출 → 여민전 포인트 전환 신청</li>
              <li>탄소포인트 가입자에 한해 kg당 100원 탄소포인트 추가지급</li>
            </ul>
            <p className="public-license">
              공공누리 공공저작물 자유이용허락 제4유형 표시 : 출처표시, 상업용금지, 변경금지{"\n"}
              자원순환 이응가게 안내 저작물은 공공누리 조건에 따라 이용 가능합니다.
            </p>
            <button className="popup-close" onClick={toggleStorePopup}>×</button>
          </div>
        </div>
      )}

      {showBotPopup && (
        <div className="popup-overlay" onClick={toggleBotPopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h3>
              <a href="https://www.sejong.go.kr/recycle/sub02_11.do;jsessionid=220801247BE2DE5AF16E597ABCFF295E.portal1" target="_blank" rel="noopener noreferrer">
                자원순환 이응봇이란? ↗️
              </a>
            </h3>
            <p>세종시에 설치된 무인회수기로, 투명페트병과 캔을 투입하면 시티앱을 통해 포인트를 지급합니다.</p>
            <ul>
              <li>1. 시티앱 설치 및 QR코드 스캔</li>
              <li>2. 회수기에 투입</li>
              <li>3. 종료 후 포인트 확인 및 여민전 환전 신청</li>
              <li>4. 투입품목: 투명페트병, 알루미늄캔 (일부 제외)</li>
              <li>5. 위치: 반곡동, 해밀동 등 주민센터 및 학교 근처</li>
            </ul>
            <p className="public-license">
              공공누리 공공저작물 자유이용허락 제4유형 표시 : 출처표시, 상업용금지, 변경금지{"\n"}
              자원순환 이응봇 안내 저작물은 공공누리 조건에 따라 이용 가능합니다.
            </p>
            <button className="popup-close" onClick={toggleBotPopup}>×</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Incentive;
