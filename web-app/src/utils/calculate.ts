/**
 * 财务计算工具
 */

/**
 * 等额本息月供计算
 * @param principal 贷款本金
 * @param annualRate 年利率(%)
 * @param months 贷款期数(月)
 */
export function calcEqualInstallment(
  principal: number,
  annualRate: number,
  months: number,
): { monthlyPayment: number; totalPayment: number; totalInterest: number } {
  if (annualRate === 0) {
    return {
      monthlyPayment: principal / months,
      totalPayment: principal,
      totalInterest: 0,
    };
  }
  const monthlyRate = annualRate / 100 / 12;
  const pow = Math.pow(1 + monthlyRate, months);
  const monthlyPayment = (principal * monthlyRate * pow) / (pow - 1);
  const totalPayment = monthlyPayment * months;
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round((totalPayment - principal) * 100) / 100,
  };
}

/**
 * 等额本金月供计算（返回首月和末月月供）
 */
export function calcEqualPrincipal(
  principal: number,
  annualRate: number,
  months: number,
): { firstPayment: number; lastPayment: number; totalPayment: number; totalInterest: number; monthlyDecrease: number } {
  const monthlyRate = annualRate / 100 / 12;
  const principalPart = principal / months;
  const firstInterest = principal * monthlyRate;
  const lastInterest = principalPart * monthlyRate;
  const firstPayment = principalPart + firstInterest;
  const lastPayment = principalPart + lastInterest;
  const totalPayment = (firstPayment + lastPayment) * months / 2;
  return {
    firstPayment: Math.round(firstPayment * 100) / 100,
    lastPayment: Math.round(lastPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round((totalPayment - principal) * 100) / 100,
    monthlyDecrease: Math.round(principalPart * monthlyRate * 100) / 100,
  };
}

/**
 * 先息后本月供计算
 */
export function calcInterestOnly(
  principal: number,
  annualRate: number,
): { monthlyPayment: number } {
  return {
    monthlyPayment: Math.round(principal * annualRate / 100 / 12 * 100) / 100,
  };
}

/**
 * 计算剩余本金
 */
export function calcRemainingPrincipal(
  principal: number,
  annualRate: number,
  totalMonths: number,
  paidMonths: number,
  method: 'equal_installment' | 'equal_principal',
): number {
  if (paidMonths >= totalMonths) return 0;
  if (method === 'equal_installment') {
    const monthlyRate = annualRate / 100 / 12;
    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = (principal * monthlyRate * pow) / (pow - 1);
    const remainingPow = Math.pow(1 + monthlyRate, totalMonths - paidMonths);
    return Math.round((monthlyPayment * (remainingPow - 1)) / (monthlyRate * remainingPow) * 100) / 100;
  } else {
    const paidPrincipal = (principal / totalMonths) * paidMonths;
    return Math.round((principal - paidPrincipal) * 100) / 100;
  }
}

/**
 * 计算净资产
 *
 * 公式：净资产 = 总资产 - 总负债
 *
 * 余额语义约定：
 *   - 资产类账户（savings/virtual/investment/creditor）：
 *       正余额 = 持有金额（资产），负余额 = 透支/亏损（负债）
 *   - 负债类账户（credit/debt）：
 *       余额绝对值 = 欠款金额（负债），无论正负
 *       例如：信用卡余额 -304.50 表示欠款304.50
 */
export function calcNetWorth(accounts: { category: string; balance: number }[]): {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetBreakdown: Record<string, number>;
  liabilityBreakdown: Record<string, number>;
} {
  const assetBreakdown: Record<string, number> = {};
  const liabilityBreakdown: Record<string, number> = {};
  let totalAssets = 0;
  let totalLiabilities = 0;

  const CATEGORY_LABELS: Record<string, string> = {
    savings: '储蓄卡',
    credit: '信用卡',
    virtual: '虚拟账户',
    debt: '负债',
    creditor: '债权',
    investment: '投资',
  };

  for (const a of accounts) {
    const label = CATEGORY_LABELS[a.category] || a.category;

    if (a.category === 'credit' || a.category === 'debt') {
      // 负债类账户：余额绝对值 = 欠款，一律计入负债
      const debtAmount = Math.abs(a.balance);
      if (debtAmount > 0) {
        totalLiabilities += debtAmount;
        liabilityBreakdown[label] = (liabilityBreakdown[label] || 0) + debtAmount;
      }
    } else {
      // 资产类账户：正余额 = 资产，负余额 = 透支/亏损 = 负债
      if (a.balance >= 0) {
        totalAssets += a.balance;
        assetBreakdown[label] = (assetBreakdown[label] || 0) + a.balance;
      } else {
        totalLiabilities += Math.abs(a.balance);
        liabilityBreakdown[`${label}(透支)`] = (liabilityBreakdown[`${label}(透支)`] || 0) + Math.abs(a.balance);
      }
    }
  }

  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    netWorth: Math.round((totalAssets - totalLiabilities) * 100) / 100,
    assetBreakdown,
    liabilityBreakdown,
  };
}

/**
 * 计算信用卡可用额度和使用率
 */
export function calcCreditUsage(
  balance: number,
  creditLimit: number,
): { used: number; available: number; utilizationRate: number } {
  const used = Math.abs(balance);
  return {
    used: Math.round(used * 100) / 100,
    available: Math.round((creditLimit - used) * 100) / 100,
    utilizationRate: creditLimit > 0 ? Math.round((used / creditLimit) * 10000) / 100 : 0,
  };
}

/**
 * 计算下次周期执行日期
 */
export function calcNextRecurringDate(
  currentDate: string,
  cycle: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number,
): string {
  const d = new Date(currentDate);
  switch (cycle) {
    case 'daily':
      d.setDate(d.getDate() + interval);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7 * interval);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + interval);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + interval);
      break;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
