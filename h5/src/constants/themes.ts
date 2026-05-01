/**
 * 主题 CSS 变量
 */

import type { RecurringCycleConfig } from '@/types';

/** 亮色主题变量 */
export const LIGHT_THEME = {
  '--color-primary': '#1677ff',
  '--color-primary-light': '#e6f4ff',
  '--color-success': '#52c41a',
  '--color-warning': '#faad14',
  '--color-danger': '#ff4d4f',
  '--color-bg': '#f5f5f5',
  '--color-bg-white': '#ffffff',
  '--color-bg-card': '#ffffff',
  '--color-text': '#333333',
  '--color-text-secondary': '#666666',
  '--color-text-hint': '#999999',
  '--color-border': '#eeeeee',
  '--color-divider': '#f0f0f0',
  '--color-expense': '#ff4d4f',
  '--color-income': '#52c41a',
  '--color-transfer': '#1677ff',
  '--shadow-card': '0 2px 8px rgba(0,0,0,0.06)',
  '--shadow-float': '0 4px 20px rgba(0,0,0,0.12)',
} as const;

/** 暗色主题变量 */
export const DARK_THEME = {
  '--color-primary': '#4096ff',
  '--color-primary-light': '#111a2c',
  '--color-success': '#73d13d',
  '--color-warning': '#ffc53d',
  '--color-danger': '#ff7875',
  '--color-bg': '#1a1a1a',
  '--color-bg-white': '#141414',
  '--color-bg-card': '#1f1f1f',
  '--color-text': '#e8e8e8',
  '--color-text-secondary': '#a0a0a0',
  '--color-text-hint': '#666666',
  '--color-border': '#333333',
  '--color-divider': '#2a2a2a',
  '--color-expense': '#ff7875',
  '--color-income': '#73d13d',
  '--color-transfer': '#4096ff',
  '--shadow-card': '0 2px 8px rgba(0,0,0,0.3)',
  '--shadow-float': '0 4px 20px rgba(0,0,0,0.5)',
} as const;

/** 周期类型配置 */
export const RECURRING_CYCLE_CONFIGS: RecurringCycleConfig[] = [
  { key: 'daily', label: '每天', unit: '天' },
  { key: 'weekly', label: '每周', unit: '周' },
  { key: 'monthly', label: '每月', unit: '月' },
  { key: 'yearly', label: '每年', unit: '年' },
];
