/**
 * 账户相关类型
 */

/** 账户分类 */
export type AccountCategory =
  | 'savings'      // 储蓄卡
  | 'credit'       // 信用卡
  | 'virtual'      // 虚拟账户（微信/支付宝等）
  | 'debt'         // 负债（借呗/房贷/车贷等）
  | 'creditor'     // 债权（别人欠我的）
  | 'investment';  // 投资（基金/股票等）

/** 还款方式 */
export type RepayMethod =
  | 'equal_installment'   // 等额本息
  | 'equal_principal'     // 等额本金
  | 'interest_only'       // 先息后本
  | 'bullet';             // 到期一次性还款

/** 还款周期 */
export type RepayCycle = 'monthly' | 'quarterly' | 'yearly' | 'single';

/** 利率类型 */
export type RateType = 'annual' | 'monthly' | 'daily';

/** 账户实体 */
export interface Account {
  id: string;
  name: string;
  category: AccountCategory;
  icon: string;
  color: string;
  balance: number;

  // ===== 信用卡特有 =====
  /** 信用额度 */
  creditLimit?: number;
  /** 账单日（每月几号） */
  billingDay?: number;
  /** 还款日（每月几号） */
  repaymentDay?: number;

  // ===== 负债/贷款特有 =====
  /** 贷款总金额（原始贷款额） */
  loanAmount?: number;
  /** 年利率(%) */
  annualRate?: number;
  /** 还款方式 */
  repayMethod?: RepayMethod;
  /** 总期数 */
  totalPeriods?: number;
  /** 已还期数 */
  paidPeriods?: number;
  /** 贷款起始日期 */
  startDate?: string;
  /** 还款周期 */
  repayCycle?: RepayCycle;
  /** 下次还款日期 */
  nextRepayDate?: string;
  /** 已还期数是否自动计算（默认 true） */
  autoPaid?: boolean;

  // ===== 债权/借出特有 =====
  /** 借出总金额 */
  creditorAmount?: number;
  /** 年利率(%)（统一转换为年利率存储） */
  creditorRate?: number;
  /** 利率类型 */
  creditorRateType?: RateType;
  /** 期限是否无限 */
  creditorInfinite?: boolean;
  /** 还款方式 */
  creditorRepayMethod?: RepayMethod;
  /** 总期数 */
  creditorTotalPeriods?: number;
  /** 已还期数 */
  creditorPaidPeriods?: number;
  /** 借出起始日期 */
  creditorStartDate?: string;
  /** 还款周期 */
  creditorRepayCycle?: RepayCycle;
  /** 下次收款日期 */
  creditorNextDate?: string;
  /** 已还期数是否自动计算 */
  creditorAutoPaid?: boolean;

  // ===== 投资特有 =====
  /** 持仓成本 */
  costBasis?: number;

  createdAt: string;
  updatedAt: string;
}

/** 账户分类配置项 */
export interface AccountCategoryConfig {
  label: string;
  emoji: string;
  color: string;
}

/** 账户匹配结果 */
export interface AccountMatchResult {
  accountId: string;
  created: boolean;
  accountName: string;
  account?: Account;
}
