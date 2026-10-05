import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let accessToken = '';
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const skipRefresh = ['/auth/login', '/auth/login-passcode', '/auth/refresh', '/auth/logout', '/auth/options'].some((path) =>
      original.url?.includes(path),
    );
    if (error.response?.status === 401 && !original._retry && !skipRefresh) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    const message = error.response?.data?.message ?? 'Something went wrong. Please try again.';
    if (!original?.skipToast) toast.error(message);
    return Promise.reject(error);
  },
);

export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', {}, { skipToast: true } as never)
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data.accessToken as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipToast?: boolean;
  }
}
