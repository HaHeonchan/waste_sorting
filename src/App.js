import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

import Home from './pages/Home/Home';
import SortGuide from './pages/SortGuide/SortGuide';
import Incentive from './pages/Incentive/Incentive';
import Report from './pages/Report/Report';
import Mypage from './pages/Mypage/Mypage';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sortguide" element={<SortGuide />} />
        <Route path="/incentive" element={<Incentive />} />
        <Route path="/report" element={<Report />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
