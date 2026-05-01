/**
 * 账户工具函数
 * 包含匹配、分类推断、名称规范化、图标/颜色映射
 */

import type { Account, AccountCategory } from '@/types';

// ============================================================
// 银行简称 → 全名 别名表
// ============================================================
const BANK_ALIASES: Record<string, string> = {
  '浦发': '浦发银行',
  '中行': '中国银行',
  '中信': '中信银行',
  '招行': '招商银行',
  '建行': '建设银行',
  '兴业': '兴业银行',
  '工行': '工商银行',
  '农行': '农业银行',
  '交行': '交通银行',
  '民生': '民生银行',
  '光大': '光大银行',
  '华夏': '华夏银行',
  '邮储': '邮政储蓄银行',
  '平安': '平安银行',
  '广发': '广发银行',
  '深发': '平安银行',
  // 支付渠道 — 无法确定具体账户
  '微信': '',
  '支付宝': '',
  '余额宝': '',
  '花呗': '花呗',
  '京东白条': '京东白条',
  '白条': '京东白条',
  '抖音月付': '抖音月付',
  '拼多多月付': '拼多多月付',
  '美团月付': '美团月付',
  '翼支付月付': '翼支付月付',
  '微信分付': '微信分付',
};

// ============================================================
// 账户分类关键词
// ============================================================
const CATEGORY_KEYWORDS: { category: AccountCategory; keywords: string[] }[] = [
  { category: 'credit', keywords: ['信用卡', 'visa', 'mastercard', 'credit', '花呗', '京东白条', '白条', '抖音月付', '拼多多月付', '美团月付', '翼支付月付', '微信分付', '苏宁任性付', '平安普惠'] },
  { category: 'virtual', keywords: ['微信', '支付宝', '余额宝', '零钱', '云闪付'] },
  { category: 'debt', keywords: ['借呗', '房贷', '车贷', '贷款', '微粒贷', '招联', '负债'] },
  { category: 'creditor', keywords: ['债权', '应收', '借出'] },
  { category: 'investment', keywords: ['基金', '股票', '理财', '投资', '证券', '期货', '黄金'] },
  { category: 'savings', keywords: ['储蓄', '储蓄卡', '借记卡', '活期', '定期', '存折'] },
];

/** 账户分类 → 图标 */
const CATEGORY_EMOJI: Record<AccountCategory, string> = {
  savings: '🏦',
  credit: '💳',
  virtual: '📱',
  debt: '📉',
  creditor: '📈',
  investment: '📊',
};

/** 账户分类 → 颜色 */
const CATEGORY_COLOR: Record<AccountCategory, string> = {
  savings: '#1677ff',
  credit: '#ff4d4f',
  virtual: '#52c41a',
  debt: '#faad14',
  creditor: '#722ed1',
  investment: '#13c2c2',
};

// ============================================================
// 导出函数
// ============================================================

/** 根据名称推断账户分类 */
export function guessAccountCategory(name: string): AccountCategory {
  if (!name) return 'savings';
  const lower = name.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) return category;
  }
  // 默认：含"银行"二字归储蓄
  if (name.includes('银行')) return 'savings';
  return 'savings';
}

/** 规范化账户名称 */
export function normalizeAcctName(name: string, category: AccountCategory): string {
  if (!name) return '未命名账户';
  const trimmed = name.trim();
  if (category === 'credit') {
    // 信用卡：确保带"信用卡"后缀
    if (!trimmed.includes('信用卡')) return trimmed + '信用卡';
  }
  if (category === 'savings') {
    // 储蓄卡：尝试用别名补全全名
    const full = BANK_ALIASES[trimmed];
    if (full) return full;
    if (!trimmed.includes('银行') && !trimmed.includes('卡') && !trimmed.includes('存折')) {
      return trimmed + '储蓄卡';
    }
  }
  return trimmed;
}

/** 获取账户分类对应的 emoji */
export function getAcctEmoji(category: AccountCategory): string {
  return CATEGORY_EMOJI[category] || '🏦';
}

/** 获取账户分类对应的颜色 */
export function getAcctColor(category: AccountCategory): string {
  return CATEGORY_COLOR[category] || '#1677ff';
}

/** 获取账户分类对应的标签文字 */
export function getAcctLabel(category: AccountCategory): string {
  const labels: Record<AccountCategory, string> = {
    savings: '储蓄卡',
    credit: '信用卡',
    virtual: '虚拟账户',
    debt: '负债',
    creditor: '债权',
    investment: '投资',
  };
  return labels[category] || '其他';
}

/**
 * 根据名称模糊匹配已有账户
 * 匹配优先级：精确 → 别名 → 卡尾号
 */
export function matchAccount(name: string, accounts: Account[]): Account | null {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  // 1. 精确/包含匹配
  const exact = accounts.find(
    (a) => a.name === trimmed || a.name.includes(trimmed) || trimmed.includes(a.name)
  );
  if (exact) return exact;

  // 2. 别名匹配
  const fullName = BANK_ALIASES[trimmed];
  if (fullName === '') return null; // 支付渠道，无法确定具体账户
  if (fullName) {
    const found = accounts.find((a) => a.name === fullName);
    if (found) return found;
  }

  // 3. 卡尾号匹配（提取4位数字）
  const numMatch = trimmed.match(/(\d{4})/);
  if (numMatch) {
    const found = accounts.find((a) => (a.cardNo || '').includes(numMatch![1]));
    if (found) return found;
  }

  return null;
}

/**
 * 智能查找或创建账户
 * 优先模糊匹配已有账户，匹配不到再创建
 */
export function smartMatchOrCreate(
  name: string,
  accounts: Account[],
  createFn: (name: string) => Account
): Account {
  const matched = matchAccount(name, accounts);
  if (matched) return matched;
  return createFn(name);
}
