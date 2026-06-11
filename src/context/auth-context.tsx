import React, { createContext, useContext, useEffect, useState } from 'react';

import { API_BASE } from '@/src/constants/api';
import { getStoredToken, removeStoredToken, setStoredToken } from '@/src/utils/auth-storage';

export type AuthRole = 'comprador' | 'vendedor';

export type AuthUser = {
  id: string;
  profileId?: string | null;
  buyerProfileId?: string | null;
  sellerProfileId?: string | null;
  email: string;
  role: AuthRole;
  name: string;
  phone: string;
  matricula?: string | null;
  curso?: string | null;
  universidade?: string | null;
  status: 'pending' | 'active';
  storeOpen?: boolean;
  termsAcceptedAt?: string | null;
};

type RegisterDetails = {
  email: string;
  password: string;
  role: AuthRole;
  name: string;
  phone: string;
  matricula?: string;
  curso?: string;
  universidade?: string;
  termsAccepted: boolean;
};

type ProfileDetails = {
  name: string;
  phone: string;
  matricula?: string;
  curso?: string;
  universidade?: string;
};

type AuthContextData = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: AuthRole) => Promise<void>;
  logout: () => Promise<void>;
  register: (details: RegisterDetails) => Promise<{ verificationCode?: string }>;
  verifyAccount: (details: { email: string; role: AuthRole; code: string }) => Promise<void>;
  updateProfile: (details: ProfileDetails) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

async function readApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível concluir a operação.');
  }

  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();

        if (!storedToken) {
          return;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const data = await readApiResponse<{ user: AuthUser }>(response);

        if (isMounted) {
          setToken(storedToken);
          setUser(data.user);
        }
      } catch {
        await removeStoredToken();
        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(email: string, password: string, role: AuthRole) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await readApiResponse<{ token: string; user: AuthUser }>(response);

    await setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function logout() {
    await removeStoredToken();
    setToken(null);
    setUser(null);
  }

  async function register(details: RegisterDetails) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });

    return readApiResponse<{ verificationCode?: string }>(response);
  }

  async function verifyAccount(details: { email: string; role: AuthRole; code: string }) {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });

    await readApiResponse<{ user: AuthUser }>(response);
  }

  async function updateProfile(details: ProfileDetails) {
    if (!token) {
      throw new Error('Entre na conta para atualizar o perfil.');
    }

    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(details),
    });
    const data = await readApiResponse<{ user: AuthUser }>(response);

    setUser(data.user);
  }

  async function deleteAccount() {
    if (!token) {
      throw new Error('Entre na conta para excluir o perfil.');
    }

    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await readApiResponse<{ message: string }>(response);
    await removeStoredToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, register, verifyAccount, updateProfile, deleteAccount }}>
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
