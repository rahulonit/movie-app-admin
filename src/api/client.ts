/// <reference types="vite/client" />

import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const normalizeBaseUrl = (raw?: string) => {
  if (!raw) return 'https://movie-app-backend-ecru.vercel.app/api';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw.replace(/^\//, '')}`;
};

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE)
});

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;
      const res = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefresh } = res.data.data;
      setAccessToken(accessToken);
      if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
      return accessToken as string;
    } catch (error) {
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  console.log('[API] Request interceptor - Token:', token ? token.slice(0, 20) + '...' : 'NO TOKEN');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] Authorization header set');
  } else {
    console.warn('[API] NO TOKEN FOUND - request will likely fail with 401');
  }
  return config;
}, (error) => Promise.reject(error));

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Log error details including debug field from backend
    console.log('[API] Response error:', {
      status: error.response?.status,
      message: (error.response?.data as any)?.message,
      debug: (error.response?.data as any)?.debug,
      url: error.config?.url
    });
    
    const originalRequest = error.config as RetryConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
