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

/** 执行导航跳转 - 优先使用 React Router，否则回退为整页跳转 */
export function navigate(path: string) {
  if (navigateFn) {
    navigateFn(path);
  } else {
    window.location.href = path;
  }
}