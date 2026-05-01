/**
 * 周期任务检查服务
 */

import type { RecurringBill, Transaction } from '@/types';
import { calcNextRecurringDate } from '@/utils/calculate';
import { getToday } from '@/utils/format';

/**
 * 检查并返回今天应执行的周期账单
 */
export function getDueRecurringBills(bills: RecurringBill[]): RecurringBill[] {
  const today = getToday();
  return bills.filter((b) => b.enabled && !b.endDate && b.nextDate <= today);
}

/**
 * 将周期账单转为交易记录
 */
export function recurringToTransaction(bill: RecurringBill): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    date: bill.nextDate,
    time: '00:00',
    direction: bill.direction,
    amount: bill.amount,
    accountId: bill.accountId,
    category: bill.category,
    subCategory: bill.subCategory,
    remark: `[周期] ${bill.title}`,
    fromRecurring: true,
    recurringId: bill.id,
  };
}

/**
 * 执行到期的周期账单，返回新增交易和更新后的周期账单列表
 */
export function processDueBills(
  bills: RecurringBill[],
): { newTransactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]; updatedBills: RecurringBill[] } {
  const dueBills = getDueRecurringBills(bills);
  const newTransactions = dueBills.map(recurringToTransaction);
  const updatedBills = bills.map((b) => {
    const due = dueBills.find((d) => d.id === b.id);
    if (!due) return b;
    const nextDate = calcNextRecurringDate(b.nextDate, b.cycle, b.interval);
    return { ...b, nextDate, executedCount: b.executedCount + 1 };
  });
  return { newTransactions, updatedBills };
}
