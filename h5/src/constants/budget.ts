/**
 * 预算相关常量
 */

/** 预算预警阈值 */
export const BUDGET_ALERT_THRESHOLDS = {
  warning: 80,    // 80% 黄色预警
  danger: 100,    // 100% 红色告警
} as const;

/** 默认预算模板 */
export const DEFAULT_BUDGET_TEMPLATES = [
  { category: '餐饮美食', amount: 2000 },
  { category: '交通出行', amount: 500 },
  { category: '购物消费', amount: 1000 },
  { category: '居住生活', amount: 3000 },
  { category: '娱乐休闲', amount: 500 },
  { category: '其他支出', amount: 500 },
] as const;
