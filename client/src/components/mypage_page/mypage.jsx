import React, { useState, useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './mypage.css';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import { Link } from "react-router-dom";

export default function MyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [userStats, setUserStats] = useState({
    points: 0,
    recycleCount: 0,
    reportCount: 0,
    receivedLikes: 0
  });
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // 예시 분석 결과 데이터
 const [analysisSummary, setAnalysisSummary] = useState([
  {
    id: 1,
    category: "플라스틱",
    subcategory: "페트병",
    method: "뚜껑과 라벨 제거 후 배출",
    recycleMark: "♻️",
    description: "투명 페트병은 고품질 플라스틱으로 재활용됩니다.",
    model: "gpt-4-vision",
    tokensUsed: 128,
  },
  {
    id: 2,
    category: "종이",
    subcategory: "신문지",
    method: "이물질 제거 후 묶어서 배출",
    recycleMark: "♻️",
    description: "신문지는 백색지와 함께 재활용됩니다.",
    model: "gpt-4-vision",
    tokensUsed: 102,
  },
  {
    id: 3,
    category: "금속",
    subcategory: "알루미늄 캔",
    method: "내용물 비우고 씻어서 배출",
    recycleMark: "♻️",
    description: "알루미늄은 에너지 효율이 높은 재활용 금속입니다.",
    model: "gpt-4-vision",
    tokensUsed: 119,
  },
  {
    id: 4,
    category: "유리",
    subcategory: "음료수 병",
    method: "내용물 비우고 물로 헹군 후 배출",
    recycleMark: "♻️",
    description: "색상별로 분리하면 재활용 효율이 높아집니다.",
    model: "gpt-4-vision",
    tokensUsed: 110,
  },
  {
    id: 5,
    category: "플라스틱",
    subcategory: "비닐봉투",
    method: "이물질 제거 후 배출",
    recycleMark: "♻️",
    description: "깨끗한 비닐만 재활용 가능합니다.",
    model: "gpt-4-vision",
    tokensUsed: 87,
  },
  {
    id: 6,
    category: "종이",
    subcategory: "종이팩 (우유팩)",
    method: "물로 헹구고 펼쳐서 건조 후 배출",
    recycleMark: "♻️",
    description: "종이팩은 일반 종이와 분리하여 배출해야 합니다.",
    model: "gpt-4-vision",
    tokensUsed: 104,
  },
  {
    id: 7,
    category: "플라스틱",
    subcategory: "세제 용기",
    method: "뚜껑 분리 후 깨끗이 헹궈 배출",
    recycleMark: "♻️",
    description: "PP, PE 재질로 분리 배출 시 효과적입니다.",
    model: "gpt-4-vision",
    tokensUsed: 126,
  },
  {
    id: 8,
    category: "스티로폼",
    subcategory: "음식 포장용기",
    method: "내용물 제거 및 깨끗이 씻어서 배출",
    recycleMark: "♻️",
    description: "오염된 스티로폼은 일반쓰레기로 분류됩니다.",
    model: "gpt-4-vision",
    tokensUsed: 91,
  },
  {
    id: 9,
    category: "금속",
    subcategory: "철캔",
    method: "내용물 비우고 압착 후 배출",
    recycleMark: "♻️",
    description: "자석을 이용한 분리 수거가 가능해요.",
    model: "gpt-4-vision",
    tokensUsed: 113,
  },
  {
    id: 10,
    category: "의류",
    subcategory: "면 티셔츠",
    method: "깨끗한 상태로 의류 수거함에 배출",
    recycleMark: "♻️",
    description: "의류는 재사용 또는 섬유 재활용됩니다.",
    model: "gpt-4-vision",
    tokensUsed: 98,
  },
]);

  // 캐러셀 스크롤 기능
  const carouselRef = useRef(null);

  // 좌우 스크롤 함수
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  // 우측 스크롤 함수
  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  useEffect(() => {
    // AuthContext가 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 로그인 상태 확인
    if (!isAuthenticated) {
      console.log('마이페이지: 인증되지 않은 사용자');
      navigate('/login');
      return;
    }

    // 사용자 정보가 있으면 데이터 가져오기
    if (user) {
      fetchUserData();
    }
  }, [isAuthenticated, authLoading, user, navigate]);

const fetchUserData = async () => {
  try {
    setLoading(true);
    setError('');

    console.log('마이페이지: 사용자 데이터 가져오기 시작');

    const token = user?.token || localStorage.getItem("authToken");

    // ✅ 각 요청마다 headers로 토큰 직접 전달
    const headers = { 'Authorization': `Bearer ${token}` };

    // 사용자 상세 정보 가져오기
    const userInfo = await apiClient.requestWithRetry('/api/auth/user/info', { headers });

    // 리워드 목록 가져오기
    const rewardsData = await apiClient.requestWithRetry('/api/auth/reward/list', { headers });

    setUserStats({
      points: userInfo.points || 0,
      recycleCount: userInfo.recycleCount || 0,
      reportCount: userInfo.reportCount || 0,
      receivedLikes: userInfo.receivedLikes || 0
    });

    setRewards(rewardsData || []);
    console.log('마이페이지: 사용자 데이터 로드 완료', userInfo);
  } catch (error) {
    console.error('사용자 데이터 조회 에러:', error);
    setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};

  
  // 예시: login 함수(혹은 로그인 버튼 클릭 후 실행되는 곳)
const handleLogin = async (email, password) => {
  const res = await axios.post("/api/auth/login", { email, password });
  

  if (res.data.token) {
    console.log('로그인 성공:', res.data);
    localStorage.setItem("authToken", res.data.token);
    login(res.data);
    setUser({ ...res.data, token: res.data.token });
  } else {
    alert("서버에서 토큰이 오지 않았습니다.");
  }
};

  const handleLogout = () => {
    if (window.confirm('로그아웃하시겠습니까?')) {
      logout();
      navigate('/');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // 사용자 레벨 계산
  const calculateLevel = (recycleCount) => {
    if (recycleCount >= 500) return { level: 5, title: '환경 마스터' };
    if (recycleCount >= 200) return { level: 4, title: '환경 전문가' };
    if (recycleCount >= 100) return { level: 3, title: '환경 애호가' };
    if (recycleCount >= 50) return { level: 2, title: '환경 초보자' };
    return { level: 1, title: '환경 신입' };
  };

  // 가입일 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 사용자 이름 표시
  const getUserDisplayName = () => {
    if (!user) return '사용자';
    
    // 실제 name 필드 우선 사용
    if (user.name) return user.name;
    
    // 구글 로그인 사용자의 displayName
    if (user.displayName) return user.displayName;
    
    // 이메일에서 이름 추출 (fallback)
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.length > 10 ? emailName.substring(0, 10) + '...' : emailName;
    }
    
    return '사용자';
  };

  // AuthContext가 로딩 중이거나 인증되지 않은 경우
  if (authLoading) {
    return (
      <div className="mypage">
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>인증 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 (리다이렉트 처리됨)
  if (!isAuthenticated) {
    return null;
  }

  // 데이터 로딩 중
  if (loading) {
    return (
      <div className="mypage">
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const userLevel = calculateLevel(userStats.recycleCount);

  return (
    <div className="mypage">
      <div className="mypage-header">
        <h1>마이페이지</h1>
        <p>내 활동 기록과 통계를 확인해보세요</p>
        {error && <div className="error-message">⚠️ {error}</div>}
      </div>

      <div className="mypage-profile-card">
        <div className="mypage-profile-left">
          <div className="mypage-icon">♻️</div>
          <div className="mypage-user-info">
            <h2>{getUserDisplayName()}</h2>
            <p>가입일: {formatDate(user?.createdAt)}</p>
            <p>레벨: {userLevel.title} (Lv.{userLevel.level})</p>
            {user?.email && <p>이메일: {user.email}</p>}
          </div>
        </div>
        <div className="mypage-points">
          {userStats.points.toLocaleString()} P<br />
          <span>보유 포인트</span>
        </div>
      </div>

      <div className="mypage-summary-box">
        <div className="mypage-summary-item green">
          <div className="circle">🟢</div>
          <div className="count">{userStats.recycleCount}</div>
          <div className="label">분리배출 인증</div>
        </div>
        <div className="mypage-summary-item orange">
          <div className="circle">🟠</div>
          <div className="count">{rewards.length}</div>
          <div className="label">리워드 교환</div>
        </div>
        <div className="mypage-summary-item warning">
          <div className="circle">⚠️</div>
          <div className="count">{userStats.reportCount}</div>
          <div className="label">민원 신고</div>
        </div>
        <div className="mypage-summary-item like">
          <div className="circle">👍</div>
          <div className="count">{userStats.receivedLikes}</div>
          <div className="label">받은 추천</div>
        </div>
      </div>

      <div className="mypage-stats">
        <div className="mypage-stats-section">
          <h3>최근 리워드 교환 내역</h3>
          {rewards.length > 0 ? (
            <ul className="activity-log">
              {rewards.slice(0, 5).map((reward, index) => (
                <li key={index}>
                  🎁 <strong>{reward.item}</strong><br />
                  {reward.date} <br />
                  {reward.points} 포인트 사용
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">아직 교환한 리워드가 없습니다.</p>
          )}
        </div>

        <div className="mypage-stats-section">
          <h3>계정 정보</h3>
          <ul className="account-info">
            <li>
              <span>이메일:</span>
              <span>{user?.email || '정보 없음'}</span>
            </li>
            <li>
              <span>가입일:</span>
              <span>{formatDate(user?.createdAt)}</span>
            </li>
            <li>
              <span>마지막 로그인:</span>
              <span>{formatDate(user?.lastLogin)}</span>
            </li>
            <li>
              <span>현재 레벨:</span>
              <span>{userLevel.title} (Lv.{userLevel.level})</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="analysis-summary-section">
        <h3>📸 분석 결과 요약</h3>

        <div className="analysis-carousel-wrapper">
          <button className="slide-button left" onClick={scrollLeft}>←</button>

          <div className="analysis-card-container" ref={carouselRef}>
            {analysisSummary.map((item) => (
              <div 
                key={item.id} 
                className="analysis-card" 
                onClick={() => setSelectedItem(item)}
              >
                <div className="card-badge">{item.category}</div>
                <div className="card-detail">
                  <strong>{item.subcategory}</strong>
                  <p>{item.method}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="slide-button right" onClick={scrollRight}>→</button>
        </div>
      </div>

      {selectedItem && (
        <div className="popup-overlay" onClick={() => setSelectedItem(null)}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setSelectedItem(null)} aria-label="닫기">✖</button>
            <h2>📋 분석 상세 결과</h2>
            <p><strong>종류:</strong> {selectedItem.category}</p>
            <p><strong>세부 분류:</strong> {selectedItem.subcategory}</p>
            <p><strong>처리 방법:</strong> {selectedItem.method}</p>
            <p><strong>재활용 마크:</strong> {selectedItem.recycleMark}</p>
            <p><strong>설명:</strong> {selectedItem.description}</p>
            <p><strong>AI 모델:</strong> {selectedItem.model}</p>
            <p><strong>토큰 사용량:</strong> {selectedItem.tokensUsed} tokens</p>
          </div>
        </div>
      )}

      <div className="mypage-footer-buttons">
        <button 
          className="btn green" 
          onClick={() => handleNavigation('/incentive')}
        >
          🎁 인센티브 관리
        </button>
        <button 
          className="btn blue" 
          onClick={() => handleNavigation('/complain')}
        >
          ⚠️ 민원 제보
        </button>
        <button 
          className="btn orange" 
          onClick={() => handleNavigation('/sortguide')}
        >
          📸 사진 업로드
        </button>
        <button 
          className="btn red" 
          onClick={handleLogout}
        >
          🚪 로그아웃
        </button>
      </div>
    </div>
  );
}