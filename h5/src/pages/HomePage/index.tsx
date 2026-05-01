/**
 * 首页 - 资产概览 + 预算进度 + 最近记录 + 快捷操作
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts, useTransactions, useBudget } from '@/hooks';
import { formatAmount, getToday, relativeDate } from '@/utils';
import { calcNetWorth } from '@/utils/calculate';
import EmptyState from '@/components/layout/EmptyState';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { accounts, getAccountName } = useAccounts();
  const { transactions } = useTransactions();
  const currentMonth = getToday().slice(0, 7);

  const { budgetProgress, totalBudget, totalSpent } = useBudget(currentMonth);

  const netWorth = useMemo(() => calcNetWorth(accounts), [accounts]);

  const todayStats = useMemo(() => {
    const todayTx = transactions.filter((t) => t.date === getToday());
    return {
      expense: todayTx.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions]);

  const monthStats = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date.startsWith(currentMonth));
    return {
      expense: monthTx.filter((t) => t.direction === 'expense').reduce((s, t) => s + t.amount, 0),
      income: monthTx.filter((t) => t.direction === 'income').reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions, currentMonth]);

  const budgetRemaining = useMemo(() => {
    return Math.max(0, totalBudget - totalSpent);
  }, [totalBudget, totalSpent]);

  const recentTx = useMemo(() => {
    return [...transactions]
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
      .slice(0, 5);
  }, [transactions]);

  const dirColor = (d: string) => {
    switch (d) {
      case 'expense': return 'var(--color-expense)';
      case 'income': return 'var(--color-income)';
      case 'transfer': return 'var(--color-transfer)';
      default: return 'var(--color-text)';
    }
  };

  const dirSign = (d: string) => (d === 'income' ? '+' : d === 'expense' ? '-' : '');

  return (
    <div className="page home-page">
      {/* 净资产卡片 */}
      <div className="net-worth-card">
        <div className="nw-label">净资产</div>
        <div className="nw-amount">¥{formatAmount(netWorth.netWorth)}</div>
        <div className="nw-row">
          <span>资产 ¥{formatAmount(netWorth.totalAssets)}</span>
          <span>负债 ¥{formatAmount(netWorth.totalLiabilities)}</span>
        </div>
      </div>

      {/* 今日/本月概览 */}
      <div className="overview-row">
        <div className="overview-item">
          <div className="ov-label">今日支出</div>
          <div className="ov-value text-expense">¥{formatAmount(todayStats.expense)}</div>
        </div>
        <div className="overview-item">
          <div className="ov-label">本月支出</div>
          <div className="ov-value text-expense">¥{formatAmount(monthStats.expense)}</div>
        </div>
        <div className="overview-item">
          <div className="ov-label">本月收入</div>
          <div className="ov-value text-income">¥{formatAmount(monthStats.income)}</div>
        </div>
      </div>

      {/* 预算概览 */}
      <div className="overview-row">
        <div className="overview-item" onClick={() => navigate('/budget')} style={{ cursor: 'pointer' }}>
          <div className="ov-label">本月预算</div>
          <div className="ov-value">{totalBudget > 0 ? `¥${formatAmount(totalBudget)}` : '未设置'}</div>
        </div>
        <div className="overview-item" onClick={() => navigate('/budget')} style={{ cursor: 'pointer' }}>
          <div className="ov-label">预算剩余</div>
          <div className={`ov-value ${totalBudget > 0 ? (budgetRemaining > 0 ? 'text-income' : 'text-expense') : ''}`}>
            {totalBudget > 0 ? `¥${formatAmount(budgetRemaining)}` : '--'}
          </div>
        </div>
        <div className="overview-item" onClick={() => navigate('/budget')} style={{ cursor: 'pointer' }}>
          <div className="ov-label">预算进度</div>
          <div className={`ov-value ${totalBudget > 0 && totalSpent > totalBudget ? 'text-expense' : ''}`}>
            {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : '--'}
          </div>
        </div>
      </div>

      {/* 预算进度条 */}
      {budgetProgress.length > 0 && (
        <div className="card budget-progress-card">
          <div className="section-title">预算详情</div>
          {budgetProgress.slice(0, 3).map((bp) => (
            <div key={bp.budget.id} className="budget-row">
              <span className="bp-name">{bp.budget.category || '总预算'}</span>
              <div className="bp-bar-track">
                <div
                  className={`bp-bar-fill ${bp.alertLevel}`}
                  style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                />
              </div>
              <span className="bp-amount">¥{formatAmount(bp.spent)} / ¥{formatAmount(bp.budget.monthlyAmount)}</span>
            </div>
          ))}
          {budgetProgress.length > 3 && (
            <div className="view-more" onClick={() => navigate('/budget')}>
              查看全部 {budgetProgress.length} 项 &gt;
            </div>
          )}
        </div>
      )}

      {/* 快捷操作 */}
      <div className="quick-actions">
        <div className="qa-item" onClick={() => navigate('/accounts')}>
          <span className="qa-icon">💳</span><span>账户</span>
        </div>
        <div className="qa-item" onClick={() => navigate('/categories')}>
          <span className="qa-icon">🏷️</span><span>分类</span>
        </div>
        <div className="qa-item" onClick={() => navigate('/budget')}>
          <span className="qa-icon">💰</span><span>预算</span>
        </div>
        <div className="qa-item" onClick={() => navigate('/settings')}>
          <span className="qa-icon">⚙️</span><span>设置</span>
        </div>
      </div>

      {/* 最近记录 */}
      <div className="card recent-card">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <span className="section-title" style={{ margin: 0 }}>最近记录</span>
          <span className="text-sm text-secondary" style={{ cursor: 'pointer' }} onClick={() => navigate('/bills')}>
            查看全部 &gt;
          </span>
        </div>
        {recentTx.length === 0 && <EmptyState icon="📝" message="暂无记录，快去记一笔吧" />}
        {recentTx.map((tx) => (
          <div key={tx.id} className="recent-item">
            <div className="recent-left">
              <span className="recent-dir" style={{ color: dirColor(tx.direction) }}>
                {tx.direction === 'expense' ? '支' : tx.direction === 'income' ? '收' : tx.direction === 'transfer' ? '转' : '退'}
              </span>
              <div>
                <div className="recent-cat">{tx.category}{tx.subCategory ? ` · ${tx.subCategory}` : ''}</div>
                <div className="text-sm text-hint ellipsis">{tx.remark || getAccountName(tx.accountId)}</div>
              </div>
            </div>
            <div className="recent-right">
              <div className="recent-amount" style={{ color: dirColor(tx.direction) }}>
                {dirSign(tx.direction)}¥{formatAmount(tx.amount)}
              </div>
              <div className="text-sm text-hint">{relativeDate(tx.date)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
