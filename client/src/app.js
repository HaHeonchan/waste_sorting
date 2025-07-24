import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrashReportBoard from './components/complain/complain';
import WasteSorting from './components/trashsort_ai/trashsort_ai';

// 404 페이지 컴포넌트
const NotFound = () => (
  <div style={{ 
    textAlign: 'center', 
    padding: '50px', 
    fontFamily: 'Arial, sans-serif' 
  }}>
    <h1>404 - 페이지를 찾을 수 없습니다</h1>
    <p>요청하신 페이지가 존재하지 않습니다.</p>
    <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
      홈으로 돌아가기
    </a>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* "/" 경로는 쓰레기 분류 메인 페이지 */}
        <Route path="/" element={<WasteSorting />} />

        {/* 민원 게시판 경로 */}
        <Route path="/complain" element={<TrashReportBoard />} />

        {/* 예비 확장용 예시 라우트 */}
        {/* <Route path="/incentives" element={<IncentivePage />} /> */}
        
        {/* 404 페이지 - 모든 매칭되지 않는 경로를 처리 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
