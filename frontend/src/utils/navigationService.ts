/**
 * 导航服务 - 在非 React 组件（如 axios 拦截器）中也能使用路由跳转
 * 组件中通过 useNavigate 设置实际导航函数，默认回退为 window.location.href
 */
type NavigateFn = (path: string) => void;

let navigateFn: NavigateFn | null = null;

/** 设置实际导航函数（在 MainLayout 或 App 中调用） */
export function setNavigate(fn: NavigateFn) {
  navigateFn = fn;
}

/** 标记：是否正在登出/跳转到登录页（防止 401 并发时多次触发跳转和登出请求） */
let redirectingToLogin = false;

/**
 * 跳转到登录页
 * 修复：增加重入保护。如果多个 401 响应并发到达，只触发一次导航和一次 /auth/logout
 * 避免：① 多个 navigate('/login') 重复执行 ② 多次调用 logout 接口
 */
export function navigateToLogin() {
  if (redirectingToLogin) return;
  redirectingToLogin = true;
  // 1 秒后允许再次跳转（页面 reload 后变量自然重置）
  setTimeout(() => { redirectingToLogin = false; }, 1000);
  navigate('/login');
}

/** 执行导航跳转 - 优先使用 React Router，否则回退为整页跳转 */
export function navigate(path: string) {
  if (navigateFn) {
    navigateFn(path);
  } else {
    window.location.href = path;
  }
}