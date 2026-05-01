/**
 * 数据存储服务（导入导出备份）
 */

import { STORAGE_KEYS } from '@/constants';

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('saveToStorage failed:', e);
  }
}

/** 收集全部本地数据 */
function collectAllData(): Record<string, unknown> {
  return {
    accounts: loadFromStorage(STORAGE_KEYS.ACCOUNTS, []),
    transactions: loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []),
    categories: loadFromStorage(STORAGE_KEYS.CATEGORIES, null),
    budgets: loadFromStorage(STORAGE_KEYS.BUDGETS, []),
    recurring: loadFromStorage(STORAGE_KEYS.RECURRING, []),
    settings: loadFromStorage(STORAGE_KEYS.SETTINGS, null),
    exportTime: new Date().toISOString(),
    version: 1,
  };
}

/** 导出全部数据为JSON并下载 */
export function exportData(): void {
  const json = JSON.stringify(collectAllData(), null, 2);
  downloadFile(json, `记账备份_${new Date().toISOString().slice(0, 10)}.json`);
}

/** 导入数据（从JSON字符串） */
export function importData(jsonStr: string): Record<string, unknown> {
  const data = JSON.parse(jsonStr);
  if (data.accounts) saveToStorage(STORAGE_KEYS.ACCOUNTS, data.accounts);
  if (data.transactions) saveToStorage(STORAGE_KEYS.TRANSACTIONS, data.transactions);
  if (data.categories) saveToStorage(STORAGE_KEYS.CATEGORIES, data.categories);
  if (data.budgets) saveToStorage(STORAGE_KEYS.BUDGETS, data.budgets);
  if (data.recurring) saveToStorage(STORAGE_KEYS.RECURRING, data.recurring);
  if (data.settings) saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
  return data;
}

/** 导入数据（从File对象） */
export async function importDataFromFile(file: File): Promise<void> {
  const text = await file.text();
  importData(text);
}

/** 创建备份（同exportData） */
export function backup(): void {
  exportData();
}

/** 恢复备份（从File对象） */
export async function restore(file: File): Promise<void> {
  await importDataFromFile(file);
}

/** 生成CSV内容 */
export function transactionsToCSV(transactions: Array<Record<string, unknown>>): string {
  if (transactions.length === 0) return '';
  const headers = Object.keys(transactions[0]);
  const rows = transactions.map((t) =>
    headers.map((h) => {
      const val = String(t[h] ?? '');
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

/** 导出CSV */
export function exportCSV(): void {
  const transactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
  const csv = transactionsToCSV(transactions);
  downloadFile(csv, `记账数据_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
}

/** 导入CSV */
export async function importCSV(file: File): Promise<void> {
  const text = await file.text();
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return;
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const transactions = lines.slice(1).map((line) => {
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').replace(/^"|"$/g, '');
    });
    return obj;
  });
  const existing = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, [...transactions, ...existing]);
}

/** 导出全部数据为JSON字符串（非下载） */
export function exportAllData(): string {
  return JSON.stringify(collectAllData(), null, 2);
}

/** 下载文件 */
export function downloadFile(content: string, filename: string, type = 'application/json'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
