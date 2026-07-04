// src/lib/api/axios.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authSession } from './authSession';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// instance اصلی برای تمام درخواست‌های پروژه
export const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// instance جدا برای رفرش جهت جلوگیری از Circular Dependency و Loop
const refreshClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

apiClient.interceptors.request.use((config) => {
  const token = authSession.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;
    if (error.response?.status !== 401 || originalRequest._retry) return Promise.reject(error);

    const refreshToken = authSession.getRefreshToken();
    if (!refreshToken) {
      authSession.clearTokens();
      authSession.redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshClient.post('/auth/token/refresh/', { refresh: refreshToken });
      authSession.setTokens(data.access, data.refresh);
      isRefreshing = false;
      failedQueue.forEach(q => q.resolve(data.access));
      failedQueue = [];
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(originalRequest);
    } catch (err) {
      failedQueue.forEach(q => q.reject(err));
      failedQueue = [];
      authSession.clearTokens();
      authSession.redirectToLogin();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
