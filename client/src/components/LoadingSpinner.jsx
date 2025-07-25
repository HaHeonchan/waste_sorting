import React from 'react';

const LoadingSpinner = ({ message = "로딩 중..." }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        fontSize: '48px',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}>
        🔄
      </div>
      <p style={{ color: '#6c757d', fontSize: '18px' }}>{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 