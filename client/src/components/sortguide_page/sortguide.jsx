import React, { useState, useEffect } from "react";
import "./sortguide.css";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { useAuth } from '../../contexts/AuthContext';
import { motion } from "framer-motion";

export default function SortGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  // Home.jsx에서 넘겨준 이미지 데이터
  const { imageFile, previewUrl } = location.state || {};
  const [selectedFile, setSelectedFile] = useState(imageFile || null);
  const [previewUrlState, setPreviewUrlState] = useState(previewUrl || null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  
  
  useEffect(() => {
    // AuthContext가 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 로그인 상태 확인
    if (!isAuthenticated) {
      console.log('SortGuide: 인증되지 않은 사용자');
      navigate('/login');
      return;
    }

    if (selectedFile) {
      handleAnalyze(); // 페이지 로드 시 자동 분석
    }
  }, [isAuthenticated, authLoading, selectedFile, navigate]);

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
      console.log('분석 완료 결과:', data);
      setResult(data);
    } catch (err) {
      console.error("분석 오류:", err);
      setResult({ 
        error: err.message || "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    } finally {
      setLoading(false);
      setProgressMessage("");
    }

    
  };

  const handleSaveResult = async () => {
    if (!result || result.error) {
      alert("저장할 분석 결과가 없습니다.");
      return;
    }

    console.log('저장할 분석 결과:', result);

    setSaving(true);
    setSaveMessage("분석 결과를 저장하고 있습니다...");

    try {
      const saveResult = await apiClient.saveAnalysisResult(result, selectedFile);
      setSaveMessage("✅ 분석 결과가 성공적으로 저장되었습니다!");
      
      // 3초 후 메시지 제거
      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
      
    } catch (error) {
      console.error("저장 오류:", error);
      setSaveMessage("❌ 저장 중 오류가 발생했습니다: " + error.message);
      
      // 5초 후 메시지 제거
      setTimeout(() => {
        setSaveMessage("");
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

   // FAQ 아코디언용 데이터
  const faqs = [
    {
      question: "📷 흐릿한 사진도 분석이 되나요?",
      answer:
        "가능은 하지만 결과 정확도가 낮아질 수 있습니다. 배경이 깔끔하고 초점이 맞은 사진을 권장합니다.",
    },
    {
      question: "🎯 분석 정확도는 얼마나 되나요?",
      answer:
        "정확도는 약 90% 수준이지만, 종류에 따라 오차가 있을 수 있습니다. 재분석도 가능합니다.",
    },
    {
      question: "📂 쓰레기 종류는 몇 가지로 구분되나요?",
      answer:
        "현재는 플라스틱, 종이, 유리, 금속, 음식물, 일반쓰레기 등 6종으로 분류하고 있습니다.",
    },
    {
      question: "🚫 분석이 안되는 경우는 어떻게 하나요?",
      answer:
        "에러 메시지를 확인 후 이미지를 다시 촬영하거나, 다른 각도에서 시도해보세요.",
    },
    {
      question: "🔄 분석 후에도 다시 업로드할 수 있나요?",
      answer:
        "네, 다시 업로드하여 재분석할 수 있습니다. 이전 결과와 비교도 가능합니다.",
    },
  ];

  // FAQ 아이템 컴포넌트
  const AccordionItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className={`faq-item ${open ? "open" : ""}`}>
        <button className="faq-question" onClick={() => setOpen(!open)}>
          {question}
          <span className="arrow">{open ? "▲" : "▼"}</span>
        </button>
        {open && <div className="faq-answer">{answer}</div>}
      </div>
    );
  };
  

  // AuthContext가 로딩 중이거나 인증되지 않은 경우
  if (authLoading) {
    return (
      <div id="result">
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

  // AuthContext가 로딩 중이거나 인증되지 않은 경우
  if (authLoading) {
    return (
      <div id="result">
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

  return (
      <motion.div
        className="result"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
      >
        {/* 직접 업로드 + FAQ는 이미지가 없을 때만 표시 */}
        {!previewUrlState && (
          <div className="manual-upload">
            <h2>🧠 AI 분리배출 가이드</h2>
            <p>사진을 업로드하면 AI가 쓰레기 종류와 처리 방법을 분석해 드려요!</p>

            <div
              className="drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setPreviewUrlState(reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <p>📁 여기에 이미지를 드래그하거나 클릭해서 업로드하세요</p>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPreviewUrlState(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            {selectedFile && (
              <button className="analyze-button" onClick={handleAnalyze}>
                🔍 분석하기
              </button>
            )}

            {/* FAQ 섹션 */}
            <div className="faq-section">
              <h3>❓ 자주 묻는 질문 (FAQ)</h3>
              {faqs.map((item, idx) => (
                <AccordionItem key={idx} {...item} />
              ))}
            </div>
          </div>
        )}
        {previewUrlState && (
          <div className="preview-section">
            <img src={previewUrlState} alt="분석 이미지 미리보기" className="preview-image" />
          </div>
        )}

        {loading && (
          <div className="loading">
            {progressMessage || "이미지를 분석하고 있습니다..."}
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {result && !result.error && (
          <div className="result-container">
            <h3>📖 분석 결과</h3>
            <div className="analysis-result">
              <div className="result-item">
                <span className="label">📂 쓰레기 종류:</span>
                <span className="value recyclable">
                  <Typewriter
                    options={{
                      strings: [result.type],
                      autoStart: true,
                      loop: false,
                      delay: 10
                    }}
                  />
                </span>
              </div>
              <div className="result-item">
                <span className="label">🗂 세부 분류:</span>
                <span className="value">
                  <Typewriter
                    options={{
                      strings: [result.subtype],
                      autoStart: true,
                      loop: false,
                      delay: 20
                    }}
                  />
                </span>
              </div>
              <div className="result-item">
                <span className="label">♻️ 재활용 마크:</span>
                <span className="value">
                  <Typewriter
                    options={{
                      strings: [result.mark],
                      autoStart: true,
                      loop: false,
                      delay: 30
                    }}
                  />
                </span>
              </div>
              <div className="result-item">
                <span className="label">💡 설명:</span>
                <span className="value">
                  <Typewriter
                    options={{
                      strings: [result.description],
                      autoStart: true,
                      loop: false,
                      delay: 40
                    }}
                  />
                </span>
              </div>
              <div className="result-item">
                <span className="label">🧺 처리 방법:</span>
                <span className="value">
                  <Typewriter
                    options={{
                      strings: [result.method],
                      autoStart: true,
                      loop: false,
                      delay: 50
                    }}
                  />
                </span>
              </div>
              <div className="result-item">
                <span className="label">🧠 모델:</span>
                <span className="value">
                  <Typewriter
                    options={{
                      strings: [result.model],
                      autoStart: true,
                      loop: false,
                      delay: 60
                    }}
                  />
                </span>
              </div>
              <div className="result-item">
                <span className="label">📊 토큰 사용량:</span>
                <span className="value">
                  <Typewriter
                    options={{
                      strings: [result.token_usage],
                      autoStart: true,
                      loop: false,
                      delay: 70
                    }}
                  />
                </span>
              </div>
            </div>
            
            {/* 저장 메시지 표시 */}
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('✅') ? 'success' : 'error'}`}>
                {saveMessage}
              </div>
            )}
            
            <div className="result-buttons">
              <button 
                className="save-button" 
                onClick={handleSaveResult}
                disabled={saving}
              >
                {saving ? '저장 중...' : '💾 분석 결과 저장'}
              </button>
              <button className="upload-button" onClick={() => navigate("/")}>
                📸 새 사진 업로드
              </button>
            </div>
          </div>
        )}

        {result?.error && <div className="error">{result.error}</div>}
    </motion.div>
   );
};