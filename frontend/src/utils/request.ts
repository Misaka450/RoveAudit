import axios, { AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { navigate } from './navigationService';

/**
 * Axios 请求封装 - 统一处理错误提示、自动重试、Token 失效处理
 * Token 由后端通过 HttpOnly Cookie 自动携带，无需前端添加
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

/**
 * 注册 axios-retry 自动重试（网络错误 + 特定状态码）
 */
instance.interceptors.response.use(undefined, async (error) => {
  const config = error.config as any;
  if (!config || !config.method) return Promise.reject(error);

  // 仅对幂等请求重试（GET、DELETE、PUT）
  const method = config.method.toUpperCase();
  if (!['GET', 'DELETE', 'PUT'].includes(method)) {
    return Promise.reject(error);
  }

  // 检查重试次数
  config.__retryCount = config.__retryCount || 0;
  if (config.__retryCount >= MAX_RETRIES) {
    return Promise.reject(error);
  }

  // 只重试网络错误或特定状态码
  const shouldRetry = !error.response || RETRY_STATUS_CODES.has(error.response.status);
  if (!shouldRetry) {
    return Promise.reject(error);
  }

  config.__retryCount += 1;

  // 延迟重试（指数退避）
  const delay = Math.pow(2, config.__retryCount) * 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return instance(config);
});

// 请求拦截器：无需手动添加 Token，Cookie 自动携带
instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// 响应拦截器：统一处理错误，并提取 res.data 返回
instance.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 如果返回的 code 不是 200，说明业务逻辑有误
    if (res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message));
    }
    return res.data; // 只返回 data 部分，方便调用方使用
  },
  async (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Token 失效 → 通知后端加入黑名单并清除本地状态
        try {
          await instance.post('/auth/logout');
        } catch {
          // 后端也返回 401 则忽略
        }
        localStorage.removeItem('userInfo');
        navigate('/login');
        message.error('登录已过期，请重新登录');
      } else if (status === 403) {
        message.error('没有操作权限');
      } else {
        message.error(error.response.data?.message || '服务器错误');
      }
    } else {
      message.error('网络连接失败，请检查网络');
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
