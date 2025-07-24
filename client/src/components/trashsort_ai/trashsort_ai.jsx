import React, { useState } from "react";
import "./trashsort_ai.css";
import apiClient from "../../utils/apiClient";

const WasteSorting = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

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
    <div className="container">
      <h1>쓰레기 분류 시스템 테스트 페이지</h1>

      <div className="upload-section">
        <h3>이미지를 업로드하여 쓰레기를 분류해보세요</h3>
        <p>지원 형식: JPG, PNG, GIF</p>
        <input
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
          <h3>미리보기</h3>
          <img src={previewUrl} alt="미리보기" />
          <br />
          <br />
          <button className="upload-btn" onClick={handleAnalyze}>
            분석하기
          </button>
        </div>
      )}

      <div id="result">
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
                <span className="value recyclable">{result.type}</span>
              </div>
              <div className="result-item">
                <span className="label">🗂 세부 분류:</span>
                <span className="value">{result.detail}</span>
              </div>
              <div className="result-item">
                <span className="label">♻️ 재활용 마크:</span>
                <span className="value">{result.mark}</span>
              </div>
              <div className="result-item">
                <span className="label">💡 설명:</span>
                <span className="value">{result.description}</span>
              </div>
              <div className="result-item">
                <span className="label">🧺 처리 방법:</span>
                <span className="value">{result.method}</span>
              </div>
              <div className="result-item">
                <span className="label">🧠 모델:</span>
                <span className="value">{result.model}</span>
              </div>
              <div className="result-item">
                <span className="label">📊 토큰 사용량:</span>
                <span className="value">{result.token_usage}</span>
              </div>
            </div>
          </div>
        )}

        {result?.error && <div className="error">{result.error}</div>}
      </div>
    </div>
  );
};

export default WasteSorting;
