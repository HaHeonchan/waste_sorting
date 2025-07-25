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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
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
            }
          }
        }
      } catch (error) {
        console.error('인증 초기화 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 