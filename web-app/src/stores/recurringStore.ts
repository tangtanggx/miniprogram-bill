/**
 * 周期记账状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecurringBill } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId } from '@/utils/id';
import { calcNextRecurringDate } from '@/utils/calculate';
import { getToday } from '@/utils/format';

interface RecurringState {
  recurringBills: RecurringBill[];
  addRecurring: (data: Omit<RecurringBill, 'id' | 'createdAt' | 'updatedAt' | 'executedCount'>) => RecurringBill;
  updateRecurring: (id: string, updates: Partial<RecurringBill>) => void;
  deleteRecurring: (id: string) => void;
  toggleRecurring: (id: string) => void;
  getDueBills: () => RecurringBill[];
  markExecuted: (id: string) => void;
}

export const useRecurringStore = create<RecurringState>()(
  persist(
    (set, get) => ({
      recurringBills: [],

      addRecurring: (data) => {
        const now = new Date().toISOString();
        const bill: RecurringBill = { ...data, id: generateId(), executedCount: 0, createdAt: now, updatedAt: now };
        set((s) => ({ recurringBills: [...s.recurringBills, bill] }));
        return bill;
      },

      updateRecurring: (id, updates) => {
        set((s) => ({
          recurringBills: s.recurringBills.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
        }));
      },

      deleteRecurring: (id) => {
        set((s) => ({ recurringBills: s.recurringBills.filter((b) => b.id !== id) }));
      },

      toggleRecurring: (id) => {
        set((s) => ({
          recurringBills: s.recurringBills.map((b) =>
            b.id === id ? { ...b, enabled: !b.enabled, updatedAt: new Date().toISOString() } : b
          ),
        }));
      },

      getDueBills: () => {
        const today = getToday();
        return get().recurringBills.filter((b) => b.enabled && b.nextDate <= today);
      },

      markExecuted: (id) => {
        set((s) => ({
          recurringBills: s.recurringBills.map((b) => {
            if (b.id !== id) return b;
            const nextDate = calcNextRecurringDate(b.nextDate, b.cycle, b.interval);
            return {
              ...b,
              nextDate,
              executedCount: b.executedCount + 1,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
    }),
    { name: STORAGE_KEYS.RECURRING }
  )
);
