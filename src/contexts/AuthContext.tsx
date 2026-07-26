import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/types";
import { authStore } from "@/lib/authStore";
import { ApiError, fetchMe, loginUser, registerUser } from "@/lib/api";
import { loadFromServer } from "@/lib/progress";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** True once the initial session check (GET /api/auth/me) has resolved. */
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(authStore.getState());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => authStore.subscribe(setState), []);

  // Validate any persisted token once on mount; drop the session if it's stale.
  useEffect(() => {
    const { token } = authStore.getState();
    if (!token) {
      setIsReady(true);
      return;
    }
    fetchMe(token)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) authStore.clearSession();
      })
      .finally(() => setIsReady(true));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginUser(email, password);
    authStore.setSession(res.user, res.token);
    await loadFromServer();
  }, []);

  const register = useCallback(async (email: string, password: string, inviteCode: string) => {
    const res = await registerUser(email, password, inviteCode);
    authStore.setSession(res.user, res.token);
    await loadFromServer();
  }, []);

  const logout = useCallback(() => {
    authStore.clearSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: state.user, token: state.token, isReady, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
