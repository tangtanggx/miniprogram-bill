/**
 * 记账模块 - 云数据库服务
 * 集合名: bookkeeping_records
 *
 * 在使用前，请先在云开发控制台创建集合 bookkeeping_records
 * 或将云开发安全规则设为所有用户可读写（开发阶段）
 */

const db = wx.cloud.database();
const _ = db.command;

// 集合名称
const COLLECTION = 'bookkeeping_records';

export interface RecordItem {
  _id?: string;
  amount: number;       // 金额，以分为单位
  type: 'expense' | 'income';
  category: string;
  note: string;
  date: string;         // 记录时间，格式 YYYY-MM-DD HH:mm
  year: number;         // 年份，用于按月查询
  month: number;        // 月份，用于按月查询
  _openid?: string;     // 云开发自动填充的用户标识
}

/**
 * 查询指定月份的记账记录
 */
export async function fetchRecords(year: number, month: number): Promise<RecordItem[]> {
  const res = await db
    .collection(COLLECTION)
    .where({
      year,
      month,
    })
    .orderBy('date', 'desc')
    .get();

  return res.data as RecordItem[];
}

/**
 * 新增一条记账记录
 */
export async function addRecord(record: Omit<RecordItem, '_id' | '_openid'>): Promise<string> {
  const res = await db.collection(COLLECTION).add({
    data: record,
  });
  return res._id;
}

/**
 * 删除一条记账记录
 */
export async function deleteRecord(id: string): Promise<void> {
  await db.collection(COLLECTION).doc(id).remove();
}

/**
 * 更新一条记账记录
 */
export async function updateRecord(id: string, record: Omit<RecordItem, '_id' | '_openid'>): Promise<void> {
  await db.collection(COLLECTION).doc(id).update({
    data: record,
  });
}
