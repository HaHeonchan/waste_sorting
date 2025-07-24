// API 기본 URL 설정
const getApiBaseUrl = () => {
  // 개발 환경에서는 proxy 설정 사용
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  
  // 프로덕션 환경에서는 현재 도메인 사용
  return process.env.REACT_APP_API_URL || '';
};

export const API_BASE_URL = getApiBaseUrl();

// API 호출 헬퍼 함수
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API 호출 실패: ${response.status}`);
  }

  return response.json();
}; 