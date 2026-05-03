import { create } from 'zustand';

export interface AuthUser {
  phone_number: string;
  display_name: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

function getLocalStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage.local;
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  initialize: async () => {
    const storage = getLocalStorage();
    if (!storage) {
      set({ isLoading: false });
      return;
    }
    const result = await storage.get(['auth_token', 'auth_user']) as {
      auth_token?: string;
      auth_user?: AuthUser;
    };
    set({
      token: result.auth_token ?? null,
      user: result.auth_user ?? null,
      isLoading: false,
    });
  },

  login: async (token, user) => {
    const storage = getLocalStorage();
    if (storage) {
      await storage.set({ auth_token: token, auth_user: user });
    }
    set({ token, user });
  },

  logout: async () => {
    const storage = getLocalStorage();
    if (storage) {
      await storage.remove(['auth_token', 'auth_user']);
    }
    set({ token: null, user: null });
  },
}));
