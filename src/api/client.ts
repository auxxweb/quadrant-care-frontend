import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config';

export const api = axios.create({
  baseURL: API_BASE_URL,
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
    let message = 'Something went wrong. Please try again.';
    const data = error.response?.data;
    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text()) as { message?: string };
        message = parsed.message ?? message;
      } catch {
        message = error.response?.status === 401 ? 'Please sign in again.' : message;
      }
    } else if (data && typeof data === 'object' && 'message' in data) {
      message = String((data as { message?: string }).message ?? message);
    }
    if (!original?.skipToast) toast.error(message);
    return Promise.reject(Object.assign(error, { message }));
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
