import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = 'http://localhost:3000/api';

export type AuthRole = 'comprador' | 'vendedor';

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
  name: string;
  phone: string;
  matricula?: string;
  curso?: string;
  universidade?: string;
  status: 'pending' | 'active';
};

type AuthContextData = {
  user: AuthUser | null;
  login: (email: string, role: AuthRole) => Promise<void>;
  logout: () => void;
  register: (details: {
    email: string;
    role: AuthRole;
    name: string;
    phone: string;
    matricula?: string;
    curso?: string;
    universidade?: string;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and set user
      // For simplicity, assume token is valid
    }
  }, []);

  async function login(email: string, role: AuthRole) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } else {
      throw new Error(data.error);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  async function register(details: {
    email: string;
    role: AuthRole;
    name: string;
    phone: string;
    matricula?: string;
    curso?: string;
    universidade?: string;
  }) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    const data = await response.json();
    if (response.ok) {
      setUser(data);
    } else {
      throw new Error(data.error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
