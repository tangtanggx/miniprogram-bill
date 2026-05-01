/**
 * 贷款还款明细计算
 */

import type { RepayMethod, Account } from '@/types';

/** 单期还款明细 */
export interface RepaymentScheduleItem {
  /** 期数（从1开始） */
  period: number;
  /** 还款日期 */
  date: string;
  /** 月供总额 */
  payment: number;
  /** 本期偿还本金 */
  principal: number;
  /** 本期偿还利息 */
  interest: number;
  /** 剩余本金 */
  remaining: number;
}

/** 还款汇总 */
export interface LoanRepaymentSummary {
  /** 贷款总金额 */
  loanAmount: number;
  /** 总还款额 */
  totalPayment: number;
  /** 总利息 */
  totalInterest: number;
  /** 剩余还款额 */
  remainingPayment: number;
  /** 已还本金 */
  paidPrincipal: number;
  /** 已还利息 */
  paidInterest: number;
  /** 剩余本金 */
  remainingPrincipal: number;
  /** 每期还款额（等额本息/先息后本固定，等额本金为首月） */
  monthlyPayment: number;
  /** 月供递减金额（仅等额本金） */
  monthlyDecrease?: number;
  /** 还款方式 */
  repayMethod: RepayMethod;
  /** 总期数 */
  totalPeriods: number;
  /** 已还期数 */
  paidPeriods: number;
  /** 逐期明细 */
  schedule: RepaymentScheduleItem[];
}

/**
 * 根据贷款起始日期和当前日期，自动计算已还期数
 *
 * 规则：
 * - 当前日期 >= 第 N 期还款日 → 第 N 期视为已还
 * - 例如贷款起始 2024-05-01，第1期还款日 2024-06-01
 * - 如果今天是 2026-05-01（未到第25期还款日 2026-06-01）→ 已还24期
 * - 如果今天是 2026-06-01（正好是还款日）→ 已还25期
 *
 * @param startDate 贷款起始日期（格式 YYYY-MM-DD）
 * @param totalPeriods 总期数
 * @param currentDate 可选，用于测试，默认取当天
 * @returns 已还期数（0 ~ totalPeriods）
 */
export function calcAutoPaidPeriods(
  startDate: string,
  totalPeriods: number,
  currentDate?: Date,
): number {
  if (!startDate || !totalPeriods) return 0;

  const now = currentDate || new Date();
  const start = new Date(startDate);

  // 逐期对比还款日，找到最后一个 <= now 的期数
  // 优化：直接计算月份差
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth(); // 0-based
  const nowDay = now.getDate();
  const startYear = start.getFullYear();
  const startMonth = start.getMonth(); // 0-based
  const startDay = start.getDate();

  // 总月数差
  const totalMonthsDiff = (nowYear - startYear) * 12 + (nowMonth - startMonth);

  // 第 N 期的还款日 = startDate + N 个月
  // 即 startMonth+N 对应的月份，日期为 startDay
  // 如果 totalMonthsDiff >= N 且当月日期 >= startDay，则第 N 期已还
  // 如果 totalMonthsDiff >= N 但当月日期 < startDay，则第 N 期未还

  // 等价于：找到最大的 N 使得 (startYear, startMonth+N, startDay) <= now
  // 即 totalMonthsDiff > N 或 (totalMonthsDiff == N 且 nowDay >= startDay)

  // N = totalMonthsDiff（当 nowDay >= startDay 时）
  // N = totalMonthsDiff - 1（当 nowDay < startDay 时）
  let paid = totalMonthsDiff;
  if (nowDay < startDay) {
    paid -= 1;
  }

  // 处理边界情况：起始日可能是31日，而某些月份没有31日
  // 需要验证实际的还款日期
  // 例如 startDay=31, 当前5月31日，但6月只有30天 → 第N期还款日是6月30日
  // 此时 nowDay(30) < startDay(31)，但我们不应该减1
  // 修正：比较实际还款日期
  const repayDateThisMonth = new Date(startYear, startMonth + paid + 1, startDay);
  const actualRepayDate = new Date(repayDateThisMonth.getFullYear(), repayDateThisMonth.getMonth(), repayDateThisMonth.getDate());
  if (actualRepayDate <= now) {
    paid += 1;
  }

  // clamp 到 [0, totalPeriods]
  return Math.max(0, Math.min(totalPeriods, paid));
}

/**
 * 到期一次性还款计算
 */
export function calcBulletPayment(
  principal: number,
  annualRate: number,
): { monthlyPayment: number; totalPayment: number; totalInterest: number } {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyInterest = principal * monthlyRate;
  return {
    monthlyPayment: Math.round(monthlyInterest * 100) / 100,
    totalPayment: Math.round((principal + monthlyInterest) * 100) / 100,
    totalInterest: Math.round(monthlyInterest * 100) / 100,
  };
}

