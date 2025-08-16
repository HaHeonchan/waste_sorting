import React, { useEffect, useMemo, useRef, useState } from "react";
import "./incentive.css";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import axios from "axios";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

/**
 * 지역/프로그램 기본 데이터
 *  - exchanges 는 주소만 있어도 됩니다(위치 자동 보정).
 */
const PROGRAMS_BASE = {
  세종: {
    regionKey: "세종",
    displayName: "세종특별자치시",
    programName: "자원순환 이응봇 · 이응가게",
    rules: [
      "투명페트병/캔 무인회수 적립",
      "분리배출 품목별 무게/수량 기준 포인트",
      "여민전 포인트 전환 가능",
    ],
    exchanges: [
      // ── 이응가게(교환처)
      {
        id: "sj-singsing-dodam",
        name: "싱싱장터 도담점",
        address: "세종특별자치시 보듬6로 16",
      },
      {
        id: "sj-happycenter",
        name: "조치원읍 행복누리터(복합커뮤니티센터)",
        address: "세종특별자치시 조치원읍 대첩로 76",
      },

      // ── 이응봇(무인 회수기) · 해밀동 3
      {
        id: "sj-eungbot-haemil-bmx",
        name: "이응봇 해밀동 BMX 경기장 관리동 옆",
        address: "세종특별자치시 해밀동 659-59",
        keyword: "세종 해밀동 BMX 경기장 관리동",
      },
      {
        id: "sj-eungbot-haemil-hs",
        name: "이응봇 해밀고 옆",
        address: "세종특별자치시 해밀동 103-1",
        keyword: "세종 해밀고등학교",
      },
      {
        id: "sj-eungbot-haemil-bridge",
        name: "이응봇 해밀중–해밀고 사이 교각 승강기 옆",
        address: "세종특별자치시 해밀동 산4-21",
        keyword: "세종 해밀중학교 해밀고등학교 교각 승강기",
      },

      // ── 이응봇(무인 회수기) · 반곡동 3
      {
        id: "sj-eungbot-bangok-north",
        name: "이응봇 반곡동 북측 옆",
        address: "세종특별자치시 반곡동 856",
        keyword: "세종 반곡동 856",
      },
      {
        id: "sj-eungbot-bangok-seezpark",
        name: "이응봇 씨즈파크 자전거보관소 옆",
        address: "세종특별자치시 반곡동 847",
        keyword: "세종 씨즈파크 자전거 보관소",
      },
      {
        id: "sj-eungbot-bangok-solbit",
        name: "이응봇 솔빛숲유원 옆 주차장",
        address: "세종특별자치시 반곡동 930",
        keyword: "세종 솔빛숲유원 주차장",
      },
    ],
    officialLinks: [
      {
        label: "세종시 이응가게 안내 ↗️",
        href: "https://www.sejong.go.kr/bbs/R0126/view.do?nttId=B000000126898Wo4lX1w&cmsNoStr=2735",
      },
      {
        label: "세종시 이응봇 안내 ↗️",
        href: "https://www.sejong.go.kr/recycle/sub02_11.do",
      },
    ],
    center: { lat: 36.4801, lng: 127.2893 },
  },
  인천: {
    regionKey: "인천",
    displayName: "인천광역시",
    programName: "재활용 보상/회수기 프로그램",
    rules: ["투명페트병/캔 회수 적립", "동별 제휴 포인트", "지역 전용 포인트 환전"],
    exchanges: [
      {
        id: "ic-cityhall",
        name: "인천시청 인근 회수기",
        keyword: "인천시청 회수 로봇",
        address: "",
      },
      {
        id: "ic-guwol",
        name: "구월동 자원순환 매장",
        keyword: "인천 구월동 자원순환가게",
        address: "",
      },
    ],
    officialLinks: [],
    center: { lat: 37.456, lng: 126.705 },
  },
  서울: {
    regionKey: "서울",
    displayName: "서울특별시",
    programName: "자원회수로봇 · 자원순환가게",
    rules: ["동주민센터/지하철역 회수로봇", "지정 매장 교환", "일부 자치구 포인트 연동"],
    exchanges: [
      {
        id: "sl-cityhall",
        name: "시청역 회수로봇",
        keyword: "서울 시청역 자원회수로봇",
        address: "",
      },
      {
        id: "sl-gangnam",
        name: "강남구 자원순환 홍보관",
        keyword: "강남구 자원순환 홍보관",
        address: "",
      },
    ],
    officialLinks: [],
    center: { lat: 37.5663, lng: 126.9779 },
  },
};

/** 후보 중심점(지역 판정용) */
const REGION_CENTERS = [
  { key: "세종", lat: 36.48, lng: 127.29 },
  { key: "인천", lat: 37.455, lng: 126.705 },
  { key: "서울", lat: 37.5663, lng: 126.9779 },
];

