/**
 * 全局设置相关类型
 */

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** AI偏好设置 */
export interface AIPreferences {
  /** 默认账户（AI识别时优先匹配） */
  defaultAccountId?: string;
  /** 自动记账时是否跳过确认 */
  autoConfirm: boolean;
  /** OCR识别语言 */
  ocrLanguage: 'zh' | 'auto';
}

/** 应用全局设置 */
export interface AppSettings {
  /** 主题模式 */
  theme: ThemeMode;
  /** 默认记账方向 */
  defaultDirection: 'expense' | 'income';
  /** 金额显示：显示/隐藏小数 */
  showDecimal: boolean;
  /** 首页显示预算进度 */
  showBudgetOnHome: boolean;
  /** AI偏好 */
  aiPreferences: AIPreferences;
  /** 数据版本（用于迁移） */
  dataVersion: number;
}

/** 默认设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultDirection: 'expense',
  showDecimal: true,
  showBudgetOnHome: true,
  aiPreferences: {
    autoConfirm: false,
    ocrLanguage: 'zh',
  },
  dataVersion: 1,
};
