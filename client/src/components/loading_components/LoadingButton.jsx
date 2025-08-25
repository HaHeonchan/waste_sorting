import React from 'react';
import './LoadingButton.css';

const LoadingButton = ({ 
  children, 
  loading = false, 
  loadingText = "처리 중...", 
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <button 
      className={`loading-button ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="button-loading-content">
          <div className="button-spinner"></div>
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton; 