// API 엔드포인트 설정
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Vercel 환경에서는 현재 도메인을 사용 (포트 없음)
    const currentDomain = window.location.origin;
    console.log('Current domain:', currentDomain);
    return `${currentDomain}/api`;
  }
  // 로컬 개발 환경에서는 포트 3001 사용
  return 'http://localhost:3001/api';
};

const getAuthBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    const currentDomain = window.location.origin;
    return `${currentDomain}/auth`;
  }
  return 'http://localhost:3001/auth';
};

const getAnalyzeBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    const currentDomain = window.location.origin;
    return `${currentDomain}/analyze`;
  }
  return 'http://localhost:3001/analyze';
};

const API_BASE_URL = getApiBaseUrl();
const AUTH_BASE_URL = getAuthBaseUrl();
const ANALYZE_BASE_URL = getAnalyzeBaseUrl();

console.log('API URLs:', { API_BASE_URL, AUTH_BASE_URL, ANALYZE_BASE_URL });

export { API_BASE_URL, AUTH_BASE_URL, ANALYZE_BASE_URL }; 