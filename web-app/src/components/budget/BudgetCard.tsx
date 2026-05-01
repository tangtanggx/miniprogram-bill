import React from 'react';
import type { BudgetProgress } from '@/types';
import { formatAmount } from '@/utils/index';
import './BudgetCard.css';

interface BudgetCardProps {
  progress: BudgetProgress;
  onClick?: () => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ progress, onClick }) => {
  const { budget, spent, remaining, percentage, alertLevel } = progress;
  const isOver = remaining < 0;

  const periodLabels: Record<string, string> = {
    month: '月',
    year: '年',
  };

  return (
    <div className={`budget-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="budget-card-header">
        <div className="budget-card-left">
          <span className="budget-card-icon">📊</span>
          <div>
            <div className="budget-card-name">{budget.category || '总预算'}</div>
            <div className="budget-card-period">{periodLabels[budget.period] || ''}预算</div>
          </div>
        </div>
        <div className="budget-card-right">
          <div className={`budget-card-remaining ${isOver ? 'over' : ''}`}>
            {isOver ? '超支' : '剩余'} {formatAmount(Math.abs(remaining))}
          </div>
        </div>
      </div>

      <div className="budget-card-progress">
        <div className="progress-track">
          <div
            className={`progress-fill ${alertLevel === 'exceeded' ? 'danger' : alertLevel === 'warning' ? 'warning' : 'normal'}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="progress-meta">
          <span>{formatAmount(spent)} / {formatAmount(budget.monthlyAmount)}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;
