/**
 * 统计分析页面 - 全面改造版
 * 参考 ai-bill-app page-stats.js
 * 功能：快捷时间选择 / 4卡片概览+环比 / 报销概览 / 分类饼图 / 面积折线趋势 / 账户分布 / 分类排行TOP10 / 图表下载
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NavBar, Toast } from 'antd-mobile';
import * as echarts from 'echarts';
import { useTransactions } from '@/hooks';
import { useAccountStore } from '@/stores';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { formatAmount, getToday, formatDate } from '@/utils';
import './StatsPage.css';

/* ===== 常量 ===== */

/** 分类图标+颜色查找表 */
const CAT_INFO_MAP: Record<string, { icon: string; color: string }> = {};
const FALLBACK_CAT = { icon: '📌', color: '#8c8c8c' };

// 支出分类颜色（与ai-bill-app一致）
const EXPENSE_COLORS = [
  '#ff4d4f', '#fa8c16', '#52c41a', '#1677ff', '#722ed1',
  '#13c2c2', '#eb2f96', '#faad14', '#2f54eb', '#9254de',
  '#f5222d', '#1890ff',
];
const INCOME_COLORS = [
  '#52c41a', '#13c2c2', '#1677ff', '#722ed1', '#fa541c',
];

// 构建分类查找表
DEFAULT_CATEGORIES.expense.forEach((c, i) => {
  CAT_INFO_MAP[c.name] = { icon: c.icon, color: EXPENSE_COLORS[i % EXPENSE_COLORS.length] };
});
DEFAULT_CATEGORIES.income.forEach((c, i) => {
  CAT_INFO_MAP[c.name] = { icon: c.icon, color: INCOME_COLORS[i % INCOME_COLORS.length] };
});

/** 时间预设类型 */
type StatPreset = 'month' | 'lastMonth' | 'quarter' | 'year' | '30d' | '90d' | '';

