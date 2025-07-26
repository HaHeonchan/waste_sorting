import React, { useEffect, useState } from 'react';
import "./complain.css";
import apiClient from '../../utils/apiClient';


const rewardAmountMap = {
    a: "20,000원 상당",
    b: "100,000원 상당",
    c: "100,000원 상당",
    d: "200,000원 상당",
    e: "400,000원 상당",
    f: "금액 미상",
  };

  const rewardTextMap = {
    a: "가. 담배꽁초, 휴지 등 휴대하고 있는 폐기물을 버린 경우",
    b: "나. 폐기물을 비닐봉지 등에 담아 아무 곳에나 버리는 행위",
    c: "다. 공원, 유원지 등에서 발생한 폐기물을 수거하지 아니하는 행위",
    d: "라. 차량, 손수레 등 운반장비로 폐기물 버리는 행위",
    e: "마. 사업활동 과정에서 발생 폐기물",
    f: "바. 기타 금액 미상",
  };

export default function Complain() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set()); // 삭제 중인 ID들
  const [uploading, setUploading] = useState(false); // 업로드 중 상태
  const [uploadProgress, setUploadProgress] = useState(0); // 업로드 진행률
  const isBackendConnected = true;// 이 부분은 실제 백엔드 연결 상태에 따라 변경해야 합니다.

  useEffect(() => {
    document.title = "분리배출 신고 게시판";
    fetchReports();
  }, [sortBy, sortOrder, page]);

  const fetchReports = async () => {
    if (!isBackendConnected) {
      setReports([]);
      setTotalPages(1);
      setError("백엔드 서버에 연결할 수 없습니다. 현재 데이터를 표시할 수 없습니다.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const sortParam = sortBy === "created_at" ? "date" : sortBy;
      const url = `/api/reports?sort=${sortParam}&order=${sortOrder}&page=${page}&limit=5`;
      const result = await apiClient.requestWithRetry(url);
      setReports(result.data || []);
      setTotalPages(Math.ceil((result.total || 0) / (result.limit || 5)));
    } catch (error) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setReports([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBackendConnected) {
      alert('🔌 백엔드 연결 필요: 제출 기능은 나중에 사용 가능합니다.');
      return;
    }
    
    if (uploading) return; // 이미 업로드 중이면 중복 요청 방지
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("reward", rewardType);
      if (image) formData.append("image", image);
      
      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);
      
      await apiClient.requestWithRetry('/api/reports', {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setShowForm(false);
        resetForm();
        fetchReports();
        setUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('민원 제출 중 오류:', error);
      alert('민원 제출 중 오류가 발생했습니다.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!isBackendConnected) {
      alert('🔌 백엔드 연결 필요: 삭제 기능은 나중에 사용 가능합니다.');
      return;
    }
    
    // 이미 삭제 중인 경우 중복 요청 방지
    if (deletingIds.has(id)) {
      return;
    }
    
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      
      // 삭제 요청 (재시도 없이 한 번만)
      const response = await fetch(`/api/reports/${id}`, { 
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      fetchReports();
    } catch (error) {
      console.error('삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleEdit = async (e, id) => {
    e.preventDefault();
    if (!isBackendConnected) {
      alert('🔌 백엔드 연결 필요: 수정 기능은 나중에 사용 가능합니다.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (image) formData.append("image", image);
      await apiClient.requestWithRetry(`/api/reports/${id}`, {
        method: "PUT",
        body: formData,
      });
      setShowEditForm(null);
      resetForm();
      fetchReports();
    } catch (error) {
      alert('수정 중 오류');
    }
  };

  const handleLike = async (id) => {
    if (!isBackendConnected) {
      alert('🔌 백엔드 연결 필요: 추천 기능은 나중에 사용 가능합니다.');
      return;
    }
    try {
      await apiClient.requestWithRetry(`/api/reports/${id}/like`, { method: "POST" });
      fetchReports();
    } catch (error) {
      alert('추천 중 오류');
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setRewardType("");
    setImage(null);
  };

  return (
    <div className="report-wrapper">
      <h1 className="report-title">📢 분리배출 신고 게시판</h1>

      <div className="report-controls">
        <button onClick={() => setShowForm(!showForm)} className="report-button">
          + 민원 제보
        </button>
        <div className="report-sort">
          <label>정렬 기준:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">시간순</option>
              <option value="likes">추천순</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
        </div>
      </div>

      {showForm && (
        <div className="report-form">
          <h2>민원 작성</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 입력"
              required
            />

            {/* 🔽 드래그 앤 드롭 이미지 업로드 영역 */}
            <div
              className="report-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith("image/")) {
                  setImage(file);
                }
              }}
              onClick={() => document.getElementById("hiddenFileInput").click()}
            >
              {image ? (
                <div className="report-preview">
                  <img src={URL.createObjectURL(image)} alt="미리보기" />
                  <button type="button" onClick={() => setImage(null)}>❌ 삭제</button>
                </div>
              ) : (
                <p className="report-drop-hint">📥 이미지를 여기에 드래그하거나 클릭하여 업로드</p>
              )}
            </div>

            {/* 실제 숨겨진 파일 선택 input */}
            <input
              id="hiddenFileInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setImage(e.target.files[0])}
              required={!image}
            />

            <textarea
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상세 내용을 입력하세요"
              required
            />

            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              required
            >
              <option value="">-- 포상금 유형 선택 --</option>
              {Object.entries(rewardTextMap).map(([key, text]) => (
                <option key={key} value={key}>
                  {text} ({rewardAmountMap[key]})
                </option>
              ))}
            </select>

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {uploadProgress < 100 ? '업로드 중...' : '완료!'}
                </div>
              </div>
            )}
            
            <div className="report-form-buttons">
              <button type="submit" disabled={uploading}>
                {uploading ? '업로드 중...' : '제보'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} disabled={uploading}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

       <h2 className="report-subtitle">전체 민원 목록</h2>

      {loading && (
        <div className='loading-container'>
          <div className="spinner"></div> {/* 🔄 로딩 원 추가 */}
          <div className="loading-message">데이터를 불러오는 중...</div>
          <div className="loading-spinner">서버 응답이 느릴 수 있습니다. 잠시만 기다려주세요.</div>
        </div>
      )}

      {error && (
        <div className='error-message'>
          {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className='no-reports-message'>
          아직 등록된 민원이 없습니다.
        </div>
      )}

      {!loading && !error && reports.map((r) => (
        <div className='report-item' key={r._id || r.report_id}>
          <div className='report-title'><b>{r.title}</b></div>
          <div className='report-content'>{r.content}</div>
          {r.image_url && <img src={r.image_url} width="100" alt="report" className='report-image' />}<br />
          <div className='report-reward'><b>포상금 지급액:</b> {rewardAmountMap[r.reward] || '-'}</div>
          <div className='report-date' style={{ color: '#888', fontSize: '0.9em' }}>{new Date(r.created_at).toLocaleString()}</div>
          <div className='report-likes'><b>추천수:</b> {r.likes || 0}</div>
          <button className='report-like-button' onClick={() => handleLike(r._id || r.report_id)}>👍 추천</button>
          <button className='report-popup-button' onClick={() => setPopupReport(r)}>📢 신고</button>
          <button 
            className='report-delete-button' 
            onClick={() => handleDelete(r._id || r.report_id)}
            disabled={deletingIds.has(r._id || r.report_id)}
          >
            {deletingIds.has(r._id || r.report_id) ? '삭제 중...' : '삭제'}
          </button>
          <button className='report-edit-button' onClick={() => {
            setShowEditForm(r._id || r.report_id);
            setTitle(r.title);
            setContent(r.content);
            setImage(null);
          }} >수정</button>

          {showEditForm === (r._id || r.report_id) && (
            <form className='report-edit-form' onSubmit={(e) => handleEdit(e, r._id || r.report_id)}>
              <input className='report-edit-input' type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 수정" required /><br />
              <input className='report-edit-input' type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} /><br />
              <textarea className='report-edit-textarea' value={content} onChange={(e) => setContent(e.target.value)} required /><br />
              <button className='report-edit-save-button' type="submit">저장</button>
              <button className='report-edit-cancel-button' type="button" onClick={() => setShowEditForm(null)}>취소</button>
            </form>
          )}
        </div>
      ))}

      <div className='pagination' >
        <button className='pagination-button' disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button>
        <span className='pagination-info' >{page} / {totalPages}</span>
        <button className='pagination-button' disabled={page === totalPages} onClick={() => setPage(page + 1)}>다음</button>
      </div>

      {popupReport && (
        <div className='report-popup'>
          <button className='report-popup-close-button' onClick={() => setPopupReport(null)}>X</button>
          <h3 className='report-popup-title'>📢 신고 안내</h3>
          <p className='report-popup-description'>{rewardTextMap[popupReport.reward] || "선택 안됨"}</p>
          <p className='report-popup-reward'><b className='report-popup-reward-label'>포상금:</b> {rewardAmountMap[popupReport.reward]}</p>
          <p className='report-popup-link'><a className='report-popup-link' href="https://www.sejong.go.kr/citizen/sub03_0307.do" target="_blank" rel="noreferrer">세종시 안전신문고 신고 바로가기</a></p>
        </div>
      )}
    </div>
  );
}