import React from 'react';
import type { Account, AccountCategory } from '@/types';
import { formatAmount } from '@/utils/index';
import { useAccountStore } from '@/stores/index';
import { ACCT_CATEGORIES } from '@/constants/index';

interface AccountPickerProps {
  selectedId?: string;
  showBalance?: boolean;
  filterCategory?: AccountCategory;
  onSelect: (account: Account) => void;
}

const AccountPicker: React.FC<AccountPickerProps> = ({
  selectedId,
  showBalance = true,
  filterCategory,
  onSelect,
}) => {
  const { accounts } = useAccountStore();

  const filtered = filterCategory
    ? accounts.filter((a) => a.category === filterCategory)
    : accounts;

  return (
    <div className="account-picker">
      {filtered.map((account) => (
        <div
          key={account.id}
          className={`account-picker-item ${selectedId === account.id ? 'active' : ''}`}
          onClick={() => onSelect(account)}
        >
          <span className="picker-account-icon" style={{ background: account.color + '20', color: account.color }}>
            {account.icon || ACCT_CATEGORIES[account.category]?.emoji || '📱'}
          </span>
          <div className="picker-account-info">
            <span className="picker-account-name">{account.name}</span>
            {showBalance && (
              <span className={`picker-account-balance ${account.balance < 0 ? 'negative' : ''}`}>
                {formatAmount(account.balance)}
              </span>
            )}
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="account-picker-empty">暂无账户，请先在账户管理中添加</div>
      )}
    </div>
  );
};

export default AccountPicker;
