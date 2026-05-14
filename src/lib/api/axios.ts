// NexusProject\nexus-frontend\src\lib\api\axios.ts

import axios, {
  AxiosError,
  AxiosRequestHeaders,
  InternalAxiosRequestConfig,
} from 'axios';
import { authService } from './services/auth.service';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const getAccessToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

const getRefreshToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

const setTokens = (access: string, refresh?: string) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem('accessToken', access);
  if (refresh) {
    localStorage.setItem('refreshToken', refresh);
  }
};

const clearTokens = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });

  failedQueue = [];
};

const setAuthHeader = (
  headers: AxiosRequestHeaders | Record<string, string> | undefined,
  token: string
) => {
  if (!headers) {
    return { Authorization: `Bearer ${token}` };
  }

  headers.Authorization = `Bearer ${token}`;
  return headers;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token) {
      config.headers = setAuthHeader(
        config.headers as AxiosRequestHeaders,
        token
      ) as AxiosRequestHeaders;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    // جلوگیری از لوپ روی خود endpoint رفرش
    if (originalRequest.url?.includes('/auth/token/refresh/')) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    // اگر قبلاً retry شده، دوباره تلاش نکن
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    // اگر refresh در حال انجام است، درخواست را در صف نگه دار
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (newAccessToken: string) => {
            originalRequest._retry = true;
            originalRequest.headers = setAuthHeader(
              originalRequest.headers as AxiosRequestHeaders,
              newAccessToken
            ) as AxiosRequestHeaders;

            resolve(apiClient(originalRequest));
          },
          reject: (queueError: unknown) => {
            reject(queueError);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { access, refresh } = await authService.refreshToken(refreshToken);

      setTokens(access, refresh);
      processQueue(null, access);

      originalRequest.headers = setAuthHeader(
        originalRequest.headers as AxiosRequestHeaders,
        access
      ) as AxiosRequestHeaders;

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
