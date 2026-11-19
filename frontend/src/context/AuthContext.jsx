import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setTokens, clearTokens, getTokens } from '../api/client';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const saved = localStorage.getItem('lrx_user');
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    clearTokens();
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  // Check profile on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const { access } = getTokens();
      if (access) {
        try {
          const profile = await apiRequest('/auth/profile/');
          setUser(profile);
          localStorage.setItem('lrx_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Auth verification failed', err);
          clearTokens();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const data = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setTokens(data.access, data.refresh);
    setUser(data.user);
    localStorage.setItem('lrx_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const refreshProfile = async () => {
    const profile = await apiRequest('/auth/profile/');
    setUser(profile);
    localStorage.setItem('lrx_user', JSON.stringify(profile));
    return profile;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
