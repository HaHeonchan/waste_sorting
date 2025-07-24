import React from "react";
import { useNavigate } from "react-router-dom";
import "./SortGuide.css";

export default function SortGuide() {
  const navigate = useNavigate();

  return (
    <div className="sort-guide-container">
      <div className="sort-guide-top">
        <span onClick={() => navigate("/")}>← 홈으로 돌아가기</span>
      </div>
      <div className="sort-guide-box">
        <p className="sort-guide-text">
          분석 결과가 없습니다. 먼저 사진을 업로드해주세요.
        </p>
        <button className="upload-button" onClick={() => navigate("/")}>
          사진 업로드하러 가기
        </button>
      </div>
    </div>
  );
}
