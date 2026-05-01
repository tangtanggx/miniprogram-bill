import { useState } from 'react';
import { NavBar, Dialog, Toast } from 'antd-mobile';
import { AddCircleOutline } from 'antd-mobile-icons';
import { useBudgetStore, useTransactionStore } from '@/stores/index';
import type { Budget } from '@/types/index';
import BudgetCard from '@/components/budget/BudgetCard';
import { formatAmount } from '@/utils/index';
import './BudgetPage.css';

export default function BudgetPage() {
  const { budgets, addBudget, updateBudget, getBudgetProgress } = useBudgetStore();
  const { transactions } = useTransactionStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const now = new Date();
  const selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [form, setForm] = useState({
    category: '',
    subCategory: '',
    monthlyAmount: 0,
    enabled: true,
    period: 'month' as 'month' | 'year',
  });

  const resetForm = () => {
    setForm({ category: '', subCategory: '', monthlyAmount: 0, enabled: true, period: 'month' });
    setEditingBudget(null);
    setShowAdd(false);
  };

  const handleSubmit = () => {
    if (!form.monthlyAmount || form.monthlyAmount <= 0) {
      Toast.show({ content: '请输入预算金额' });
      return;
    }
    const data = {
      category: form.category,
      subCategory: form.subCategory,
      monthlyAmount: form.monthlyAmount,
      enabled: form.enabled,
      period: form.period,
    };
    if (editingBudget) {
      updateBudget(editingBudget.id, data);
      Toast.show({ content: '更新成功' });
    } else {
      addBudget(data);
      Toast.show({ content: '添加成功' });
    }
    resetForm();
  };

  // 计算已支出
  const monthTx = transactions.filter(t => t.date.startsWith(selectedMonth) && t.direction === 'expense');
  const spentByCategory: Record<string, number> = {};
  for (const tx of monthTx) {
    const key = tx.subCategory ? `${tx.category}|${tx.subCategory}` : tx.category;
    spentByCategory[key] = (spentByCategory[key] || 0) + tx.amount;
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
  }

  const progressList = getBudgetProgress(selectedMonth, spentByCategory);
  const totalExpense = monthTx.reduce((s, t) => s + t.amount, 0);
  const totalBudget = budgets.filter(b => b.enabled).reduce((s, b) => s + b.monthlyAmount, 0);

  return (
    <div className="page budget-page">
      <NavBar onBack={() => window.history.back()}>预算管理</NavBar>

      <div className="budget-summary">
        <div className="budget-summary-item">
          <span className="budget-label">本月支出</span>
          <span className="budget-value expense">{formatAmount(totalExpense)}</span>
        </div>
        <div className="budget-summary-item">
          <span className="budget-label">总预算</span>
          <span className="budget-value">{formatAmount(totalBudget)}</span>
        </div>
      </div>

      <div className="budget-progress-list">
        {progressList.map(p => (
          <BudgetCard key={p.budget.id} progress={p} onClick={() => {
            setEditingBudget(p.budget);
            setForm({
              category: p.budget.category || '',
              subCategory: p.budget.subCategory || '',
              monthlyAmount: p.budget.monthlyAmount,
              enabled: p.budget.enabled,
              period: p.budget.period,
            });
            setShowAdd(true);
          }} />
        ))}
        {progressList.length === 0 && (
          <div className="budget-empty">暂无预算，点击右下角添加</div>
        )}
      </div>

      <div className="budget-fab" onClick={() => { resetForm(); setShowAdd(true); }}>
        <AddCircleOutline fontSize={28} color="#fff" />
      </div>

      <Dialog
        visible={showAdd}
        title={editingBudget ? '编辑预算' : '添加预算'}
        content={
          <div className="budget-form">
            <div className="form-group">
              <label>预算金额</label>
              <input type="number" placeholder="0.00"
                value={form.monthlyAmount || ''}
                onChange={e => setForm({ ...form, monthlyAmount: Number(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>分类（留空为总预算）</label>
              <input type="text" placeholder="如：餐饮"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label>子分类</label>
              <input type="text" placeholder="如：早餐"
                value={form.subCategory}
                onChange={e => setForm({ ...form, subCategory: e.target.value })} />
            </div>
          </div>
        }
        actions={[
          { key: 'cancel', text: '取消', onClick: resetForm },
          { key: 'confirm', text: '确定', onClick: handleSubmit, bold: true },
        ]}
        onClose={resetForm}
      />
    </div>
  );
}
