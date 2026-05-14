// src/lib/api/types/auth.ts

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserProfile {
  uuid: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active: boolean;
}
