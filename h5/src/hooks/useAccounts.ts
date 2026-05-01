/**
 * 账户管理 Hook
 */

import { useCallback } from 'react';
import { useAccountStore } from '@/stores';
import type { Account, AccountCategory } from '@/types';

export function useAccounts() {
  const accounts = useAccountStore((s) => s.accounts);
  const addAccount = useAccountStore((s) => s.addAccount);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);
  const createAccountIfNeeded = useAccountStore((s) => s.createAccountIfNeeded);
  const getAccountName = useAccountStore((s) => s.getAccountName);
  const getTotalBalance = useAccountStore((s) => s.getTotalBalance);

  const createAccount = useCallback(
    (name: string, category?: AccountCategory, extra?: Partial<Account>) => {
      return addAccount({
        name,
        category: category || 'virtual',
        icon: '',
        color: '#999',
        balance: 0,
        ...extra,
      });
    },
    [addAccount]
  );

  return {
    accounts,
    totalBalance: getTotalBalance(),
    createAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    createAccountIfNeeded,
    getAccountName,
  };
}
