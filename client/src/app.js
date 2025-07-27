import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/login_page/login';
import Signup from './components/signup_page/signup';
import Mypage from './components/mypage_page/mypage';
import Incentive from './components/incentive_page/incentive';
import Complain from './components/complain_page/complain.jsx';
import SortGuide from './components/sortguide_page/sortguide.jsx';
import Home from './components/home_page/home';
import Navbar from './components/navbar_page/navbar.jsx';
import TestPage from './components/TestPage';
import List from './components/list_page/list.jsx';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div>
            <Navbar />
            <Routes>
              
              {/* API 테스트 페이지 */}
              <Route path="/test" element={<TestPage />} />

              <Route path="/" element={<Home />} /> {/* 쓰레기 분류 메인 페이지 */}
              <Route path="/sortguide" element={<SortGuide />} /> {/* 쓰레기 분류 ai 페이지 */}
              <Route path="/incentive" element={<Incentive />} /> {/* 인센티브 페이지 */}
              <Route path="/complain" element={<Complain />} /> {/* 민원 게시판 페이지 */}
              <Route path="/mypage" element={<Mypage />} /> {/* 마이페이지 페이지 */}
              <Route path="/login" element={<Login />} /> {/* 로그인 페이지 */}
              <Route path="/signup" element={<Signup />} /> {/* 회원가입 페이지 */}
              <Route path="/analysis-results" element={<List />} /> {/* 분석 결과 목록 페이지 */}
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
