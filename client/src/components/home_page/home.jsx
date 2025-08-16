import React, { useState, useEffect } from "react";
import "./home.css";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [todayStats, setTodayStats] = useState({
    totalAnalyses: 0,
    accuracyPercent: 0,
    co2TodayKg: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsErr, setStatsErr] = useState("");

  // CRA 개발환경(3000) ↔ 서버(3001) 자동 연결
  const API_BASE =
    process.env.REACT_APP_API_URL ||
    (window.location.origin.includes(":3000") ? "http://localhost:3001" : "");

  // JSON 안전 fetch
  const fetchJson = async (url) => {
    const res = await fetch(url, { credentials: "include" });
    const ct = res.headers.get("content-type") || "";
    const txt = await res.text();
    if (!ct.includes("application/json")) {
      throw new Error(
        `Non-JSON from ${res.url} [${res.status}] -> ${txt.slice(0, 80)}...`
      );
    }
    return JSON.parse(txt);
  };

  // 부드러운 숫자 카운트업
  const useCountUp = (value, ms = 800) => {
    const [v, setV] = useState(0);
    useEffect(() => {
      let raf;
      const t0 = performance.now();
      const from = 0;
      const to = Number(value || 0);
      const tick = (t) => {
        const p = Math.min((t - t0) / ms, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(from + (to - from) * eased);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [value, ms]);
    return v;
  };

  // 통계 호출
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setStatsLoading(true);
        const data = await fetchJson(`${API_BASE}/api/stats/today`);
        if (!alive) return;
        setTodayStats(data);
      } catch (e) {
        setStatsErr(e.message || "오늘 통계 호출 실패");
      } finally {
        setStatsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [API_BASE]);

  // 애니메이션 값
  const totalAnim = useCountUp(todayStats.totalAnalyses, 700);
  const accAnim = useCountUp(todayStats.accuracyPercent, 900);

  // CO2: 디자인#2 스타일 — 숫자만 크게, 단위는 라벨에 표기
  const co2Kg = Number(todayStats.co2TodayKg || 0);
  const co2IsGram = co2Kg < 1;
  const co2Anim = useCountUp(co2IsGram ? co2Kg * 1000 : co2Kg, 900);
  const co2ValueText = co2IsGram
    ? `${Math.round(co2Anim).toLocaleString()}`
    : `${Math.round(co2Anim).toLocaleString()}`;
  const co2UnitText = co2IsGram ? "(g)" : "(kg)";

  // 구글 로그인 콜백 처리
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const loginStatus = sp.get("login");
    const message = sp.get("message");
    if (loginStatus === "success") {
      alert(message || "구글 로그인이 성공했습니다!");
      navigate("/", { replace: true });
    } else if (loginStatus === "error") {
      alert(message || "구글 로그인에 실패했습니다.");
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("이미지를 선택해주세요.");
      return;
    }
    setLoading(true);
    setResult(null);
    setProgressMessage("");

    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      const data = await apiClient.analyzeImage(formData, (msg) =>
        setProgressMessage(msg)
      );
      setResult(data);
    } catch (err) {
      console.error("분석 오류:", err);
      setResult({
        error:
          err.message ||
          "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setLoading(false);
      setProgressMessage("");
      setPreviewUrl(null);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">AI가 도와주는 스마트 분리배출</h1>
        <p className="home-description">
          사진을 업로드하면 AI가 분리배출 방법을 알려드려요
        </p>
      </div>

      <motion.div
        className="upload-box"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75 }}
      >
        <div className="upload-inner">
          <i className="upload-icon">📤</i>
          <h2 className="upload-title">사진을 업로드해주세요</h2>
          <p className="upload-description">
            분리배출할 물건이나 분리배출 아이콘이 있는 사진을 올려주시면
            AI가 분석해드립니다
          </p>
          <input
            className="upload-input"
            type="file"
            id="imageInput"
            accept="image/*"
            onChange={handleFileChange}
          />
          <label htmlFor="imageInput" className="upload-btn">
            이미지 선택
          </label>
        </div>

        {previewUrl && (
          <div className="preview">
            <img className="preview-image" src={previewUrl} alt="미리보기" />
            <br />
            <br />
            <button
              className="upload-btn"
              onClick={() =>
                navigate("/sortguide", {
                  state: { imageFile: selectedFile, previewUrl },
                })
              }
            >
              분석하기
            </button>
          </div>
        )}
      </motion.div>

      <motion.div
        className="feature-cards"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
      >
        <div onClick={() => navigate("/sortguide")} className="card card-green">
          <div className="card-icon">🔍</div>
          <div className="card-title">분리배출 안내</div>
          <div className="card-desc">올바른 분리배출 방법을 확인하세요</div>
        </div>
        <div onClick={() => navigate("/incentive")} className="card card-orange">
          <div className="card-icon">🎁</div>
          <div className="card-title">인센티브 관리</div>
          <div className="card-desc">포인트를 모아보세요</div>
        </div>
        <div onClick={() => navigate("/complain")} className="card card-red">
          <div className="card-icon">🚨</div>
          <div className="card-title">민원 제보</div>
          <div className="card-desc">환경 오염을 신고하세요</div>
        </div>
        <div onClick={() => navigate("/mypage")} className="card card-blue">
          <div className="card-icon">👤</div>
          <div className="card-title">마이페이지</div>
          <div className="card-desc">내 활동 기록을 확인하세요</div>
        </div>
      </motion.div>

      {/* ▼▼▼ 디자인 #2: 심플 통계 ▼▼▼ */}
      <motion.div
        className="stats-box simple"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="stats-title">오늘의 분리배출 현황</h2>

        {statsLoading ? (
          <div className="simple-grid">
            <div className="simple-item skeleton" />
            <div className="simple-item skeleton" />
            <div className="simple-item skeleton" />
          </div>
        ) : statsErr ? (
          <div className="stats-error">
            <span className="err-badge">오류</span>
            <span className="err-text">{statsErr}</span>
            <button
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              새로고침
            </button>
          </div>
        ) : (
          <div className="simple-grid">
            {/* 총 분석 */}
            <div className="simple-item">
              <div className="simple-number green">
                {Math.round(totalAnim).toLocaleString()}
              </div>
              <div className="simple-label">총 분석 요청</div>
            </div>

            {/* 정확도 */}
            <div className="simple-item">
              <div className="simple-number green">
                {accAnim.toFixed(1)}%
              </div>
              <div className="simple-label">AI 정확도</div>
            </div>

            {/* CO2 */}
            <div className="simple-item">
              <div className="simple-number orange">{co2ValueText}</div>
              <div className="simple-label">오늘 추정 배출량 {co2UnitText}</div>
            </div>
          </div>
        )}
      </motion.div>
      {/* ▲▲▲ 디자인 #2 끝 ▲▲▲ */}
    </div>
  );
}
