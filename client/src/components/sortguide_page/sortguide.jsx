import React, { useState, useEffect, useCallback, useRef } from "react";
import "./sortguide.css";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { useAuth } from '../../contexts/AuthContext';
import { motion } from "framer-motion";
import AnimatedLoadingSpinner from "../loading_components/AnimatedLoadingSpinner";

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
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [abortController, setAbortController] = useState(null); // 요청 취소를 위한 컨트롤러
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 추가 중복 방지 플래그
  const analyzeTimeoutRef = useRef(null); // 디바운싱을 위한 timeout ref
  const hasInitialized = useRef(false); // 초기화 완료 플래그
  
  
  
  useEffect(() => {
    // AuthContext가 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 로그인 상태 확인
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 이미 초기화가 완료되었으면 중복 실행 방지
    if (hasInitialized.current) {
      return;
    }

    // selectedFile이 있고 아직 분석하지 않은 경우에만 분석 실행
    if (selectedFile && !hasAnalyzed && !loading && !isAnalyzing) {
      // 디바운싱 적용 (1초 지연으로 증가)
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
      
      analyzeTimeoutRef.current = setTimeout(() => {
        hasInitialized.current = true; // 초기화 완료 표시
        handleAnalyze(); // 페이지 로드 시 자동 분석
      }, 1000);
    }
    
    // cleanup 함수
    return () => {
      if (analyzeTimeoutRef.current) {
        clearTimeout(analyzeTimeoutRef.current);
      }
    };
  }, [isAuthenticated, authLoading, selectedFile, navigate]); // 의존성 배열에서 hasAnalyzed, loading, isAnalyzing 제거

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) {
      alert("이미지를 선택해주세요.");
      return;
    }

    // 이미 분석 중이거나 분석 완료된 경우 중복 실행 방지
    if (loading || hasAnalyzed || isAnalyzing) {
      console.log('🚫 중복 분석 요청 차단:', { loading, hasAnalyzed, isAnalyzing });
      return;
    }

    // 즉시 분석 중 플래그 설정 (동기적으로)
    setIsAnalyzing(true);

    // 이전 요청이 있다면 취소
    if (abortController) {
      abortController.abort();
    }

    // 새로운 AbortController 생성
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    
    setLoading(true);
    setResult(null);
    setProgressMessage("");
    setHasAnalyzed(true); // 분석 시작 플래그 설정

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const data = await apiClient.analyzeImage(formData, (message) => {
        setProgressMessage(message);
      });
      setResult(data);
    } catch (err) {
      // 요청이 취소된 경우는 에러로 처리하지 않음
      if (err.message === '분석 요청이 취소되었습니다.') {
        return;
      }
      
      // 서버에서 중복 요청 차단 응답인 경우
      if (err.message.includes('이미 처리 중인 요청입니다')) {
        setHasAnalyzed(false); // 플래그 리셋하여 재시도 가능하게 함
        return;
      }
      
      console.error("분석 오류:", err.message);
      setResult({ 
        error: err.message || "분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
      setHasAnalyzed(false); // 에러 시 플래그 리셋
    } finally {
      setLoading(false);
      setProgressMessage("");
      setAbortController(null); // 컨트롤러 정리
      setIsAnalyzing(false); // 분석 중 플래그 해제
    }
  }, [selectedFile, abortController]); // 의존성 배열에서 loading, hasAnalyzed, isAnalyzing 제거

  const handleSaveResult = async () => {
    if (!result || result.error) {
      alert("저장할 분석 결과가 없습니다.");
      return;
    }



    setSaving(true);
    setSaveMessage("분석 결과를 저장하고 있습니다...");

    try {
      const saveResult = await apiClient.saveAnalysisResult(result, selectedFile);

      const points = saveResult?.data?.points;
      if (typeof points === "number") {
        setSaveMessage(`✅ 분석 결과가 성공적으로 저장되었습니다! (+${points}포인트)`);
      } else {
        setSaveMessage("✅ 분석 결과가 성공적으로 저장되었습니다!");
      }

      navigate("/analysis-results", {
        state: { saveResult }
      });

      setSaveMessage("✅ 분석 결과가 성공적으로 저장되었습니다!");
      
      // 3초 후 메시지 제거
      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
      
    } catch (error) {
      console.error("저장 오류:", error.message);
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
      question: "무엇을 찍어야 하나요?",
      answer:
        "쓰레기에 있는 분리배출 아이콘, 혹은 버릴 쓰레기의 전체적인 모습을 촬영해주세요.",
    },
    {
      question: "흐릿한 사진도 분석이 되나요?",
      answer:
        "가능은 하지만 결과 정확도가 낮아질 수 있습니다. 배경이 깔끔하고 초점이 맞은 사진을 권장합니다.",
    },
    {
      question: "하루에 몇번까지 가능한가요?",
      answer:
        "분석 횟수에는 제한이 없지만, 결과를 저장하는것은 하루 최대 5번까지 가능합니다.",
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
        <AnimatedLoadingSpinner message="인증 상태를 확인하는 중..." />
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
            <p>AI가 쓰레기 종류와 처리 방법을 분석해 드려요! <br></br> 분리배출 아이콘을 찾아 촬영하거나 <br></br> 없다면 쓰레기의 전체적인 형태를 촬영해주세요!</p>

            <div
              className="drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedFile(file);
                  setHasAnalyzed(false); // 새로운 파일 선택 시 분석 상태 리셋
                  setResult(null); // 이전 결과 초기화
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
                    setHasAnalyzed(false); // 새로운 파일 선택 시 분석 상태 리셋
                    setResult(null); // 이전 결과 초기화
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
                  {result.type || '분류 중...'}
                </span>
              </div>
              <div className="result-item">
                <span className="label">🗂 세부 분류:</span>
                <span className="value">
                  {result.detail || '정보 없음'}
                </span>
              </div>
              {/* 재활용 마크와 설명은 잠시 숨김
              <div className="result-item">
                <span className="label">♻️ 재활용 마크:</span>
                <span className="value">
                  {result.mark || '정보 없음'}
                </span>
              </div>
              <div className="result-item">
                <span className="label">💡 설명:</span>
                <span className="value">
                  {result.description || '정보 없음'}
                </span>
              </div>
              */}
              {/* 처리 방법도 잠시 숨김
              <div className="result-item">
                <span className="label">🧺 처리 방법:</span>
                <span className="value">
                  {result.method || '정보 없음'}
                </span>
              </div>
              */}
              
              {/* 부위별 재질 정보 표시 */}
              {result.materialParts && result.materialParts.length > 0 && (
                <div className="material-parts-section">
                  <h4>🔍 부위별 재질 분석</h4>
                  <div className="material-parts-grid">
                    {result.materialParts.map((part, index) => (
                      <div key={index} className="material-part-card">
                        <div className="part-header">
                          <span className="part-name">{part.part}</span>
                          <span className="material-type">{part.material}</span>
                        </div>
                        <div className="part-description">
                          {part.description}
                        </div>
                        {part.disposalMethod && (
                          <div className="part-disposal">
                            <strong>처리 방법:</strong> {part.disposalMethod}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* <div className="result-item">
                <span className="label">🧠 모델:</span>
                <span className="value">
                  {result.model || '정보 없음'}
                </span>
              </div>
              <div className="result-item">
                <span className="label">📊 토큰 사용량:</span>
                <span className="value">
                  {result.token_usage || '정보 없음'}
                </span>
              </div> */}
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