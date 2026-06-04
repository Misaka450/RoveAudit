import { create } from 'zustand';
import { UserInfo } from '@/types';

/**
 * 认证状态管理 - 存储用户登录信息和 Token
 */
interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  /** 设置登录信息 */
  setAuth: (token: string, userInfo: UserInfo) => void;
  /** 清除登录信息（退出登录） */
  logout: () => void;
  /** 是否已登录 */
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),

  setAuth: (token: string, userInfo: UserInfo) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    set({ token, userInfo });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    set({ token: null, userInfo: null });
  },

  isLoggedIn: () => !!get().token,
}));