import axios, { AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { navigate } from './navigationService';

/**
 * Axios 请求封装 - 统一处理错误提示
 * Token 由后端通过 HttpOnly Cookie 自动携带，无需前端添加
 */
const instance = axios.create({
  baseURL: '/api', // 后端 API 基础路径
  timeout: 30000,  // 请求超时时间：30秒
  withCredentials: true, // 允许跨域携带 Cookie
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
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Token 过期，清除本地状态并跳转到登录页
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