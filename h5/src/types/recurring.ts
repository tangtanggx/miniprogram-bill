/**
 * 周期记账相关类型
 */

/** 周期类型 */
export type RecurringCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** 周期账单实体 */
export interface RecurringBill {
  id: string;
  /** 记录标题 */
  title: string;
  /** 交易方向 */
  direction: 'expense' | 'income';
  /** 金额 */
  amount: number;
  /** 账户ID */
  accountId: string;
  /** 一级分类 */
  category: string;
  /** 二级分类 */
  subCategory: string;
  /** 备注 */
  remark: string;
  /** 周期类型 */
  cycle: RecurringCycle;
  /** 周期间隔（如每2周 = 2） */
  interval: number;
  /** 开始日期 */
  startDate: string;
  /** 结束日期（可选） */
  endDate?: string;
  /** 下次执行日期 */
  nextDate: string;
  /** 是否启用 */
  enabled: boolean;
  /** 已自动生成的次数 */
  executedCount: number;
  createdAt: string;
  updatedAt: string;
}

/** 周期类型配置 */
export interface RecurringCycleConfig {
  key: RecurringCycle;
  label: string;
  unit: string;
}
