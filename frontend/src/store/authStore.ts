import { create } from 'zustand';
import { UserInfo } from '@/types';

/**
 * 认证状态管理 - 存储用户登录信息
 * Token 现在通过 HttpOnly Cookie 传递，前端不存储 Token
 */
interface AuthState {
  userInfo: UserInfo | null;
  /** 设置登录信息 */
  setAuth: (_token: string, userInfo: UserInfo) => void;
  /** 清除登录信息（退出登录） */
  logout: () => void;
  /** 是否已登录 */
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),

  setAuth: (_token: string, userInfo: UserInfo) => {
    // Token 由后端通过 HttpOnly Cookie 设置，前端不再存储 Token
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    set({ userInfo });
  },

  logout: () => {
    localStorage.removeItem('userInfo');
    set({ userInfo: null });
  },

  isLoggedIn: () => !!get().userInfo,
}));