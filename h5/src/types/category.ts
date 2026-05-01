/**
 * 分类相关类型
 */

/** 二级分类定义 */
export interface SubCategoryDef {
  name: string;
  icon: string;
}

/** 一级分类及其二级分类 */
export interface CategoryDef {
  name: string;
  icon: string;
  subCategories: SubCategoryDef[];
}

/** 分类配置（按方向分组） */
export interface CategoriesConfig {
  expense: CategoryDef[];
  income: CategoryDef[];
}

/** 自定义分类操作类型 */
export type CategoryOpType = 'add_primary' | 'add_sub' | 'rename' | 'delete' | 'reorder';
