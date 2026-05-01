/**
 * 初始化种子数据注入逻辑
 *
 * 在应用首次启动时（localStorage 无账户/交易数据），
 * 自动注入 SEED_ACCOUNTS + SEED_TRANSACTIONS，让新用户开箱即用。
 *
 * 策略：
 * - 不直接操作 localStorage，而是通过 Zustand action 逐个添加
 * - 使用 accounting_seeded 标记防止重复注入
 * - 在 App 组件 mount 后（Zustand hydration 完成）调用
 */

import { SEED_ACCOUNTS, SEED_TRANSACTIONS } from '@/data/seedData';
import type { Account } from '@/types';
import type { Transaction } from '@/types';

/** 标记是否已完成过种子注入（防止重复注入） */
const SEEDED_KEY = 'accounting_seeded';

/**
 * 检测并注入种子数据
 *
 * 仅在以下条件**同时**满足时注入：
 * 1. 未曾执行过种子注入（localStorage 无 accounting_seeded 标记）
 * 2. accounts store 中无任何账户
 *
 * 通过 Zustand action 注入，确保状态一致性。
 * 注入完成后设置 accounting_seeded 标记。
 */
export async function checkAndSeed(): Promise<void> {
  // 动态导入 store，避免循环依赖
  const { useAccountStore } = await import('@/stores/accountStore');
  const { useTransactionStore } = await import('@/stores/transactionStore');

  const seeded = localStorage.getItem(SEEDED_KEY);

  // 已注入过 → 跳过
  if (seeded) {
    return;
  }

  // 检查现有账户数量
  const { accounts } = useAccountStore.getState();
  if (accounts.length > 0) {
    // 已有账户数据 → 标记已注入，不再处理
    localStorage.setItem(SEEDED_KEY, '1');
    return;
  }

  const now = new Date().toISOString();

  // 逐个添加账户（使用固定 ID）
  const idMap = new Map<number, string>();
  for (let i = 0; i < SEED_ACCOUNTS.length; i++) {
    const acct = SEED_ACCOUNTS[i];
    const fullAccount: Account = {
      ...acct,
      id: `seed-a${i + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    // 为贷款账户自动计算下次还款日期
    if (fullAccount.category === 'debt' && fullAccount.startDate && fullAccount.totalPeriods && fullAccount.paidPeriods !== undefined) {
      const start = new Date(fullAccount.startDate);
      const nextMonth = new Date(start);
      nextMonth.setMonth(nextMonth.getMonth() + (fullAccount.paidPeriods + 1));
      const yyyy = nextMonth.getFullYear();
      const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const dd = String(nextMonth.getDate()).padStart(2, '0');
      fullAccount.nextRepayDate = `${yyyy}-${mm}-${dd}`;
    }
    // 使用 setState 绕过 generateId，直接写入固定 ID
    useAccountStore.setState((s) => ({
      accounts: [...s.accounts, fullAccount],
    }));
    idMap.set(i, `seed-a${i + 1}`);
  }

  // 逐个添加交易
  for (let i = 0; i < SEED_TRANSACTIONS.length; i++) {
    const tx = SEED_TRANSACTIONS[i];
    const fullTx: Transaction = {
      ...tx,
      id: `seed-t${i + 1}`,
      createdAt: now,
      updatedAt: now,
    };
    // 使用 setState 绕过 generateId + updateBalance（seed数据余额已预设）
    useTransactionStore.setState((s) => ({
      transactions: [...s.transactions, fullTx],
    }));
  }

  // 标记已完成注入
  localStorage.setItem(SEEDED_KEY, '1');

  console.log(
    `[seed] 已注入 ${SEED_ACCOUNTS.length} 个账户 + ${SEED_TRANSACTIONS.length} 笔交易`
  );
}

/**
 * 修复种子负债账户中缺失的贷款字段
 *
 * 旧版本注入的种子数据可能缺少 loanAmount/annualRate/repayMethod 等字段，
 * 此函数检测种子负债账户并从 SEED_ACCOUNTS 模板中补全。
 *
 * 每次应用启动时调用（由 App.tsx 驱动），幂等操作。
 */
export async function repairSeedDebtAccounts(): Promise<void> {
  const { useAccountStore } = await import('@/stores/accountStore');
  const { accounts } = useAccountStore.getState();

  let repaired = false;
  const updated = accounts.map((a) => {
    // 只处理负债类且缺少必要字段的种子账户
    if (a.category !== 'debt') return a;
    if (a.loanAmount && a.annualRate && a.totalPeriods && a.repayMethod && a.startDate) return a;
    if (!a.id.startsWith('seed-a')) return a;

    // 从 SEED_ACCOUNTS 中找到对应的种子模板
    const seedIdx = parseInt(a.id.replace('seed-a', ''), 10) - 1;
    const seedAcct = SEED_ACCOUNTS[seedIdx];
    if (!seedAcct || seedAcct.category !== 'debt') return a;

    repaired = true;
    console.warn(`[seed] 补全种子负债账户 ${a.name} (${a.id}) 的贷款字段`);

    // 计算下次还款日期
    let nextRepayDate = '';
    if (seedAcct.startDate && seedAcct.totalPeriods) {
      const paid = a.paidPeriods ?? seedAcct.paidPeriods ?? 0;
      const start = new Date(seedAcct.startDate);
      const nextMonth = new Date(start);
      nextMonth.setMonth(nextMonth.getMonth() + (paid + 1));
      const yyyy = nextMonth.getFullYear();
      const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
      const dd = String(nextMonth.getDate()).padStart(2, '0');
      nextRepayDate = `${yyyy}-${mm}-${dd}`;
    }

    return {
      ...a,
      loanAmount: a.loanAmount || seedAcct.loanAmount || 0,
      annualRate: a.annualRate || seedAcct.annualRate || 0,
      repayMethod: a.repayMethod || seedAcct.repayMethod || 'equal_installment',
      totalPeriods: a.totalPeriods || seedAcct.totalPeriods || 0,
      paidPeriods: a.paidPeriods ?? seedAcct.paidPeriods ?? 0,
      startDate: a.startDate || seedAcct.startDate || '',
      repayCycle: a.repayCycle || seedAcct.repayCycle || 'monthly',
      nextRepayDate: a.nextRepayDate || nextRepayDate,
      updatedAt: new Date().toISOString(),
    };
  });

  if (repaired) {
    useAccountStore.setState({ accounts: updated });
    console.log('[seed] 已补全种子负债账户的贷款字段');
  }
}