function haversine(a, b) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function nearestRegion(lat, lng) {
  const here = { lat, lng };
  let best = REGION_CENTERS[0];
  let bestDist = haversine(here, best);
  for (let i = 1; i < REGION_CENTERS.length; i++) {
    const d = haversine(here, REGION_CENTERS[i]);
    if (d < bestDist) {
      best = REGION_CENTERS[i];
      bestDist = d;
    }
  }
  return best.key;
}

function Incentive() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = localStorage.getItem("userId");

  // Kakao SDK
  const APPKEY = (process.env.REACT_APP_KAKAO_MAPS_KEY || "").trim();
  const [loadingKakao, kakaoError] = useKakaoLoader({
    appkey: APPKEY,
    libraries: ["services"],
  });

  // 포인트/내역
  const [summary, setSummary] = useState({ total_point: 0, this_month: 0 });
  const [earnedList, setEarnedList] = useState([]);
  const earnedListRef = useRef(null);

  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 지도/GPS/지역
  const [gps, setGps] = useState({ lat: 36.48, lng: 127.29, ok: false });
  const [currentRegion, setCurrentRegion] = useState("세종");
  const [programs, setPrograms] = useState(PROGRAMS_BASE);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  // 지도 인스턴스
  const mapRef = useRef(null);

  // 히스토리 지역 필터
  const [historyRegionFilter, setHistoryRegionFilter] = useState("전체");

  const scrollLeft = () =>
    earnedListRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () =>
    earnedListRef.current?.scrollBy({ left: 300, behavior: "smooth" });

  // 인센티브 요약/내역
  useEffect(() => {
    if (!userId) return;
    axios
      .get(`/api/incentives/summary/${userId}`)
      .then((res) => setSummary(res.data));
    axios.get(`/api/incentives/${userId}`).then((res) => {
      const onlyEarned = res.data.filter((item) => item.earned_point > 0);
      setEarnedList(onlyEarned);
    });
  }, [userId]);

  // 최근 적립 결과
  useEffect(() => {
    apiClient
      .getUserAnalysisResults(1, 10)
      .then((res) => {
        const data = res.results || res.data?.results || [];
        setAnalysisResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("분석 결과 불러오기 실패: " + err.message);
        setLoading(false);
      });
  }, []);

  // GPS → 현재 지역 판정
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGps((g) => ({ ...g, ok: false }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const key = nearestRegion(lat, lng);
        setGps({ lat, lng, ok: true });
        setCurrentRegion(key);
      },
      () => {
        setGps((g) => ({ ...g, ok: false }));
        setCurrentRegion("세종");
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  }, []);

  // 주소/키워드 → 좌표 보정(초기 1회 + SDK 로드 후)
  useEffect(() => {
    if (loadingKakao || kakaoError || !(window.kakao && window.kakao.maps))
      return;

    const kakaoMaps = window.kakao.maps;
    const geocoder = new kakaoMaps.services.Geocoder();
    const places = new kakaoMaps.services.Places();

    const nextPrograms = JSON.parse(JSON.stringify(programs));

    const resolveOne = (ex) =>
      new Promise((resolve) => {
        const finish = (lat, lng) => {
          ex.lat = lat;
          ex.lng = lng;
          resolve();
        };

        const tryKeyword = () => {
          const q = ex.keyword || ex.name;
          if (!q) return resolve();
          places.keywordSearch(
            q,
            (r, s) => {
              if (s === kakaoMaps.services.Status.OK && r.length) {
                finish(r[0].y * 1, r[0].x * 1);
              } else resolve();
            },
            { size: 3 }
          );
        };

        if (ex.lat && ex.lng) return resolve();

        if (ex.address) {
          geocoder.addressSearch(ex.address, (r, s) => {
            if (s === kakaoMaps.services.Status.OK && r.length) {
              finish(r[0].y * 1, r[0].x * 1);
            } else {
              tryKeyword();
            }
          });
        } else {
          tryKeyword();
        }
      });

    const run = async () => {
      for (const key of Object.keys(nextPrograms)) {
        const arr = nextPrograms[key].exchanges || [];
        for (const ex of arr) {
          // 좌표 없는 것만 보정 시도
          if (!(ex.lat && ex.lng)) {
            // eslint-disable-next-line no-await-in-loop
            await resolveOne(ex);
          }
        }
      }
      setPrograms(nextPrograms);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingKakao, kakaoError]);

  const currentProgram = useMemo(
    () => programs[currentRegion],
    [programs, currentRegion]
  );

  const safeRegion = (result) => result?.region || currentRegion || "미상";

  const filteredResults = useMemo(() => {
    if (historyRegionFilter === "전체") return analysisResults;
    return analysisResults.filter((r) => safeRegion(r) === historyRegionFilter);
  }, [analysisResults, historyRegionFilter]);

  /** 리스트 클릭 시 지도 이동 & 마커 활성화 */
  const focusExchange = async (p) => {
    if (!(window.kakao && window.kakao.maps) || !mapRef.current) return;
    const kakaoMaps = window.kakao.maps;

    // 좌표 없으면 한 번 더 지오코딩 시도
    if (!(p.lat && p.lng)) {
      const geocoder = new kakaoMaps.services.Geocoder();
      if (p.address) {
        await new Promise((resolve) => {
          geocoder.addressSearch(p.address, (r, s) => {
            if (s === kakaoMaps.services.Status.OK && r.length) {
              p.lat = r[0].y * 1;
              p.lng = r[0].x * 1;
            }
            resolve();
          });
        });
      }
      if (!(p.lat && p.lng) && (p.keyword || p.name)) {
        const places = new kakaoMaps.services.Places();
        await new Promise((resolve) => {
          places.keywordSearch(p.keyword || p.name, (r, s) => {
            if (s === kakaoMaps.services.Status.OK && r.length) {
              p.lat = r[0].y * 1;
              p.lng = r[0].x * 1;
            }
            resolve();
          });
        });
      }
    }

    if (p.lat && p.lng) {
      mapRef.current.panTo(new kakaoMaps.LatLng(p.lat, p.lng));
      setSelectedMarkerId(p.id);
    }
  };

  /** 지도 UI */
  const renderMapArea = () => {
    if (!APPKEY) {
      return stub(
        "카카오 지도 앱키가 설정되지 않았습니다.\n루트 .env 의 REACT_APP_KAKAO_MAPS_KEY 를 확인하세요."
      );
    }
    if (loadingKakao) return stub("지도를 불러오는 중…", "#666");
    if (kakaoError) {
      return stub(
        `카카오 지도 로드 오류\n${kakaoError.message || "SDK 로드 실패"}\n(키/도메인/서비스 권한/네트워크 확인)`
      );
    }
    if (!(window.kakao && window.kakao.maps)) {
      return stub(
        "window.kakao.maps 가 없습니다.\n광고차단 확장프로그램을 잠시 끄고 새로고침해 보세요."
      );
    }

    return (
      <Map
        center={currentProgram?.center || { lat: 36.48, lng: 127.29 }}
        style={{ width: "100%", height: "360px", borderRadius: "1rem" }}
        level={6}
        onCreate={(map) => {
          mapRef.current = map;
          setTimeout(() => map.relayout(), 0);
        }}
      >
        {(currentProgram?.exchanges || []).map((p) => {
          if (!(p.lat && p.lng)) return null;
          return (
            <MapMarker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              onClick={() =>
                setSelectedMarkerId((id) => (id === p.id ? null : p.id))
              }
            >
              {selectedMarkerId === p.id && (
                <div className="marker-info">
                  <strong>{p.name}</strong>
                  {p.address && <div className="marker-small">{p.address}</div>}
                </div>
              )}
            </MapMarker>
          );
        })}
      </Map>
    );
  };

  /** 교환/회수 카드: 타입/아이콘/클래스 계산 */
  const cardMeta = (name = "") => {
    const isRobot = /(이응봇|회수기|로봇)/.test(name);
    return {
      isRobot,
      typeLabel: isRobot ? "회수기" : "교환처",
      icon: isRobot ? "🤖" : "🏬",
      className: isRobot ? "type-robot" : "type-shop",
    };
  };

  return (
    <motion.div
      className="incentive-container"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="incentive-title">인센티브 관리</h1>
      <p className="incentive-subtitle">
        사진 기반 자동 분리배출 적립, 지역별 교환처를 한 번에 확인하세요.
      </p>

      {/* 현재 포인트 */}
      <div className="point-box">
        <div className="point-text">
          <h3>현재 보유 포인트</h3>
          <p className="point-amount">{user?.points ?? 0} P</p>
          <p className="point-subtext">이달 적립: {summary?.this_month ?? 0} P</p>
        </div>
        <div className="point-icon" aria-hidden>
          <i className="fas fa-coins" />
        </div>
      </div>

      {/* 지역/프로그램 + 지도 */}
      <section className="region-section">
        <div className="region-header">
          <div className="region-now">
            <span className="badge">{gps.ok ? "GPS" : "기본"}</span>
            <span>
              현재 지역: <b>{currentProgram?.displayName || currentRegion}</b>
            </span>
          </div>
          <div className="region-controls">
            <label htmlFor="regionSelect">지역 변경</label>
            <select
              id="regionSelect"
              className="region-select"
              value={currentRegion}
              onChange={(e) => setCurrentRegion(e.target.value)}
            >
              {Object.keys(programs).map((key) => (
                <option key={key} value={key}>
                  {programs[key].displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 프로그램 카드 */}
        <div className="program-card">
          <h3>지역 프로그램</h3>
          <p className="program-title">
            {currentProgram?.programName}{" "}
            <span className="program-region">· {currentProgram?.displayName}</span>
          </p>
          <ul className="program-rules">
            {(currentProgram?.rules || []).map((r, idx) => (
              <li key={idx}>✅ {r}</li>
            ))}
          </ul>
          {currentProgram?.officialLinks?.length > 0 && (
            <div className="program-links">
              {currentProgram.officialLinks.map((lnk) => (
                <a
                  key={lnk.href}
                  href={lnk.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {lnk.label}
                </a>
              ))}
            </div>
          )}
          <p className="program-note">※ 실제 운영·시간은 각 지자체 공지로 확인하세요.</p>
        </div>

        {/* 지도 + 교환처 리스트 (리뉴얼된 카드형 그리드) */}
        <div className="map-and-list">
          <div className="map-wrap">{renderMapArea()}</div>

          <div className="exchange-panel">
            <h4>교환/회수 가능한 곳</h4>

            <div className="exchange-grid">
              {(currentProgram?.exchanges || []).map((p) => {
                const { className, typeLabel, icon } = cardMeta(p.name);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`exchange-card ${className}`}
                    onClick={() => focusExchange(p)}
                    title="지도에서 위치 보기"
                  >
                    <span className="exchange-type">{icon} {typeLabel}</span>
                    <div className="exchange-title">{p.name}</div>
                    <div className="exchange-meta">
                      {p.address || "위치 확인 필요"}
                    </div>
                    <span className="exchange-chev" aria-hidden>
                      →
                    </span>
                  </button>
                );
              })}
            </div>

            {(!currentProgram?.exchanges ||
              currentProgram?.exchanges.length === 0) && (
              <div className="no-history">등록된 교환처가 없습니다.</div>
            )}
          </div>
        </div>
      </section>

      {/* 최근 자동 적립 내역 (가로 슬라이드) */}
      <div className="recent-earned">
        <div className="earned-header">
          <h2>최근 자동 적립 내역</h2>
          <div className="earned-filter">
            <label htmlFor="historyRegion">지역</label>
            <select
              id="historyRegion"
              value={historyRegionFilter}
              onChange={(e) => setHistoryRegionFilter(e.target.value)}
            >
              <option>전체</option>
              {Object.keys(programs).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="no-history">⏳ 데이터를 불러오는 중...</p>
        ) : error ? (
          <p className="no-history">{error}</p>
        ) : filteredResults.length === 0 ? (
          <p className="no-history">아직 적립된 내역이 없습니다.</p>
        ) : (
          <div className="earned-wrapper">
            <button className="arrow left" onClick={scrollLeft}>
              ←
            </button>

            <div className="earned-list" ref={earnedListRef}>
              {filteredResults.map((result, i) => {
                const point = result?.analysisResult?.earned_point ?? 10;
                const regionName = safeRegion(result);
                const tier =
                  point >= 200 ? "high" : point >= 100 ? "medium" : "low";
                return (
                  <div
                    className="earned-card"
                    key={result._id || i}
                    data-point={tier}
                  >
                    <strong>{result.analysisResult?.type || "알 수 없음"}</strong>
                    <span className="earned-point">+{point}P</span>
                    <span className="earned-date">
                      {new Date(
                        result.uploadedAt || result.createdAt
                      ).toLocaleString()}
                    </span>
                    <span className="earned-region">📍 {regionName}</span>
                  </div>
                );
              })}
            </div>

            <button className="arrow right" onClick={scrollRight}>
              →
            </button>
          </div>
        )}
      </div>

      {/* 세종 안내 링크
      <div className="link-buttons">
        <a
          className="btn-link"
          href="https://www.sejong.go.kr/bbs/R0126/view.do?nttId=B000000126898Wo4lX1w&cmsNoStr=2735"
          target="_blank"
          rel="noopener noreferrer"
        >
          자원순환 이응 가게 소개
        </a>
        <a
          className="btn-link"
          href="https://www.sejong.go.kr/recycle/sub02_11.do"
          target="_blank"
          rel="noopener noreferrer"
        >
          자원순환 이응봇 소개
        </a>
      </div> */}
    </motion.div>
  );
}

/** 스텁 UI */
function stub(text, color = "#c00") {
  return (
    <div
      style={{
        width: "100%",
        height: 360,
        borderRadius: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f6f6",
        color,
        whiteSpace: "pre-wrap",
        textAlign: "center",
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}

export default Incentive;
