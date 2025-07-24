import React, { useEffect, useState } from "react";
import { API_ENDPOINTS } from "../../config/api";

const rewardAmountMap = {
  a: "20,000원 상당",
  b: "100,000원 상당",
  c: "100,000원 상당",
  d: "200,000원 상당",
  e: "400,000원 상당",
  f: "금액 미상"
};

const rewardTextMap = {
  a: "가. 담배꽁초, 휴지 등 휴대하고 있는 폐기물을 버린 경우",
  b: "나. 폐기물을 비닐봉지 등에 담아 아무 곳에나 버리는 행위",
  c: "다. 공원, 유원지 등에서 발생한 폐기물을 수거하지 아니하는 행위",
  d: "라. 차량, 손수레 등 운반장비로 폐기물 버리는 행위",
  e: "마. 사업활동 과정에서 발생 폐기물",
  f: "바. 기타 금액 미상"
};

export default function TrashReportBoard() {
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rewardType, setRewardType] = useState("");
  const [image, setImage] = useState(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [popupReport, setPopupReport] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.title = "분리배출 신고 게시판";
    fetchReports();
  }, [sortBy, sortOrder, page]);

  const fetchReports = async () => {
    const sortParam = sortBy === "created_at" ? "date" : sortBy;
    const res = await fetch(`${API_ENDPOINTS.REPORTS}?sort=${sortParam}&order=${sortOrder}&page=${page}&limit=5`);
    const result = await res.json();
    setReports(result.data);
    setTotalPages(Math.ceil(result.total / result.limit));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("reward", rewardType);
    if (image) formData.append("image", image);
    await fetch(API_ENDPOINTS.REPORTS, {
      method: "POST",
      body: formData,
    });
    setShowForm(false);
    resetForm();
    fetchReports();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_ENDPOINTS.REPORTS}/${id}`, { method: "DELETE" });
    fetchReports();
  };

  const handleEdit = async (e, id) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (image) formData.append("image", image);
    await fetch(`${API_ENDPOINTS.REPORTS}/${id}`, {
      method: "PUT",
      body: formData,
    });
    setShowEditForm(null);
    resetForm();
    fetchReports();
  };

  const handleLike = async (id) => {
    await fetch(API_ENDPOINTS.REPORT_LIKE(id), { method: "POST" });
    fetchReports();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setRewardType("");
    setImage(null);
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>분리배출 신고 게시판</h1>
      <button onClick={() => setShowForm(true)}>+ 민원 제보</button>

      <div style={{ marginTop: 16 }}>
        <label>정렬 기준: </label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created_at">시간순</option>
          <option value="likes">추천순</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">내림차순</option>
          <option value="asc">오름차순</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={formStyle}>
          <h2>민원 작성</h2>
          <input type="text" placeholder="제목 입력" value={title} onChange={(e) => setTitle(e.target.value)} required /><br />
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} /><br />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="민원 내용" required /><br />
          <select value={rewardType} onChange={(e) => setRewardType(e.target.value)} required>
            <option value="" disabled>포상금 유형 선택</option>
            {Object.entries(rewardTextMap).map(([key, label]) => (
              <option value={key} key={key}>{label} ({rewardAmountMap[key]})</option>
            ))}
          </select><br />
          <button type="submit">제보</button>
          <button type="button" onClick={() => setShowForm(false)}>취소</button>
        </form>
      )}

      <h2>전체 민원 목록</h2>
      {reports.map((r) => (
        <div key={r._id || r.report_id} style={reportStyle}>
          <div><b>{r.title}</b></div>
          <div>{r.content}</div>
          {r.image_url && <img src={r.image_url} width="100" alt="report" style={{ margin: "8px 0" }} />}<br />
          <div><b>포상금 지급액:</b> {rewardAmountMap[r.reward] || '-'}</div>
          <div style={{ color: '#888', fontSize: '0.9em' }}>{new Date(r.created_at).toLocaleString()}</div>
          <div><b>추천수:</b> {r.likes || 0}</div>
          <button onClick={() => handleLike(r._id || r.report_id)} style={{ color: 'green' }}>👍 추천</button>
          <button onClick={() => setPopupReport(r)} style={{ marginLeft: 8 }}>📢 신고</button>
          <button onClick={() => handleDelete(r._id || r.report_id)} style={{ color: 'red', marginLeft: 8 }}>삭제</button>
          <button onClick={() => {
            setShowEditForm(r._id || r.report_id);
            setTitle(r.title);
            setContent(r.content);
            setImage(null);
          }} style={{ color: '#0a67d6', marginLeft: 8 }}>수정</button>

          {showEditForm === (r._id || r.report_id) && (
            <form onSubmit={(e) => handleEdit(e, r._id || r.report_id)} style={formStyle}>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 수정" required /><br />
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} /><br />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required /><br />
              <button type="submit">저장</button>
              <button type="button" onClick={() => setShowEditForm(null)}>취소</button>
            </form>
          )}
        </div>
      ))}

      {/* 페이지네이션 UI */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
        <span style={{ margin: "0 12px" }}>{page} / {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>다음</button>
      </div>

      {popupReport && (
        <div style={popupStyle}>
          <button onClick={() => setPopupReport(null)} style={{ float: 'right' }}>X</button>
          <h3>📢 신고 안내</h3>
          <p>{rewardTextMap[popupReport.reward] || "선택 안됨"}</p>
          <p><b>포상금:</b> {rewardAmountMap[popupReport.reward]}</p>
          <p><a href="https://www.sejong.go.kr/citizen/sub03_0307.do" target="_blank" rel="noreferrer">세종시 안전신문고 신고 바로가기</a></p>
        </div>
      )}
    </div>
  );
}

const formStyle = {
  background: '#f9f9f9',
  borderRadius: 8,
  padding: 16,
  margin: '18px 0'
};

const reportStyle = {
  border: '1px solid #ddd',
  marginBottom: 12,
  padding: 12,
  borderRadius: 8
};

const popupStyle = {
  position: 'fixed',
  top: '20%',
  left: '50%',
  transform: 'translate(-50%, -20%)',
  backgroundColor: '#fff',
  border: '1px solid #ccc',
  padding: 20,
  zIndex: 1000,
  width: 300,
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)'
};
