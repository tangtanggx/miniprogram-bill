/**
 * 信用卡管理相关类型（信用卡核心字段已在 Account 类型中定义）
 * 此文件扩展信用卡专用的计算结果类型
 */

/** 信用卡账单周期 */
export interface BillingCycle {
  /** 账单开始日期 */
  startDate: string;
  /** 账单结束日期 */
  endDate: string;
  /** 还款到期日 */
  dueDate: string;
}

/** 信用卡账单汇总 */
export interface CreditCardBillSummary {
  accountId: string;
  accountName: string;
  cycle: BillingCycle;
  /** 本期消费总额 */
  totalSpent: number;
  /** 本期还款总额 */
  totalRepaid: number;
  /** 上期未还余额 */
  previousBalance: number;
  /** 当前应还金额 */
  currentDue: number;
  /** 最低还款额（通常为10%或固定金额） */
  minimumPayment: number;
  /** 信用额度 */
  creditLimit: number;
  /** 已用额度 */
  usedLimit: number;
  /** 可用额度 */
  availableLimit: number;
  /** 使用率(%) */
  utilizationRate: number;
  /** 免息期天数 */
  interestFreeDays: number;
}

/** 还款计算结果 */
export interface RepaymentCalcResult {
  /** 月供 */
  monthlyPayment: number;
  /** 总还款额 */
  totalPayment: number;
  /** 总利息 */
  totalInterest: number;
  /** 剩余本金 */
  remainingPrincipal: number;
}
