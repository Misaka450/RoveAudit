import request from '@/utils/request';
import { message } from 'antd';
import type { LoginResponse, PageResult, ReportConfig, User, Role, MenuItem, ReportColumnConfig, ReportChartConfig } from '@/types';

/**
 * 认证相关 API
 */
export const authApi = {
  /** 登录（支持验证码参数） */
  login: (params: { username: string; password: string; captchaId?: string; captcha?: string }) =>
    request.post<LoginResponse>('/auth/login', params),
};

/**
 * 用户管理 API
 */
export const userApi = {
  /** 获取用户列表（支持分页） */
  list: (keyword?: string, page?: number, pageSize?: number): Promise<PageResult<User>> =>
    request.get('/users', { params: { keyword, page, pageSize } }),
  /** 创建用户 */
  create: (data: Partial<User>) => request.post('/users', data),
  /** 更新用户 */
  update: (id: number, data: Partial<User>) => request.put(`/users/${id}`, data),
  /** 重置密码 */
  resetPassword: (id: number, password: string) =>
    request.put(`/users/${id}/reset-password`, { password }),
  /** 删除用户 */
  remove: (id: number) => request.delete(`/users/${id}`),
  /** 批量导入 */
  batchImport: (data: Partial<User>[]) => request.post('/users/batch-import', data),
  /** 获取导入模板 */
  template: (): Promise<Partial<User>[]> => request.get('/users/template'),
};

/**
 * 角色管理 API
 */
export const roleApi = {
  /** 获取角色列表 */
  list: (): Promise<Role[]> => request.get('/roles'),
  /** 创建角色 */
  create: (data: Partial<Role>) => request.post('/roles', data),
  /** 更新角色 */
  update: (id: number, data: Partial<Role>) => request.put(`/roles/${id}`, data),
  /** 删除角色 */
  remove: (id: number) => request.delete(`/roles/${id}`),
};

/**
 * 菜单管理 API
 */
export const menuApi = {
  /** 获取菜单树 */
  tree: (): Promise<MenuItem[]> => request.get('/menus/tree'),
  /** 获取菜单列表 */
  list: (): Promise<MenuItem[]> => request.get('/menus'),
  /** 创建菜单 */
  create: (data: Partial<MenuItem>) => request.post('/menus', data),
  /** 更新菜单 */
  update: (id: number, data: Partial<MenuItem>) => request.put(`/menus/${id}`, data),
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
  detail: (id: number): Promise<ReportConfig> => request.get(`/reports/${id}`),
  /** 创建清单 */
  create: (data: Partial<ReportConfig>) => request.post('/reports', data),
  /** 更新清单 */
  update: (id: number, data: Partial<ReportConfig>) => request.put(`/reports/${id}`, data),
  /** 删除清单 */
  remove: (id: number) => request.delete(`/reports/${id}`),
};

/**
 * 清单字段配置 API
 */
export const reportColumnApi = {
  /** 获取字段配置 */
  get: (reportCode: string): Promise<ReportColumnConfig[]> =>
    request.get(`/report-columns/${reportCode}`),
  /** 批量保存字段配置 */
  save: (reportCode: string, columns: ReportColumnConfig[]) =>
    request.put(`/report-columns/${reportCode}`, columns),
};

/**
 * 清单图表配置 API
 */
export const reportChartApi = {
  /** 获取所有图表配置 */
  listAll: (): Promise<ReportChartConfig[]> => request.get('/report-charts'),
  /** 获取清单的图表配置 */
  list: (reportCode: string): Promise<ReportChartConfig[]> =>
    request.get(`/report-charts/${reportCode}`),
  /** 创建图表配置 */
  create: (data: Partial<ReportChartConfig>) => request.post('/report-charts', data),
  /** 更新图表配置 */
  update: (id: number, data: Partial<ReportChartConfig>) => request.put(`/report-charts/${id}`, data),
  /** 删除图表配置 */
  remove: (id: number) => request.delete(`/report-charts/${id}`),
};

/**
 * 数据查询 API
 */
export const dataQueryApi = {
  /** 根据清单编码查询数据 */
  query: (reportCode: string, params: any = {}): Promise<PageResult> =>
    request.get(`/data-query/report/${reportCode}`, { params }),
  /** 查询预览数据（仅前5行） */
  preview: (reportCode: string, params: any = {}): Promise<any[]> =>
    request.get(`/data-query/report/${reportCode}`, { params: { ...params, pageSize: 5 } }),
};

/**
 * 异常规则 API
 */
export const warningApi = {
  /** 获取异常规则列表 */
  listRules: (): Promise<any[]> => request.get('/warnings/rules'),
  /** 获取异常检测结果汇总 */
  getResults: (): Promise<any[]> => request.get('/warnings/results'),
  /** 获取异常趋势数据 */
  getTrend: (days?: number): Promise<{ dates: string[]; high: number[]; medium: number[]; low: number[] }> =>
    request.get('/warnings/trend', { params: { days } }),
  /** 获取异常类型占比 */
  getDistribution: (): Promise<{ name: string; value: number }[]> => request.get('/warnings/distribution'),
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
 * 通用下载函数 - 支持 Excel / CSV
 * Token 由 HttpOnly Cookie 自动携带，无需手动设置请求头
 */
const downloadFile = async (
  type: 'excel' | 'csv',
  reportCode: string,
  params: any = {},
) => {
  const cleanParams: Record<string, string> = { reportCode };
  const filters: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'startDate' || key === 'endDate') {
        cleanParams[key] = String(value);
      } else {
        filters[key] = String(value);
      }
    }
  });
  if (Object.keys(filters).length > 0) {
    cleanParams.filters = JSON.stringify(filters);
  }
  const query = new URLSearchParams(cleanParams).toString();
  const resp = await fetch(`/api/download/${type}?${query}`, {
    credentials: 'include', // 携带 Cookie
  });
  if (!resp.ok) {
    message.error('下载失败');
    return;
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = resp.headers.get('content-disposition') || '';
  const match = disposition.match(/filename=(.+)/);
  a.download = match?.[1] ? decodeURIComponent(match[1]) : `${reportCode}.${type === 'excel' ? 'xlsx' : 'csv'}`;
  a.click();
  URL.revokeObjectURL(url);
  message.success('下载完成');
};

/**
 * 下载 API
 */
export const downloadApi = {
  /** 下载 Excel */
  excel: (reportCode: string, params?: any) => downloadFile('excel', reportCode, params),
  /** 下载 CSV */
  csv: (reportCode: string, params?: any) => downloadFile('csv', reportCode, params),
};

/**
 * 下载日志 API
 */
export const downloadLogApi = {
  /** 获取下载日志列表 */
  list: (page?: number, pageSize?: number): Promise<any> =>
    request.get('/download/logs', { params: { page, pageSize } }),
  /** 删除下载日志 */
  remove: (id: number) => request.delete(`/download/logs/${id}`),
  /** 获取下载统计（后端计算，高效准确） */
  stats: (): Promise<{ todayCount: number; monthCount: number }> =>
    request.get('/download/stats'),
};

/**
 * 审计日志 API
 */
export const auditLogApi = {
  /** 查询审计日志列表 */
  list: (keyword?: string, page?: number, pageSize?: number): Promise<{ list: any[]; total: number }> =>
    request.get('/audit-log', { params: { keyword, page, pageSize } }),
  /** 删除审计日志 */
  remove: (id: number) => request.delete(`/audit-log/${id}`),
  /** 清理指定天数前的日志 */
  clean: (days: number) => request.delete('/audit-log', { params: { days } }),
};
