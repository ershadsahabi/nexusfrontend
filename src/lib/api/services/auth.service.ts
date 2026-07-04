// src/lib/api/services/auth.service.ts

import { apiClient } from '../axios';
import { TokenResponse, LoginCredentials, UserProfile } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/token/', credentials);
    return response.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>('/users/me/');
    return response.data;
  },
};
