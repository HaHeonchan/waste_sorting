import React, { useState, useEffect } from "react";
import './home.css';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from "../../utils/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [stats, setStats] = useState({ totalPosts: 0, totalAnalysis: 0, totalUsers: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // 통계 데이터 가져오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.getStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('통계 데이터 가져오기 실패:', error);
      }
    };
    fetchStats();
  }, []);

  // 구글 로그인 콜백 처리
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const loginStatus = searchParams.get('login');
    const message = searchParams.get('message');
    
    if (loginStatus === 'success') {
      alert(message || '구글 로그인이 성공했습니다!');
      // URL에서 쿼리 파라미터 제거
      navigate('/', { replace: true });
    } else if (loginStatus === 'error') {
      alert(message || '구글 로그인에 실패했습니다.');
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
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
      const data = await apiClient.analyzeImage(formData, (message) => {
        setProgressMessage(message);
      });
      setResult(data);
    } catch (err) {
      console.error("분석 오류:", err);
      setResult({ 
        error: err.message || "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    } finally {
      setLoading(false);
      setProgressMessage("");
      setPreviewUrl(null); // 💡 분석 완료 후 미리보기 영역 숨김!
    }
  };


  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">AI가 도와주는 스마트 분리배출</h1>
        <p className="home-description">사진을 업로드하면 AI가 분리배출 방법을 알려드려요</p>
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
          <p className="upload-description">분리배출할 물건이나 분리배출 아이콘이 있는 사진을 올려주시면 AI가 분석해드립니다</p>
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
                onClick={() => {
                  navigate("/sortguide", {
                    state: {
                      imageFile: selectedFile,
                      previewUrl: previewUrl
                    }
                  });
                }}
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
        <div onClick={() => navigate('/sortguide')} className="card card-green">
          <div className="card-icon">🔍</div>
          <div className="card-title">분리배출 안내</div>
          <div className="card-desc">올바른 분리배출 방법을 확인하세요</div>
        </div>
        <div onClick={() => navigate('/incentive')} className="card card-orange">
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
      </motion.div>
      
      <motion.div
        className="stats-box"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 3 }}
      >
        <h2 className="stats-title">분리배출 현황</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number blue">{stats.totalUsers.toLocaleString()}</div>
            <div className="stat-label">가입자 수</div>
          </div>
          <div className="stat-item">
            <div className="stat-number green">{stats.totalPosts.toLocaleString()}</div>
            <div className="stat-label">총 게시글</div>
          </div>
          <div className="stat-item">
            <div className="stat-number orange">{stats.totalAnalysis.toLocaleString()}</div>
            <div className="stat-label">분리배출 인증</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
