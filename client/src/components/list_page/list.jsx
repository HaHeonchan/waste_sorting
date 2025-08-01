
import React, { useEffect, useState, useRef } from "react";
import apiClient from "../../utils/apiClient";
import { useNavigate } from "react-router-dom";
import "./list.css";

export default function List() {
  const navigate = useNavigate();
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [data, setData] = useState([]);
  const sliderRef = useRef();
  const [selectedImage, setSelectedImage] = useState(null);
  

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
      
    // const dummyData = [
    //   {
    //     id: 1,
    //     date: "2025-07-25T19:15:00",
    //     category: "플라스틱",
    //     detail: "투명 PET 병",
    //     description: "라벨 제거 후 압축하여 배출하세요.",
    //     imageURL: "http://news.samsungdisplay.com/wp-content/uploads/2018/08/1.png" // ✅ 예시 이미지
    //   },
    //   {
    //     id: 2,
    //     date: "2025-07-25T12:40:00",
    //     category: "종이",
    //     detail: "우유팩",
    //     description: "일반 종이류와 분리하여 깨끗이 씻어 배출하세요.",
    //     imageURL: "http://news.samsungdisplay.com/wp-content/uploads/2018/08/SDC%EB%89%B4%EC%8A%A4%EB%A3%B8_%EC%82%AC%EC%A7%848%ED%8E%B8_180806_%EB%8F%84%EB%B9%84%EB%9D%BC.png"
    //   },
    //   {
    //     id: 3,
    //     date: "2025-07-23T17:05:00",
    //     category: "금속",
    //     detail: "알루미늄 캔",
    //     description: "내용물을 비우고 압축하여 배출하세요.",
    //     imageURL: "http://news.samsungdisplay.com/wp-content/uploads/2018/08/2.png"
    //   }
    // ];
    // setAnalysisResults(dummyData);
    // setLoading(false);
  }, []);

  if (loading) return <div>불러오는 중...</div>;
  if (error) return <div>{error}</div>;


   const sortedResults = [...analysisResults].sort((a, b) =>
    sortOrder === "desc"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date)
  );

  const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
  <div className="analysis-list-wrapper">
  <div className="analysis-list-page">
    {/* ✅ 상단바 */}
    <div className="header-bar">
      <button className="go-mypage-btn" onClick={() => navigate("/mypage")}>
        ←
      </button>
      <h2 className="page-title">최근 분석 결과</h2>
      <select
        className="sort-dropdown"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
      >
        <option value="desc">내림차순</option>
        <option value="asc">오름차순</option>
      </select>
    </div>

    {/* ✅ 카드 3개씩 정렬 */}
    <div className="analysis-grid">
      {sortedResults.map((item, idx) => (
        <div
          className="analysis-card"
          key={idx}
          onClick={() => item.imageUrl && setSelectedImage(item.imageUrl)}
        >
          <div className="card-content">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.analysisResult?.detail || item.detail} className="card-image" />
            )}
            <div className="card-title">{item.analysisResult?.detail || item.detail}</div>
            <div className="card-subtext">{item.analysisResult?.type || item.type}</div>
            <div className="card-desc">💡 {item.analysisResult?.detail || item.detail}</div>
            <div className="card-date">{formatDate(item.uploadedAt)}</div>
          </div>
        </div>
      ))}
    </div>

    {/* ✅ 이미지 팝업 */}
    {selectedImage && (
      <div className="image-popup-overlay" onClick={() => setSelectedImage(null)}>
        <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
          <button className="popup-close" onClick={() => setSelectedImage(null)}>×</button>
          <img src={selectedImage} alt="분석 결과 원본" />
        </div>
      </div>
    )}
  </div>
</div>
  
);

}