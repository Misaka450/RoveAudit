import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/login';
import HomePage from '@/pages/home';
import ReportCenter from '@/pages/report';
import AnalysisPage from '@/pages/analysis';
import WarningPage from '@/pages/warning';
import UserPage from '@/pages/system/users';
import RolePage from '@/pages/system/roles';
import ReportConfigPage from '@/pages/system/reports';
import WarningRulesPage from '@/pages/system/warning-rules';
import ReportListPage from '@/pages/report/ReportListPage';
import MenuPage from '@/pages/system/menus';
import DownloadLogPage from '@/pages/system/download-logs';

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
        <Route path="home" element={<HomePage />} />
        <Route path="report-center" element={<ReportCenter />} />
        <Route path="report-list/:reportCode" element={<ReportListPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="warning-center" element={<WarningPage />} />
        <Route path="system/users" element={<UserPage />} />
        <Route path="system/roles" element={<RolePage />} />
        <Route path="system/menus" element={<MenuPage />} />
        <Route path="system/reports" element={<ReportConfigPage />} />
        <Route path="system/warning-rules" element={<WarningRulesPage />} />
        <Route path="system/download-logs" element={<DownloadLogPage />} />
      </Route>

      {/* 404 - 未匹配的路由 */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}