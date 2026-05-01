import React from 'react';
import type { Account, AccountCategory } from '@/types';
import { formatAmount } from '@/utils/index';
import { calcCreditUsage } from '@/utils/index';
import './CreditCardCard.css';

interface CreditCardCardProps {
  account: Account;
  onClick?: () => void;
}

const CreditCardCard: React.FC<CreditCardCardProps> = ({ account, onClick }) => {
  if (account.category !== ('credit' as AccountCategory)) return null;

  const credit = calcCreditUsage(account.balance, account.creditLimit || 0);
  const isWarning = credit.utilizationRate >= 80;
  const isDanger = credit.utilizationRate >= 100;

  return (
    <div className="credit-card-card" onClick={onClick}>
      <div className="credit-card-header">
        <div className="credit-card-brand">
          <span className="card-icon">{account.icon || '💳'}</span>
          <span className="card-name">{account.name}</span>
        </div>
      </div>
      <div className="credit-card-balance">
        <span className="balance-label">可用额度</span>
        <span className="balance-value">{formatAmount(credit.available)}</span>
      </div>
      <div className="credit-card-usage">
        <div className="usage-track">
          <div
            className={`usage-fill ${isDanger ? 'danger' : isWarning ? 'warning' : 'normal'}`}
            style={{ width: `${Math.min(credit.utilizationRate, 100)}%` }}
          />
        </div>
        <div className="usage-meta">
          <span>已用 {formatAmount(credit.used)}</span>
          <span>总额度 {formatAmount(account.creditLimit || 0)}</span>
        </div>
      </div>
      <div className="credit-card-dates">
        <div className="date-item">
          <span className="date-label">账单日</span>
          <span className="date-value">每月{account.billingDay || 1}日</span>
        </div>
        <div className="date-item">
          <span className="date-label">还款日</span>
          <span className="date-value">每月{account.repaymentDay || 1}日</span>
        </div>
      </div>
    </div>
  );
};

export default CreditCardCard;
