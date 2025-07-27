
import React, { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { useNavigate } from "react-router-dom";

export default function List() {
  const navigate = useNavigate();
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <div>불러오는 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="analysis-list-page">
      <h2>최근 분석 결과</h2>

      {/* ✅ 마이페이지로 이동 버튼 */}
      <button 
        className="go-mypage-btn" 
        onClick={() => navigate("/mypage")}
        style={{
          padding: "16px 24px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "16px"
        }}
      >
        마이페이지로 이동
      </button>

      {analysisResults.length === 0 ? (
        <div>아직 분석 결과가 없습니다.</div>
      ) : (
        <ul className="analysis-result-list">
          {analysisResults.map((result, idx) => (
            <li key={result._id || idx} className="analysis-result-item">
              <div>
                <span>분석일: {new Date(result.uploadedAt || result.createdAt).toLocaleString()}</span>
                <span>｜분류: {result.analysisResult?.type || result.type}</span>
                <span>｜상세: {result.analysisResult?.detail || result.detail}</span>
              </div>
              <div>
                <span>설명: {result.analysisResult?.description || result.description}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
