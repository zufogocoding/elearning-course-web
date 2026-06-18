'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setAccessToken, api } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((token: string, userData: User, refreshToken?: string) => {
    setToken(token);
    setAccessToken(token);
    setUser(userData);
    if (refreshToken && typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const localRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      await api.post('/api/auth/logout', { refreshToken: localRefreshToken });
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refreshToken');
    }
    setToken(null);
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.get('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {}
  }, [accessToken]);

  // On mount: try to restore session from refresh token cookie or localStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const localRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          { 
            method: 'POST', 
            headers: localRefreshToken ? { 'Content-Type': 'application/json' } : undefined,
            body: localRefreshToken ? JSON.stringify({ refreshToken: localRefreshToken }) : undefined,
            credentials: 'include' 
          }
        );

        if (!refreshRes.ok) {
          setIsLoading(false);
          return;
        }

        const { accessToken: token, refreshToken: newRefreshToken } = await refreshRes.json();
        if (!token) {
          setIsLoading(false);
          return;
        }

        setToken(token);
        setAccessToken(token);
        if (newRefreshToken && typeof window !== 'undefined') {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Fetch user profile
        const userRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          }
        );

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }
      } catch {
        // Session restore failed, user stays logged out
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
