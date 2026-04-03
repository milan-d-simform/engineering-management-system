import { defineStore } from 'pinia';
import type { User, AuthTokens, LoginPayload } from '~/types';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    isSuperAdmin: (state) => state.user?.role === 'SUPERADMIN',
    isAdmin: (state) => state.user?.role === 'ADMIN' || state.user?.role === 'SUPERADMIN',
    isMember: (state) => state.user?.role === 'MEMBER',
    currentUser: (state) => state.user,
  },

  actions: {
    async login(payload: LoginPayload) {
      this.isLoading = true;
      this.error = null;
      try {
        const config = useRuntimeConfig();
        const response = await fetch(`${config.public.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(
            Array.isArray(json.message) ? json.message.join(', ') : json.message || 'Login failed',
          );
        }
        const data: AuthTokens = json.data;
        this.setAuth(data);
        return data;
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Login failed';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async refreshTokens(): Promise<boolean> {
      if (!this.refreshToken) return false;
      try {
        const config = useRuntimeConfig();
        const response = await fetch(`${config.public.apiBaseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
        if (!response.ok) {
          this.logout();
          return false;
        }
        const json = await response.json();
        this.accessToken = json.data.accessToken;
        this.refreshToken = json.data.refreshToken;
        this.persistTokens();
        return true;
      } catch {
        this.logout();
        return false;
      }
    },

    async logoutFromServer() {
      try {
        const config = useRuntimeConfig();
        if (this.accessToken) {
          await fetch(`${config.public.apiBaseUrl}/auth/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.accessToken}` },
          });
        }
      } finally {
        this.logout();
      }
    },

    setAuth(data: AuthTokens) {
      this.user = data.user;
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.persistTokens();
    },

    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      if (import.meta.client) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    },

    persistTokens() {
      if (import.meta.client) {
        if (this.accessToken) localStorage.setItem('access_token', this.accessToken);
        if (this.refreshToken) localStorage.setItem('refresh_token', this.refreshToken);
        if (this.user) localStorage.setItem('user', JSON.stringify(this.user));
      }
    },

    hydrateFromStorage() {
      if (import.meta.client) {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userRaw = localStorage.getItem('user');
        if (accessToken && refreshToken && userRaw) {
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          try {
            this.user = JSON.parse(userRaw);
          } catch {
            this.logout();
          }
        }
      }
    },

    updateCurrentUser(user: User) {
      this.user = user;
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
  },
});
