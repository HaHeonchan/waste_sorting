import { API_ENDPOINTS } from '../config/api';

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
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId: email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || '로그인에 실패했습니다.');
    }

    // 토큰 저장
    setToken(data.token);
    
    // 사용자 정보 저장 (토큰에서 디코드하거나 별도 API 호출)
    const userInfo = await getUserInfo();
    setUser(userInfo);

    return { success: true, user: userInfo };
  } catch (error) {
    console.error('로그인 에러:', error);
    return { success: false, error: error.message };
  }
};

// 회원가입
export const signup = async (name, email, password) => {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || '회원가입에 실패했습니다.');
    }

    return { success: true, message: data.msg };
  } catch (error) {
    console.error('회원가입 에러:', error);
    return { success: false, error: error.message };
  }
};

// 사용자 정보 가져오기
export const getUserInfo = async () => {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(API_ENDPOINTS.AUTH.USER_INFO, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('사용자 정보를 가져올 수 없습니다.');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('사용자 정보 조회 에러:', error);
    return null;
  }
};

// 구글 로그인 팝업
export const loginWithGoogle = () => {
  const popup = window.open(
    API_ENDPOINTS.AUTH.GOOGLE_POPUP,
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