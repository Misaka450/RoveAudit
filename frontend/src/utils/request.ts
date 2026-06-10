import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { navigateToLogin } from './navigationService';

/**
 * Axios 请求封装 - 统一处理错误提示、自动重试、Token 失效处理
 * Token 由后端通过 HttpOnly Cookie 自动携带，无需前端添加
 *
 * 修复说明：
 * 1. 原本注册了两个 response 拦截器（一个重试 + 一个业务处理），
 *    axios 会按"后注册先执行"反向处理，容易导致重试响应再次走业务处理时丢失 context。
 *    现在重试逻辑合并到唯一响应拦截器中，行为可控。
 * 2. 重试次数标记在 axios 自定义属性 axios-retry-count 上，避开与 axios 内部属性冲突
 */
const instance = axios.create({
  baseURL: '/api', // 后端 API 基础路径
  timeout: 30000,  // 请求超时时间：30秒
  withCredentials: true, // 允许跨域携带 Cookie
});

/** 最大重试次数 */
const MAX_RETRIES = 2;
/** 需要重试的状态码 */
const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

// 自定义重试计数属性
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    __retryCount?: number;
  }
}

// 请求拦截器：无需手动添加 Token，Cookie 自动携带
instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

/**
 * 唯一响应拦截器：处理业务错误 + 自动重试
 * 之前两个拦截器分开注册会让 axios 处理顺序难以预测
 */
instance.interceptors.response.use(
  // 成功响应：拆出 res.data 并校验业务码
  (response) => {
    const res = response.data;
    if (res && res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return res?.data;
  },
  // 失败响应：自动重试 + 业务码处理
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    // ===== 自动重试 =====
    if (config && config.method) {
      const method = config.method.toUpperCase();
      const isIdempotent = ['GET', 'DELETE', 'PUT'].includes(method);
      config.__retryCount = config.__retryCount || 0;
      const shouldRetry = isIdempotent
        && config.__retryCount < MAX_RETRIES
        && (!status || RETRY_STATUS_CODES.has(status));

      if (shouldRetry) {
        config.__retryCount += 1;
        // 指数退避：1s、2s
        const delay = Math.pow(2, config.__retryCount) * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return instance(config);
      }
    }

    // ===== 业务错误处理 =====
    if (status === 401) {
      // Token 失效 → 通知后端加入黑名单并清除本地状态
      // 修复：用 navigateToLogin 替代 navigate，内部有重入保护
      try {
        await instance.post('/auth/logout');
      } catch (e) {
        // 后端也返回 401 则忽略
        console.error('自动登出失败:', e);
      }
      localStorage.removeItem('userInfo');
      navigateToLogin();
      message.error('登录已过期，请重新登录');
    } else if (status === 403) {
      message.error('没有操作权限');
    } else {
      message.error(error.response?.data?.message || '服务器错误');
    }
    return Promise.reject(error);
  },
);

// 包装请求方法，返回正确的类型
const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.get(url, config) as any,
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    instance.post(url, data, config) as any,
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    instance.put(url, data, config) as any,
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.delete(url, config) as any,
};

export default request;
