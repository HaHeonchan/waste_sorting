import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrashReportBoard from './components/complain/complain';
import WasteSorting from './components/trashsort_ai/trashsort_ai';
import Navigation from './components/Navigation';
import TestPage from './components/TestPage';

function App() {
  return (
    <Router>
      <div>
        <Navigation />
        <Routes>
          {/* "/" 경로는 쓰레기 분류 메인 페이지 */}
          <Route path="/" element={<WasteSorting />} />

          {/* 민원 게시판 경로 */}
          <Route path="/complain" element={<TrashReportBoard />} />

          {/* API 테스트 페이지 */}
          <Route path="/test" element={<TestPage />} />

          {/* 예비 확장용 예시 라우트 */}
          {/* <Route path="/incentives" element={<IncentivePage />} /> */}
          {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
