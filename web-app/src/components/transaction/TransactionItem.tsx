import React from 'react';
import { SwipeAction, Dialog, Toast } from 'antd-mobile';
import type { Transaction } from '@/types';
import { formatAmount, relativeDate } from '@/utils/index';
import { useTransactionStore, useCategoryStore, useAccountStore } from '@/stores/index';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (tx: Transaction) => void;
  showActions?: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick, showActions = true }) => {
  const { deleteTransaction } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();

  // 从 CategoriesConfig 中查找分类图标
  const findCategoryIcon = (catName: string, subCatName: string): { icon: string; name: string; color: string } => {
    const allCats = [...categories.expense, ...categories.income];
    const primary = allCats.find((c) => c.name === catName);
    if (primary) {
      if (subCatName) {
        const sub = primary.subCategories.find((s) => s.name === subCatName);
        if (sub) return { icon: sub.icon, name: sub.name, color: '#94a3b8' };
      }
      return { icon: primary.icon, name: primary.name, color: '#94a3b8' };
    }
    return { icon: '📌', name: catName || '未分类', color: '#94a3b8' };
  };

  const account = accounts.find((a) => a.id === transaction.accountId);
  const catInfo = findCategoryIcon(transaction.category, transaction.subCategory);

  const directionConfig: Record<string, { prefix: string; colorClass: string }> = {
    expense: { prefix: '-', colorClass: 'expense' },
    income: { prefix: '+', colorClass: 'income' },
    transfer: { prefix: '', colorClass: 'transfer' },
  };

  const cfg = directionConfig[transaction.direction] || { prefix: '', colorClass: '' };

  const handleDelete = () => {
    Dialog.confirm({
      content: '确定要删除这条记录吗？',
      onConfirm: () => {
        deleteTransaction(transaction.id);
        Toast.show({ content: '已删除' });
      },
    });
  };

  const item = (
    <div className="tx-item" onClick={() => onClick?.(transaction)}>
      <div className="tx-icon" style={{ background: catInfo.color + '20', color: catInfo.color }}>
        {catInfo.icon}
      </div>
      <div className="tx-info">
        <div className="tx-category">{catInfo.name}</div>
        <div className="tx-meta">
          {transaction.remark && <span className="tx-note">{transaction.remark}</span>}
          {account && <span className="tx-account">{account.name}</span>}
          <span className="tx-date">{relativeDate(transaction.date)}</span>
        </div>
      </div>
      <div className={`tx-amount ${cfg.colorClass}`}>
        {cfg.prefix}{formatAmount(transaction.amount)}
      </div>
    </div>
  );

  if (!showActions) return item;

  return (
    <SwipeAction rightActions={[{ text: '删除', key: 'delete', color: 'danger', onClick: handleDelete }]}>
      {item}
    </SwipeAction>
  );
};

export default TransactionItem;
