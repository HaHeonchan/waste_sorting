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

// 사용자 정보 가져오기 (안전한 JSON 파싱)
export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    const parsedUser = JSON.parse(user);
    return parsedUser;
  } catch (error) {
    console.error('사용자 정보 파싱 오류:', error);
    // 파싱 오류 시 localStorage에서 제거
    localStorage.removeItem('user');
    return null;
  }
};

// 사용자 정보 제거
export const removeUser = () => {
  localStorage.removeItem('user');
};

// 모든 인증 데이터 클리어
export const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// 로그인 상태 확인
export const isAuthenticated = () => {
  return !!getToken();
};

// 로그아웃
export const logout = () => {
  clearAuthData();
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
      body: JSON.stringify({ email, password }),
    });

    // 토큰 저장
    setToken(result.token);
    
    // 사용자 정보 구성 (서버에서 받은 정보 사용)
    const userInfo = {
      email: email,
      name: result.name, // 서버에서 받은 name 필드 사용
      id: result.id,
      points: result.points || 0,
      recycleCount: result.recycleCount || 0,
      reportCount: result.reportCount || 0,
      createdAt: result.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    // 사용자 정보 저장
    setUser(userInfo);
    
    console.log('로그인 성공 - 사용자 정보:', userInfo);

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
  // 팝업용 구글 로그인 URL 생성 (팝업 파라미터 추가)
  const googleLoginUrl = `${apiClient.baseUrl}/auth/google/popup?isPopup=true`;
  
  const popup = window.open(
    googleLoginUrl,
    'googleLogin',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  return new Promise((resolve, reject) => {
    // postMessage 이벤트 리스너 추가
    const messageHandler = (event) => {
      console.log('Received message:', event.data);
      
      if (event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
        console.log('Google login success received');
        window.removeEventListener('message', messageHandler);
        clearInterval(checkClosed);
        
        // 사용자 정보 저장
        const userInfo = event.data.user;
        setUser(userInfo);
        
        // JWT 토큰 저장 (서버에서 받은 토큰)
        if (event.data.token) {
          setToken(event.data.token);
        }
        
        resolve({ success: true, user: userInfo });
      } else if (event.data.type === 'GOOGLE_LOGIN_ERROR') {
        console.log('Google login error received');
        window.removeEventListener('message', messageHandler);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || '구글 로그인에 실패했습니다.'));
      }
    };

    window.addEventListener('message', messageHandler);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        
        // 팝업이 닫혔지만 메시지를 받지 못한 경우
        reject(new Error('구글 로그인이 취소되었습니다.'));
      }
    }, 1000);
  });
};

// API 요청에 인증 헤더 추가
export const authHeaders = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}; 