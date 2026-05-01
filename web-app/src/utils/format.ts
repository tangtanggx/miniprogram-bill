/**
 * 格式化工具
 */

/**
 * 格式化金额（保留2位小数，千分位分隔）
 */
export function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * 获取当前时间字符串 HH:MM
 */
export function getNowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Date 转 YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 获取当月第一天
 */
export function getMonthFirst(month: string): string {
  return `${month}-01`;
}

/**
 * 获取当月最后一天
 */
export function getMonthLast(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0);
  return formatDate(last);
}

/**
 * 获取中文星期
 */
export function getWeekday(dateStr: string): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date(dateStr).getDay()];
}

/**
 * 相对时间描述（今天/昨天/前天/MM-DD）
 */
export function relativeDate(dateStr: string): string {
  const today = getToday();
  const d = new Date();
  const yesterday = formatDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const dayBefore = formatDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 2));

  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  if (dateStr === dayBefore) return '前天';
  return dateStr.slice(5); // MM-DD
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: never[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: never[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
