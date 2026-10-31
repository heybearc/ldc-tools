import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from './api';
import { defaultApiBase, normalizeApiBase } from './config';

const TOKEN_KEY = 'ldc.token';
const USER_KEY = 'ldc.user';
const API_BASE_KEY = 'ldc.apiBase';

export type MobileUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: MobileUser | null;
  apiBase: string;
  setApiBase: (value: string) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [apiBase, setApiBaseState] = useState(defaultApiBase());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedToken, storedUser, storedBase] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(API_BASE_KEY),
      ]);
      if (cancelled) return;
      if (storedBase) setApiBaseState(normalizeApiBase(storedBase));
      if (storedToken) setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as MobileUser);
        } catch {
          setUser(null);
        }
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setApiBase(value: string) {
    const next = normalizeApiBase(value);
    setApiBaseState(next);
    await SecureStore.setItemAsync(API_BASE_KEY, next);
  }

  async function signIn(email: string, password: string) {
    const result = await apiRequest<{ token: string; user: MobileUser }>(apiBase, '/api/v1/auth/mobile', {
      method: 'POST',
      body: { email, password },
    });
    setToken(result.token);
    setUser(result.user);
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));
  }

  async function signOut() {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  return (
    <AuthContext.Provider value={{ ready, token, user, apiBase, setApiBase, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
