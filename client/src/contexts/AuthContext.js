import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getUser, getUserInfo, getToken, clearAuthData } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 인증 상태 확인 함수
  const checkAuthStatus = () => {
    try {
      const token = getToken();
      const localUser = getUser();
      
      if (token && localUser) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('AuthContext: 인증 상태 확인 오류:', error);
      // 오류 발생 시 모든 인증 데이터 클리어
      clearAuthData();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setError(null);
        console.log('AuthContext: 인증 초기화 시작');
        
        if (isAuthenticated()) {
          console.log('AuthContext: 토큰 발견, 사용자 정보 가져오기 시도');
          // 토큰이 있으면 사용자 정보 가져오기
          const userInfo = await getUserInfo();
          if (userInfo) {
            const token = getToken() || localStorage.getItem("authToken");
            console.log('AuthContext: 서버에서 사용자 정보 가져옴', userInfo);
            setUser(userInfo);
          } else {
            // 토큰은 있지만 사용자 정보를 가져올 수 없는 경우
            const localUser = getUser();
            if (localUser) {
              console.log('AuthContext: 로컬 사용자 정보 사용', localUser);
              setUser(localUser);
            } else {
              // 토큰은 있지만 사용자 정보가 없는 경우 - 토큰 무효화
              console.warn('AuthContext: 토큰은 있지만 사용자 정보를 가져올 수 없습니다.');
              clearAuthData();
              setError('인증 정보가 만료되었습니다. 다시 로그인해주세요.');
            }
          }
        } else {
          console.log('AuthContext: 토큰 없음, 비로그인 상태');
        }
      } catch (error) {
        console.error('AuthContext: 인증 초기화 에러:', error);
        // 오류 발생 시 모든 인증 데이터 클리어
        clearAuthData();
        setError('인증 상태를 확인하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
        console.log('AuthContext: 인증 초기화 완료');
      }
    };

    initializeAuth();
  }, []);

  // 로그인 함수
  const login = (userData) => {
    console.log('AuthContext: 로그인 성공', userData);

    if (userData.token) {
      localStorage.setItem('authToken', userData.token);
    }
    login(res.data);
    setUser(userData);
    setError(null);
  };

  // 로그아웃 함수
  const logout = () => {
    console.log('AuthContext: 로그아웃');
    clearAuthData();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: checkAuthStatus() || !!user
  };

  // 로딩 중일 때 로딩 스피너 표시
  if (loading) {
    return <LoadingSpinner message="인증 상태를 확인하는 중..." />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 