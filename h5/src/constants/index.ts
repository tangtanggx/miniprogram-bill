/**
 * 常量统一导出
 */

export {
  ACCT_CATEGORIES,
  ACCT_CATEGORY_OPTIONS,
  VIRTUAL_CHANNEL_MAP,
  BANK_KEYWORDS,
  CREDIT_KEYWORDS,
  INVEST_KEYWORDS,
  DEBT_KEYWORDS,
  CREDITOR_KEYWORDS,
  REPAY_METHOD_OPTIONS,
  REPAY_CYCLE_OPTIONS,
  REPAY_METHOD_LABELS,
  REPAY_CYCLE_LABELS,
  RATE_TYPE_OPTIONS,
  RATE_TYPE_LABELS,
  convertToAnnualRate,
  convertFromAnnualRate,
  formatRateDisplay,
} from './accounts';

export { DEFAULT_CATEGORIES } from './categories';

export { BUDGET_ALERT_THRESHOLDS, DEFAULT_BUDGET_TEMPLATES } from './budget';

export { LIGHT_THEME, DARK_THEME, RECURRING_CYCLE_CONFIGS } from './themes';

// 重导出 DEFAULT_SETTINGS（来自types/settings.ts）
export { DEFAULT_SETTINGS } from '@/types';

/** 本地存储 key */
export const STORAGE_KEYS = {
  ACCOUNTS: 'accounting_accounts',
  TRANSACTIONS: 'accounting_transactions',
  CATEGORIES: 'accounting_categories',
  BUDGETS: 'accounting_budgets',
  RECURRING: 'accounting_recurring',
  SETTINGS: 'accounting_settings',
  AUTH: 'accounting_auth',
} as const;

/** DeepSeek API 配置 */
export const DEEPSEEK_CONFIG = {
  apiKey: 'sk-17cca859296140ed9dc7e41a92983d64',
  baseUrl: '/api/deepseek',
  model: 'deepseek-chat',
} as const;

/** 交易方向配置 */
export const DIRECTION_CONFIGS = [
  { key: 'expense' as const, label: '支出', color: '#ff4d4f', sign: '-' },
  { key: 'income'  as const, label: '收入', color: '#52c41a', sign: '+' },
  { key: 'transfer' as const, label: '转账', color: '#1677ff', sign: '' },
] as const;
