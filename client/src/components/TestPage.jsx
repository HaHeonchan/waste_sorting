import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const TestPage = () => {
  const [apiStatus, setApiStatus] = useState('테스트 중...');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      setApiUrl(API_ENDPOINTS.REPORTS);
      console.log('Testing API connection to:', API_ENDPOINTS.REPORTS);
      
      const response = await fetch(API_ENDPOINTS.REPORTS);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setApiStatus('✅ API 연결 성공!');
      } else {
        setApiStatus(`❌ API 연결 실패: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('API test error:', error);
      setApiStatus(`❌ API 연결 오류: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🔧 API 연결 테스트</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>API 상태</h3>
        <p><strong>URL:</strong> {apiUrl}</p>
        <p><strong>상태:</strong> {apiStatus}</p>
        
        <button 
          onClick={testApiConnection}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          다시 테스트
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '8px' 
      }}>
        <h3>환경변수 확인</h3>
        <p><strong>REACT_APP_API_URL:</strong> {process.env.REACT_APP_API_URL || '설정되지 않음'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
};

export default TestPage; 