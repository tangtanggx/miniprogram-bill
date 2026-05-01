/**
 * 账单列表页 - 搜索筛选 / 月份切换 / 排序 / 按日分组 / 左滑操作 / 批量选择 / 完整编辑弹窗
 */

import { useState, useMemo, useCallback } from 'react';
import { NavBar, SwipeAction, Dialog, Toast, Popup, Picker, Switch } from 'antd-mobile';
import { useTransactions, useAccounts, useCategories } from '@/hooks';
import { useAccountStore } from '@/stores';
import { formatAmount, getToday } from '@/utils';
import type { Transaction, TransactionDirection } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import './BillsPage.css';

/* ========== 分类图标颜色查找表 ========== */
const CAT_INFO_MAP: Record<string, { icon: string; color: string }> = {};
for (const dir of ['expense', 'income'] as const) {
  for (const cat of DEFAULT_CATEGORIES[dir]) {
    const colors: Record<string, string> = {
      '餐饮美食': '#ff6b35', '交通出行': '#1677ff', '购物消费': '#eb2f96',
      '休闲娱乐': '#722ed1', '居住物业': '#fa8c16', '医疗健康': '#52c41a',
      '教育学习': '#2f54eb', '通讯网络': '#13c2c2', '人情往来': '#f5222d',
      '金融保险': '#faad14', '宠物': '#9254de', '其他支出': '#8c8c8c',
      '工资收入': '#52c41a', '兼职副业': '#2f54eb', '投资收益': '#cf1322',
      '理财收入': '#faad14', '其他收入': '#1677ff',
    };
    CAT_INFO_MAP[cat.name] = { icon: cat.icon, color: colors[cat.name] || '#8c8c8c' };
  }
}

function getCatInfo(category: string) {
  return CAT_INFO_MAP[category] || { icon: '📌', color: '#8c8c8c' };
}

function getWeekDay(dateStr: string): string {
  const d = new Date(dateStr);
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
}

function formatDayLabel(dateStr: string): string {
  const today = getToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  const mm = dateStr.slice(5);
  return `${mm} ${getWeekDay(dateStr)}`;
}

/* ========== 筛选类型 ========== */
interface Filters {
  direction: string;
  category: string;
  accountId: string;
  dateFrom: string;
  dateTo: string;
  amtMin: string;
  amtMax: string;
  reimb: string;
}

const DEFAULT_FILTERS: Filters = {
  direction: '',
  category: '',
  accountId: '',
  dateFrom: '',
  dateTo: '',
  amtMin: '',
  amtMax: '',
  reimb: '',
};

type SortCol = 'date' | 'amount' | 'category';

/* ========== 编辑表单状态 ========== */
interface EditFormState {
  direction: TransactionDirection;
  amount: string;
  accountId: string;
  targetAccountId: string;
  category: string;
  subCategory: string;
  remark: string;
  date: string;
  time: string;
  reimbursable: boolean;
}

const EMPTY_EDIT_FORM: EditFormState = {
  direction: 'expense',
  amount: '',
  accountId: '',
  targetAccountId: '',
  category: '',
  subCategory: '',
  remark: '',
  date: '',
  time: '',
  reimbursable: false,
};

