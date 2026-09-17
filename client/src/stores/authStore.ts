import { create } from 'zustand';
import { User } from '../types';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const res = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (res.success && res.user) {
        set({ user: res.user, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('nexus_token');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      localStorage.removeItem('nexus_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; user: User; token?: string }>('/auth/login', { email, password });
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('nexus_token', res.token);
      }
      set({ user: res.user, isAuthenticated: true });
    }
  },

  register: async (name: string, email: string, password: string) => {
    const res = await api.post<{ success: boolean; user: User; token?: string }>('/auth/register', { name, email, password });
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('nexus_token', res.token);
      }
      set({ user: res.user, isAuthenticated: true });
    }
  },

  googleLogin: async (credential: string) => {
    const res = await api.post<{ success: boolean; user: User; token?: string }>('/auth/google', { credential });
    if (res.success && res.user) {
      if (res.token) {
        localStorage.setItem('nexus_token', res.token);
      }
      set({ user: res.user, isAuthenticated: true });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('nexus_token');
      set({ user: null, isAuthenticated: false });
    }
  }
}));
