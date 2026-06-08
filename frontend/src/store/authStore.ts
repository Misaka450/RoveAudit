import { create } from 'zustand';
import { UserInfo } from '@/types';
import request from '@/utils/request';

/**
 * 认证状态管理 - 存储用户登录信息
 * Token 现在通过 HttpOnly Cookie 传递，前端不存储 Token
 */
interface AuthState {
  userInfo: UserInfo | null;
  /** 设置登录信息（Token 由后端 HttpOnly Cookie 管理，前端不存储 Token） */
  setAuth: (userInfo: UserInfo) => void;
  /** 清除登录信息（退出登录） */
  logout: () => void;
  /** 是否已登录 */
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),

  setAuth: (userInfo: UserInfo) => {
    // Token 由后端通过 HttpOnly Cookie 管理，前端不需要存储 Token
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    set({ userInfo });
  },

  logout: async () => {
    // 通知后端将 Token 加入黑名单
    try {
      await request.post('/auth/logout');
    } catch {
      // 网络错误时仍然清除本地状态
    }
    localStorage.removeItem('userInfo');
    set({ userInfo: null });
  },

  isLoggedIn: () => !!get().userInfo,
}));