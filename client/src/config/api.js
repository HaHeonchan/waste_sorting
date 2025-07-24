// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     (process.env.NODE_ENV === 'production' 
                       ? process.env.REACT_APP_SERVER_URL || 'https://your-server-name.onrender.com'
                       : 'http://localhost:3001');

export const API_ENDPOINTS = {
  // 분석 관련
  ANALYZE: `${API_BASE_URL}/analyze/upload-analyze`,
  
  // 신고 관련
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORT_LIKE: (id) => `${API_BASE_URL}/api/reports/${id}/like`,
  
  // 인증 관련
  AUTH: {
    GOOGLE: `${API_BASE_URL}/auth/google`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    PROFILE: `${API_BASE_URL}/auth/profile`
  }
};

export default API_BASE_URL; 