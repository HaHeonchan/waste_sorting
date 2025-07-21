import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TrashReportBoard from './components/complain';
// import MainPage from './pages/MainPage'; // 나중에 메인 생기면 추가
// import IncentivePage from './pages/IncentivePage'; // 추가 페이지 예시

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/complain" replace />} />
        <Route path="/complain" element={<TrashReportBoard />} />

        {/* 향후 확장을 위한 예시 */}
        {/* <Route path="/incentives" element={<IncentivePage />} /> */}
        {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
      </Routes>
    </Router>
  );
}

export default App;
