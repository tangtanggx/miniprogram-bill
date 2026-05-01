/**
 * 自定义分类 Store
 * 基于操作日志（ops）实现运行时分类增删改，与默认分类合并
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CategoriesConfig } from '@/types';
import { DEFAULT_CATEGORIES } from '@/constants';

/** 分类操作类型 */
export type CategoryOpAction =
  | 'addCat'   // 添加一级分类
  | 'delCat'   // 删除一级分类
  | 'editCat'  // 编辑一级分类（名称/图标）
  | 'addSub'   // 添加二级分类
  | 'delSub'   // 删除二级分类
  | 'editSub'; // 编辑二级分类名称

/** 分类操作日志条目 */
export interface CategoryOp {
  action: CategoryOpAction;
  type: 'expense' | 'income';
  name: string;
  oldName?: string;    // editCat/editSub 时使用
  parent?: string;     // addSub/editSub 时使用
  icon?: string;
  subs?: string[];     // addCat 时可携带子分类
}

interface CategoryState {
  ops: CategoryOp[];
  /** 合并后的分类配置（每次 ops 变化自动重新计算） */
  categories: CategoriesConfig;
  addOp: (op: CategoryOp) => void;
  removeOp: (index: number) => void;
  getMergedCategories: () => CategoriesConfig;
}

/**
 * 将操作日志应用到默认分类副本上，生成最终分类
 */
function applyOpsToDefaults(ops: CategoryOp[]): CategoriesConfig {
  // 深拷贝默认分类
  const result: CategoriesConfig = {
    expense: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES.expense)),
    income: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES.income)),
  };

  for (const op of ops) {
    const list = result[op.type];
    if (!list) continue;

    switch (op.action) {
      case 'addCat': {
        if (!list.find((c) => c.name === op.name)) {
          list.push({
            name: op.name,
            icon: op.icon || '📌',
            subCategories: (op.subs || []).map((s) => ({ name: s, icon: '📌' })),
          });
        }
        break;
      }
      case 'delCat': {
        const idx = list.findIndex((c) => c.name === op.name);
        if (idx >= 0) list.splice(idx, 1);
        break;
      }
      case 'editCat': {
        const cat = list.find((c) => c.name === op.oldName);
        if (cat) {
          cat.name = op.name || cat.name;
          cat.icon = op.icon || cat.icon;
        }
        break;
      }
      case 'addSub': {
        const parent = list.find((c) => c.name === op.parent);
        if (parent && !parent.subCategories.find((s) => s.name === op.name)) {
          parent.subCategories.push({ name: op.name, icon: op.icon || '📌' });
        }
        break;
      }
      case 'delSub': {
        const parent = list.find((c) => c.name === op.parent);
        if (parent) {
          parent.subCategories = parent.subCategories.filter((s) => s.name !== op.name);
        }
        break;
      }
      case 'editSub': {
        const parent = list.find((c) => c.name === op.parent);
        if (parent) {
          const sub = parent.subCategories.find((s) => s.name === op.oldName);
          if (sub) {
            sub.name = op.name || sub.name;
            sub.icon = op.icon || sub.icon;
          }
        }
        break;
      }
    }
  }

  return result;
}

const CUSTOM_OPS_KEY = 'accounting_custom_categories';

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      ops: [],
      categories: DEFAULT_CATEGORIES,

      addOp: (op: CategoryOp) => {
        set((s) => {
          const newOps = [...s.ops, op];
          return { ops: newOps, categories: applyOpsToDefaults(newOps) };
        });
      },

      removeOp: (index: number) => {
        set((s) => {
          const newOps = s.ops.filter((_, i) => i !== index);
          return { ops: newOps, categories: applyOpsToDefaults(newOps) };
        });
      },

      getMergedCategories: () => {
        return applyOpsToDefaults(get().ops);
      },
    }),
    {
      name: CUSTOM_OPS_KEY,
      /** 水合后重新计算 categories */
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.categories = applyOpsToDefaults(state.ops);
        }
      },
    }
  )
);
