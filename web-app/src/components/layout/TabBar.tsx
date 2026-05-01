/**
 * 底部TabBar导航（5Tab）
 */

import { useLocation, useNavigate } from 'react-router-dom';
import './TabBar.css';

const TABS = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/bills', label: '账单', icon: '📋' },
  { path: '/record', label: '记账', icon: '➕', isCenter: true },
  { path: '/stats', label: '统计', icon: '📊' },
  { path: '/my', label: '我的', icon: '👤' },
];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="tab-bar">
      {TABS.map((tab) => (
        <div
          key={tab.path}
          className={`tab-item ${tab.isCenter ? 'tab-center' : ''} ${isActive(tab.path) ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </div>
      ))}
    </div>
  );
}
