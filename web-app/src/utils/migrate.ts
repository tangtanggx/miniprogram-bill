/**
 * 数据迁移脚本
 * 处理版本升级时的数据格式变更
 */

const DATA_VERSION_KEY = 'accounting_data_version';

/**
 * 运行所有未执行的迁移
 */
export function runMigrations() {
  try {
    const version = parseInt(localStorage.getItem(DATA_VERSION_KEY) || '0', 10);
    let v = version;

    if (v < 1) {
      migrateV0toV1();
      v = 1;
    }
    if (v < 2) {
      migrateV1toV2();
      v = 2;
    }

    localStorage.setItem(DATA_VERSION_KEY, String(v));
  } catch (e) {
    console.error('Migration failed:', e);
  }
}

/**
 * V0 → V1: refund方向迁移为income + 报销机制
 */
function migrateV0toV1() {
  try {
    const raw = localStorage.getItem('accounting_transactions');
    if (!raw) return;
    const transactions = JSON.parse(raw);
    let changed = false;

    for (const tx of transactions) {
      if (tx.direction === 'refund') {
        tx.direction = 'income';
        if (!tx.category || tx.category === '报销退款') {
          tx.category = '其他收入';
          tx.subCategory = '报销';
        }
        changed = true;
      }
      // 确保报销字段存在
      if (tx.reimbursable === undefined) tx.reimbursable = false;
      if (tx.reimbStatus === undefined && tx.reimbursable) tx.reimbStatus = 'pending';
    }

    if (changed) {
      localStorage.setItem('accounting_transactions', JSON.stringify(transactions));
    }
  } catch (e) {
    console.error('V0→V1 migration failed:', e);
  }
}

/**
 * V1 → V2: 独立 reimburse_items 迁移到 Transaction
 */
function migrateV1toV2() {
  try {
    const raw = localStorage.getItem('reimburse_items');
    if (!raw) return;

    const reimburseItems = JSON.parse(raw);
    if (!Array.isArray(reimburseItems) || reimburseItems.length === 0) {
      localStorage.removeItem('reimburse_items');
      return;
    }

    const txRaw = localStorage.getItem('accounting_transactions');
    if (!txRaw) { localStorage.removeItem('reimburse_items'); return; }
    const transactions = JSON.parse(txRaw);
    let changed = false;

    for (const item of reimburseItems) {
      if (item.transactionId && item.status === 'reimbursed') {
        const tx = transactions.find((t: any) => t.id === item.transactionId);
        if (tx) {
          tx.reimbStatus = 'done';
          tx.reimbursed = true;
          changed = true;
        }
      }
    }

    if (changed) {
      localStorage.setItem('accounting_transactions', JSON.stringify(transactions));
    }
    localStorage.removeItem('reimburse_items');
  } catch (e) {
    console.error('V1→V2 migration failed:', e);
  }
}
