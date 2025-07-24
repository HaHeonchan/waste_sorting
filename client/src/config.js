// API 엔드포인트 설정
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://your-vercel-domain.vercel.app/api'
  : 'http://localhost:3001/api';

const AUTH_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_AUTH_URL || 'https://your-vercel-domain.vercel.app/auth'
  : 'http://localhost:3001/auth';

const ANALYZE_BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_ANALYZE_URL || 'https://your-vercel-domain.vercel.app/analyze'
  : 'http://localhost:3001/analyze';

export { API_BASE_URL, AUTH_BASE_URL, ANALYZE_BASE_URL }; 