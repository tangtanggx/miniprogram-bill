import { useState, useMemo } from 'react';
import { NavBar, Dialog, Toast, SwipeAction, Popup } from 'antd-mobile';
import { AddCircleOutline, BankcardOutline, CloseOutline } from 'antd-mobile-icons';
import { useAccountStore } from '@/stores/index';
import type { Account, AccountCategory, RateType } from '@/types/index';
import { formatAmount, calcNetWorth } from '@/utils/index';
import { ACCT_CATEGORIES, ACCT_CATEGORY_OPTIONS, REPAY_METHOD_OPTIONS, REPAY_CYCLE_OPTIONS, REPAY_METHOD_LABELS, REPAY_CYCLE_LABELS, RATE_TYPE_OPTIONS, convertToAnnualRate, convertFromAnnualRate, formatRateDisplay } from '@/constants/index';
import LoanDetail from '@/components/loanDetail/LoanDetail';
import './index.css';

const ICON_OPTIONS = ['💳', '🏦', '💰', '📱', '📈', '🏷️', '🏠', '🚗', '🛒', '✈️', '🎮', '💊'];
const COLOR_OPTIONS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const DEBT_DEFAULTS = {
  loanAmount: 0,
  annualRate: 0,
  repayMethod: 'equal_installment' as const,
  totalPeriods: 0,
  paidPeriods: 0,
  startDate: '',
  repayCycle: 'monthly' as const,
  nextRepayDate: '',
};

const CREDITOR_DEFAULTS = {
  creditorAmount: 0,
  creditorRate: 0,
  creditorRateType: 'annual' as RateType,
  creditorInfinite: false,
  creditorRepayMethod: 'bullet' as const,
  creditorTotalPeriods: 0,
  creditorPaidPeriods: 0,
  creditorStartDate: '',
  creditorRepayCycle: 'single' as const,
  creditorNextDate: '',
};

