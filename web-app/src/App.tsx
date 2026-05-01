import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import TabBar from '@components/layout/TabBar';
import HomePage from '@pages/HomePage';
import BillsPage from '@pages/BillsPage';
import RecordPage from '@pages/RecordPage';
import StatsPage from '@pages/StatsPage';
import AccountsPage from '@pages/AccountsPage';
import MyPage from '@pages/MyPage';
import BudgetPage from '@pages/BudgetPage';
import CategoriesPage from '@pages/CategoriesPage';
import SettingsPage from '@pages/SettingsPage';
import LoginPage from '@pages/LoginPage';
import { checkAndSeed, repairSeedDebtAccounts } from '@/utils/seed';
import { runMigrations } from '@/utils/migrate';
import { useAccountStore, useAuthStore } from '@/stores';
import './App.css';

/** 需要登录才能访问的路由 */
const PROTECTED_PATHS = new Set([
  '/', '/bills', '/record', '/stats', '/my',
  '/accounts', '/settings', '/budget', '/categories',
]);

/** 登录路由 */
const LOGIN_PATH = '/login';

/** 路由守卫：未登录时重定向到登录页 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    // 记录来源路径，登录后跳回
    return <Navigate to={LOGIN_PATH} state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const showTabBar = PROTECTED_PATHS.has(location.pathname);

  return (
    <div className="app-container">
      <div className="app-content">
        <Routes>
          {/* 登录页（无需登录） */}
          <Route path={LOGIN_PATH} element={<LoginPage />} />

          {/* 受保护的主Tab页面 */}
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/bills" element={<RequireAuth><BillsPage /></RequireAuth>} />
          <Route path="/record" element={<RequireAuth><RecordPage /></RequireAuth>} />
          <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
          <Route path="/my" element={<RequireAuth><MyPage /></RequireAuth>} />
          <Route path="/accounts" element={<RequireAuth><AccountsPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/budget" element={<RequireAuth><BudgetPage /></RequireAuth>} />
          <Route path="/categories" element={<RequireAuth><CategoriesPage /></RequireAuth>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {/* TabBar 仅在主页面显示 */}
      {showTabBar && <TabBar />}
    </div>
  );
};

const App: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      runMigrations();
      await checkAndSeed();
      await repairSeedDebtAccounts();
      useAccountStore.getState().repairLegacyAccounts();
      setReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export default App;
