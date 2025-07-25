import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated, getUser, getUserInfo } from '../utils/auth';

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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setError(null);
        
        if (isAuthenticated()) {
          // 토큰이 있으면 사용자 정보 가져오기
          const userInfo = await getUserInfo();
          if (userInfo) {
            setUser(userInfo);
          } else {
            // 토큰은 있지만 사용자 정보를 가져올 수 없는 경우
            const localUser = getUser();
            if (localUser) {
              setUser(localUser);
            } else {
              // 토큰은 있지만 사용자 정보가 없는 경우 - 토큰 무효화
              console.warn('토큰은 있지만 사용자 정보를 가져올 수 없습니다.');
              setError('인증 정보가 만료되었습니다. 다시 로그인해주세요.');
            }
          }
        }
      } catch (error) {
        console.error('인증 초기화 에러:', error);
        setError('인증 상태를 확인하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setError(null);
  };

  const logout = () => {
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
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 