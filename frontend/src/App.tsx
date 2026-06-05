import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '@/store/authStore';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/login';

/**
 * 页面组件懒加载 - 按需加载减少首屏 JS 体积
 */
const HomePage = lazy(() => import('@/pages/home'));
const ReportCenter = lazy(() => import('@/pages/report'));
const ReportListPage = lazy(() => import('@/pages/report/ReportListPage'));
const AnalysisPage = lazy(() => import('@/pages/analysis'));
const WarningPage = lazy(() => import('@/pages/warning'));
const UserPage = lazy(() => import('@/pages/system/users'));
const RolePage = lazy(() => import('@/pages/system/roles'));
const MenuPage = lazy(() => import('@/pages/system/menus'));
const ReportConfigPage = lazy(() => import('@/pages/system/reports'));
const WarningRulesPage = lazy(() => import('@/pages/system/warning-rules'));
const DownloadLogPage = lazy(() => import('@/pages/system/download-logs'));

/** 页面加载中的 fallback 组件 */
function PageLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <Spin tip="加载中..." />
    </div>
  );
}

/** 带 Suspense 包裹的懒加载路由 */
function LazyPage({ Component }: { Component: React.LazyExoticComponent<any> }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Component />
    </Suspense>
  );
}

/**
 * 路由守卫组件 - 未登录自动跳转到登录页
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/**
 * 应用根组件 - 路由配置
 */
export default function App() {
  return (
    <Routes>
      {/* 登录页（不需要登录） */}
      <Route path="/login" element={<LoginPage />} />

      {/* 需要登录的页面（包裹在 MainLayout 中） */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* 默认重定向到首页 */}
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<LazyPage Component={HomePage} />} />
        <Route path="report-center" element={<LazyPage Component={ReportCenter} />} />
        <Route path="report-list/:reportCode" element={<LazyPage Component={ReportListPage} />} />
        <Route path="analysis" element={<LazyPage Component={AnalysisPage} />} />
        <Route path="warning-center" element={<LazyPage Component={WarningPage} />} />
        <Route path="system/users" element={<LazyPage Component={UserPage} />} />
        <Route path="system/roles" element={<LazyPage Component={RolePage} />} />
        <Route path="system/menus" element={<LazyPage Component={MenuPage} />} />
        <Route path="system/reports" element={<LazyPage Component={ReportConfigPage} />} />
        <Route path="system/warning-rules" element={<LazyPage Component={WarningRulesPage} />} />
        <Route path="system/download-logs" element={<LazyPage Component={DownloadLogPage} />} />
      </Route>

      {/* 404 - 未匹配的路由 */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}