/**
 * 生成完整还款计划（所有期数）
 */
function generateFullSchedule(
  principal: number,
  annualRate: number,
  totalMonths: number,
  method: RepayMethod,
  startDate: string,
): RepaymentScheduleItem[] {
  const monthlyRate = annualRate / 100 / 12;
  const schedule: RepaymentScheduleItem[] = [];
  let remaining = principal;

  const start = new Date(startDate);

  for (let i = 1; i <= totalMonths; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let payment = 0;
    let principalPart = 0;
    let interestPart = 0;

    switch (method) {
      case 'equal_installment': {
        const pow = Math.pow(1 + monthlyRate, totalMonths);
        payment = (principal * monthlyRate * pow) / (pow - 1);
        interestPart = remaining * monthlyRate;
        principalPart = payment - interestPart;
        break;
      }
      case 'equal_principal': {
        principalPart = principal / totalMonths;
        interestPart = remaining * monthlyRate;
        payment = principalPart + interestPart;
        break;
      }
      case 'interest_only': {
        interestPart = remaining * monthlyRate;
        payment = interestPart;
        // 最后一期偿还本金
        if (i === totalMonths) {
          principalPart = remaining;
          payment += principalPart;
        }
        break;
      }
      case 'bullet': {
        interestPart = remaining * monthlyRate;
        payment = interestPart;
        // 最后一期偿还全部本金
        if (i === totalMonths) {
          principalPart = remaining;
          payment += principalPart;
        }
        break;
      }
    }

    remaining = Math.max(0, remaining - principalPart);

    schedule.push({
      period: i,
      date,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      interest: Math.round(interestPart * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
    });
  }

  return schedule;
}

/**
 * 计算贷款还款汇总（含逐期明细）
 *
 * @param account 负债类账户
 * @returns 还款汇总 + 逐期明细
 */
export function calcLoanRepayment(account: Account): LoanRepaymentSummary | null {
  const loanAmount = (account as any).loanAmount;
  const annualRate = (account as any).annualRate;
  const totalPeriods = (account as any).totalPeriods;
  const paidPeriods = (account as any).paidPeriods;
  const repayMethod = (account as any).repayMethod;
  const startDate = (account as any).startDate;

  // 缺少必要字段 —— 使用 Number() 做安全转换，兼容字符串类型
  const pLoan = Number(loanAmount);
  const pRate = Number(annualRate);
  const pTotal = Number(totalPeriods);
  const pPaid = Number(paidPeriods) || 0;

  if (!pLoan || !pRate || !pTotal || !repayMethod || !startDate) {
    console.warn('[calcLoanRepayment] 缺少必要字段:', {
      loanAmount, annualRate, totalPeriods, repayMethod, startDate,
      accountId: account.id, accountName: account.name
    });
    return null;
  }

  const principal = pLoan;
  const rate = pRate;
  const total = pTotal;
  const paid = pPaid;
  const start = String(startDate);

  // 生成完整还款计划
  const schedule = generateFullSchedule(principal, rate, total, repayMethod, start);

  // 计算汇总
  const paidItems = schedule.slice(0, paid);
  const remainingItems = schedule.slice(paid);

  const paidPrincipal = paidItems.reduce((s, item) => s + item.principal, 0);
  const paidInterest = paidItems.reduce((s, item) => s + item.interest, 0);
  const remainingPayment = remainingItems.reduce((s, item) => s + item.payment, 0);
  const totalPayment = schedule.reduce((s, item) => s + item.payment, 0);
  const totalInterest = schedule.reduce((s, item) => s + item.interest, 0);
  const remainingPrincipal = Math.max(0, principal - paidPrincipal);

  let monthlyPayment = 0;
  let monthlyDecrease: number | undefined;

  if (repayMethod === 'equal_installment') {
    monthlyPayment = schedule[0]?.payment || 0;
  } else if (repayMethod === 'equal_principal') {
    monthlyPayment = schedule[0]?.payment || 0;
    monthlyDecrease = (principal / total) * (rate / 100 / 12);
  } else if (repayMethod === 'interest_only' || repayMethod === 'bullet') {
    monthlyPayment = schedule[0]?.payment || 0;
  }

  return {
    loanAmount: principal,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    remainingPayment: Math.round(remainingPayment * 100) / 100,
    paidPrincipal: Math.round(paidPrincipal * 100) / 100,
    paidInterest: Math.round(paidInterest * 100) / 100,
    remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    monthlyDecrease: monthlyDecrease ? Math.round(monthlyDecrease * 100) / 100 : undefined,
    repayMethod,
    totalPeriods: total,
    paidPeriods: paid,
    schedule,
  };
}
