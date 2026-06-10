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

/**
 * 安全读取 localStorage 中的 userInfo
 * 修复：localStorage 中可能存了被手动篡改的脏数据（如非 JSON 字符串、缺字段等）
 *      任何 JSON.parse 异常或字段缺失都会导致整个白屏（最常见：开发期间清缓存后格式变更）
 *      现在统一 try-catch，失败时清掉脏数据返回 null
 */
function safeReadUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 验证必要字段：userId 与 username 必须存在
    if (!parsed || typeof parsed !== 'object' || !parsed.userId || !parsed.username) {
      localStorage.removeItem('userInfo');
      return null;
    }
    return parsed as UserInfo;
  } catch {
    // JSON.parse 失败 → 清掉脏数据
    localStorage.removeItem('userInfo');
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 修复：原来 JSON.parse(localStorage.getItem('userInfo') || 'null')
  // 遇到脏数据会抛错导致整个白屏
  userInfo: safeReadUserInfo(),

  setAuth: (userInfo: UserInfo) => {
    // Token 由后端通过 HttpOnly Cookie 管理，前端不需要存储 Token
    try {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } catch (e) {
      // 隐私模式 / 配额超限
      console.warn('localStorage 写入失败:', e);
    }
    set({ userInfo });
  },

  logout: async () => {
    // 通知后端将 Token 加入黑名单
    try {
      await request.post('/auth/logout');
    } catch (e) {
      // 网络错误时仍然清除本地状态
      console.error('登出请求失败:', e);
    }
    localStorage.removeItem('userInfo');
    set({ userInfo: null });
  },

  isLoggedIn: () => !!get().userInfo,
}));