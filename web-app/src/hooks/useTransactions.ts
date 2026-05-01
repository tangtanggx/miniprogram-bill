/**
 * 交易记录 Hook
 */

import { useCallback } from 'react';
import { useTransactionStore } from '@/stores';
import { useAccountStore } from '@/stores';
import type { TransactionDirection } from '@/types';

interface QuickRecordParams {
  date: string;
  time: string;
  direction: TransactionDirection;
  amount: number;
  accountName: string;
  category: string;
  subCategory: string;
  remark: string;
  tags?: string;
  reimbursable?: boolean;
}

export function useTransactions() {
  const transactions = useTransactionStore((s) => s.transactions);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const getTransactionsByMonth = useTransactionStore((s) => s.getTransactionsByMonth);
  const getTransactionsByDate = useTransactionStore((s) => s.getTransactionsByDate);
  const getTransactionsByRange = useTransactionStore((s) => s.getTransactionsByRange);
  const getMonthSummary = useTransactionStore((s) => s.getMonthSummary);
  const getCategorySummary = useTransactionStore((s) => s.getCategorySummary);
  const getDailySummary = useTransactionStore((s) => s.getDailySummary);
  const getReimbursable = useTransactionStore((s) => s.getReimbursable);
  const confirmReimburse = useTransactionStore((s) => s.confirmReimburse);
  const createAccountIfNeeded = useAccountStore((s) => s.createAccountIfNeeded);

  const quickRecord = useCallback(
    (params: QuickRecordParams) => {
      const { accountId } = createAccountIfNeeded(params.accountName);
      return addTransaction({
        date: params.date,
        time: params.time,
        direction: params.direction,
        amount: params.amount,
        accountId,
        category: params.category,
        subCategory: params.subCategory,
        remark: params.remark,
        tags: params.tags,
        reimbursable: params.reimbursable,
      });
    },
    [addTransaction, createAccountIfNeeded]
  );

  return {
    transactions,
    addTransaction,
    quickRecord,
    updateTransaction,
    deleteTransaction,
    getTransactionsByMonth,
    getTransactionsByDate,
    getTransactionsByRange,
    getMonthSummary,
    getCategorySummary,
    getDailySummary,
    getReimbursable,
    confirmReimburse,
  };
}
