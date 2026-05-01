import React, { useState } from 'react';
import { NavBar, List, Dialog, Toast, Switch, Tabs } from 'antd-mobile';
import {
  RightOutline,
  UploadOutline,
} from 'antd-mobile-icons';
import { useSettingsStore } from '@/stores/index';
import type { ThemeMode } from '@/types/index';
import { storageService } from '@/services/index';
import './index.css';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
];

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, updateTheme } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<string>('general');

  const handleExport = () => {
    try {
      storageService.exportData();
      Toast.show({ content: '数据导出成功' });
    } catch {
      Toast.show({ content: '导出失败' });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        Dialog.confirm({
          content: `导入 "${file.name}" 将覆盖当前数据，确定继续？`,
          onConfirm: async () => {
            if (file.name.endsWith('.csv')) {
              await storageService.importCSV(file);
            } else {
              await storageService.importDataFromFile(file);
            }
            Toast.show({ content: '导入成功，页面将刷新' });
            setTimeout(() => window.location.reload(), 1500);
          },
        });
      } catch {
        Toast.show({ content: '导入失败，请检查文件格式' });
      }
    };
    input.click();
  };

  const handleBackup = () => {
    try {
      storageService.backup();
      Toast.show({ content: '备份成功' });
    } catch {
      Toast.show({ content: '备份失败' });
    }
  };

  const handleThemeChange = (mode: ThemeMode) => {
    updateTheme(mode);
  };

  return (
    <div className="settings-page">
      <NavBar className="page-navbar" onBack={() => window.history.back()}>
        设置
      </NavBar>

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="settings-tabs">
        <Tabs.Tab key="general" title="通用" />
        <Tabs.Tab key="data" title="数据" />
        <Tabs.Tab key="about" title="关于" />
      </Tabs>

      {/* 通用设置 */}
      {activeTab === 'general' && (
        <div className="settings-content">
          <List header="外观">
            <List.Item
              prefix={<span>🎨</span>}
              extra={
                <div className="theme-selector">
                  {THEME_OPTIONS.map(opt => (
                    <div
                      key={opt.value}
                      className={`theme-option ${settings.theme === opt.value ? 'active' : ''}`}
                      onClick={() => handleThemeChange(opt.value)}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              }
            >
              主题模式
            </List.Item>
          </List>

          <List header="记账偏好">
            <List.Item
              prefix={<span>📊</span>}
              extra={
                <Switch
                  checked={settings.showBudgetOnHome}
                  onChange={val => updateSettings({ showBudgetOnHome: val })}
                />
              }
            >
              首页显示预算
            </List.Item>
            <List.Item
              prefix={<span>🔢</span>}
              extra={
                <Switch
                  checked={settings.showDecimal}
                  onChange={val => updateSettings({ showDecimal: val })}
                />
              }
            >
              显示金额小数
            </List.Item>
            <List.Item
              prefix={<span>🤖</span>}
              extra={
                <Switch
                  checked={settings.aiPreferences.autoConfirm}
                  onChange={val =>
                    updateSettings({
                      aiPreferences: { ...settings.aiPreferences, autoConfirm: val },
                    })
                  }
                />
              }
            >
              AI自动确认
            </List.Item>
          </List>
        </div>
      )}

      {/* 数据管理 */}
      {activeTab === 'data' && (
        <div className="settings-content">
          <List header="数据导入导出">
            <List.Item
              prefix={<UploadOutline />}
              extra={<RightOutline />}
              onClick={handleExport}
            >
              导出数据
            </List.Item>
            <List.Item
              prefix={<span>📥</span>}
              extra={<RightOutline />}
              onClick={handleImport}
            >
              导入数据
            </List.Item>
          </List>

          <List header="数据备份">
            <List.Item
              prefix={<span>☁️</span>}
              extra={<RightOutline />}
              onClick={handleBackup}
            >
              创建备份
            </List.Item>
            <List.Item
              prefix={<span>☁️</span>}
              extra={<RightOutline />}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  try {
                    Dialog.confirm({
                      content: '恢复备份将覆盖当前数据，确定继续？',
                      onConfirm: async () => {
                        await storageService.restore(file);
                        Toast.show({ content: '恢复成功，页面将刷新' });
                        setTimeout(() => window.location.reload(), 1500);
                      },
                    });
                  } catch {
                    Toast.show({ content: '恢复失败' });
                  }
                };
                input.click();
              }}
            >
              恢复备份
            </List.Item>
          </List>

          <List header="CSV处理">
            <List.Item
              prefix={<span>📁</span>}
              extra={<RightOutline />}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  try {
                    await storageService.importCSV(file);
                    Toast.show({ content: 'CSV导入成功' });
                    setTimeout(() => window.location.reload(), 1000);
                  } catch {
                    Toast.show({ content: 'CSV导入失败' });
                  }
                };
                input.click();
              }}
            >
              导入CSV
            </List.Item>
            <List.Item
              prefix={<span>📁</span>}
              extra={<RightOutline />}
              onClick={() => {
                try {
                  storageService.exportCSV();
                  Toast.show({ content: 'CSV导出成功' });
                } catch {
                  Toast.show({ content: 'CSV导出失败' });
                }
              }}
            >
              导出CSV
            </List.Item>
          </List>

          <List header="危险操作">
            <List.Item
              prefix={<span className="danger-icon">⚠️</span>}
              extra={<RightOutline />}
              onClick={() => {
                Dialog.confirm({
                  content: '确定要清空所有数据吗？此操作不可撤销！',
                  confirmText: '清空',
                  onConfirm: () => {
                    localStorage.clear();
                    Toast.show({ content: '数据已清空，页面将刷新' });
                    setTimeout(() => window.location.reload(), 1500);
                  },
                });
              }}
            >
              清空所有数据
            </List.Item>
          </List>
        </div>
      )}

      {/* 关于 */}
      {activeTab === 'about' && (
        <div className="settings-content">
          <List header="关于">
            <List.Item prefix={<span>ℹ️</span>} extra="v3.0.0">
              版本
            </List.Item>
            <List.Item prefix={<span>📋</span>} extra="React 18 + TypeScript">
              技术栈
            </List.Item>
            <List.Item prefix={<span>🎨</span>} extra="Ant Design Mobile 5">
              UI框架
            </List.Item>
          </List>

          <div className="about-info">
            <p>个人记账助手 - React版</p>
            <p className="about-desc">
              支持6种交易方向、预算管理、周期记账、AI记账、数据导入导出等功能。
              所有数据存储在本地，保障您的隐私安全。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
