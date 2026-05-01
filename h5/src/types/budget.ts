/**
 * 预算管理相关类型
 */

/** 预算实体 */
export interface Budget {
  id: string;
  /** 预算名称，null表示总预算 */
  category?: string;
  /** 子分类，null表示整个一级分类 */
  subCategory?: string;
  /** 月度预算金额 */
  monthlyAmount: number;
  /** 预算周期: month | year */
  period: 'month' | 'year';
  /** 是否启用 */
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 预算使用进度 */
export interface BudgetProgress {
  budget: Budget;
  /** 已使用金额 */
  spent: number;
  /** 剩余金额 */
  remaining: number;
  /** 使用百分比 0~100+ */
  percentage: number;
  /** 预警级别 */
  alertLevel: 'safe' | 'warning' | 'danger' | 'exceeded';
}

/** 预算月度汇总 */
export interface BudgetMonthSummary {
  month: string;       // YYYY-MM
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  categories: BudgetProgress[];
}
