/**
 * 交易记录相关类型
 */

/** 交易方向 */
export type TransactionDirection = 'expense' | 'income' | 'transfer';

/** 交易记录实体 */
export interface Transaction {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  direction: TransactionDirection;
  amount: number;
  /** 主账户ID */
  accountId: string;
  /** 转账目标账户ID */
  targetAccountId?: string;
  /** 一级分类 */
  category: string;
  /** 二级分类 */
  subCategory: string;
  /** 备注/商家名 */
  remark: string;
  /** 标签（逗号分隔） */
  tags?: string;
  /** 是否为可报销支出 */
  reimbursable?: boolean;
  /** 报销状态 */
  reimbStatus?: 'pending' | 'done';
  /** 是否已报销（兼容旧数据） */
  reimbursed?: boolean;
  /** 关联的报销收入记录ID */
  linkedReimbId?: string;
  /** 是否为周期记账自动生成 */
  fromRecurring?: boolean;
  /** 关联的周期账单ID */
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

/** 方向配置 */
export interface DirectionConfig {
  key: TransactionDirection;
  label: string;
  color: string;
  sign: '+' | '-';
}
