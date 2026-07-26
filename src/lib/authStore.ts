/**
 * authStore.ts — framework-agnostic auth session store
 *
 * Plain module (not a React context) so it can be read synchronously from
 * api.ts / progress.ts without those files depending on React. AuthContext
 * subscribes to this store to drive React state.
 */

import type { User } from "@/types";

const AUTH_STORAGE_KEY = "auth";

export interface AuthState {
  user: User | null;
  token: string | null;
}

function readInitialState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuthState>;
      if (parsed.token && parsed.user) {
        return { user: parsed.user, token: parsed.token };
      }
    }
  } catch {}
  return { user: null, token: null };
}

let state: AuthState = readInitialState();
type Listener = (state: AuthState) => void;
const listeners = new Set<Listener>();

function persist() {
  try {
    if (state.token && state.user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {}
}

function notify() {
  for (const listener of listeners) listener(state);
}

export const authStore = {
  getState(): AuthState {
    return state;
  },

  setSession(user: User, token: string) {
    state = { user, token };
    persist();
    notify();
  },

  clearSession() {
    if (!state.user && !state.token) return;
    state = { user: null, token: null };
    persist();
    notify();
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
