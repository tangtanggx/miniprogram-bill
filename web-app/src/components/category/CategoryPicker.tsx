import React from 'react';
import { useCategoryStore } from '@/stores/index';

interface CategoryPickerProps {
  selectedPrimary?: string;
  selectedSub?: string;
  direction?: 'expense' | 'income';
  onSelect: (primary: string, sub: string) => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedPrimary,
  selectedSub,
  direction = 'expense',
  onSelect,
}) => {
  const { categories } = useCategoryStore();
  const catList = direction === 'expense' ? categories.expense : categories.income;

  return (
    <div className="category-picker">
      {catList.map((parent) => {
        const children = parent.subCategories;
        return (
          <div key={parent.name} className="picker-group">
            <div className="picker-group-title">
              <span>{parent.icon}</span>
              <span>{parent.name}</span>
            </div>
            <div className="picker-group-items">
              {children.map((child) => {
                const isActive = selectedPrimary === parent.name && selectedSub === child.name;
                return (
                  <div
                    key={child.name}
                    className={`picker-item ${isActive ? 'active' : ''}`}
                    onClick={() => onSelect(parent.name, child.name)}
                  >
                    <span className="picker-item-icon">{child.icon}</span>
                    <span className="picker-item-name">{child.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryPicker;
