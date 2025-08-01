import React, { useState, useEffect,useRef, use } from 'react';
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
  const [analysisResults, setAnalysisResults] = useState([]);
  
  // 예시 분석 결과 데이터 (실제 API 호출로 대체 필요)
  // 이 부분은 실제 API 호출로 대체해야 합니다.

 useEffect(() => {
    apiClient.getUserAnalysisResults(1, 10)
      .then(res => {
        // 응답 구조에 따라 results 또는 data.results로 접근
        const data = res.results || res.data?.results || [];
        setAnalysisResults(data);
        setLoading(false);
      })
      .catch(err => {
        setError("분석 결과 불러오기 실패: " + err.message);
        setLoading(false);
      });
  }, []);

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
          <div className="spinner"></div>
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
          <div className="spinner"></div>
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
            {analysisResults.map((result, idx) => (
              <div
                key={result.id}
                className="analysis-card"
                onClick={() => setSelectedItem(result)}
              >
              <div>
                <span><strong>분석일: {new Date(result.uploadedAt || result.createdAt).toLocaleString()}</strong></span>
                </div>
              <div>
                <span>상세: {result.analysisResult?.detail || result.detail}</span>
              </div>
                <div className="card-badge">{result.category}</div>
                <div className="card-detail">
                  <strong>{result.subcategory}</strong>
                  <p>{result.method}</p>
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
              <p><strong>분석일:</strong> {new Date(selectedItem.uploadedAt || selectedItem.createdAt).toLocaleString()}</p>
              <p><strong>종류:</strong> {selectedItem.analysisResult?.type}</p>
              <p><strong>세부 분류:</strong> {selectedItem.analysisResult?.detail}</p>
              <p><strong>처리 방법:</strong> {selectedItem.analysisResult?.method}</p>
              <p><strong>재활용 마크:</strong> {selectedItem.analysisResult?.recycleMark}</p>
              <p><strong>설명:</strong> {selectedItem.analysisResult?.description}</p>
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
          className="btn yellow" 
          onClick={() => handleNavigation('/analysis-results')}
        >
          📋 분석 결과 목록
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