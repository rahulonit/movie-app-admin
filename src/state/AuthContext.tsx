import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../api/client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (_) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('[Auth] Attempting login with email:', email);
      const res = await api.post('/auth/login', { email, password });
      console.log('[Auth] Login response:', res.data);
      const { accessToken, refreshToken, user: u } = res.data.data;
      setAccessToken(accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      const newUser = { id: u.id, email: u.email, role: u.role };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error: any) {
      console.error('[Auth] Login failed:', error.response?.data || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
