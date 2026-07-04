// src/lib/api/authSession.ts

export const authSession = {
  getAccessToken: () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  getRefreshToken: () => typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,

  setTokens: (access: string, refresh?: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
  },

  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  redirectToLogin: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};
