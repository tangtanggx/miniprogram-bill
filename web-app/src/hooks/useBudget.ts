/**
 * 预算操作 Hook
 */

import { useMemo } from 'react';
import { useBudgetStore } from '@/stores';
import { useTransactionStore } from '@/stores';


export function useBudget(month: string) {
  const budgets = useBudgetStore((s) => s.budgets);
  const addBudget = useBudgetStore((s) => s.addBudget);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const getCategorySummary = useTransactionStore((s) => s.getCategorySummary);

  const [year, m] = month.split('-').map(Number);
  const categorySpent = useMemo(() => {
    const summary = getCategorySummary(year, m);
    const map: Record<string, number> = {};
    for (const item of summary) {
      map[item.category] = (map[item.category] || 0) + item.amount;
      if (item.subCategory) {
        map[`${item.category}|${item.subCategory}`] = item.amount;
      }
    }
    return map;
  }, [getCategorySummary, year, m]);

  const budgetProgress = useMemo(() => {
    return useBudgetStore.getState().getBudgetProgress(month, categorySpent);
  }, [month, categorySpent, budgets]);

  const totalBudget = useMemo(() => {
    return useBudgetStore.getState().getTotalBudget(month);
  }, [month, budgets]);

  const totalSpent = useMemo(() => {
    return Object.values(categorySpent).reduce((s, v) => s + v, 0);
  }, [categorySpent]);

  return { budgets, budgetProgress, totalBudget, totalSpent, addBudget, updateBudget, deleteBudget };
}
