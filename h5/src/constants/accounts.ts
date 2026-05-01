/**
 * 账户相关常量
 */

import type { AccountCategory, AccountCategoryConfig, RepayMethod, RepayCycle, RateType } from '@/types';

/** 账户分类配置 */
export const ACCT_CATEGORIES: Record<AccountCategory, AccountCategoryConfig> = {
  savings:    { label: '储蓄卡',   emoji: '🏦', color: '#4CAF50' },
  credit:     { label: '信用卡',   emoji: '💳', color: '#FF5722' },
  virtual:    { label: '虚拟账户', emoji: '📱', color: '#2196F3' },
  debt:       { label: '负债',     emoji: '📉', color: '#9C27B0' },
  creditor:   { label: '债权',     emoji: '🤝', color: '#FF9800' },
  investment: { label: '投资',     emoji: '📈', color: '#00BCD4' },
};

/** 账户分类列表（用于Picker等组件） */
export const ACCT_CATEGORY_OPTIONS = Object.entries(ACCT_CATEGORIES).map(([key, val]) => ({
  label: val.label,
  value: key,
}));

/** 虚拟支付渠道映射 */
export const VIRTUAL_CHANNEL_MAP: Record<string, string> = {
  '财付通': '微信支付',
  '微信支付': '微信支付',
  '支付宝': '支付宝',
  '京东支付': '京东支付',
  '云闪付': '云闪付',
  '美团支付': '美团支付',
  '拼多多支付': '拼多多支付',
  '抖音支付': '抖音支付',
  '翼支付': '翼支付',
  '和包': '和包支付',
  '百度钱包': '百度钱包',
  '数字人民币': '数字人民币',
};

/** 银行关键词 */
export const BANK_KEYWORDS = [
  '工商银行', '农业银行', '中国银行', '建设银行', '交通银行', '邮储银行',
  '招商银行', '浦发银行', '中信银行', '光大银行', '华夏银行', '民生银行',
  '兴业银行', '广发银行', '平安银行', '北京银行', '上海银行', '宁波银行',
  '南京银行', '江苏银行', '杭州银行', '长沙银行', '成都银行', '广州银行',
  '深圳发展银行', '广东发展银行', '农村信用社', '农村商业银行',
];

/** 信用卡关键词 */
export const CREDIT_KEYWORDS = [
  '信用卡', '贷记卡', '联名信用卡', '白金卡', '金卡', '普卡',
  'VISA', 'Master',
  '花呗', '京东白条', '白条',
  '抖音月付', '拼多多月付', '美团月付', '翼支付月付',
  '微信分付', '苏宁任性付', '平安普惠',
];

/** 投资关键词 */
export const INVEST_KEYWORDS = ['基金', '理财', '股票', '证券', '投资', '黄金', '债券'];

/** 负债关键词 */
export const DEBT_KEYWORDS = ['借呗', '贷款', '房贷', '车贷', '信用卡还款'];

/** 债权关键词 */
export const CREDITOR_KEYWORDS = ['借出', '应收', '别人欠我'];

/** 还款方式选项 */
export const REPAY_METHOD_OPTIONS: { label: string; value: RepayMethod }[] = [
  { label: '等额本息', value: 'equal_installment' },
  { label: '等额本金', value: 'equal_principal' },
  { label: '先息后本', value: 'interest_only' },
  { label: '到期一次性还款', value: 'bullet' },
];

/** 还款周期选项 */
export const REPAY_CYCLE_OPTIONS: { label: string; value: RepayCycle }[] = [
  { label: '每月', value: 'monthly' },
  { label: '每季度', value: 'quarterly' },
  { label: '每年', value: 'yearly' },
  { label: '一次性', value: 'single' },
];

/** 还款方式中文映射 */
export const REPAY_METHOD_LABELS: Record<RepayMethod, string> = {
  equal_installment: '等额本息',
  equal_principal: '等额本金',
  interest_only: '先息后本',
  bullet: '到期一次性还款',
};

/** 还款周期中文映射 */
export const REPAY_CYCLE_LABELS: Record<RepayCycle, string> = {
  monthly: '每月',
  quarterly: '每季度',
  yearly: '每年',
  single: '一次性',
};

/** 利率类型选项 */
export const RATE_TYPE_OPTIONS: { label: string; value: RateType }[] = [
  { label: '日息万分之X', value: 'daily' },
  { label: '月息千分之X', value: 'monthly' },
  { label: '年息百分之X', value: 'annual' },
];

/** 利率类型中文映射 */
export const RATE_TYPE_LABELS: Record<RateType, string> = {
  daily: '日息',
  monthly: '月息',
  annual: '年息',
};

/**
 * 将用户输入的利率转换为年利率（%）
 * @param rateInput 用户输入的数值（不带百分号/千分号/万分号）
 * @param rateType 利率类型
 * @returns 年利率（%）
 */
export function convertToAnnualRate(rateInput: number, rateType: RateType): number {
  switch (rateType) {
    case 'daily':
      // 日息万分之X → 年利率 = X / 10000 * 365 * 100 = X * 3.65
      return Math.round(rateInput * 3.65 * 100) / 100;
    case 'monthly':
      // 月息千分之X → 年利率 = X / 1000 * 12 * 100 = X * 1.2
      return Math.round(rateInput * 1.2 * 100) / 100;
    case 'annual':
      // 年息百分之X → 直接就是X
      return rateInput;
  }
}

/**
 * 将年利率（%）转换为用户输入的利率值
 * @param annualRate 年利率（%）
 * @param rateType 利率类型
 * @returns 用户输入的利率数值
 */
export function convertFromAnnualRate(annualRate: number, rateType: RateType): number {
  switch (rateType) {
    case 'daily':
      // 年利率(%) → 日息万分之X = annualRate / 3.65
      return Math.round((annualRate / 3.65) * 100) / 100;
    case 'monthly':
      // 年利率(%) → 月息千分之X = annualRate / 1.2
      return Math.round((annualRate / 1.2) * 100) / 100;
    case 'annual':
      return annualRate;
  }
}

/**
 * 获取利率显示文本
 * @param annualRate 年利率（%）
 * @param rateType 利率类型
 * @returns 显示文本，如 "日息万分之5" "月息千分之10" "年利率5%"
 */
export function formatRateDisplay(annualRate: number, rateType: RateType): string {
  switch (rateType) {
    case 'daily': {
      const daily = convertFromAnnualRate(annualRate, 'daily');
      return `日息万分之${daily}`;
    }
    case 'monthly': {
      const monthly = convertFromAnnualRate(annualRate, 'monthly');
      return `月息千分之${monthly}`;
    }
    case 'annual':
      return `年利率${annualRate}%`;
  }
}
