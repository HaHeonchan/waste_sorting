import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TrashReportBoard from './components/complain';
// import MainPage from './pages/MainPage';  // 추후 메인화면 필요 시 사용
// import IncentivePage from './pages/IncentivePage'; // 인센티브 페이지 예시

function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 경로는 /complain으로 리다이렉트 */}
        <Route path="/" element={<Navigate to="/complain" replace />} />

        {/* 민원 게시판 경로 */}
        <Route path="/complain" element={<TrashReportBoard />} />

        {/* 예비 확장용 예시 라우트 */}
        {/* <Route path="/incentives" element={<IncentivePage />} /> */}
        {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
      </Routes>
    </Router>
  );
}

export default App;
