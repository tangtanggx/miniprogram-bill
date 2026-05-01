/**
 * 预算管理状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Budget, BudgetProgress } from '@/types';
import { STORAGE_KEYS, BUDGET_ALERT_THRESHOLDS } from '@/constants';
import { generateId } from '@/utils/id';

interface BudgetState {
  budgets: Budget[];
  addBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetProgress: (month: string, spentByCategory: Record<string, number>) => BudgetProgress[];
  getTotalBudget: (month: string) => number;
}

function getAlertLevel(percentage: number): BudgetProgress['alertLevel'] {
  if (percentage >= BUDGET_ALERT_THRESHOLDS.danger) return 'exceeded';
  if (percentage >= BUDGET_ALERT_THRESHOLDS.warning) return 'warning';
  return 'safe';
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],

      addBudget: (data) => {
        const now = new Date().toISOString();
        const budget: Budget = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ budgets: [...s.budgets, budget] }));
        return budget;
      },

      updateBudget: (id, updates) => {
        set((s) => ({
          budgets: s.budgets.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
        }));
      },

      deleteBudget: (id) => {
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
      },

      getBudgetProgress: (_month, spentByCategory) => {
        const { budgets } = get();
        return budgets
          .filter((b) => b.enabled)
          .map((b) => {
            const catKey = b.category || '';
            const key = b.subCategory ? `${catKey}|${b.subCategory}` : catKey;
            const spent = spentByCategory[key] || (catKey ? spentByCategory[catKey] : 0) || 0;
            const remaining = b.monthlyAmount - spent;
            const percentage = b.monthlyAmount > 0 ? Math.round((spent / b.monthlyAmount) * 100) : 0;
            return {
              budget: b,
              spent: Math.round(spent * 100) / 100,
              remaining: Math.round(remaining * 100) / 100,
              percentage,
              alertLevel: getAlertLevel(percentage),
            };
          });
      },

      getTotalBudget: (_month) => {
        return get().budgets
          .filter((b) => b.enabled && !b.category)
          .reduce((s, b) => s + b.monthlyAmount, 0);
      },
    }),
    { name: STORAGE_KEYS.BUDGETS }
  )
);
