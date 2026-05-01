/**
 * 我的 - 个人中心页面
 * 记账概况 + 净资产明细 + 快捷入口 + 设置
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts, useTransactions } from '@/hooks';
import { formatAmount } from '@/utils';
import { calcNetWorth } from '@/utils/calculate';
import './index.css';

/** 问候语（根据时段） */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export default function MyPage() {
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  // ===== 净资产计算（使用已有的 calcNetWorth） =====
  const nw = useMemo(() => calcNetWorth(accounts), [accounts]);

  // ===== 按账户类别细分资产/负债 =====
  const nwDetail = useMemo(() => {
    const detail: {
      savings: number;
      virtual: number;
      investment: number;
      creditor: number;
      credit: number;
      debt: number;
    } = { savings: 0, virtual: 0, investment: 0, creditor: 0, credit: 0, debt: 0 };

    for (const a of accounts) {
      if (a.category === 'credit') {
        detail.credit += Math.abs(a.balance);
      } else if (a.category === 'debt') {
        detail.debt += Math.abs(a.balance);
      } else if (a.category === 'investment') {
        detail.investment += a.balance >= 0 ? a.balance : 0;
      } else if (a.category === 'creditor') {
        detail.creditor += a.balance >= 0 ? a.balance : 0;
      } else if (a.category === 'virtual') {
        detail.virtual += a.balance >= 0 ? a.balance : 0;
      } else {
        // savings 及其他默认资产类
        detail.savings += a.balance >= 0 ? a.balance : 0;
      }
    }

    return {
      ...detail,
      savingsAndVirtual: Math.round((detail.savings + detail.virtual) * 100) / 100,
      totalAssets: Math.round((detail.savings + detail.virtual + detail.investment + detail.creditor) * 100) / 100,
      totalLiabilities: Math.round((detail.credit + detail.debt) * 100) / 100,
    };
  }, [accounts]);

  // ===== 记账统计 =====
  const stats = useMemo(() => {
    // 所有记账日期去重
    const allDatesSet = new Set(transactions.map(t => t.date.slice(0, 10)));
    const totalDays = allDatesSet.size;

    // 从今天往前计算连续天数
    let curStreak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (allDatesSet.has(ds)) {
        curStreak++;
      } else {
        if (i === 0) break; // 今天没记，连续断了
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // 当月收支
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}`;
    const monthTx = transactions.filter(t => t.date.startsWith(monthPrefix));
    const monthExpense = monthTx.filter(t => t.direction === 'expense').reduce((s, t) => s + t.amount, 0);
    const monthIncome = monthTx.filter(t => t.direction === 'income').reduce((s, t) => s + t.amount, 0);
    const monthBalance = monthIncome - monthExpense;

    return {
      totalDays,
      totalBills: transactions.length,
      curStreak,
      monthExpense,
      monthIncome,
      monthBalance,
    };
  }, [transactions]);

  // ===== 问候语 =====
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <div className="my-page">
      {/* 头部：问候 + 头像 */}
      <div className="my-header">
        <div className="my-header-inner">
          <div className="my-avatar">👤</div>
          <div className="my-user-info">
            <div className="my-username">记账达人</div>
            <div className="my-user-desc">
              {greeting} 👋 坚持记账第 {stats.curStreak} 天
            </div>
          </div>
        </div>
      </div>

      {/* 记账概况卡片 */}
      <div className="my-card my-overview-card">
        <div className="my-card-title">记账概况</div>
        <div className="my-overview-stats">
          <div className="my-ov-stat">
            <div className="my-ov-num my-ov-primary">{stats.totalDays}</div>
            <div className="my-ov-label">累计天数</div>
          </div>
          <div className="my-ov-stat">
            <div className="my-ov-num my-ov-primary">{stats.totalBills}</div>
            <div className="my-ov-label">总笔数</div>
          </div>
          <div className="my-ov-stat">
            <div className="my-ov-num my-ov-orange">{stats.curStreak}</div>
            <div className="my-ov-label">连续天数</div>
          </div>
        </div>
        <div className="my-month-divider" />
        <div className="my-month-stats">
          <div className="my-ms-item">
            <div className="my-ms-num my-ms-expense">-¥{formatAmount(stats.monthExpense)}</div>
            <div className="my-ms-label">本月支出</div>
          </div>
          <div className="my-ms-item">
            <div className="my-ms-num my-ms-income">+¥{formatAmount(stats.monthIncome)}</div>
            <div className="my-ms-label">本月收入</div>
          </div>
          <div className="my-ms-item">
            <div className={`my-ms-num ${stats.monthBalance >= 0 ? 'my-ms-income' : 'my-ms-expense'}`}>
              {stats.monthBalance >= 0 ? '+¥' : '-¥'}{formatAmount(Math.abs(stats.monthBalance))}
            </div>
            <div className="my-ms-label">本月结余</div>
          </div>
        </div>
      </div>

      {/* 净资产明细卡片 */}
      <div className="my-card my-nw-card">
        <div className="my-card-title">
          净资产明细
          <span className="my-card-more" onClick={() => navigate('/accounts')}>账户详情 ›</span>
        </div>
        <div className="my-nw-center">
          <div className="my-nw-label">净资产</div>
          <div className={`my-nw-value ${nw.netWorth >= 0 ? 'my-nw-positive' : 'my-nw-negative'}`}>
            {nw.netWorth >= 0 ? '¥' : '-¥'}{formatAmount(Math.abs(nw.netWorth))}
          </div>
        </div>
        <div className="my-nw-grid">
          {/* 左列：总资产 */}
          <div className="my-nw-col my-nw-col-asset">
            <div className="my-nw-col-header">💰 总资产 ¥{formatAmount(nwDetail.totalAssets)}</div>
            <div className="my-nw-row">
              <span>💵 存款/虚拟</span>
              <span className="my-nw-green">¥{formatAmount(nwDetail.savingsAndVirtual)}</span>
            </div>
            {nwDetail.investment > 0 && (
              <div className="my-nw-row">
                <span>📈 投资账户</span>
                <span className="my-nw-green">¥{formatAmount(nwDetail.investment)}</span>
              </div>
            )}
            {nwDetail.creditor > 0 && (
              <div className="my-nw-row">
                <span>🤝 借出款</span>
                <span className="my-nw-green">¥{formatAmount(nwDetail.creditor)}</span>
              </div>
            )}
          </div>
          {/* 分割线 */}
          <div className="my-nw-sep" />
          {/* 右列：总负债 */}
          <div className="my-nw-col my-nw-col-liability">
            <div className="my-nw-col-header">📉 总负债 ¥{formatAmount(nwDetail.totalLiabilities)}</div>
            {nwDetail.credit > 0 && (
              <div className="my-nw-row">
                <span>💳 信用卡</span>
                <span className="my-nw-red">¥{formatAmount(nwDetail.credit)}</span>
              </div>
            )}
            {nwDetail.debt > 0 && (
              <div className="my-nw-row">
                <span>🏦 贷款/借贷</span>
                <span className="my-nw-red">¥{formatAmount(nwDetail.debt)}</span>
              </div>
            )}
            {nwDetail.credit === 0 && nwDetail.debt === 0 && (
              <div className="my-nw-row my-nw-empty">
                <span>暂无负债</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="my-card my-menu-card">
        <div className="my-menu-item" onClick={() => navigate('/accounts')}>
          <div className="my-menu-left">
            <span className="my-menu-icon">🏦</span>
            <div className="my-menu-text">
              <div className="my-menu-label">账户管理</div>
              <div className="my-menu-desc">管理银行账户与转账</div>
            </div>
          </div>
          <span className="my-menu-arrow">›</span>
        </div>
        <div className="my-menu-item" onClick={() => navigate('/categories')}>
          <div className="my-menu-left">
            <span className="my-menu-icon">📂</span>
            <div className="my-menu-text">
              <div className="my-menu-label">分类管理</div>
              <div className="my-menu-desc">浏览支出与收入分类</div>
            </div>
          </div>
          <span className="my-menu-arrow">›</span>
        </div>
        <div className="my-menu-item" onClick={() => navigate('/budget')}>
          <div className="my-menu-left">
            <span className="my-menu-icon">💰</span>
            <div className="my-menu-text">
              <div className="my-menu-label">预算管理</div>
              <div className="my-menu-desc">设定月度预算目标</div>
            </div>
          </div>
          <span className="my-menu-arrow">›</span>
        </div>
      </div>

      <div className="my-card my-menu-card">
        <div className="my-menu-item" onClick={() => navigate('/stats')}>
          <div className="my-menu-left">
            <span className="my-menu-icon">📊</span>
            <div className="my-menu-text">
              <div className="my-menu-label">统计分析</div>
              <div className="my-menu-desc">查看收支趋势报表</div>
            </div>
          </div>
          <span className="my-menu-arrow">›</span>
        </div>
        <div className="my-menu-item" onClick={() => navigate('/settings')}>
          <div className="my-menu-left">
            <span className="my-menu-icon">⚙️</span>
            <div className="my-menu-text">
              <div className="my-menu-label">系统设置</div>
              <div className="my-menu-desc">偏好设置与数据管理</div>
            </div>
          </div>
          <span className="my-menu-arrow">›</span>
        </div>
      </div>

      {/* 版本信息 */}
      <div className="my-footer">
        AI记账本 v3.4.0
      </div>
    </div>
  );
}
