import request from '@/utils/request';
import type { LoginResponse, PageResult, ReportConfig } from '@/types';

/**
 * 认证相关 API
 */
export const authApi = {
  /** 登录 */
  login: (username: string, password: string) =>
    request.post<LoginResponse>('/auth/login', { username, password }),
};

/**
 * 用户管理 API
 */
export const userApi = {
  /** 获取用户列表 */
  list: (keyword?: string): Promise<any[]> =>
    request.get('/users', { params: { keyword } }),
  /** 创建用户 */
  create: (data: any) => request.post('/users', data),
  /** 更新用户 */
  update: (id: number, data: any) => request.put(`/users/${id}`, data),
  /** 重置密码 */
  resetPassword: (id: number, password: string) =>
    request.put(`/users/${id}/reset-password`, { password }),
  /** 删除用户 */
  remove: (id: number) => request.delete(`/users/${id}`),
};

/**
 * 角色管理 API
 */
export const roleApi = {
  /** 获取角色列表 */
  list: (): Promise<any[]> => request.get('/roles'),
  /** 创建角色 */
  create: (data: any) => request.post('/roles', data),
  /** 更新角色 */
  update: (id: number, data: any) => request.put(`/roles/${id}`, data),
  /** 删除角色 */
  remove: (id: number) => request.delete(`/roles/${id}`),
};

/**
 * 菜单管理 API
 */
export const menuApi = {
  /** 获取菜单树 */
  tree: (): Promise<any[]> => request.get('/menus/tree'),
  /** 获取菜单列表 */
  list: (): Promise<any[]> => request.get('/menus'),
  /** 创建菜单 */
  create: (data: any) => request.post('/menus', data),
  /** 更新菜单 */
  update: (id: number, data: any) => request.put(`/menus/${id}`, data),
  /** 删除菜单 */
  remove: (id: number) => request.delete(`/menus/${id}`),
};

/**
 * 清单配置 API
 */
export const reportApi = {
  /** 获取清单分类 */
  categories: (): Promise<string[]> => request.get('/reports/categories'),
  /** 获取启用的清单列表 */
  list: (category?: string): Promise<ReportConfig[]> =>
    request.get('/reports/list', { params: { category } }),
  /** 获取所有清单（管理页面） */
  listAdmin: (keyword?: string): Promise<ReportConfig[]> =>
    request.get('/reports', { params: { keyword } }),
  /** 获取清单详情 */
  detail: (id: number) => request.get(`/reports/${id}`),
  /** 创建清单 */
  create: (data: any) => request.post('/reports', data),
  /** 更新清单 */
  update: (id: number, data: any) => request.put(`/reports/${id}`, data),
  /** 删除清单 */
  remove: (id: number) => request.delete(`/reports/${id}`),
};

/**
 * 数据查询 API
 */
export const dataQueryApi = {
  /** 根据清单编码查询数据 */
  query: (reportCode: string, params: any = {}): Promise<PageResult> =>
    request.get(`/data-query/report/${reportCode}`, { params }),
  /** 执行自定义 SQL */
  execute: (sql: string): Promise<any[]> =>
    request.post('/data-query/execute', { sql }),
};

/**
 * 异常规则 API
 */
export const warningApi = {
  /** 获取异常规则列表 */
  listRules: (): Promise<any[]> => request.get('/warnings/rules'),
  /** 获取异常检测结果汇总 */
  getResults: (): Promise<any[]> => request.get('/warnings/results'),
  /** 创建规则 */
  createRule: (data: any) => request.post('/warnings/rules', data),
  /** 更新规则 */
  updateRule: (id: number, data: any) => request.put(`/warnings/rules/${id}`, data),
  /** 删除规则 */
  removeRule: (id: number) => request.delete(`/warnings/rules/${id}`),
  /** 执行单条规则 */
  executeRule: (id: number) => request.post(`/warnings/rules/${id}/execute`),
  /** 执行所有规则 */
  executeAll: () => request.post('/warnings/execute-all'),
};

/**
 * 下载 API
 */
export const downloadApi = {
  /** 下载 Excel */
  excel: (reportCode: string, params: any = {}) => {
    const token = localStorage.getItem('token');
    // 过滤掉空值，避免 URL 中出现 "undefined" 或 "null"
    const cleanParams: Record<string, string> = { reportCode };
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value);
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    window.open(`/api/download/excel?${query}&token=${token}`, '_blank');
  },
  /** 下载 CSV */
  csv: (reportCode: string, params: any = {}) => {
    const token = localStorage.getItem('token');
    const cleanParams: Record<string, string> = { reportCode };
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value);
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    window.open(`/api/download/csv?${query}&token=${token}`, '_blank');
  },
};