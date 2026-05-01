/**
 * 交易记录状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId } from '@/utils/id';
import { useAccountStore } from './accountStore';

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByMonth: (year: number, month: number) => Transaction[];
  getTransactionsByDate: (date: string) => Transaction[];
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByRange: (startDate: string, endDate?: string) => Transaction[];
  getReimbusable: () => Transaction[];
  confirmReimburse: (id: string) => void;
  getMonthSummary: (year: number, month: number) => { totalExpense: number; totalIncome: number; count: number };
  getCategorySummary: (year: number, month: number) => Array<{ category: string; subCategory: string; amount: number; count: number }>;
  getDailySummary: (year: number, month: number) => Array<{ date: string; expense: number; income: number }>;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (txData) => {
        const now = new Date().toISOString();
        const tx: Transaction = { ...txData, id: generateId(), createdAt: now, updatedAt: now };
        // 更新账户余额
        const acctStore = useAccountStore.getState();
        if (tx.accountId && tx.direction !== 'transfer') {
          acctStore.updateBalance(tx.accountId, tx.amount, tx.direction);
        }
        // 转账：同时更新目标账户
        if (tx.direction === 'transfer' && tx.targetAccountId) {
          acctStore.updateBalance(tx.targetAccountId, tx.amount, 'income');
        }
        // 可报销标记
        if (tx.direction === 'expense' && tx.reimbursable) {
          tx.reimbStatus = 'pending';
        }
        set((s) => ({ transactions: [tx, ...s.transactions] }));
        return tx;
      },

      updateTransaction: (id, updates) => {
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },

      deleteTransaction: (id) => {
        const tx = get().transactions.find((t) => t.id === id);
        if (tx) {
          const acctStore = useAccountStore.getState();
          // 恢复账户余额
          if (tx.accountId && tx.direction !== 'transfer') {
            // 删除支出 → 增加余额；删除收入 → 减少余额
            const reverseDir = tx.direction === 'expense' ? 'income' : 'expense';
            acctStore.updateBalance(tx.accountId, tx.amount, reverseDir);
          }
          // 转账：恢复目标账户余额
          if (tx.direction === 'transfer' && tx.targetAccountId) {
            acctStore.updateBalance(tx.targetAccountId, tx.amount, 'expense');
          }
        }
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
      },

      getTransactionsByMonth: (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return get().transactions
          .filter((t) => t.date.startsWith(prefix))
          .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
      },

      getTransactionsByDate: (date) => {
        return get().transactions
          .filter((t) => t.date === date)
          .sort((a, b) => b.time.localeCompare(a.time));
      },

      getTransactionsByAccount: (accountId) => {
        return get().transactions
          .filter((t) => t.accountId === accountId)
          .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
      },

      getTransactionsByRange: (startDate, endDate) => {
        return get().transactions
          .filter((t) => {
            if (t.date < startDate) return false;
            if (endDate && t.date > endDate) return false;
            return true;
          })
          .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
      },

      getReimbusable: () => {
        return get().transactions
          .filter((t) => t.reimbusable && t.reimbStatus !== 'done')
          .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
      },

      confirmReimburse: (id: string) => {
        const now = new Date().toISOString();
        const acctStore = useAccountStore.getState();
        const tx = get().transactions.find((t) => t.id === id);
        if (!tx || tx.reimbStatus === 'done') return;

        // 1. 更新原支出记录
        const updatedTx = {
          ...tx,
          reimbStatus: 'done' as const,
          reimbursed: true,
          updatedAt: now,
        };

        // 2. 自动生成收入记录
        const incomeTx: Transaction = {
          id: generateId(),
          date: now.slice(0, 10),
          time: now.slice(11, 16),
          direction: 'income',
          amount: tx.amount,
          accountId: tx.accountId,
          category: '其他收入',
          subCategory: '报销',
          remark: `报销到账：${tx.remark || tx.subCategory || tx.category}`,
          linkedReimbId: tx.id,
          createdAt: now,
          updatedAt: now,
        };

        // 3. 更新余额（收入增加余额）
        acctStore.updateBalance(tx.accountId, incomeTx.amount, 'income');

        // 4. 保存
        set((s) => ({
          transactions: [incomeTx, ...s.transactions.map((t) => (t.id === id ? updatedTx : t))],
        }));
      },

      getMonthSummary: (year, month) => {
        const txs = get().getTransactionsByMonth(year, month);
        return {
          totalExpense: txs.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0),
          totalIncome: txs.filter((t) => t.direction === 'income').reduce((s, t) => s + t.amount, 0),
          count: txs.length,
        };
      },

      getCategorySummary: (year, month) => {
        const txs = get().getTransactionsByMonth(year, month).filter((t) => t.direction === 'expense');
        const map = new Map<string, { category: string; subCategory: string; amount: number; count: number }>();
        for (const tx of txs) {
          const key = `${tx.category}|${tx.subCategory || ''}`;
          const existing = map.get(key);
          if (existing) {
            existing.amount += tx.amount;
            existing.count += 1;
          } else {
            map.set(key, { category: tx.category, subCategory: tx.subCategory, amount: tx.amount, count: 1 });
          }
        }
        return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
      },

      getDailySummary: (year, month) => {
        const txs = get().getTransactionsByMonth(year, month);
        const map = new Map<string, { date: string; expense: number; income: number }>();
        for (const tx of txs) {
          const existing = map.get(tx.date) || { date: tx.date, expense: 0, income: 0 };
          if (tx.direction === 'expense') existing.expense += tx.amount;
          else if (tx.direction === 'income') existing.income += tx.amount;
          map.set(tx.date, existing);
        }
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
      },
    }),
    { name: STORAGE_KEYS.TRANSACTIONS }
  )
);