const AccountsPage = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, repairLegacyAccounts } = useAccountStore();
  const [showPopup, setShowPopup] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedDebtAccount, setSelectedDebtAccount] = useState<Account | null>(null);
  const [form, setForm] = useState<Partial<Account>>({
    name: '', category: 'virtual', balance: 0,
    icon: '💳', color: '#4f46e5', creditLimit: 0, billingDay: 1, repaymentDay: 1,
    ...DEBT_DEFAULTS, ...CREDITOR_DEFAULTS,
  });

  const resetForm = () => {
    setForm({ name: '', category: 'virtual', balance: 0, icon: '💳', color: '#4f46e5', creditLimit: 0, billingDay: 1, repaymentDay: 1, ...DEBT_DEFAULTS, ...CREDITOR_DEFAULTS });
    setEditingAccount(null);
    setShowPopup(false);
  };

  const openAdd = () => { resetForm(); setShowPopup(true); };
  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({ ...DEBT_DEFAULTS, ...CREDITOR_DEFAULTS, ...account });
    setShowPopup(true);
  };

  const openDebtDetail = (account: Account) => {
    // 先尝试修复旧版数据中缺失的贷款字段
    repairLegacyAccounts();
    // 从最新 store 中重新获取账户（可能已被修复）
    const repaired = useAccountStore.getState().getAccountById(account.id);
    setSelectedDebtAccount(repaired || account);
  };

  const handleDelete = (id: string) => {
    Dialog.confirm({
      content: '确定要删除该账户吗？关联的账单不会删除。',
      confirmText: '删除',
      onConfirm: () => deleteAccount(id),
    });
  };

  const handleSubmit = () => {
    if (!form.name?.trim()) { Toast.show({ content: '请输入账户名称', icon: 'fail' }); return; }
    // 负债账户：如果填了贷款金额，用贷款金额推算余额
    if (form.category === 'debt' && form.loanAmount && form.loanAmount > 0 && (!editingAccount)) {
      form.balance = -form.loanAmount;
    }
    // 债权账户：如果填了借出金额，用借出金额推算余额
    if (form.category === 'creditor' && form.creditorAmount && form.creditorAmount > 0 && (!editingAccount)) {
      form.balance = form.creditorAmount;
    }
    if (editingAccount) {
      updateAccount(editingAccount.id, form);
      Toast.show({ content: '修改成功', icon: 'success' });
    } else {
      addAccount(form as Omit<Account, 'id' | 'createdAt' | 'updatedAt'>);
      Toast.show({ content: '添加成功', icon: 'success' });
    }
    resetForm();
  };

  const nw = useMemo(() => calcNetWorth(accounts), [accounts]);

  // 按分类分组
  const groups = useMemo(() => {
    const map: Record<string, Account[]> = {};
    accounts.forEach(a => {
      const key = a.category;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    const order: AccountCategory[] = ['savings', 'virtual', 'investment', 'credit', 'debt', 'creditor'];
    return order.filter(k => map[k]?.length).map(k => ({
      key: k,
      config: ACCT_CATEGORIES[k],
      items: map[k],
    }));
  }, [accounts]);

  // 贷款详情页
  if (selectedDebtAccount) {
    return (
      <LoanDetail
        account={selectedDebtAccount}
        onBack={() => setSelectedDebtAccount(null)}
      />
    );
  }

  return (
    <div className="accounts-page">
      <NavBar className="page-navbar" onBack={() => window.history.back()}>
        账户管理
      </NavBar>

      {/* 总览卡片 */}
      <div className="acct-overview-card">
        <div className="acct-ov-row">
          <div className="acct-ov-item">
            <span className="acct-ov-label">总资产</span>
            <span className="acct-ov-value asset">{formatAmount(nw.totalAssets)}</span>
          </div>
          <div className="acct-ov-divider" />
          <div className="acct-ov-item">
            <span className="acct-ov-label">总负债</span>
            <span className="acct-ov-value debt">{formatAmount(nw.totalLiabilities)}</span>
          </div>
          <div className="acct-ov-divider" />
          <div className="acct-ov-item">
            <span className="acct-ov-label">净资产</span>
            <span className={`acct-ov-value ${nw.netWorth < 0 ? 'negative' : 'positive'}`}>{formatAmount(nw.netWorth)}</span>
          </div>
        </div>
        <div className="acct-ov-bar">
          <span className="acct-ov-count-badge">{accounts.length} 个账户</span>
          <span className="acct-ov-hint">左滑卡片可编辑/删除</span>
        </div>
      </div>

      {/* 账户分组列表 */}
      {groups.length === 0 && (
        <div className="acct-empty">
          <BankcardOutline fontSize={48} />
          <p>还没有账户</p>
          <span className="acct-empty-hint">点击下方按钮添加你的第一个账户</span>
        </div>
      )}

      {groups.map(group => (
        <div key={group.key} className="acct-section">
          <div className={`acct-section-header ${group.key === 'debt' ? 'debt' : ''} ${group.key === 'credit' ? 'credit' : ''} ${group.key === 'creditor' ? 'creditor' : ''}`}>
            <div className="acct-section-title-row">
              <span className={`acct-section-emoji ${group.key === 'debt' ? 'debt' : ''} ${group.key === 'credit' ? 'credit' : ''} ${group.key === 'creditor' ? 'creditor' : ''}`}>{group.config.emoji}</span>
              <span className="acct-section-title">{group.config.label}</span>
            </div>
            <span className="acct-section-count">{group.items.length}个</span>
          </div>
          <div className="acct-card-list">
            {group.items.map(account => (
              <SwipeAction
                key={account.id}
                closeOnContentClick={true}
                rightActions={[
                  { text: '编辑', key: 'edit', color: 'primary', onClick: () => openEdit(account) },
                  { text: '删除', key: 'delete', color: 'danger', onClick: () => handleDelete(account.id) },
                ]}
              >
                <div className="acct-card" onClick={() => {
                  // 负债/债权账户点击查看还款明细
                  if (account.category === 'debt' || account.category === 'creditor') {
                    openDebtDetail(account);
                  } else {
                    openEdit(account);
                  }
                }}>
                  <div className="acct-card-left">
                    <span className="acct-card-icon" style={{ background: (account.color || group.config.color) + '18', color: account.color || group.config.color }}>
                      {account.icon || group.config.emoji}
                    </span>
                    <div className="acct-card-info">
                      <div className="acct-card-name">{account.name}</div>
                      <div className="acct-card-meta">
                        {account.category === 'credit' && account.creditLimit ? (
                          <span>额度 {formatAmount(account.creditLimit)} · 账单日{account.billingDay}日</span>
                        ) : account.category === 'credit' ? (
                          <span>信用卡</span>
                        ) : account.category === 'debt' ? (
                          <div className="acct-card-debt-meta">
                            <span className="acct-debt-meta-line1">{account.loanAmount ? formatAmount(account.loanAmount) : '--'}{account.annualRate ? ` · ${account.annualRate}%` : ''}</span>
                            <span className="acct-debt-meta-line2">
                              {account.repayMethod ? (REPAY_METHOD_LABELS[account.repayMethod] || '') : ''}
                              {account.totalPeriods ? ` · ${account.paidPeriods || 0}/${account.totalPeriods}期` : ''}
                              {account.nextRepayDate && account.nextRepayDate !== '已结清' ? ` · 下次${account.nextRepayDate}` : ''}
                            </span>
                          </div>
                        ) : account.category === 'creditor' ? (
                          <div className="acct-card-creditor-meta">
                            <span className="acct-creditor-meta-line1">{account.creditorAmount ? formatAmount(account.creditorAmount) : '--'}{account.creditorRate ? ` · ${formatRateDisplay(account.creditorRate, (account as any).creditorRateType || 'annual')}` : ''}</span>
                            <span className="acct-creditor-meta-line2">
                              {account.creditorRepayMethod ? (REPAY_METHOD_LABELS[account.creditorRepayMethod] || '') : ''}
                              {(account as any).creditorInfinite ? ' · 无限期' : (account.creditorTotalPeriods ? ` · ${account.creditorPaidPeriods || 0}/${account.creditorTotalPeriods}期` : '')}
                              {account.creditorNextDate && account.creditorNextDate !== '已结清' ? ` · 下次${account.creditorNextDate}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span>{group.config.label}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="acct-card-right">
                    <span className={`acct-card-balance ${account.balance < 0 ? 'negative' : ''}`}>
                      {account.balance >= 0 ? '' : '-'}{formatAmount(Math.abs(account.balance))}
                    </span>
                  </div>
                </div>
              </SwipeAction>
            ))}
          </div>
          {/* 分组小计 */}
          <div className="acct-section-footer">
            <span>小计</span>
            <span className={`acct-section-subtotal ${group.items.reduce((s, a) => s + a.balance, 0) < 0 ? 'negative' : ''}`}>
              {group.items.reduce((s, a) => s + a.balance, 0) >= 0 ? '' : '-'}{formatAmount(Math.abs(group.items.reduce((s, a) => s + a.balance, 0)))}
            </span>
          </div>
        </div>
      ))}

      {/* 添加按钮 */}
      <div className="acct-fab" onClick={openAdd}>
        <AddCircleOutline fontSize={28} color="#fff" />
      </div>

      {/* ===== 添加/编辑 Popup ===== */}
      <Popup
        visible={showPopup}
        position="bottom"
        destroyOnClose
        onMaskClick={resetForm}
        bodyStyle={{ borderRadius: '20px 20px 0 0', minHeight: '50vh' }}
      >
        <div className="acct-popup">
          <div className="acct-popup-header">
            <div className="acct-popup-handle" />
            <div className="acct-popup-title-row">
              <span className="acct-popup-title">{editingAccount ? '编辑账户' : '添加账户'}</span>
              <span className="acct-popup-close" onClick={resetForm}><CloseOutline fontSize={20} /></span>
            </div>
          </div>

          <div className="acct-popup-body">
            {/* 图标+颜色选择 */}
            <div className="acct-form-section">
              <span className="acct-form-label">图标与颜色</span>
              <div className="acct-icon-color-row">
                <div className="acct-icon-picker">
                  {ICON_OPTIONS.map(icon => (
                    <span
                      key={icon}
                      className={`acct-icon-opt ${form.icon === icon ? 'active' : ''}`}
                      style={form.icon === icon ? { borderColor: form.color, background: form.color + '18' } : {}}
                      onClick={() => setForm({ ...form, icon })}
                    >{icon}</span>
                  ))}
                </div>
                <div className="acct-color-picker">
                  {COLOR_OPTIONS.map(c => (
                    <span
                      key={c}
                      className={`acct-color-opt ${form.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 账户名称 */}
            <div className="acct-form-section">
              <span className="acct-form-label">账户名称</span>
              <input
                className="acct-form-input"
                placeholder="如：房贷（建设银行）"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* 账户类型 */}
            <div className="acct-form-section">
              <span className="acct-form-label">账户类型</span>
              <div className="acct-type-grid">
                {ACCT_CATEGORY_OPTIONS.map(opt => {
                  const cfg = ACCT_CATEGORIES[opt.value as AccountCategory];
                  return (
                    <div
                      key={opt.value}
                      className={`acct-type-chip ${form.category === opt.value ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, category: opt.value as AccountCategory })}
                    >
                      <span>{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 余额（负债类型显示为"剩余欠款"） */}
            <div className="acct-form-section">
              <span className="acct-form-label">{form.category === 'debt' ? '剩余欠款' : form.category === 'creditor' ? '待收金额' : '余额'}</span>
              <div className="acct-amount-input-wrap">
                <span className="acct-amount-prefix">¥</span>
                <input
                  className="acct-amount-input"
                  type="number"
                  placeholder="0.00"
                  value={form.balance || ''}
                  onChange={e => setForm({ ...form, balance: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* ===== 信用卡专属字段 ===== */}
            {form.category === 'credit' && (
              <div className="acct-form-section">
                <span className="acct-form-label">信用卡信息</span>
                <div className="acct-credit-fields">
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">信用额度</span>
                    <div className="acct-amount-input-wrap compact">
                      <span className="acct-amount-prefix">¥</span>
                      <input className="acct-amount-input compact" type="number" placeholder="0.00"
                        value={form.creditLimit || ''}
                        onChange={e => setForm({ ...form, creditLimit: Number(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="acct-credit-row">
                    <div className="acct-credit-col">
                      <span className="acct-credit-label">账单日</span>
                      <div className="acct-day-input-wrap">
                        <input className="acct-day-input" type="number" min={1} max={28} placeholder="--"
                          value={form.billingDay || ''}
                          onChange={e => setForm({ ...form, billingDay: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })} />
                        <span className="acct-day-suffix">日/月</span>
                      </div>
                    </div>
                    <div className="acct-credit-col">
                      <span className="acct-credit-label">还款日</span>
                      <div className="acct-day-input-wrap">
                        <input className="acct-day-input" type="number" min={1} max={28} placeholder="--"
                          value={form.repaymentDay || ''}
                          onChange={e => setForm({ ...form, repaymentDay: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })} />
                        <span className="acct-day-suffix">日/月</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== 负债/贷款专属字段 ===== */}
            {form.category === 'debt' && (
              <div className="acct-form-section">
                <span className="acct-form-label">贷款信息</span>
                <div className="acct-credit-fields">
                  {/* 贷款金额 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">贷款金额</span>
                    <div className="acct-amount-input-wrap compact">
                      <span className="acct-amount-prefix">¥</span>
                      <input className="acct-amount-input compact" type="number" placeholder="0.00"
                        value={form.loanAmount || ''}
                        onChange={e => setForm({ ...form, loanAmount: Number(e.target.value) || 0 })} />
                    </div>
                  </div>

                  {/* 贷款期限 + 年利率 */}
                  <div className="acct-credit-row">
                    <div className="acct-credit-col">
                      <span className="acct-credit-label">贷款期限（月）</span>
                      <div className="acct-day-input-wrap">
                        <input className="acct-day-input" type="number" min={1} max={600} placeholder="--"
                          value={form.totalPeriods || ''}
                          onChange={e => setForm({ ...form, totalPeriods: Math.max(0, Number(e.target.value) || 0) })} />
                        <span className="acct-day-suffix">期</span>
                      </div>
                    </div>
                    <div className="acct-credit-col">
                      <span className="acct-credit-label">年利率</span>
                      <div className="acct-day-input-wrap">
                        <input className="acct-day-input" type="number" min={0} max={100} step={0.01} placeholder="--"
                          value={form.annualRate || ''}
                          onChange={e => setForm({ ...form, annualRate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
                        <span className="acct-day-suffix">%</span>
                      </div>
                    </div>
                  </div>

                  {/* 还款方式 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">还款方式</span>
                    <div className="acct-debt-chips">
                      {REPAY_METHOD_OPTIONS.map(opt => (
                        <span
                          key={opt.value}
                          className={`acct-debt-chip ${form.repayMethod === opt.value ? 'active' : ''}`}
                          onClick={() => setForm({ ...form, repayMethod: opt.value })}
                        >{opt.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* 还款周期 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">还款周期</span>
                    <div className="acct-debt-chips">
                      {REPAY_CYCLE_OPTIONS.map(opt => (
                        <span
                          key={opt.value}
                          className={`acct-debt-chip ${form.repayCycle === opt.value ? 'active' : ''}`}
                          onClick={() => setForm({ ...form, repayCycle: opt.value })}
                        >{opt.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* 已还期数 + 起始日期 */}
                  <div className="acct-credit-row">
                    <div className="acct-credit-col">
                      <span className="acct-credit-label">已还期数</span>
                      <div className="acct-day-input-wrap">
                        <input className="acct-day-input" type="number" min={0} placeholder="--"
                          value={form.paidPeriods || ''}
                          onChange={e => setForm({ ...form, paidPeriods: Math.max(0, Number(e.target.value) || 0) })} />
                        <span className="acct-day-suffix">期</span>
                      </div>
                    </div>
                    <div className="acct-credit-col">
                      <span className="acct-credit-label">起始日期</span>
                      <input
                        className="acct-form-input compact"
                        type="date"
                        value={form.startDate || ''}
                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 下次还款日期 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">下次还款日期</span>
                    <input
                      className="acct-form-input compact"
                      type="date"
                      value={form.nextRepayDate || ''}
                      onChange={e => setForm({ ...form, nextRepayDate: e.target.value })}
                      placeholder="选择日期"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===== 债权/借出专属字段 ===== */}
            {form.category === 'creditor' && (
              <div className="acct-form-section">
                <span className="acct-form-label">借出信息</span>
                <div className="acct-credit-fields">
                  {/* 借出金额 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">借出金额</span>
                    <div className="acct-amount-input-wrap compact">
                      <span className="acct-amount-prefix">¥</span>
                      <input className="acct-amount-input compact" type="number" placeholder="0.00"
                        value={form.creditorAmount || ''}
                        onChange={e => setForm({ ...form, creditorAmount: Number(e.target.value) || 0 })} />
                    </div>
                  </div>

                  {/* 利率类型切换 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">利率类型</span>
                    <div className="acct-debt-chips" style={{ marginBottom: 8 }}>
                      {RATE_TYPE_OPTIONS.map(opt => (
                        <span
                          key={opt.value}
                          className={`acct-debt-chip ${form.creditorRateType === opt.value ? 'active' : ''}`}
                          onClick={() => {
                            // 切换利率类型时转换当前利率值
                            const oldRate = form.creditorRate || 0;
                            const oldType = form.creditorRateType || 'annual';
                            if (oldRate > 0) {
                              // 先转回原始输入值，再转为新类型的年利率
                              const rawInput = convertFromAnnualRate(oldRate, oldType as RateType);
                              const newAnnual = convertToAnnualRate(rawInput, opt.value);
                              setForm({ ...form, creditorRateType: opt.value, creditorRate: newAnnual });
                            } else {
                              setForm({ ...form, creditorRateType: opt.value });
                            }
                          }}
                        >{opt.label}</span>
                      ))}
                    </div>
                    <div className="acct-day-input-wrap">
                      <input className="acct-day-input" type="number" min={0} step={0.01} placeholder="0.00"
                        value={(form.creditorRate && form.creditorRateType !== 'annual') ? convertFromAnnualRate(form.creditorRate, (form.creditorRateType || 'annual') as RateType) : (form.creditorRate || '')}
                        onChange={e => {
                          const rawInput = Number(e.target.value) || 0;
                          const annualRate = convertToAnnualRate(rawInput, (form.creditorRateType || 'annual') as RateType);
                          setForm({ ...form, creditorRate: annualRate });
                        }} />
                      <span className="acct-day-suffix">
                        {(form.creditorRateType || 'annual') === 'daily' ? '‱' : (form.creditorRateType || 'annual') === 'monthly' ? '‰' : '%'}
                      </span>
                    </div>
                  </div>

                  {/* 借出期限 */}
                  <div className="acct-credit-row">
                    <div className="acct-credit-col">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="acct-credit-label">借出期限</span>
                        <span
                          className={`acct-debt-chip ${form.creditorInfinite ? 'active' : ''}`}
                          style={{ fontSize: 11, padding: '2px 10px', marginBottom: 0 }}
                          onClick={() => {
                            if (form.creditorInfinite) {
                              setForm({ ...form, creditorInfinite: false, creditorTotalPeriods: 0 });
                            } else {
                              setForm({ ...form, creditorInfinite: true, creditorTotalPeriods: 9999 });
                            }
                          }}
                        >{form.creditorInfinite ? '已设为无限' : '设为无限'}</span>
                      </div>
                      {form.creditorInfinite ? (
                        <div className="ld-infinite-badge" style={{ marginTop: 6, padding: '6px 14px', fontSize: 13 }}>无限期限</div>
                      ) : (
                        <div className="acct-day-input-wrap">
                          <input className="acct-day-input" type="number" min={1} max={600} placeholder="--"
                            value={form.creditorTotalPeriods || ''}
                            onChange={e => setForm({ ...form, creditorTotalPeriods: Math.max(0, Number(e.target.value) || 0) })} />
                          <span className="acct-day-suffix">期</span>
                        </div>
                      )}
                    </div>
                    <div className="acct-credit-col">
                      <span className="acct-credit-label">借出日期</span>
                      <input
                        className="acct-form-input compact"
                        type="date"
                        value={form.creditorStartDate || ''}
                        onChange={e => setForm({ ...form, creditorStartDate: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* 还款方式 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">还款方式</span>
                    <div className="acct-debt-chips">
                      {REPAY_METHOD_OPTIONS.map(opt => (
                        <span
                          key={opt.value}
                          className={`acct-debt-chip ${form.creditorRepayMethod === opt.value ? 'active' : ''}`}
                          onClick={() => setForm({ ...form, creditorRepayMethod: opt.value })}
                        >{opt.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* 还款周期 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">还款周期</span>
                    <div className="acct-debt-chips">
                      {REPAY_CYCLE_OPTIONS.map(opt => (
                        <span
                          key={opt.value}
                          className={`acct-debt-chip ${form.creditorRepayCycle === opt.value ? 'active' : ''}`}
                          onClick={() => setForm({ ...form, creditorRepayCycle: opt.value })}
                        >{opt.label}</span>
                      ))}
                    </div>
                  </div>



                  {/* 下次收款日期 */}
                  <div className="acct-credit-field-full">
                    <span className="acct-credit-label">下次收款日期</span>
                    <input
                      className="acct-form-input compact"
                      type="date"
                      value={form.creditorNextDate || ''}
                      onChange={e => setForm({ ...form, creditorNextDate: e.target.value })}
                      placeholder="选择日期"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="acct-popup-footer">
            <button className="acct-btn cancel" onClick={resetForm}>取消</button>
            <button className="acct-btn confirm" onClick={handleSubmit}>{editingAccount ? '保存修改' : '添加账户'}</button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default AccountsPage;
