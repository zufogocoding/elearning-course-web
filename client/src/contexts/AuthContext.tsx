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
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((token: string, userData: User) => {
    setToken(token);
    setAccessToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {}
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

  // On mount: try to restore session from refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
          { method: 'POST', credentials: 'include' }
        );

        if (!refreshRes.ok) {
          setIsLoading(false);
          return;
        }

        const { accessToken: token } = await refreshRes.json();
        if (!token) {
          setIsLoading(false);
          return;
        }

        setToken(token);
        setAccessToken(token);

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
