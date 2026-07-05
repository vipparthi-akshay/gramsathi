import api from './api';
import { User } from '@/store/authStore';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authApi = {
  sendOTP: async (mobile: string): Promise<{ sessionId: string }> => {
    const { data } = await api.post('/auth/otp/send', { mobile });
    return data;
  },

  verifyOTP: async (mobile: string, otp: string, sessionId?: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/otp/verify', { mobile, otp, sessionId });
    if (data.refreshToken) {
      localStorage.setItem('gramsathi-refresh-token', data.refreshToken);
    }
    return data;
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const refreshToken = localStorage.getItem('gramsathi-refresh-token');
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('gramsathi-refresh-token');
    }
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get('/auth/profile');
    return data;
  },

  updateProfile: async (profile: Partial<User>): Promise<User> => {
    const { data } = await api.put('/auth/profile', profile);
    return data;
  },
};
