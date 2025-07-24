// API 설정 - 환경별 백엔드 URL 관리
const getApiBaseUrl = () => {
    // 개발 환경
    if (process.env.NODE_ENV === 'development') {
        return process.env.REACT_APP_API_URL || 'http://localhost:3001';
    }
    
    // 프로덕션 환경
    return process.env.REACT_APP_API_URL || 'https://your-backend-domain.vercel.app';
};

export const API_BASE_URL = getApiBaseUrl();

// API 엔드포인트들
export const API_ENDPOINTS = {
    // 쓰레기 분류 관련
    WASTE_ANALYZE: `${API_BASE_URL}/analyze`,
    WASTE_API: `${API_BASE_URL}/api/waste`,
    
    // 인증 관련
    AUTH: `${API_BASE_URL}/auth`,
    
    // 불만사항 관련
    COMPLAIN: `${API_BASE_URL}/api`,
    
    // 파일 업로드
    UPLOAD: `${API_BASE_URL}/uploads`
};

// API 요청 헬퍼 함수
export const apiRequest = async (endpoint, options = {}) => {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함
    };

    const response = await fetch(endpoint, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
}; 