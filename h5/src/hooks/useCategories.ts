/**
 * 分类操作 Hook
 * 基于新的 categoryStore（ops-based）封装分类查询和管理方法
 */

import { useMemo } from 'react';
import { useCategoryStore, type CategoryOp } from '@/stores/categoryStore';
import type { CategoriesConfig, CategoryDef, SubCategoryDef } from '@/types';

export function useCategories() {
  const ops = useCategoryStore((s) => s.ops);
  const addOp = useCategoryStore((s) => s.addOp);
  const getMergedCategories = useCategoryStore((s) => s.getMergedCategories);

  const categories = useMemo(() => getMergedCategories(), [ops, getMergedCategories]);

  const getExpenseCats = () => categories.expense;
  const getIncomeCats = () => categories.income;
  const getAllCats = () => categories;

  const getCatsForDirection = (direction: 'expense' | 'income') => {
    return direction === 'expense' ? categories.expense : categories.income;
  };

  /** 查找子分类所在的一级分类 */
  const findSubCategory = (
    direction: 'expense' | 'income',
    subName: string
  ): { parent: CategoryDef; sub: SubCategoryDef } | null => {
    const list = direction === 'expense' ? categories.expense : categories.income;
    for (const parent of list) {
      const sub = parent.subCategories.find((s) => s.name === subName);
      if (sub) return { parent, sub };
    }
    return null;
  };

  /** 添加一级分类 */
  const addPrimaryCategory = (direction: 'expense' | 'income', cat: { name: string; icon: string }) => {
    const op: CategoryOp = {
      action: 'addCat',
      type: direction,
      name: cat.name,
      icon: cat.icon,
    };
    addOp(op);
  };

  /** 添加子分类 */
  const addSubCategory = (direction: 'expense' | 'income', parentName: string, sub: { name: string; icon: string }) => {
    const op: CategoryOp = {
      action: 'addSub',
      type: direction,
      name: sub.name,
      icon: sub.icon,
      parent: parentName,
    };
    addOp(op);
  };

  /** 删除分类（一级或二级） */
  const removeCategory = (direction: 'expense' | 'income', primaryName: string, subName?: string) => {
    const op: CategoryOp = subName
      ? { action: 'delSub', type: direction, name: subName, parent: primaryName }
      : { action: 'delCat', type: direction, name: primaryName };
    addOp(op);
  };

  /** 编辑一级分类名称/图标 */
  const editPrimaryCategory = (direction: 'expense' | 'income', oldName: string, updates: { name?: string; icon?: string }) => {
    const op: CategoryOp = {
      action: 'editCat',
      type: direction,
      name: updates.name || oldName,
      oldName,
      icon: updates.icon,
    };
    addOp(op);
  };

  /** 编辑子分类名称/图标 */
  const editSubCategory = (direction: 'expense' | 'income', parentName: string, oldName: string, updates: { name?: string; icon?: string }) => {
    const op: CategoryOp = {
      action: 'editSub',
      type: direction,
      name: updates.name || oldName,
      oldName,
      parent: parentName,
      icon: updates.icon,
    };
    addOp(op);
  };

  return {
    categories,
    getExpenseCats,
    getIncomeCats,
    getAllCats,
    getCatsForDirection,
    findSubCategory,
    addPrimaryCategory,
    addSubCategory,
    removeCategory,
    editPrimaryCategory,
    editSubCategory,
  };
}
