import apiClient from './apiClient';

// JWT 토큰 저장
export const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

// JWT 토큰 가져오기
export const getToken = () => {
  return localStorage.getItem('authToken');
};

// JWT 토큰 제거
export const removeToken = () => {
  localStorage.removeItem('authToken');
};

// 사용자 정보 저장
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// 사용자 정보 가져오기
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// 사용자 정보 제거
export const removeUser = () => {
  localStorage.removeItem('user');
};

// 로그인 상태 확인
export const isAuthenticated = () => {
  return !!getToken();
};

// 로그아웃
export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = '/';
};

// 이메일/비밀번호 로그인
export const loginWithEmail = async (email, password) => {
  try {
    const result = await apiClient.requestWithRetry('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId: email, password }),
    });

    // 토큰 저장
    setToken(result.token);
    
    // 사용자 정보 저장 (토큰에서 디코드하거나 별도 API 호출)
    const userInfo = await getUserInfo();
    setUser(userInfo);

    return { success: true, user: userInfo };
  } catch (error) {
    console.error('로그인 에러:', error);
    return { success: false, error: error.message || '로그인에 실패했습니다.' };
  }
};

// 회원가입
export const signup = async (name, email, password) => {
  try {
    const result = await apiClient.requestWithRetry('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    return { success: true, message: result.msg || '회원가입이 완료되었습니다.' };
  } catch (error) {
    console.error('회원가입 에러:', error);
    return { success: false, error: error.message || '회원가입에 실패했습니다.' };
  }
};

// 사용자 정보 가져오기
export const getUserInfo = async () => {
  try {
    const token = getToken();
    if (!token) return null;

    const result = await apiClient.requestWithRetry('/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return result.user;
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    return null;
  }
};

// 구글 로그인 팝업
export const loginWithGoogle = () => {
  // apiClient의 baseUrl을 사용하여 구글 로그인 URL 생성
  const googleLoginUrl = `${apiClient.baseUrl}/auth/google/popup`;
  
  const popup = window.open(
    googleLoginUrl,
    'googleLogin',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  return new Promise((resolve, reject) => {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // 팝업이 닫혔을 때 사용자 정보 확인
        const user = getUser();
        if (user) {
          resolve({ success: true, user });
        } else {
          reject(new Error('구글 로그인이 취소되었습니다.'));
        }
      }
    }, 1000);
  });
};

// API 요청에 인증 헤더 추가
export const authHeaders = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}; 