/** 预设配置 */
const PRESETS: { key: StatPreset; label: string }[] = [
  { key: 'month', label: '本月' },
  { key: 'lastMonth', label: '上月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
  { key: '30d', label: '近30天' },
  { key: '90d', label: '近90天' },
];

/* ===== 工具函数 ===== */

/** 获取当月天数 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 获取预设对应的年月 */
function getPresetYM(preset: StatPreset): { year: number; month: number } {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  switch (preset) {
    case 'month': return { year: y, month: m };
    case 'lastMonth': return { year: m === 1 ? y - 1 : y, month: m === 1 ? 12 : m - 1 };
    case 'quarter': return { year: y, month: Math.floor((m - 1) / 3) * 3 + 1 };
    case 'year': return { year: y, month: 1 };
    case '30d': {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }
    case '90d': {
      const d = new Date(now); d.setDate(d.getDate() - 89);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }
    default: return { year: y, month: m };
  }
}

/** 获取预设对应的日期范围 */
function getPresetRange(preset: StatPreset, year: number, month: number): { start: string; end?: string } {
  if (preset === '30d') {
    const d = new Date(); d.setDate(d.getDate() - 29);
    return { start: formatDate(d), end: getToday() };
  }
  if (preset === '90d') {
    const d = new Date(); d.setDate(d.getDate() - 89);
    return { start: formatDate(d), end: getToday() };
  }
  if (preset === 'quarter') {
    const qm = Math.floor((month - 1) / 3) * 3 + 1;
    const start = `${year}-${String(qm).padStart(2, '0')}-01`;
    const endM = qm + 2;
    const end = `${year}-${String(endM).padStart(2, '0')}-${getDaysInMonth(year, endM)}`;
    return { start, end };
  }
  if (preset === 'year') {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  // month / lastMonth / 自定义月份
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${getDaysInMonth(year, month)}`;
  return { start, end };
}

/** 获取显示标签 */
function getStatLabel(preset: StatPreset, year: number, month: number): string {
  if (preset === '30d') return '近30天';
  if (preset === '90d') return '近90天';
  if (preset === 'year') return `${year}年`;
  if (preset === 'quarter') return `${year}年Q${Math.floor((month - 1) / 3) + 1}`;
  return `${year}年${month}月`;
}

/** 下载图表为PNG */
function downloadChart(ref: React.RefObject<HTMLDivElement | null>, name: string) {
  if (!ref.current) return;
  const canvas = ref.current.querySelector('canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `${name}_${getToday()}.png`;
  link.href = canvas.toDataURL();
  link.click();
  Toast.show({ icon: 'success', content: '图表已下载' });
}

/* ===== 主组件 ===== */

export default function StatsPage() {
  const { getTransactionsByRange } = useTransactions();
  const getAccountById = useAccountStore((s) => s.getAccountById);

  // 状态
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [preset, setPreset] = useState<StatPreset>('month');

  // 图表 refs
  const pieRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const acctRef = useRef<HTMLDivElement>(null);
  const pieInstRef = useRef<echarts.ECharts | null>(null);
  const lineInstRef = useRef<echarts.ECharts | null>(null);
  const acctInstRef = useRef<echarts.ECharts | null>(null);

  // ===== 预设切换 =====
  const changePreset = useCallback((p: StatPreset) => {
    setPreset(p);
    if (p) {
      const ym = getPresetYM(p);
      setYear(ym.year);
      setMonth(ym.month);
    }
  }, []);

  // 月份左右切换
  const changeMonth = useCallback((delta: number) => {
    setPreset('');
    let newM = month + delta;
    let newY = year;
    if (newM > 12) { newM = 1; newY++; }
    if (newM < 1) { newM = 12; newY--; }
    // 不允许超过当前月
    if (newY > now.getFullYear() || (newY === now.getFullYear() && newM > now.getMonth() + 1)) return;
    setYear(newY);
    setMonth(newM);
  }, [year, month]);

  // ===== 数据计算 =====
  const range = useMemo(() => getPresetRange(preset, year, month), [preset, year, month]);

  const filteredTx = useMemo(() => {
    return getTransactionsByRange(range.start, range.end);
  }, [getTransactionsByRange, range.start, range.end]);

  const label = useMemo(() => getStatLabel(preset, year, month), [preset, year, month]);

  // 天数
  const totalDays = useMemo(() => {
    if (preset === '30d') return 30;
    if (preset === '90d') return 90;
    if (preset === 'year') return 365;
    if (preset === 'quarter') return 90;
    return getDaysInMonth(year, month);
  }, [preset, year, month]);

  // 支出/收入汇总
  const expTx = useMemo(() => filteredTx.filter(t => t.direction === 'expense'), [filteredTx]);
  const incTx = useMemo(() => filteredTx.filter(t => t.direction === 'income'), [filteredTx]);
  const totalExp = useMemo(() => expTx.reduce((s, t) => s + t.amount, 0), [expTx]);
  const totalInc = useMemo(() => incTx.reduce((s, t) => s + t.amount, 0), [incTx]);
  const balance = totalInc + totalExp;

  // 环比（支出对比上月）
  const expChange = useMemo(() => {
    if (preset === '30d' || preset === '90d') return null;
    // 计算上一个周期
    let prevStart: string;
    let prevEnd: string;
    if (preset === 'quarter') {
      const qm = Math.floor((month - 1) / 3) * 3 + 1;
      if (qm <= 3) {
        prevStart = `${year - 1}-10-01`;
        prevEnd = `${year - 1}-12-31`;
      } else {
        const pqm = qm - 3;
        prevStart = `${year}-${String(pqm).padStart(2, '0')}-01`;
        prevEnd = `${year}-${String(pqm + 2).padStart(2, '0')}-${getDaysInMonth(year, pqm + 2)}`;
      }
    } else if (preset === 'year') {
      prevStart = `${year - 1}-01-01`;
      prevEnd = `${year - 1}-12-31`;
    } else {
      // month / lastMonth / custom
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      prevStart = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
      prevEnd = `${prevY}-${String(prevM).padStart(2, '0')}-${getDaysInMonth(prevY, prevM)}`;
    }
    const prevTx = getTransactionsByRange(prevStart, prevEnd).filter(t => t.direction === 'expense');
    const prevExp = prevTx.reduce((s, t) => s + t.amount, 0);
    if (prevExp === 0) return null;
    return ((totalExp - prevExp) / Math.abs(prevExp) * 100).toFixed(1);
  }, [preset, year, month, totalExp, getTransactionsByRange]);

  // 报销汇总
  const reimbData = useMemo(() => {
    const pending = filteredTx.filter(t => (t.reimbStatus === 'pending') && !t.reimbursed);
    const done = filteredTx.filter(t => t.reimbursed);
    return {
      pending,
      done,
      pendingAmt: pending.reduce((s, t) => s + Math.abs(t.amount), 0),
      doneAmt: done.reduce((s, t) => s + Math.abs(t.amount), 0),
    };
  }, [filteredTx]);

  // 分类汇总（支出，按一级分类）
  const catSummary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of expTx) {
      const key = tx.category;
      map[key] = (map[key] || 0) + tx.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [expTx]);

  // 每日趋势数据
  const dailyData = useMemo(() => {
    const startDate = new Date(range.start);
    const endDate = range.end ? new Date(range.end) : new Date();
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 864e5) + 1;

    const expArr = new Array(days).fill(0);
    const incArr = new Array(days).fill(0);
    const labels: string[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const ds = formatDate(d);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);

      for (const tx of filteredTx) {
        if (tx.date === ds) {
          if (tx.direction === 'expense') expArr[i] += tx.amount;
          else if (tx.direction === 'income') incArr[i] += tx.amount;
        }
      }
    }

    return { labels, expense: expArr, income: incArr };
  }, [filteredTx, range.start, range.end]);

  // 账户分布（支出）
  const acctSummary = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of expTx) {
      const id = tx.accountId || '_';
      map[id] = (map[id] || 0) + tx.amount;
    }
    return Object.entries(map)
      .map(([id, value]) => {
        const acct = id === '_' ? null : getAccountById(id);
        return {
          id,
          name: acct ? `${acct.icon} ${acct.name}` : '未分配',
          value: Math.round(value * 100) / 100,
          color: acct?.color || '#8c8c8c',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expTx, getAccountById]);

  // ===== 图表渲染 =====

  // 分类饼图
  useEffect(() => {
    if (!pieRef.current) return;
    if (!pieInstRef.current) {
      pieInstRef.current = echarts.init(pieRef.current);
    }
    const chart = pieInstRef.current;

    if (catSummary.length === 0) {
      chart.clear();
      return;
    }

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['35%', '50%'],
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 600 },
        },
        data: catSummary.slice(0, 8).map(item => ({
          ...item,
          name: `${CAT_INFO_MAP[item.name]?.icon || FALLBACK_CAT.icon} ${item.name}`,
          itemStyle: { color: CAT_INFO_MAP[item.name]?.color || FALLBACK_CAT.color },
        })),
      }],
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
        formatter: (name: string) => name.slice(3), // 去掉emoji（2字符+空格）
      },
    }, true);

    return () => {};
  }, [catSummary]);

  // 每日趋势折线图
  useEffect(() => {
    if (!lineRef.current) return;
    if (!lineInstRef.current) {
      lineInstRef.current = echarts.init(lineRef.current);
    }
    const chart = lineInstRef.current;

    if (dailyData.labels.length === 0) {
      chart.clear();
      return;
    }

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
      },
      legend: {
        data: ['支出', '收入'],
        bottom: 0,
        textStyle: { fontSize: 11 },
        itemWidth: 16,
        itemHeight: 2,
      },
      grid: { top: 10, left: 40, right: 10, bottom: 30 },
      xAxis: {
        type: 'category',
        data: dailyData.labels,
        axisLabel: { fontSize: 10, maxTicksLimit: 8 },
        axisLine: { lineStyle: { color: '#eee' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, formatter: '¥{value}' },
        splitLine: { lineStyle: { color: '#f5f5f5' } },
      },
      series: [
        {
          name: '支出',
          type: 'line',
          data: dailyData.expense,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#ff4d4f', width: 2 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,77,79,0.2)' },
            { offset: 1, color: 'rgba(255,77,79,0.02)' },
          ]) },
        },
        {
          name: '收入',
          type: 'line',
          data: dailyData.income,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#52c41a', width: 2 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82,196,26,0.2)' },
            { offset: 1, color: 'rgba(82,196,26,0.02)' },
          ]) },
        },
      ],
    }, true);

    return () => {};
  }, [dailyData]);

  // 账户分布环形图
  useEffect(() => {
    if (!acctRef.current) return;
    if (!acctInstRef.current) {
      acctInstRef.current = echarts.init(acctRef.current);
    }
    const chart = acctInstRef.current;

    if (acctSummary.length === 0) {
      chart.clear();
      return;
    }

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['35%', '50%'],
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 600 },
        },
        data: acctSummary.map(item => ({
          ...item,
          itemStyle: { color: item.color },
        })),
      }],
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
      },
    }, true);

    return () => {};
  }, [acctSummary]);

  // resize
  useEffect(() => {
    const handler = () => {
      pieInstRef.current?.resize();
      lineInstRef.current?.resize();
      acctInstRef.current?.resize();
    };
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('resize', handler);
      pieInstRef.current?.dispose();
      lineInstRef.current?.dispose();
      acctInstRef.current?.dispose();
    };
  }, []);

  // ===== 渲染 =====

  return (
    <div className="page stats-page">
      <NavBar>统计</NavBar>

      {/* 月份切换 */}
      <div className="month-selector">
        <button className="month-btn" onClick={() => changeMonth(-1)}>&lt;</button>
        <span className="month-label">{label}</span>
        <button className="month-btn" onClick={() => changeMonth(1)}>&gt;</button>
      </div>

      {/* 快捷时间选择 */}
      <div className="stat-presets">
        {PRESETS.map(p => (
          <button
            key={p.key}
            className={`stat-preset-chip${preset === p.key ? ' active' : ''}`}
            onClick={() => changePreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 收支概览 4 卡片 */}
      <div className="stat-summary-grid">
        <div className="stat-summary-card">
          <div className="stat-summary-label">总支出</div>
          <div className="stat-summary-value" style={{ color: 'var(--color-expense)' }}>
            ¥{formatAmount(totalExp)}
          </div>
          <div className="stat-summary-sub">
            {expTx.length}笔 · 日均¥{formatAmount(Math.abs(totalExp / Math.max(totalDays, 1)))}
          </div>
          {expChange && (
            <div className={`stat-change ${Number(expChange) > 0 ? 'up' : 'down'}`}>
              支出{Number(expChange) > 0 ? '↑' : '↓'}环比{Math.abs(Number(expChange))}%
            </div>
          )}
        </div>
        <div className="stat-summary-card">
          <div className="stat-summary-label">总收入</div>
          <div className="stat-summary-value" style={{ color: 'var(--color-income)' }}>
            ¥{formatAmount(totalInc)}
          </div>
          <div className="stat-summary-sub">{incTx.length}笔</div>
        </div>
        <div className="stat-summary-card">
          <div className="stat-summary-label">结余</div>
          <div className="stat-summary-value" style={{ color: balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
            {balance >= 0 ? '+' : ''}¥{formatAmount(balance)}
          </div>
          <div className="stat-summary-sub">{balance >= 0 ? '盈余' : '亏损'}</div>
        </div>
        <div className="stat-summary-card">
          <div className="stat-summary-label">记账</div>
          <div className="stat-summary-value">
            {filteredTx.length}<span style={{ fontSize: 12 }}> 笔</span>
          </div>
          <div className="stat-summary-sub">日均{(filteredTx.length / Math.max(totalDays, 1)).toFixed(1)}笔</div>
        </div>
      </div>

      {/* 报销概览（条件显示） */}
      {(reimbData.pending.length > 0 || reimbData.done.length > 0) && (
        <div className="stat-reimb-card">
          <div className="stat-chart-title" style={{ marginBottom: 12 }}>报销概览</div>
          <div className="stat-reimb-grid">
            <div className="stat-reimb-item">
              <div className="stat-reimb-label" style={{ color: '#722ed1' }}>待报销</div>
              <div className="stat-reimb-value" style={{ color: '#722ed1' }}>
                ¥{formatAmount(reimbData.pendingAmt)}
              </div>
              <div className="stat-reimb-count">{reimbData.pending.length}笔</div>
            </div>
            <div className="stat-reimb-item">
              <div className="stat-reimb-label" style={{ color: 'var(--color-income)' }}>已报销</div>
              <div className="stat-reimb-value" style={{ color: 'var(--color-income)' }}>
                ¥{formatAmount(reimbData.doneAmt)}
              </div>
              <div className="stat-reimb-count">{reimbData.done.length}笔</div>
            </div>
          </div>
          {expChange && (
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <span className={`stat-change ${Number(expChange) > 0 ? 'up' : 'down'}`}>
                支出{Number(expChange) > 0 ? '↑' : '↓'}环比{Math.abs(Number(expChange))}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* 分类饼图 */}
      <div className="stat-chart-card">
        <div className="stat-chart-header">
          <div className="stat-chart-title">支出分类</div>
          <button className="stat-chart-download" onClick={() => downloadChart(pieRef, '支出分类')}>📥</button>
        </div>
        <div ref={pieRef} className="stat-chart-box" />
        {catSummary.length === 0 && <div className="stat-empty">暂无数据</div>}
      </div>

      {/* 每日趋势折线图 */}
      <div className="stat-chart-card">
        <div className="stat-chart-header">
          <div className="stat-chart-title">每日趋势</div>
          <button className="stat-chart-download" onClick={() => downloadChart(lineRef, '每日趋势')}>📥</button>
        </div>
        <div ref={lineRef} className="stat-chart-box" />
        {dailyData.labels.length === 0 && <div className="stat-empty">暂无数据</div>}
      </div>

      {/* 账户分布 */}
      <div className="stat-chart-card">
        <div className="stat-chart-header">
          <div className="stat-chart-title">账户分布</div>
          <button className="stat-chart-download" onClick={() => downloadChart(acctRef, '账户分布')}>📥</button>
        </div>
        <div ref={acctRef} className="stat-chart-box" />
        {acctSummary.length === 0 && <div className="stat-empty">暂无数据</div>}
      </div>

      {/* 分类排行 TOP 10 */}
      <div className="stat-chart-card">
        <div className="stat-chart-title" style={{ marginBottom: 12 }}>支出排行</div>
        {catSummary.length > 0 ? (
          <div className="rank-list">
            {catSummary.slice(0, 10).map((item, i) => {
              const cat = CAT_INFO_MAP[item.name] || FALLBACK_CAT;
              const maxVal = catSummary[0].value || 1;
              return (
                <div className="rank-item" key={item.name}>
                  <div className={`rank-num${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}>
                    {i + 1}
                  </div>
                  <div className="rank-info">
                    <div className="rank-name">
                      <span>{cat.icon}</span>
                      <span className="rank-name-text">{item.name}</span>
                    </div>
                    <div className="rank-bar-bg">
                      <div
                        className="rank-bar"
                        style={{ width: `${(item.value / maxVal * 100).toFixed(0)}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                  <div className="rank-amt">¥{item.value.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="stat-empty">暂无数据</div>
        )}
      </div>
    </div>
  );
}
