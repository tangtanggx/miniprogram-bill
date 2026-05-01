/**
 * 初始化模拟数据
 *
 * 4个基础账户（1银行卡+1信用卡+微信+支付宝），余额为0。
 * 无交易记录，用于新用户首次体验。
 */

import type { Account } from '@/types';
import type { Transaction } from '@/types';

/** 4个基础账户 */
export const SEED_ACCOUNTS: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ===== 储蓄卡 =====
  {
    name: '招商银行',
    category: 'savings',
    icon: '🏦',
    color: '#4CAF50',
    balance: 0,
  },
  // ===== 信用卡 =====
  {
    name: '中信信用卡',
    category: 'credit',
    icon: '💳',
    color: '#FF5722',
    balance: 0,
    creditLimit: 35000,
    billingDay: 5,
    repaymentDay: 25,
  },
  // ===== 虚拟账户 =====
  {
    name: '微信零钱',
    category: 'virtual',
    icon: '📱',
    color: '#2196F3',
    balance: 0,
  },
  {
    name: '支付宝余额',
    category: 'virtual',
    icon: '📱',
    color: '#2196F3',
    balance: 0,
  },
];

/** 无交易记录 */
export const SEED_TRANSACTIONS: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
