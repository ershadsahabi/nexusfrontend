// NexusProject\nexus-frontend\src\lib\api\services\auth.service.ts

import axios from 'axios';
import { TokenResponse, LoginCredentials, UserProfile } from '../types';

const authClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await authClient.post<TokenResponse>('/auth/token/', credentials);
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<TokenResponse> => {
    const response = await authClient.post<TokenResponse>('/auth/token/refresh/', { refresh });
    return response.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await authClient.get<UserProfile>('/users/me/', {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });

    return response.data;
  },
};
