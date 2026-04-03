import type { ApiResponse } from '~/types';

export const useApi = () => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  const request = async <T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string | number | boolean | undefined> } = {},
  ): Promise<T> => {
    const { params, ...fetchOptions } = options;

    let url = `${config.public.apiBaseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    const token = authStore.accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...fetchOptions, headers });

    if (response.status === 401 && authStore.refreshToken) {
      // Attempt token refresh
      const refreshed = await authStore.refreshTokens();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${authStore.accessToken}`;
        const retryResponse = await fetch(url, { ...fetchOptions, headers });
        if (!retryResponse.ok) {
          const err = await retryResponse.json().catch(() => ({}));
          throw new Error(err.message || 'Request failed');
        }
        const retryData: ApiResponse<T> = await retryResponse.json();
        return retryData.data;
      } else {
        authStore.logout();
        navigateTo('/login');
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      throw new Error(message || `HTTP ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    return data.data;
  };

  const get = <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { method: 'GET', params });

  const post = <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });

  const patch = <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

  const del = <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' });

  return { get, post, patch, del };
};
