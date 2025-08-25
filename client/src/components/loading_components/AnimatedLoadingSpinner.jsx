import React from 'react';
import './AnimatedLoadingSpinner.css';

const AnimatedLoadingSpinner = ({ message = "데이터를 불러오는 중..." }) => {
  return (
    <div className='animated-loading-container'>
      <div className="animated-spinner"></div>
      <div className="animated-loading-message">{message}</div>
    </div>
  );
};

export default AnimatedLoadingSpinner; 