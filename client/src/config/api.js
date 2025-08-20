// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     (process.env.NODE_ENV === 'production' 
                       ? process.env.REACT_APP_SERVER_URL || window.location.origin.replace(':3000', ':3001')
                       : 'http://localhost:3001');

export const API_ENDPOINTS = {
  // 분석 관련
  ANALYZE: `${API_BASE_URL}/analyze/upload-analyze`,
  ANALYZE_COMPREHENSIVE: `${API_BASE_URL}/analyze/upload-analyze-comprehensive`,
  
  // 신고 관련
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORT_LIKE: (id) => `${API_BASE_URL}/api/reports/${id}/like`,

  // 통계 관련
  STATS: `${API_BASE_URL}/api/stats`,
  
  // 인증 관련
  AUTH: {
    // 구글 OAuth
    GOOGLE: `${API_BASE_URL}/auth/google`,
    GOOGLE_POPUP: `${API_BASE_URL}/auth/google/popup`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/auth/google/callback`,
    
    // 이메일/비밀번호 인증
    LOGIN: `${API_BASE_URL}/auth/login`,
    SIGNUP: `${API_BASE_URL}/auth/signup`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    USER_INFO: `${API_BASE_URL}/auth/user`,
    
    // 리워드 관련
    USER_INFO_DETAIL: `${API_BASE_URL}/api/auth/user/info`,
    REWARD_LIST: `${API_BASE_URL}/api/auth/reward/list`,
    REWARD_EXCHANGE: `${API_BASE_URL}/api/auth/reward/exchange`
  }
};

export default API_BASE_URL; 