import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav style={{
      backgroundColor: '#f8f9fa',
      padding: '1rem',
      marginBottom: '2rem',
      borderBottom: '1px solid #dee2e6'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
          ♻️ 쓰레기 분류 시스템
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link 
            to="/" 
            style={{
              textDecoration: 'none',
              color: location.pathname === '/' ? '#28a745' : '#6c757d',
              fontWeight: location.pathname === '/' ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              backgroundColor: location.pathname === '/' ? '#e8f5e8' : 'transparent'
            }}
          >
            🏠 메인
          </Link>
          <Link 
            to="/complain" 
            style={{
              textDecoration: 'none',
              color: location.pathname === '/complain' ? '#28a745' : '#6c757d',
              fontWeight: location.pathname === '/complain' ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              backgroundColor: location.pathname === '/complain' ? '#e8f5e8' : 'transparent'
            }}
          >
            📢 민원 게시판
          </Link>
          <Link 
            to="/test" 
            style={{
              textDecoration: 'none',
              color: location.pathname === '/test' ? '#28a745' : '#6c757d',
              fontWeight: location.pathname === '/test' ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              backgroundColor: location.pathname === '/test' ? '#e8f5e8' : 'transparent'
            }}
          >
            🔧 테스트
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 