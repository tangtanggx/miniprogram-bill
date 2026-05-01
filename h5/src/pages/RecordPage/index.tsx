/**
 * 记账页面 - 手动录入 + AI智能记账（底部入口）
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Picker, Toast, Dialog, Switch } from 'antd-mobile';
import { CameraOutline, CheckCircleOutline, EditSOutline } from 'antd-mobile-icons';
import { DIRECTION_CONFIGS } from '@/constants';
import { useAccounts, useTransactions, useCategories } from '@/hooks';
import { recognizeAndParseBill } from '@/services/ocrService';
import { getToday, getNowTime } from '@/utils';
import type { TransactionDirection, AIRecognitionResult } from '@/types';
import './RecordPage.css';

export default function RecordPage() {
  const { accounts, createAccountIfNeeded } = useAccounts();
  const { quickRecord } = useTransactions();
  const { getCatsForDirection } = useCategories();

  const [direction, setDirection] = useState<TransactionDirection>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState(getNowTime());
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [remark, setRemark] = useState('');
  const [reimbursable, setReimbursable] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AIRecognitionResult[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AIRecognitionResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const categories = getCatsForDirection(direction as 'expense' | 'income');

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const catDef = categories.find((c) => c.name === cat);
    if (catDef?.subCategories.length) setSubCategory(catDef.subCategories[0].name);
    else setSubCategory('');
  };

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) { Toast.show({ content: '请输入金额', icon: 'fail' }); return; }
    if (!category) { Toast.show({ content: '请选择分类', icon: 'fail' }); return; }
    const acctName = accounts.find((a) => a.id === accountId)?.name || '未选择账户';
    quickRecord({ date, time, direction, amount: parseFloat(amount), accountName: acctName, category, subCategory, remark, reimbursable: direction === 'expense' ? reimbursable : undefined });
    Toast.show({ content: '记账成功', icon: 'success' });
    setAmount(''); setRemark(''); setReimbursable(false);
    setTimeout(() => navigate('/'), 600);
  };

  const applyAIResult = (r: AIRecognitionResult) => {
    // 根据方向切换分类源
    const cats = getCatsForDirection(r.direction as 'expense' | 'income');
    setDirection(r.direction);
    setAmount(String(Math.abs(r.amount)));
    setDate(r.date || getToday());
    setTime(r.time || '00:00');
    setCategory(r.category);
    const catDef = cats.find((c) => c.name === r.category);
    setSubCategory(r.subCategory || (catDef?.subCategories[0]?.name || ''));
    setRemark(r.remark);
    if (r.accountName) {
      const result = createAccountIfNeeded(r.accountName);
      setAccountId(result.accountId);
    }
    setShowAiPanel(false);
  };

  const handleOCR = useCallback(async (file: File) => {
    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const { results } = await recognizeAndParseBill(base64);
          if (results.length === 1) {
            applyAIResult(results[0]);
            Toast.show({ content: '已自动填入1笔交易', icon: 'success' });
          } else if (results.length > 1) {
            setAiResults(results); setShowAiPanel(true);
            Toast.show({ content: `识别到${results.length}笔交易，请选择`, icon: 'success' });
          } else { Toast.show({ content: '未识别到交易记录', icon: 'fail' }); }
        } catch (err) { Toast.show({ content: `AI解析失败: ${(err as Error).message}`, icon: 'fail' }); }
        setOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch { setOcrLoading(false); }
  }, []);

  /** 一键导入所有记录 */
  const handleImportAll = () => {
    Dialog.confirm({
      content: `确定要一键导入全部${aiResults.length}笔交易吗？`,
      onConfirm: () => {
        let successCount = 0;
        aiResults.forEach((r) => {
          try {
            quickRecord({
              date: r.date || getToday(),
              time: r.time || '00:00',
              direction: r.direction,
              amount: Math.abs(r.amount),
              accountName: r.accountName || '未识别账户',
              category: r.category,
              subCategory: r.subCategory,
              remark: r.remark,
            });
            successCount++;
          } catch { /* skip */ }
        });
        setShowAiPanel(false);
        setAiResults([]);
        Toast.show({ content: `成功导入${successCount}笔交易`, icon: 'success' });
      },
    });
  };

  /** 点击单条记录进入编辑模式 */
  const handleEditItem = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const r = aiResults[idx];
    // 确保账户存在
    if (r.accountName) createAccountIfNeeded(r.accountName);
    setEditForm({ ...r });
    setEditingIdx(idx);
  };

  /** 保存编辑 */
  const handleSaveEdit = () => {
    if (!editForm || editingIdx === null) return;
    const updated = [...aiResults];
    updated[editingIdx] = editForm;
    setAiResults(updated);
    setEditingIdx(null);
    setEditForm(null);
    Toast.show({ content: '已修改', icon: 'success' });
  };

  /** 取消编辑 */
  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditForm(null);
  };

  /** 将编辑中的单条填入表单 */
  const handleFillSingle = (r: AIRecognitionResult) => {
    applyAIResult(r);
  };

  const dirColor = (d: string) => {
    const cfg = DIRECTION_CONFIGS.find(c => c.key === d);
    return cfg?.color || 'var(--color-text)';
  };


  const pickerColumns = [
    categories.map((c) => ({
      label: c.name,
      value: c.name,
      children: c.subCategories.map((s) => ({ label: s.name, value: s.name })),
    })),
  ];

  // 编辑模式：方向对应的分类
  const editCategories = editForm
    ? getCatsForDirection(editForm.direction as 'expense' | 'income')
    : [];

  return (
    <div className="page record-page">
      <NavBar>记一笔</NavBar>

      {/* 方向切换 */}
      <div className="direction-tabs">
        {DIRECTION_CONFIGS.map((cfg) => (
          <div key={cfg.key} className={`dir-tab ${direction === cfg.key ? 'active' : ''}`}
            style={{ '--dir-color': cfg.color } as React.CSSProperties}
            onClick={() => { setDirection(cfg.key as TransactionDirection); setCategory(''); setSubCategory(''); if (cfg.key !== 'expense') setReimbursable(false); }}>
            {cfg.label}
          </div>
        ))}
      </div>

      {/* ===== AI智能记账入口 ===== */}
      <div className="ai-banner-bottom-area">
        <div className="manual-divider">
          <span className="manual-divider-line" />
          <span className="manual-divider-text">或者</span>
          <span className="manual-divider-line" />
        </div>
        <div className="ai-banner" onClick={() => fileRef.current?.click()}>
          <div className="ai-banner-bg" />
          <div className="ai-banner-content">
            <div className="ai-banner-left">
              <div className="ai-banner-icon-wrap">
                <CameraOutline fontSize={22} />
              </div>
              <div className="ai-banner-text">
                <div className="ai-banner-title">AI 智能记账</div>
                <div className="ai-banner-desc">拍照 / 截图识别账单，自动填充金额和分类</div>
              </div>
            </div>
            <div className="ai-banner-action">
              <span className="ai-banner-btn">去拍照</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 金额 */}
      <div className="amount-section">
        <span className="currency">¥</span>
        <input type="number" className="amount-input" placeholder="0.00" value={amount}
          onChange={(e) => setAmount(e.target.value)} />
      </div>

      {/* 表单 */}
      <div className="form-card">
        {/* 账户 */}
        <div className="form-row" onClick={() => {
          if (accounts.length === 0) { Toast.show({ content: '请先在账户管理中添加账户', icon: 'fail' }); return; }
        }}>
          <span className="form-label">账户</span>
          <Picker columns={[accounts.map((a) => ({ label: a.name, value: a.id }))]}
            onConfirm={(v) => setAccountId(v[0] as string)} value={[accountId]}>
            {(_items, actions) => (
              <span className="form-value clickable" onClick={() => actions.open()}>
                {accounts.find((a) => a.id === accountId)?.name || '选择账户'}
              </span>
            )}
          </Picker>
        </div>

        {/* 分类 */}
        <div className="form-row">
          <span className="form-label">分类</span>
          <Picker columns={pickerColumns}
            onConfirm={(v) => { if (v[0]) handleCategoryChange(v[0] as string); if (v[1]) setSubCategory(v[1] as string); }}>
            {(_items, actions) => (
              <span className="form-value clickable" onClick={() => actions.open()}>
                {category ? `${category}${subCategory ? ` > ${subCategory}` : ''}` : '选择分类'}
              </span>
            )}
          </Picker>
        </div>

        {/* 分类快捷网格 */}
        <div className="cat-grid">
          {categories.map((c) => (
            <div key={c.name} className={`cat-item ${category === c.name ? 'active' : ''}`}
              onClick={() => handleCategoryChange(c.name)}>
              <span className="cat-icon">{c.icon}</span>
              <span className="cat-name">{c.name}</span>
            </div>
          ))}
        </div>

        {/* 二级分类网格 */}
        {category && (
          <div className="subcat-grid">
            {categories.find((c) => c.name === category)?.subCategories.map((s) => (
              <div key={s.name} className={`subcat-item ${subCategory === s.name ? 'active' : ''}`}
                onClick={() => setSubCategory(s.name)}>
                <span>{s.icon}</span><span>{s.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* 可报销开关 - 仅支出方向显示 */}
        {direction === 'expense' && (
          <div className="form-row reimb-toggle-row">
            <span className="form-label">可报销</span>
            <Switch checked={reimbursable} onChange={setReimbursable} />
          </div>
        )}

        {/* 日期 */}
        <div className="form-row">
          <span className="form-label">日期</span>
          <input type="date" className="form-input-inline" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* 时间 */}
        <div className="form-row">
          <span className="form-label">时间</span>
          <input type="time" className="form-input-inline" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        {/* 备注 */}
        <div className="form-row">
          <span className="form-label">备注</span>
          <input className="form-input-inline" placeholder="备注/商家" value={remark}
            onChange={(e) => setRemark(e.target.value)} />
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="save-btn-wrap">
        <button className="btn btn-primary btn-block save-btn" onClick={handleSave}>保存</button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
        const f = e.target.files?.[0]; if (f) handleOCR(f); e.target.value = '';
      }} />

      {/* ===== AI识别结果面板 ===== */}
      {showAiPanel && aiResults.length > 0 && (
        <div className="ai-panel" onClick={(e) => e.stopPropagation()}>
          <div className="ai-panel-handle" />
          <div className="ai-header">
            <span className="ai-header-title">
              <span className="ai-header-dot" />
              AI 识别结果
              <span className="ai-header-count">{aiResults.length}笔</span>
            </span>
            <span className="ai-close" onClick={() => setShowAiPanel(false)}>✕</span>
          </div>

          <div className="ai-panel-list">
            {aiResults.map((r, i) => (
              <div key={i} className="ai-item">
                {editingIdx === i && editForm ? (
                  /* === 编辑模式 === */
                  <div className="ai-item-edit">
                    <div className="ai-edit-row">
                      <span className="ai-edit-label">金额</span>
                      <input className="ai-edit-input" type="number" value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: Math.abs(Number(e.target.value)) || 0 })} />
                    </div>
                    <div className="ai-edit-row">
                      <span className="ai-edit-label">账户</span>
                      <Picker
                        columns={[accounts.map((a) => ({ label: a.name, value: a.name }))]}
                        onConfirm={(v) => setEditForm({ ...editForm, accountName: v[0] as string })}
                        value={[editForm.accountName]}
                      >
                        {(_items, actions) => (
                          <span className="ai-edit-value clickable" onClick={() => actions.open()}>
                            {editForm.accountName || '选择账户'}
                          </span>
                        )}
                      </Picker>
                    </div>
                    <div className="ai-edit-row">
                      <span className="ai-edit-label">分类</span>
                      <Picker
                        columns={[editCategories.map((c) => ({
                          label: c.name, value: c.name,
                          children: c.subCategories.map((s) => ({ label: s.name, value: s.name })),
                        }))]}
                        onConfirm={(v) => {
                          const newForm = { ...editForm };
                          if (v[0]) newForm.category = v[0] as string;
                          if (v[1]) newForm.subCategory = v[1] as string;
                          setEditForm(newForm);
                        }}
                        value={[editForm.category, editForm.subCategory]}
                      >
                        {(_items, actions) => (
                          <span className="ai-edit-value clickable" onClick={() => actions.open()}>
                            {editForm.category}{editForm.subCategory ? ` > ${editForm.subCategory}` : ''}
                          </span>
                        )}
                      </Picker>
                    </div>
                    <div className="ai-edit-row">
                      <span className="ai-edit-label">备注</span>
                      <input className="ai-edit-input" value={editForm.remark}
                        onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })} />
                    </div>
                    <div className="ai-edit-actions">
                      <button className="ai-edit-btn cancel" onClick={handleCancelEdit}>取消</button>
                      <button className="ai-edit-btn confirm" onClick={handleSaveEdit}>确定</button>
                      <button className="ai-edit-btn fill" onClick={() => handleFillSingle(editForm)}>填入表单</button>
                    </div>
                  </div>
                ) : (
                  /* === 展示模式 === */
                  <div className="ai-item-display">
                    <div className="ai-item-top">
                      <div className="ai-item-left">
                        <div className="ai-item-dir" style={{ color: dirColor(r.direction), background: dirColor(r.direction) + '14' }}>
                          {r.direction === 'expense' ? '支' : r.direction === 'income' ? '收' : '转'}
                        </div>
                        <div className="ai-item-info">
                          <div className="ai-item-amount">¥{Math.abs(r.amount).toFixed(2)}</div>
                          <div className="ai-item-meta">{r.category} · {r.subCategory}</div>
                        </div>
                      </div>
                      <span className="ai-item-edit-btn" onClick={(e) => handleEditItem(i, e)}>
                        <EditSOutline fontSize={16} />
                      </span>
                    </div>
                    <div className="ai-item-bottom">
                      <div className="ai-item-acct">
                        <span className="ai-item-acct-icon">💳</span>
                        <span>{r.accountName || '未识别账户'}</span>
                      </div>
                      {r.remark && <div className="ai-item-remark">{r.remark}</div>}
                      <span className="ai-item-fill" onClick={(e) => { e.stopPropagation(); applyAIResult(r); }}>
                        <CheckCircleOutline fontSize={14} /> 填入
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 一键导入按钮 */}
          <div className="ai-panel-footer">
            <button className="ai-import-all-btn" onClick={handleImportAll}>
              一键导入全部{aiResults.length}笔
            </button>
            <div className="ai-panel-tip">点击"填入"将单条填入表单，点击编辑图标可修改</div>
          </div>
        </div>
      )}

      {/* 识别加载遮罩 */}
      {ocrLoading && (
        <div className="loading-mask">
          <div className="loading-spinner" />
          <span className="loading-text">AI 正在识别中...</span>
          <span className="loading-sub">解析账单金额、分类、商家信息</span>
        </div>
      )}
    </div>
  );
}
