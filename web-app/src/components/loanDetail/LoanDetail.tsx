/**
 * LoanDetail 贷款/债权还款明细组件
 *
 * 功能：
 * - 贷款概览（剩余本金、每期还款额、总利息）
 * - 自动计算已还期数
 * - 还款汇总（已还/未还本金利息）
 * - 逐期还款明细表
 * - 修改功能（编辑贷款参数、提前还款等）
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { NavBar, Popup, Toast, Dialog } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { useAccountStore } from '@/stores/index';
import type { Account, RepayMethod, RepayCycle, RateType } from '@/types/index';
import { formatAmount, calcAutoPaidPeriods } from '@/utils/index';
import { REPAY_METHOD_OPTIONS, REPAY_CYCLE_OPTIONS, REPAY_METHOD_LABELS, REPAY_CYCLE_LABELS, RATE_TYPE_OPTIONS, convertToAnnualRate, convertFromAnnualRate, formatRateDisplay } from '@/constants/index';
import type { LoanRepaymentSummary, RepaymentScheduleItem } from '@/utils/index';
import { calcLoanRepayment } from '@/utils/index';
import './LoanDetail.css';

type ScheduleFilter = 'remaining' | 'paid' | 'all';

interface EditForm {
  loanAmount: number;
  annualRate: number;
  totalPeriods: number;
  paidPeriods: number;
  repayMethod: RepayMethod;
  repayCycle: RepayCycle;
  startDate: string;
  nextRepayDate: string;
  balance: number;
  autoPaid: boolean;
  // 债权字段
  creditorAmount: number;
  creditorRate: number;
  creditorRateType: RateType;
  creditorInfinite: boolean;
  creditorTotalPeriods: number;
  creditorPaidPeriods: number;
  creditorRepayMethod: RepayMethod;
  creditorRepayCycle: RepayCycle;
  creditorStartDate: string;
  creditorNextDate: string;
  creditorAutoPaid: boolean;
}

const LoanDetail: React.FC<{
  account: Account;
  onBack: () => void;
}> = ({ account, onBack }) => {
  const [filter, setFilter] = useState<ScheduleFilter>('remaining');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [showPrepay, setShowPrepay] = useState(false);
  const [prepayAmount, setPrepayAmount] = useState('');
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const accounts = useAccountStore((s) => s.accounts);

  const isCreditor = account.category === 'creditor';

  // 标签映射
  const labelMap = useMemo(() => ({
    amount: isCreditor ? '借出金额' : '贷款金额',
    periods: isCreditor ? '借出期限' : '贷款期限',
    rate: isCreditor ? '利率' : '年利率',
    method: isCreditor ? '还款方式' : '还款方式',
    startDate: isCreditor ? '借出日期' : '贷款日期',
    nextDate: isCreditor ? '下次收款' : '下次还款',
    paidPeriods: isCreditor ? '已收期数' : '已还期数',
    remaining: isCreditor ? '待收本金' : '剩余本金',
    prepay: isCreditor ? '提前收款' : '提前还款',
    payAction: isCreditor ? '收款' : '还款',
    title: isCreditor ? '收款明细' : '还款明细',
  }), [isCreditor]);

  // 获取最新账户数据
  const latestAccount = useMemo(
    () => accounts.find((a) => a.id === account.id) || account,
    [accounts, account.id],
  );

  // 自动计算已还期数
  const autoPaid = useMemo(() => {
    const sDate = isCreditor ? latestAccount.creditorStartDate : latestAccount.startDate;
    const tPeriods = isCreditor ? latestAccount.creditorTotalPeriods : latestAccount.totalPeriods;
    if (!sDate || !tPeriods) return 0;
    return calcAutoPaidPeriods(sDate, tPeriods);
  }, [isCreditor, latestAccount.creditorStartDate, latestAccount.startDate, latestAccount.creditorTotalPeriods, latestAccount.totalPeriods]);

  const effectivePaid = (isCreditor ? latestAccount.creditorAutoPaid : latestAccount.autoPaid) === false
    ? ((isCreditor ? latestAccount.creditorPaidPeriods : latestAccount.paidPeriods) || 0)
    : autoPaid;

  const isCreditorInfiniteCalc = isCreditor && (latestAccount as any).creditorInfinite;

  // 用 effectivePaid 构造临时账户对象用于计算
  const accountForCalc = useMemo<Account>(() => {
    const base = { ...latestAccount, paidPeriods: effectivePaid };
    if (isCreditor) {
      base.loanAmount = base.creditorAmount || 0;
      base.annualRate = base.creditorRate || 0;
      base.totalPeriods = isCreditorInfiniteCalc
        ? Math.max(effectivePaid + 360, 360)
        : (base.creditorTotalPeriods || 0);
      base.repayMethod = base.creditorRepayMethod || 'bullet';
      base.startDate = base.creditorStartDate || '';
    }
    return base;
  }, [latestAccount, effectivePaid, isCreditor, isCreditorInfiniteCalc]);

  const summary = useMemo<LoanRepaymentSummary | null>(
    () => calcLoanRepayment(accountForCalc),
    [accountForCalc],
  );

  // 打开编辑面板
  const openEdit = useCallback(() => {
    setEditForm({
      loanAmount: latestAccount.loanAmount || 0,
      annualRate: latestAccount.annualRate || 0,
      totalPeriods: latestAccount.totalPeriods || 0,
      paidPeriods: latestAccount.paidPeriods || 0,
      repayMethod: latestAccount.repayMethod || 'equal_installment',
      repayCycle: latestAccount.repayCycle || 'monthly',
      startDate: latestAccount.startDate || '',
      nextRepayDate: latestAccount.nextRepayDate || '',
      balance: latestAccount.balance,
      autoPaid: latestAccount.autoPaid !== false,
      creditorAmount: latestAccount.creditorAmount || 0,
      creditorRate: latestAccount.creditorRate || 0,
      creditorRateType: (latestAccount as any).creditorRateType || 'annual',
      creditorInfinite: (latestAccount as any).creditorInfinite || false,
      creditorTotalPeriods: latestAccount.creditorTotalPeriods || 0,
      creditorPaidPeriods: latestAccount.creditorPaidPeriods || 0,
      creditorRepayMethod: latestAccount.creditorRepayMethod || 'bullet',
      creditorRepayCycle: latestAccount.creditorRepayCycle || 'single',
      creditorStartDate: latestAccount.creditorStartDate || '',
      creditorNextDate: latestAccount.creditorNextDate || '',
      creditorAutoPaid: latestAccount.creditorAutoPaid !== false,
    });
    setShowEdit(true);
  }, [latestAccount]);

  // 保存编辑
  const handleSave = useCallback(() => {
    if (!editForm) return;

    if (isCreditor) {
      if (!editForm.creditorAmount) { Toast.show({ content: '请输入借出金额', icon: 'fail' }); return; }
      if (!editForm.creditorInfinite && !editForm.creditorTotalPeriods) { Toast.show({ content: '请输入借出期限', icon: 'fail' }); return; }

      const updates: Partial<Account> = {
        creditorAmount: editForm.creditorAmount,
        creditorRate: editForm.creditorRate,
        creditorRateType: editForm.creditorRateType,
        creditorInfinite: editForm.creditorInfinite,
        creditorTotalPeriods: editForm.creditorInfinite ? 9999 : editForm.creditorTotalPeriods,
        creditorPaidPeriods: editForm.creditorAutoPaid ? 0 : editForm.creditorPaidPeriods,
        creditorRepayMethod: editForm.creditorRepayMethod,
        creditorRepayCycle: editForm.creditorRepayCycle,
        creditorStartDate: editForm.creditorStartDate,
        creditorAutoPaid: editForm.creditorAutoPaid,
      };
      if (editForm.creditorInfinite) {
        updates.balance = editForm.creditorAmount;
      } else {
        const effective = editForm.creditorAutoPaid ? autoPaid : editForm.creditorPaidPeriods;
        const calcAccount: Account = {
          ...latestAccount,
          loanAmount: editForm.creditorAmount,
          annualRate: editForm.creditorRate,
          totalPeriods: Math.max(effective + 360, 360),
          paidPeriods: effective,
          repayMethod: editForm.creditorRepayMethod,
          startDate: editForm.creditorStartDate,
        } as Account;
        const s = calcLoanRepayment(calcAccount);
        updates.balance = s ? s.remainingPrincipal : editForm.creditorAmount;
      }
      updateAccount(latestAccount.id, updates);
    } else {
      if (!editForm.loanAmount) { Toast.show({ content: '请输入贷款金额', icon: 'fail' }); return; }
      if (!editForm.totalPeriods) { Toast.show({ content: '请输入贷款期限', icon: 'fail' }); return; }

      const updates: Partial<Account> = {
        loanAmount: editForm.loanAmount,
        annualRate: editForm.annualRate,
        totalPeriods: editForm.totalPeriods,
        paidPeriods: editForm.autoPaid ? 0 : editForm.paidPeriods,
        repayMethod: editForm.repayMethod,
        repayCycle: editForm.repayCycle,
        startDate: editForm.startDate,
        nextRepayDate: editForm.nextRepayDate,
        autoPaid: editForm.autoPaid,
      };
      const effective = editForm.autoPaid ? autoPaid : editForm.paidPeriods;
      const calcAccount: Account = {
        ...latestAccount,
        loanAmount: editForm.loanAmount,
        annualRate: editForm.annualRate,
        totalPeriods: editForm.totalPeriods,
        paidPeriods: effective,
        repayMethod: editForm.repayMethod,
        startDate: editForm.startDate,
      } as Account;
      const s = calcLoanRepayment(calcAccount);
      updates.balance = s ? -s.remainingPrincipal : -editForm.loanAmount;
      updateAccount(latestAccount.id, updates);
    }

    setShowEdit(false);
    Toast.show({ content: '保存成功', icon: 'success' });
  }, [editForm, isCreditor, latestAccount, updateAccount, autoPaid]);

  // 快捷操作：打开提前还款/收款弹窗
  const openPrepay = useCallback(() => {
    if (!summary) return;
    setPrepayAmount('');
    setShowPrepay(true);
  }, [summary]);

  // 执行提前还款/收款
  const handlePrepay = useCallback((extraPrincipal: number) => {
    if (!summary) return;
    const actionText = isCreditor ? '提前收款' : '提前还款';
    const confirmMsg = isCreditor
      ? `确认提前收款 ¥${formatAmount(extraPrincipal)}？将减少待收本金。`
      : `确认提前还款 ¥${formatAmount(extraPrincipal)}？将减少剩余本金。`;
    Dialog.confirm({
      content: confirmMsg,
      confirmText: '确认',
      onConfirm: () => {
        const newRemaining = Math.max(0, summary.remainingPrincipal - extraPrincipal);
        const newAmount = Math.round((summary.paidPrincipal + newRemaining) * 100) / 100;
        if (isCreditor) {
          updateAccount(latestAccount.id, {
            creditorAmount: newAmount,
            balance: newRemaining,
          });
        } else {
          updateAccount(latestAccount.id, {
            loanAmount: newAmount,
            balance: -newRemaining,
          });
        }
        Toast.show({ content: `${actionText}成功`, icon: 'success' });
        setShowPrepay(false);
      },
    });
  }, [summary, isCreditor, latestAccount.id, updateAccount]);

  // 筛选明细
  const filteredSchedule = useMemo(() => {
    if (!summary) return [];
    const { schedule, paidPeriods } = summary;
    if (filter === 'remaining') return schedule.slice(paidPeriods);
    if (filter === 'paid') return schedule.slice(0, paidPeriods);
    return schedule;
  }, [summary, filter]);

  // ===== 信息不完整时的 early return =====
  if (!summary) {
    const missing: string[] = [];
    if (isCreditor) {
      if (!latestAccount.creditorAmount) missing.push('借出金额');
      if (!(latestAccount as any).creditorInfinite && !latestAccount.creditorTotalPeriods) missing.push('借出期限');
    } else {
      if (!latestAccount.loanAmount) missing.push('贷款金额');
      if (!latestAccount.totalPeriods) missing.push('贷款期限');
    }

    return (
      <div className="loan-detail">
        <NavBar className="page-navbar" onBack={onBack}>{isCreditor ? '收款明细' : '还款明细'}</NavBar>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
          <div style={{ fontSize: 16, marginBottom: 12, color: '#999' }}>贷款信息不完整，无法生成还款明细。</div>
          <div style={{ fontSize: 14, color: '#cc0000', marginBottom: 16 }}>缺失字段：{missing.join('、') || '未知'}</div>
          <div style={{ fontSize: 12, color: '#bbb' }}>请点击"修改"按钮补全贷款信息。</div>
          <button className="ld-edit-btn" onClick={openEdit} style={{ marginTop: 16 }}>{isCreditor ? '修改借出信息' : '修改贷款信息'}</button>
        </div>
      </div>
    );
  }

  // ===== 主渲染 =====
  const progressPercent = !isCreditorInfiniteCalc && summary.totalPeriods > 0
    ? Math.round((summary.paidPeriods / summary.totalPeriods) * 100)
    : 0;

  const rateDisplay = isCreditor
    ? formatRateDisplay(latestAccount.creditorRate || 0, (latestAccount as any).creditorRateType || 'annual')
    : `${latestAccount.annualRate}%`;

  const periodDisplay = isCreditorInfiniteCalc
    ? '无限期'
    : `${summary.paidPeriods}/${summary.totalPeriods}期`;

  const nextRepayDisplay = isCreditor
    ? (latestAccount.creditorNextDate || '--')
    : (latestAccount.nextRepayDate || '--');

  const startDateDisplay = isCreditor
    ? (latestAccount.creditorStartDate || '--')
    : (latestAccount.startDate || '--');

  const cycleDisplay = isCreditor
    ? (REPAY_CYCLE_LABELS[latestAccount.creditorRepayCycle || 'single'] || '')
    : (REPAY_CYCLE_LABELS[latestAccount.repayCycle || 'monthly'] || '');

  const methodDisplay = REPAY_METHOD_LABELS[summary.repayMethod] || '';

  const autoLabel = (isCreditor ? latestAccount.creditorAutoPaid : latestAccount.autoPaid) !== false
    ? '自动'
    : '';

  return (
    <div className="loan-detail">
      <NavBar className="page-navbar" onBack={onBack}>
        {isCreditor ? '收款明细' : '还款明细'}
      </NavBar>

      {/* 贷款概览卡片 */}
      <div className="ld-overview">
        <div className="ld-overview-header">
          <span className="ld-overview-name">
            {latestAccount.icon} {latestAccount.name}
          </span>
          <span className="ld-overview-method">
            {methodDisplay}
          </span>
        </div>

        <div className="ld-remaining-row">
          <div className="ld-remaining-label">{labelMap.remaining}</div>
          <div className="ld-remaining-value">¥{formatAmount(summary.remainingPrincipal)}</div>
        </div>

        <div className="ld-stats-row">
          <div className="ld-stat-item">
            <div className="ld-stat-label">每期{labelMap.payAction}</div>
            <div className="ld-stat-value">¥{formatAmount(summary.monthlyPayment)}</div>
          </div>
          <div className="ld-stat-item">
            <div className="ld-stat-label">总利息</div>
            <div className="ld-stat-value">¥{formatAmount(summary.totalInterest)}</div>
          </div>
          <div className="ld-stat-item">
            <div className="ld-stat-label">还款进度</div>
            <div className="ld-stat-value">
              {isCreditorInfiniteCalc ? `${summary.paidPeriods}期` : periodDisplay}
            </div>
          </div>
        </div>

        {!isCreditorInfiniteCalc && (
          <div className="ld-progress-wrap">
            <div className="ld-progress-track">
              <div className="ld-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="ld-progress-text">
              <span>已{labelMap.payAction} {progressPercent}%</span>
              <span>剩余 {100 - progressPercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* 借出/贷款信息 */}
      <div className="ld-info-card">
        <div className="ld-info-title-row">
          <div className="ld-info-title">{isCreditor ? '借出信息' : '贷款信息'}</div>
          <div className="ld-title-actions">
            <button className="ld-edit-btn ld-prepay-btn" onClick={openPrepay}>
              {isCreditor ? '提前收款' : '提前还款'}
            </button>
            <button className="ld-edit-btn" onClick={openEdit}>修改</button>
          </div>
        </div>
        <div className="ld-info-grid">
          <div className="ld-info-item">
            <span className="ld-info-label">{labelMap.amount}</span>
            <span className="ld-info-value">¥{formatAmount(isCreditor ? latestAccount.creditorAmount : latestAccount.loanAmount)}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">{labelMap.periods}</span>
            <span className="ld-info-value">
              {isCreditorInfiniteCalc ? '无限期' : `${summary.totalPeriods}个月`}
            </span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">{labelMap.rate}</span>
            <span className="ld-info-value highlight">{rateDisplay}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">还款方式</span>
            <span className="ld-info-value">{methodDisplay}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">{isCreditor ? '借出日期' : '贷款日期'}</span>
            <span className="ld-info-value">{startDateDisplay}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">{labelMap.nextDate}</span>
            <span className="ld-info-value">{nextRepayDisplay}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">{labelMap.paidPeriods}</span>
            <span className="ld-info-value">
              {summary.paidPeriods}期
              {autoLabel && <span className="ld-auto-badge">{autoLabel}</span>}
            </span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">{labelMap.remaining}</span>
            <span className="ld-info-value">¥{formatAmount(summary.remainingPrincipal)}</span>
          </div>
        </div>
      </div>

      {/* 还款汇总 */}
      <div className="ld-info-card">
        <div className="ld-info-title">{isCreditor ? '收款汇总' : '还款汇总'}</div>
        <div className="ld-info-grid">
          <div className="ld-info-item">
            <span className="ld-info-label">总{labelMap.payAction}额</span>
            <span className="ld-info-value">¥{formatAmount(summary.totalPayment)}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">总利息</span>
            <span className="ld-info-value">¥{formatAmount(summary.totalInterest)}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">已{labelMap.payAction}本金</span>
            <span className="ld-info-value">¥{formatAmount(summary.paidPrincipal)}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">已{labelMap.payAction}利息</span>
            <span className="ld-info-value">¥{formatAmount(summary.paidInterest)}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">{labelMap.remaining}</span>
            <span className="ld-info-value highlight">¥{formatAmount(summary.remainingPrincipal)}</span>
          </div>
          <div className="ld-info-item">
            <span className="ld-info-label">剩余{labelMap.payAction}额</span>
            <span className="ld-info-value">¥{formatAmount(summary.remainingPayment)}</span>
          </div>
        </div>
      </div>

      {/* 逐期还款明细（先息后本方式不显示） */}
      {summary.repayMethod !== 'interest_only' && summary.repayMethod !== 'bullet' && (
        <div className="ld-schedule-card">
          <div className="ld-schedule-header">
            <div className="ld-schedule-title">{isCreditor ? '收款明细' : '还款明细'}</div>
          </div>

          <div className="ld-filter-tabs">
            {(['remaining', 'paid', 'all'] as ScheduleFilter[]).map(f => (
              <button
                key={f}
                className={`ld-filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'remaining' ? `待${labelMap.payAction}` : f === 'paid' ? `已${labelMap.payAction}` : '全部'}
              </button>
            ))}
          </div>

          <table className="ld-table">
            <thead>
              <tr>
                <th>期数</th>
                <th>日期</th>
                <th className="td-right">{isCreditor ? '收款' : '还款'}</th>
                <th className="td-right">本金</th>
                <th className="td-right">利息</th>
                <th className="td-right">剩余</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedule.map((item) => {
                const isPaid = item.period <= summary.paidPeriods;
                const isCurrent = item.period === summary.paidPeriods + 1;
                return (
                  <tr key={item.period} className={`${isPaid ? 'paid' : ''} ${isCurrent ? 'current' : ''}`}>
                    <td>{item.period}</td>
                    <td>{item.date}</td>
                    <td className="td-right text-expense">¥{formatAmount(item.payment)}</td>
                    <td className="td-right">¥{formatAmount(item.principal)}</td>
                    <td className="td-right">¥{formatAmount(item.interest)}</td>
                    <td className="td-right">¥{formatAmount(item.remaining)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>合计</td>
                <td>{filteredSchedule.length}期</td>
                <td className="td-right text-expense">¥{formatAmount(filteredSchedule.reduce((s, i) => s + i.payment, 0))}</td>
                <td className="td-right">¥{formatAmount(filteredSchedule.reduce((s, i) => s + i.principal, 0))}</td>
                <td className="td-right">¥{formatAmount(filteredSchedule.reduce((s, i) => s + i.interest, 0))}</td>
                <td className="td-right">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ===== 编辑贷款信息 Popup ===== */}
      <Popup
        visible={showEdit}
        position="bottom"
        destroyOnClose
        onMaskClick={() => setShowEdit(false)}
        bodyStyle={{ borderRadius: '20px 20px 0 0', maxHeight: '85vh' }}
      >
        {editForm && (
          <div className="ld-edit-popup">
            <div className="ld-edit-header">
              <div className="acct-popup-handle" />
              <span className="ld-edit-title">{isCreditor ? '修改借出信息' : '修改贷款信息'}</span>
              <span className="ld-edit-close" onClick={() => setShowEdit(false)}><CloseOutline /></span>
            </div>
            <div className="ld-edit-body">
              {isCreditor ? (
                <>
                  {/* 债权编辑表单 */}
                  <div className="ld-edit-section">
                    <label className="ld-edit-label">借出金额</label>
                    <div className="ld-edit-input-wrap">
                      <span className="ld-edit-prefix">¥</span>
                      <input className="ld-edit-input" type="number" value={editForm.creditorAmount || ''} placeholder="请输入借出金额" onChange={e => setEditForm({ ...editForm, creditorAmount: Number(e.target.value) || 0 })} />
                      <span className="ld-edit-suffix">元</span>
                    </div>
                  </div>

                  {/* 无限期限开关 */}
                  <div className="ld-edit-section">
                    <label className="ld-edit-label">借出期限</label>
                    {editForm.creditorInfinite ? (
                      <div className="ld-infinite-badge">无限期</div>
                    ) : (
                      <div className="ld-edit-input-wrap">
                        <input className="ld-edit-input" type="number" value={editForm.creditorTotalPeriods || ''} placeholder="请输入期数" onChange={e => setEditForm({ ...editForm, creditorTotalPeriods: Number(e.target.value) || 0 })} />
                        <span className="ld-edit-suffix">个月</span>
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <button
                        className={`ld-auto-btn ${editForm.creditorInfinite ? 'active' : ''}`}
                        onClick={() => setEditForm({ ...editForm, creditorInfinite: !editForm.creditorInfinite })}
                      >
                        {editForm.creditorInfinite ? '已设为无限期' : '设为无限期'}
                      </button>
                    </div>
                  </div>

                  {/* 利率类型切换 */}
                  <div className="ld-edit-section">
                    <label className="ld-edit-label">利率类型</label>
                    <div className="ld-rate-mode-toggle">
                      {RATE_TYPE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          className={`ld-rate-mode-btn ${editForm.creditorRateType === opt.value ? 'active' : ''}`}
                          onClick={() => {
                            const oldRate = editForm.creditorRate || 0;
                            const oldType = editForm.creditorRateType || 'annual';
                            if (oldRate > 0) {
                              const rawInput = convertFromAnnualRate(oldRate, oldType);
                              const newAnnual = convertToAnnualRate(rawInput, opt.value);
                              setEditForm({ ...editForm, creditorRateType: opt.value, creditorRate: newAnnual });
                            } else {
                              setEditForm({ ...editForm, creditorRateType: opt.value });
                            }
                          }}
                        >{opt.label}</button>
                      ))}
                    </div>
                    <div className="ld-edit-input-wrap">
                      <span className="ld-edit-prefix">
                        {editForm.creditorRateType === 'daily' ? '万分之' : editForm.creditorRateType === 'monthly' ? '千分之' : ''}
                      </span>
                      <input
                        className="ld-edit-input"
                        type="number"
                        step={0.01}
                        value={editForm.creditorRate ? convertFromAnnualRate(editForm.creditorRate, editForm.creditorRateType || 'annual') : ''}
                        onChange={e => {
                          const rawInput = Number(e.target.value) || 0;
                          const annualRate = convertToAnnualRate(rawInput, editForm.creditorRateType || 'annual');
                          setEditForm({ ...editForm, creditorRate: annualRate });
                        }}
                        placeholder={editForm.creditorRateType === 'daily' ? '如日息万分之2输入2' : editForm.creditorRateType === 'monthly' ? '如月息千分之5输入5' : '如年利率5%输入5'}
                      />
                      {editForm.creditorRateType === 'annual' && <span className="ld-edit-suffix">%</span>}
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">还款方式</label>
                    <div className="ld-edit-chips">
                      {REPAY_METHOD_OPTIONS.map(opt => (
                        <button key={opt.value} className={`ld-edit-chip ${editForm.creditorRepayMethod === opt.value ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, creditorRepayMethod: opt.value as RepayMethod })}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">还款周期</label>
                    <div className="ld-edit-chips">
                      {REPAY_CYCLE_OPTIONS.map(opt => (
                        <button key={opt.value} className={`ld-edit-chip ${editForm.creditorRepayCycle === opt.value ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, creditorRepayCycle: opt.value as RepayCycle })}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">借出日期</label>
                    <input className="ld-edit-date" type="date" value={editForm.creditorStartDate} onChange={e => setEditForm({ ...editForm, creditorStartDate: e.target.value })} />
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">已{labelMap.payAction}期数</label>
                    <div className="ld-auto-toggle">
                      <button className={`ld-auto-btn ${editForm.creditorAutoPaid ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, creditorAutoPaid: true })}>自动计算</button>
                      <button className={`ld-auto-btn ${!editForm.creditorAutoPaid ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, creditorAutoPaid: false })}>手动输入</button>
                    </div>
                    {!editForm.creditorAutoPaid && (
                      <div className="ld-edit-input-wrap" style={{ marginTop: 8 }}>
                        <input className="ld-edit-input" type="number" value={editForm.creditorPaidPeriods || ''} placeholder="请输入已还期数" onChange={e => setEditForm({ ...editForm, creditorPaidPeriods: Number(e.target.value) || 0 })} />
                        <span className="ld-edit-suffix">期</span>
                      </div>
                    )}
                    {editForm.creditorAutoPaid && (
                      <div className="ld-auto-hint">将根据借出日期和当前日期自动计算</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* 负债编辑表单 */}
                  <div className="ld-edit-section">
                    <label className="ld-edit-label">贷款金额</label>
                    <div className="ld-edit-input-wrap">
                      <span className="ld-edit-prefix">¥</span>
                      <input className="ld-edit-input" type="number" value={editForm.loanAmount || ''} placeholder="请输入贷款金额" onChange={e => setEditForm({ ...editForm, loanAmount: Number(e.target.value) || 0 })} />
                      <span className="ld-edit-suffix">元</span>
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">贷款期限</label>
                    <div className="ld-edit-input-wrap">
                      <input className="ld-edit-input" type="number" value={editForm.totalPeriods || ''} placeholder="请输入期数" onChange={e => setEditForm({ ...editForm, totalPeriods: Number(e.target.value) || 0 })} />
                      <span className="ld-edit-suffix">个月</span>
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">年利率</label>
                    <div className="ld-edit-input-wrap">
                      <input className="ld-edit-input" type="number" step={0.01} value={editForm.annualRate || ''} placeholder="如年利率5%输入5" onChange={e => setEditForm({ ...editForm, annualRate: Number(e.target.value) || 0 })} />
                      <span className="ld-edit-suffix">%</span>
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">还款方式</label>
                    <div className="ld-edit-chips">
                      {REPAY_METHOD_OPTIONS.map(opt => (
                        <button key={opt.value} className={`ld-edit-chip ${editForm.repayMethod === opt.value ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, repayMethod: opt.value as RepayMethod })}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">还款周期</label>
                    <div className="ld-edit-chips">
                      {REPAY_CYCLE_OPTIONS.map(opt => (
                        <button key={opt.value} className={`ld-edit-chip ${editForm.repayCycle === opt.value ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, repayCycle: opt.value as RepayCycle })}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">贷款日期</label>
                    <input className="ld-edit-date" type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">下次还款日期</label>
                    <input className="ld-edit-date" type="date" value={editForm.nextRepayDate} onChange={e => setEditForm({ ...editForm, nextRepayDate: e.target.value })} />
                  </div>

                  <div className="ld-edit-section">
                    <label className="ld-edit-label">已还期数</label>
                    <div className="ld-auto-toggle">
                      <button className={`ld-auto-btn ${editForm.autoPaid ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, autoPaid: true })}>自动计算</button>
                      <button className={`ld-auto-btn ${!editForm.autoPaid ? 'active' : ''}`} onClick={() => setEditForm({ ...editForm, autoPaid: false })}>手动输入</button>
                    </div>
                    {!editForm.autoPaid && (
                      <div className="ld-edit-input-wrap" style={{ marginTop: 8 }}>
                        <input className="ld-edit-input" type="number" value={editForm.paidPeriods || ''} placeholder="请输入已还期数" onChange={e => setEditForm({ ...editForm, paidPeriods: Number(e.target.value) || 0 })} />
                        <span className="ld-edit-suffix">期</span>
                      </div>
                    )}
                    {editForm.autoPaid && (
                      <div className="ld-auto-hint">将根据贷款日期和当前日期自动计算</div>
                    )}
                  </div>
                </>
              )}

              <div className="ld-edit-footer">
                <button className="ld-edit-btn-cancel" onClick={() => setShowEdit(false)}>取消</button>
                <button className="ld-edit-btn-save" onClick={handleSave}>保存</button>
              </div>
            </div>
          </div>
        )}
      </Popup>

      {/* ===== 提前还款/收款弹窗 ===== */}
      <Popup
        visible={showPrepay}
        position="bottom"
        destroyOnClose
        onMaskClick={() => setShowPrepay(false)}
        bodyStyle={{ borderRadius: '20px 20px 0 0' }}
      >
        <div className="ld-edit-popup">
          <div className="ld-edit-header">
            <div className="acct-popup-handle" />
            <span className="ld-edit-title">{isCreditor ? '提前收款' : '提前还款'}</span>
            <span className="ld-edit-close" onClick={() => setShowPrepay(false)}><CloseOutline /></span>
          </div>
          <div className="ld-edit-body">
            <div className="ld-edit-section">
              <label className="ld-edit-label">{isCreditor ? '收款金额' : '还款金额'}</label>
              <div className="ld-edit-input-wrap">
                <span className="ld-edit-prefix">¥</span>
                <input
                  className="ld-edit-input"
                  type="number"
                  value={prepayAmount}
                  placeholder={summary ? `${isCreditor ? '待收' : '剩余'}本金 ${formatAmount(summary.remainingPrincipal)}` : '请输入金额'}
                  onChange={e => setPrepayAmount(e.target.value)}
                />
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{isCreditor ? '待收本金' : '剩余本金'}：¥{summary ? formatAmount(summary.remainingPrincipal) : '0.00'}</span>
                <span
                  style={{ color: '#667eea', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => summary && setPrepayAmount(String(summary.remainingPrincipal))}
                >
                  全部还清
                </span>
              </div>
            </div>
            <div className="ld-edit-footer">
              <button className="ld-edit-btn-cancel" onClick={() => setShowPrepay(false)}>取消</button>
              <button
                className="ld-edit-btn-save"
                onClick={() => {
                  const amount = Number(prepayAmount);
                  if (!amount || amount <= 0) {
                    Toast.show({ content: isCreditor ? '请输入收款金额' : '请输入还款金额', icon: 'fail' });
                    return;
                  }
                  if (summary && amount > summary.remainingPrincipal) {
                    Toast.show({ content: isCreditor ? '收款金额不能超过待收本金' : '还款金额不能超过剩余本金', icon: 'fail' });
                    return;
                  }
                  setShowPrepay(false);
                  handlePrepay(amount);
                }}
              >确认{isCreditor ? '收款' : '还款'}</button>
            </div>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default LoanDetail;