export default function BillsPage() {
  const { transactions, deleteTransaction, updateTransaction, confirmReimburse } = useTransactions();
  const { accounts } = useAccounts();
  const { categories, getCatsForDirection } = useCategories();
  const getAccountById = useAccountStore((s) => s.getAccountById);

  const [selectedMonth, setSelectedMonth] = useState(getToday().slice(0, 7));
  const [searchText, setSearchText] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_EDIT_FORM);
  const [catPickerVisible, setCatPickerVisible] = useState(false);
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);
  const [targetAccountPickerVisible, setTargetAccountPickerVisible] = useState(false);

  /* ========== 打开编辑弹窗 ========== */
  const openEditBill = useCallback((tx: Transaction) => {
    if (selectedIds.size > 0) return;
    const dir = tx.direction || 'expense';
    const cats = getCatsForDirection(dir as 'expense' | 'income');
    const catExists = cats.some((c) => c.name === tx.category);
    setEditForm({
      direction: dir,
      amount: String(tx.amount),
      accountId: tx.accountId,
      targetAccountId: tx.targetAccountId || '',
      category: catExists ? tx.category : '',
      subCategory: tx.subCategory || '',
      remark: tx.remark || '',
      date: tx.date,
      time: tx.time,
      reimbursable: tx.reimbursable || false,
    });
    setEditingTx(tx);
  }, [selectedIds, getCatsForDirection]);

  /* ========== 切换方向时重置分类 ========== */
  const handleEditDirChange = useCallback((dir: TransactionDirection) => {
    setEditForm((prev) => ({
      ...prev,
      direction: dir,
      category: '',
      subCategory: '',
    }));
  }, []);

  /* ========== 保存编辑 ========== */
  const saveEditingBill = useCallback(() => {
    if (!editingTx) return;
    const amt = parseFloat(editForm.amount);
    if (!amt || amt <= 0) {
      Toast.show({ content: '请输入有效金额', icon: 'fail' });
      return;
    }
    if (!editForm.accountId) {
      Toast.show({ content: '请选择账户', icon: 'fail' });
      return;
    }
    if (!editForm.category) {
      Toast.show({ content: '请选择分类', icon: 'fail' });
      return;
    }

    updateTransaction(editingTx.id, {
      amount: amt,
      direction: editForm.direction,
      accountId: editForm.accountId,
      targetAccountId: editForm.direction === 'transfer' ? editForm.targetAccountId || undefined : undefined,
      category: editForm.category,
      subCategory: editForm.subCategory,
      remark: editForm.remark.trim(),
      date: editForm.date,
      time: editForm.time,
      reimbursable: editForm.direction === 'expense' ? editForm.reimbursable : undefined,
    });
    setEditingTx(null);
    setEditForm(EMPTY_EDIT_FORM);
    Toast.show({ content: '已保存', icon: 'success' });
  }, [editingTx, editForm, updateTransaction]);

  /* ========== 删除编辑中的记录 ========== */
  const deleteEditingBill = useCallback(() => {
    if (!editingTx) return;
    Dialog.confirm({
      content: '确定删除此条记录？',
      onConfirm: () => {
        deleteTransaction(editingTx.id);
        setEditingTx(null);
        setEditForm(EMPTY_EDIT_FORM);
        Toast.show({ content: '已删除', icon: 'success' });
      },
    });
  }, [editingTx, deleteTransaction]);

  /* ========== 过滤 ========== */
  const filteredTx = useMemo(() => {
    let bills = transactions.filter((t) => t.date.startsWith(selectedMonth));

    if (searchText.trim()) {
      const s = searchText.toLowerCase();
      bills = bills.filter(
        (t) =>
          (t.remark || '').toLowerCase().includes(s) ||
          (t.category || '').toLowerCase().includes(s) ||
          (t.subCategory || '').toLowerCase().includes(s)
      );
    }

    if (filters.direction) {
      bills = bills.filter((t) => (t.direction || 'expense') === filters.direction);
    }
    if (filters.category) {
      bills = bills.filter((t) => t.category === filters.category);
    }
    if (filters.accountId) {
      bills = bills.filter((t) => t.accountId === filters.accountId);
    }
    if (filters.dateFrom) {
      bills = bills.filter((t) => t.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      bills = bills.filter((t) => t.date <= filters.dateTo + 'z');
    }
    const minAmt = parseFloat(filters.amtMin);
    if (!isNaN(minAmt)) bills = bills.filter((t) => t.amount >= minAmt);
    const maxAmt = parseFloat(filters.amtMax);
    if (!isNaN(maxAmt)) bills = bills.filter((t) => t.amount <= maxAmt);
    if (filters.reimb === 'pending') {
      bills = bills.filter((t) => t.reimbStatus === 'pending' && !t.reimbursed);
    }
    if (filters.reimb === 'done') {
      bills = bills.filter((t) => t.reimbStatus === 'done' || t.reimbursed);
    }

    bills = [...bills].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortCol === 'date') { va = `${a.date} ${a.time}`; vb = `${b.date} ${b.time}`; }
      else if (sortCol === 'amount') { va = Math.abs(a.amount); vb = Math.abs(b.amount); }
      else if (sortCol === 'category') { va = a.category; vb = b.category; }
      else { va = `${a.date} ${a.time}`; vb = `${b.date} ${b.time}`; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    return bills;
  }, [transactions, selectedMonth, searchText, filters, sortCol, sortAsc]);

  /* ========== 按日分组 ========== */
  const grouped = useMemo(() => {
    const g: Record<string, Transaction[]> = {};
    for (const tx of filteredTx) {
      if (!g[tx.date]) g[tx.date] = [];
      g[tx.date].push(tx);
    }
    return g;
  }, [filteredTx]);

  const dailySum = useMemo(() => {
    const s: Record<string, { expense: number; income: number }> = {};
    for (const [date, txs] of Object.entries(grouped)) {
      s[date] = txs.reduce(
        (a, t) => ({
          expense: a.expense + (t.direction === 'expense' ? t.amount : 0),
          income: a.income + (t.direction === 'income' ? t.amount : 0),
        }),
        { expense: 0, income: 0 }
      );
    }
    return s;
  }, [grouped]);

  /* ========== 活跃筛选标签 ========== */
  const activeFilterTags = useMemo(() => {
    const tags: { key: keyof Filters; label: string }[] = [];
    if (filters.direction) tags.push({ key: 'direction', label: filters.direction === 'expense' ? '支出' : filters.direction === 'income' ? '收入' : '转账' });
    if (filters.category) tags.push({ key: 'category', label: filters.category });
    if (filters.accountId) {
      const acct = getAccountById(filters.accountId);
      if (acct) tags.push({ key: 'accountId', label: acct.name });
    }
    if (filters.dateFrom) tags.push({ key: 'dateFrom', label: `从 ${filters.dateFrom}` });
    if (filters.dateTo) tags.push({ key: 'dateTo', label: `至 ${filters.dateTo}` });
    if (filters.reimb) tags.push({ key: 'reimb', label: filters.reimb === 'pending' ? '待报销' : '已报销' });
    return tags;
  }, [filters, getAccountById]);

  /* ========== 事件处理 ========== */
  const changeMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    if (d <= new Date()) {
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(col === 'date' ? false : true); }
  };

  const handleDelete = (id: string) => {
    Dialog.confirm({
      content: '确定删除这条记录？',
      onConfirm: () => {
        deleteTransaction(id);
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        Toast.show({ content: '已删除', icon: 'success' });
      },
    });
  };

  const handleConfirmReimburse = (id: string) => {
    Dialog.confirm({
      content: '确认报销已到账？将自动生成一笔收入记录。',
      onConfirm: () => {
        confirmReimburse(id);
        Toast.show({ content: '已确认报销，收入已入账', icon: 'success' });
      },
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (filteredTx.every((t) => selectedIds.has(t.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTx.map((t) => t.id)));
    }
  };

  const batchDelete = () => {
    const n = selectedIds.size;
    if (!n) return;
    Dialog.confirm({
      content: `确定删除选中的 ${n} 条记录？`,
      onConfirm: () => {
        for (const id of selectedIds) deleteTransaction(id);
        setSelectedIds(new Set());
        Toast.show({ content: `已删除 ${n} 条`, icon: 'success' });
      },
    });
  };

  const removeFilterTag = (key: keyof Filters) => {
    setFilters((prev) => ({ ...prev, [key]: '' }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchText('');
  };

  const isSelectMode = selectedIds.size > 0;

  /* ========== 所有分类选项（筛选用） ========== */
  const allCategoryOptions = useMemo(() => {
    const opts: { label: string; value: string }[] = [];
    for (const cat of categories.expense) opts.push({ label: `${cat.icon} ${cat.name}`, value: cat.name });
    for (const cat of categories.income) opts.push({ label: `${cat.icon} ${cat.name}`, value: cat.name });
    return opts;
  }, [categories]);

  /* ========== 编辑弹窗中的分类列 ========== */
  const editCategories = useMemo(() => {
    return getCatsForDirection(editForm.direction as 'expense' | 'income');
  }, [editForm.direction, getCatsForDirection]);

  const editPickerColumns = useMemo(() => {
    return [
      editCategories.map((c) => ({
        label: c.name,
        value: c.name,
        children: c.subCategories.length > 0
          ? c.subCategories.map((s) => ({ label: s.name, value: s.name }))
          : [{ label: '无子分类', value: '_none_' }],
      })),
    ];
  }, [editCategories]);

  const editAccountColumns = useMemo(() => {
    return [accounts.map((a) => ({ label: `${a.icon || ''} ${a.name}`, value: a.id }))];
  }, [accounts]);

  /* ========== 渲染 ========== */
  return (
    <div className="page bills-page">
      <NavBar onBack={() => window.history.back()}>账单</NavBar>

      {/* 搜索+工具栏 */}
      <div className="bills-toolbar">
        <input
          className="bills-search-input"
          placeholder="搜索备注/分类"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <button
          className={`bills-tool-btn ${filterOpen ? 'active' : ''}`}
          onClick={() => setFilterOpen(!filterOpen)}
        >
          {filterOpen ? '收起' : '筛选'}
        </button>
        <button
          className="bills-tool-btn"
          onClick={() => {
            if (isSelectMode) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(filteredTx.map((t) => t.id)));
            }
          }}
        >
          {isSelectMode ? '取消' : '选择'}
        </button>
      </div>

      {/* 筛选面板 */}
      <div className={`bills-filter-panel ${filterOpen ? 'show' : ''}`}>
        <div className="filter-row">
          <label>方向</label>
          <select value={filters.direction} onChange={(e) => setFilters((p) => ({ ...p, direction: e.target.value }))}>
            <option value="">全部</option>
            <option value="expense">支出</option>
            <option value="income">收入</option>
            <option value="transfer">转账</option>
          </select>
        </div>
        <div className="filter-row">
          <label>分类</label>
          <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
            <option value="">全部分类</option>
            {allCategoryOptions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label>账户</label>
          <select value={filters.accountId} onChange={(e) => setFilters((p) => ({ ...p, accountId: e.target.value }))}>
            <option value="">全部账户</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label>日期</label>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} />
          <span style={{ color: 'var(--color-text-hint)', fontSize: 12 }}>~</span>
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} />
        </div>
        <div className="filter-row">
          <label>金额</label>
          <input type="number" placeholder="最小" value={filters.amtMin} onChange={(e) => setFilters((p) => ({ ...p, amtMin: e.target.value }))} />
          <span style={{ color: 'var(--color-text-hint)', fontSize: 12 }}>~</span>
          <input type="number" placeholder="最大" value={filters.amtMax} onChange={(e) => setFilters((p) => ({ ...p, amtMax: e.target.value }))} />
        </div>
        <div className="filter-row">
          <label>报销</label>
          <select value={filters.reimb} onChange={(e) => setFilters((p) => ({ ...p, reimb: e.target.value }))}>
            <option value="">全部</option>
            <option value="pending">待报销</option>
            <option value="done">已报销</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="filter-btn filter-btn-clear" onClick={clearFilters}>重置</button>
          <button className="filter-btn filter-btn-apply" onClick={() => setFilterOpen(false)}>确定</button>
        </div>
      </div>

      {/* 已筛选标签 */}
      {activeFilterTags.length > 0 && (
        <div className="bills-filter-tags">
          {activeFilterTags.map((tag) => (
            <span key={tag.key} className="bills-filter-tag">
              {tag.label}
              <span className="tag-close" onClick={() => removeFilterTag(tag.key)}>x</span>
            </span>
          ))}
          <span className="bills-filter-tag" onClick={clearFilters} style={{ cursor: 'pointer' }}>
            清除全部
          </span>
        </div>
      )}

      {/* 月份切换 */}
      <div className="bills-month-bar">
        <button className="month-arrow-btn" onClick={() => changeMonth(-1)}>&lt;</button>
        <span className="month-label">{selectedMonth}</span>
        <button className="month-arrow-btn" onClick={() => changeMonth(1)} disabled={selectedMonth >= getToday().slice(0, 7)}>&gt;</button>
      </div>

      {/* 排序 */}
      <div className="bills-sort-bar">
        {[
          { col: 'date' as SortCol, label: '日期' },
          { col: 'amount' as SortCol, label: '金额' },
          { col: 'category' as SortCol, label: '分类' },
        ].map(({ col, label }) => (
          <div
            key={col}
            className={`sort-chip ${sortCol === col ? 'active' : ''}`}
            onClick={() => toggleSort(col)}
          >
            {label}
            {sortCol === col && (sortAsc ? ' ↑' : ' ↓')}
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-hint)' }}>
          共 {filteredTx.length} 条
        </span>
      </div>

      {/* 账单列表 */}
      <div className="bills-list">
        {Object.keys(grouped).length === 0 ? (
          <div className="bills-empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">暂无账单</div>
            <div className="empty-desc">点击记账按钮添加第一笔</div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => {
            const ds = dailySum[date];
            return (
              <div key={date} className="bill-day-group">
                <div className="bdg-header">
                  <span className="bdg-date">{formatDayLabel(date)}</span>
                  <span className="bdg-summary">
                    {ds.income > 0 && <span className="sum-inc">+{formatAmount(ds.income)}</span>}
                    {ds.expense > 0 && <span className="sum-exp">-{formatAmount(ds.expense)}</span>}
                    {ds.income === 0 && ds.expense === 0 && (
                      <span style={{ color: 'var(--color-text-hint)', fontSize: 11 }}>¥0.00</span>
                    )}
                  </span>
                </div>
                {txs.map((tx) => {
                  const cat = getCatInfo(tx.category);
                  const acct = getAccountById(tx.accountId);
                  const dir = tx.direction || 'expense';
                  const isIncome = dir === 'income';
                  const dirLabels: Record<string, string> = { expense: '支出', income: '收入', transfer: '转账' };

                  return (
                    <SwipeAction
                      key={tx.id}
                      rightActions={[
                        ...(tx.reimbStatus === 'pending'
                          ? [{ key: 'reimb' as const, text: '确认报销', color: 'success' as const, onClick: () => handleConfirmReimburse(tx.id) }]
                          : []),
                        { key: 'del' as const, text: '删除', color: 'danger' as const, onClick: () => handleDelete(tx.id) },
                      ]}
                    >
                      <div
                        className="bill-card"
                        onClick={() => {
                          if (isSelectMode) toggleSelect(tx.id);
                          else openEditBill(tx);
                        }}
                      >
                        {isSelectMode && (
                          <input
                            type="checkbox"
                            className="bc-check"
                            checked={selectedIds.has(tx.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelect(tx.id)}
                          />
                        )}

                        <div className="bc-left">
                          <div className="bc-cat" style={{ background: `${cat.color}12` }}>
                            {cat.icon}
                          </div>
                          <div className="bc-info">
                            <div className="bc-merchant">{tx.remark || tx.category}</div>
                            <div className="bc-sub">
                              <span className={`dir-tag ${dir}`}>{dirLabels[dir] || dir}</span>
                              <span>{tx.subCategory ? `${tx.category} · ${tx.subCategory}` : tx.category}</span>
                              {acct && <span>{acct.icon || '💳'} {acct.name}</span>}
                              {tx.fromRecurring && <span className="ai-badge">周期</span>}
                            </div>
                          </div>
                        </div>

                        <div className="bc-right">
                          {tx.reimbStatus === 'pending' && (
                            <span className="reimb-tag pending">📋 待报销</span>
                          )}
                          {tx.reimbStatus === 'done' && (
                            <span className="reimb-tag done">✓ 已报销</span>
                          )}
                          <div className={`bc-amt ${isIncome ? 'amt-inc' : 'amt-exp'}`}>
                            {isIncome ? '+' : '-'}¥{formatAmount(tx.amount)}
                          </div>
                          <div className="bc-date">{tx.time}</div>
                        </div>
                      </div>
                    </SwipeAction>
                  );
                })}
              </div>
            );
          })
        )}
        <div className="bills-list-bottom" />
      </div>

      {/* 批量操作栏 */}
      <div className={`bills-batch-bar ${isSelectMode ? 'show' : ''}`}>
        <button className="batch-btn batch-btn-cancel" onClick={() => setSelectedIds(new Set())}>
          取消
        </button>
        <span className="batch-info">已选 {selectedIds.size} 条</span>
        <button className="batch-btn batch-btn-select-all" onClick={toggleSelectAll}>
          {filteredTx.length > 0 && filteredTx.every((t) => selectedIds.has(t.id)) ? '取消全选' : '全选'}
        </button>
        <button className="batch-btn batch-btn-delete" onClick={batchDelete} disabled={selectedIds.size === 0}>
          删除
        </button>
      </div>

      {/* ========== 完整编辑弹窗 ========== */}
      <Popup
        visible={!!editingTx}
        onMaskClick={() => {
          setEditingTx(null);
          setEditForm(EMPTY_EDIT_FORM);
        }}
        position="bottom"
        bodyStyle={{ borderRadius: '16px 16px 0 0', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {editingTx && (
          <div className="edit-bill-modal">
            {/* 标题栏 */}
            <div className="edit-modal-header">
              <h2 className="edit-modal-title">编辑账单</h2>
              <button className="edit-modal-close" onClick={() => {
                setEditingTx(null);
                setEditForm(EMPTY_EDIT_FORM);
              }}>&#10005;</button>
            </div>

            <div className="edit-bill-form">
              {/* 方向切换 */}
              <div className="form-group">
                <div className="form-label">方向</div>
                <div className="dir-toggle">
                  {(['expense', 'income', 'transfer'] as TransactionDirection[]).map((d) => {
                    const labels: Record<string, string> = { expense: '支出', income: '收入', transfer: '转账' };
                    const colors: Record<string, string> = { expense: '#ff4d4f', income: '#52c41a', transfer: '#1677ff' };
                    return (
                      <button
                        key={d}
                        className="dir-toggle-btn"
                        style={editForm.direction === d ? {
                          background: colors[d],
                          color: '#fff',
                          borderColor: colors[d],
                        } : {}}
                        onClick={() => handleEditDirChange(d)}
                      >
                        {labels[d]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 金额 */}
              <div className="form-group">
                <div className="form-label">金额</div>
                <div className="edit-amount-wrap">
                  <span className="edit-currency">¥</span>
                  <input
                    className="edit-amount-input"
                    type="number"
                    placeholder="0.00"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
              </div>

              {/* 账户 */}
              <div className="form-group">
                <div className="form-label">{editForm.direction === 'transfer' ? '转出账户' : '账户'}</div>
                <Picker
                  columns={editAccountColumns}
                  visible={accountPickerVisible}
                  onConfirm={(v) => {
                    setEditForm((p) => ({ ...p, accountId: v[0] as string }));
                    setAccountPickerVisible(false);
                  }}
                  onClose={() => setAccountPickerVisible(false)}
                  value={[editForm.accountId]}
                >
                  {() => (
                    <div className="edit-picker-trigger" onClick={() => setAccountPickerVisible(true)}>
                      {(() => {
                        const acct = accounts.find((a) => a.id === editForm.accountId);
                        return acct
                          ? <span className="edit-picker-value">{acct.icon} {acct.name}</span>
                          : <span className="edit-picker-placeholder">选择账户</span>;
                      })()}
                      <span className="edit-picker-arrow">&#8250;</span>
                    </div>
                  )}
                </Picker>
              </div>

              {/* 转入账户（仅转账时显示） */}
              {editForm.direction === 'transfer' && (
                <div className="form-group">
                  <div className="form-label">转入账户</div>
                  <Picker
                    columns={editAccountColumns}
                    visible={targetAccountPickerVisible}
                    onConfirm={(v) => {
                      setEditForm((p) => ({ ...p, targetAccountId: v[0] as string }));
                      setTargetAccountPickerVisible(false);
                    }}
                    onClose={() => setTargetAccountPickerVisible(false)}
                    value={[editForm.targetAccountId]}
                  >
                    {() => (
                      <div className="edit-picker-trigger" onClick={() => setTargetAccountPickerVisible(true)}>
                        {(() => {
                          const acct = accounts.find((a) => a.id === editForm.targetAccountId);
                          return acct
                            ? <span className="edit-picker-value">{acct.icon} {acct.name}</span>
                            : <span className="edit-picker-placeholder">选择转入账户</span>;
                        })()}
                        <span className="edit-picker-arrow">&#8250;</span>
                      </div>
                    )}
                  </Picker>
                </div>
              )}

              {/* 分类 */}
              <div className="form-group">
                <div className="form-label">分类</div>
                <Picker
                  columns={editPickerColumns}
                  visible={catPickerVisible}
                  onConfirm={(v) => {
                    if (v[0]) {
                      const subCat = v[1] && v[1] !== '_none_' ? String(v[1]) : '';
                      setEditForm((p) => ({ ...p, category: v[0] as string, subCategory: subCat }));
                    }
                    setCatPickerVisible(false);
                  }}
                  onClose={() => setCatPickerVisible(false)}
                  value={[editForm.category, editForm.subCategory]}
                >
                  {() => (
                    <div className="edit-picker-trigger" onClick={() => setCatPickerVisible(true)}>
                      {editForm.category ? (
                        <span className="edit-picker-value">
                          {getCatInfo(editForm.category).icon} {editForm.category}
                          {editForm.subCategory ? ` · ${editForm.subCategory}` : ''}
                        </span>
                      ) : (
                        <span className="edit-picker-placeholder">选择分类</span>
                      )}
                      <span className="edit-picker-arrow">&#8250;</span>
                    </div>
                  )}
                </Picker>
              </div>

              {/* 备注 */}
              <div className="form-group">
                <div className="form-label">备注 / 商家</div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="备注或商家名称"
                  value={editForm.remark}
                  onChange={(e) => setEditForm((p) => ({ ...p, remark: e.target.value }))}
                />
              </div>

              {/* 日期 */}
              <div className="form-group">
                <div className="form-label">日期</div>
                <div className="edit-datetime-row">
                  <input
                    className="form-input"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="form-input"
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm((p) => ({ ...p, time: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* 可报销开关 - 仅支出方向显示 */}
              {editForm.direction === 'expense' && (
                <div className="form-group">
                  <div className="edit-reimb-row">
                    <span className="form-label" style={{ marginBottom: 0 }}>可报销</span>
                    <Switch
                      checked={editForm.reimbursable}
                      onChange={(v) => setEditForm((p) => ({ ...p, reimbursable: v }))}
                    />
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="edit-actions-row">
                <button className="filter-btn filter-btn-clear" onClick={deleteEditingBill} style={{ flex: 1 }}>
                  删除
                </button>
                <button className="filter-btn filter-btn-apply" onClick={saveEditingBill} style={{ flex: 2 }}>
                  保存修改
                </button>
              </div>
            </div>
          </div>
        )}
      </Popup>

      {/* 分类 Picker（独立挂载，避免嵌套 Popup 问题） */}
      <Picker
        columns={editPickerColumns}
        visible={catPickerVisible}
        onConfirm={(v) => {
          if (v[0]) {
            const subCat = v[1] && v[1] !== '_none_' ? String(v[1]) : '';
            setEditForm((p) => ({ ...p, category: v[0] as string, subCategory: subCat }));
          }
          setCatPickerVisible(false);
        }}
        onClose={() => setCatPickerVisible(false)}
        value={[editForm.category, editForm.subCategory]}
      />

      {/* 账户 Picker */}
      <Picker
        columns={editAccountColumns}
        visible={accountPickerVisible}
        onConfirm={(v) => {
          setEditForm((p) => ({ ...p, accountId: v[0] as string }));
          setAccountPickerVisible(false);
        }}
        onClose={() => setAccountPickerVisible(false)}
        value={[editForm.accountId]}
      />

      {/* 转入账户 Picker */}
      <Picker
        columns={editAccountColumns}
        visible={targetAccountPickerVisible}
        onConfirm={(v) => {
          setEditForm((p) => ({ ...p, targetAccountId: v[0] as string }));
          setTargetAccountPickerVisible(false);
        }}
        onClose={() => setTargetAccountPickerVisible(false)}
        value={[editForm.targetAccountId]}
      />
    </div>
  );
}
