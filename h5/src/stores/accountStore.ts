/**
 * 账户状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, AccountMatchResult } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId } from '@/utils/id';
import { getAcctEmoji, getAcctColor, guessAccountCategory, normalizeAcctName, matchAccount } from '@/utils/account';

interface AccountState {
  accounts: Account[];
  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  repairLegacyAccounts: () => boolean;
  getAccountById: (id: string) => Account | undefined;
  getAccountName: (id: string) => string;
  createAccountIfNeeded: (name: string) => AccountMatchResult;
  updateBalance: (id: string, amount: number, direction: 'income' | 'expense' | 'transfer_in' | 'transfer_out') => void;
  getTotalBalance: () => number;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],

      addAccount: (data) => {
        const now = new Date().toISOString();
        const account: Account = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({ accounts: [...s.accounts, account] }));
        return account;
      },

      updateAccount: (id, updates) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
      },

      /**
       * 修复旧版数据中负债账户缺失的贷款字段
       *
       * 旧版本创建的负债账户可能缺少 loanAmount/annualRate/repayMethod 等字段，
       * 导致还款明细页面无法计算。此方法从 balance 推算 loanAmount 并填充默认值。
       *
       * 注意：种子数据账户的补全由 seed.ts 中的 repairSeedDebtAccounts() 处理。
       * 返回 true 表示执行了修复。
       */
      repairLegacyAccounts: () => {
        const { accounts } = get();
        let repaired = false;
        const updated = accounts.map((a) => {
          if (a.category !== 'debt') return a;
          if (a.loanAmount && a.annualRate && a.totalPeriods && a.repayMethod && a.startDate) return a;

          repaired = true;
          console.warn(`[accountStore] 修复负债账户缺失字段: ${a.name} (${a.id})`);
          const loanAmount = a.loanAmount || Math.abs(a.balance) || 0;
          return {
            ...a,
            loanAmount,
            annualRate: a.annualRate || 0,
            totalPeriods: a.totalPeriods || 0,
            paidPeriods: a.paidPeriods || 0,
            repayMethod: a.repayMethod || 'equal_installment',
            startDate: a.startDate || a.createdAt?.slice(0, 10) || '',
            updatedAt: new Date().toISOString(),
          };
        });
        if (repaired) {
          set({ accounts: updated });
        }
        return repaired;
      },

      getAccountById: (id) => get().accounts.find((a) => a.id === id),

      getAccountName: (id) => {
        const acct = get().accounts.find((a) => a.id === id);
        return acct?.name || '未知账户';
      },

      createAccountIfNeeded: (name) => {
        const { accounts } = get();
        if (!name) return { accountId: '', created: false, accountName: '' };

        const existing = matchAccount(name, accounts);
        if (existing) return { accountId: existing.id, created: false, accountName: existing.name };

        const category = guessAccountCategory(name);
        const normalizedName = normalizeAcctName(name, category);
        const now = new Date().toISOString();
        const newAccount: Account = {
          id: generateId(),
          name: normalizedName,
          category,
          icon: getAcctEmoji(category),
          color: getAcctColor(category),
          balance: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ accounts: [...s.accounts, newAccount] }));
        return { accountId: newAccount.id, created: true, accountName: newAccount.name };
      },

      updateBalance: (id, amount, direction) => {
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== id) return a;
            let bal = a.balance;
            if (direction === 'income' || direction === 'transfer_in') bal += amount;
            else bal -= amount;
            return { ...a, balance: Math.round(bal * 100) / 100 };
          }),
        }));
      },

      getTotalBalance: () => {
        return get().accounts.reduce((sum, a) => sum + a.balance, 0);
      },
    }),
    { name: STORAGE_KEYS.ACCOUNTS }
  )
);
