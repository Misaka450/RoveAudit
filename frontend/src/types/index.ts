// 用户登录信息类型
export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  department: string;
  permissions: string[];
  menus: string[];
}

// 登录响应类型
export interface LoginResponse {
  token: string;
  userInfo: UserInfo;
}

// API 通用响应类型
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 分页查询参数
export interface PageParams {
  page: number;
  pageSize: number;
}

// 分页查询结果
export interface PageResult<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 菜单类型
export interface MenuItem {
  id: number;
  menuName: string;
  parentId: number;
  path: string;
  icon: string;
  sortOrder: number;
  status: number;
  children?: MenuItem[];
}

// 角色类型
export interface Role {
  id: number;
  roleName: string;
  roleCode: string;
  description: string;
  status: number;
  menus: MenuItem[];
  permissions: Permission[];
}

// 权限类型
export interface Permission {
  id: number;
  permissionName: string;
  permissionKey: string;
  description: string;
}

// 清单配置类型
export interface ReportConfig {
  id: number;
  reportName: string;
  reportCode: string;
  category: string;
  description: string;
  sqlContent: string;
  queryParams: string;
  enableDownload: number;
  enableChart: number;
  status: number;
  sortOrder: number;
  updateTime: string;
}

// 用户类型
export interface User {
  id: number;
  username: string;
  realName: string;
  department: string;
  phone: string;
  status: number;
  roles: Role[];
  createTime: string;
}