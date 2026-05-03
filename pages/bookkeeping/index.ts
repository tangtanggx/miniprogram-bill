import { fetchRecords, deleteRecord, RecordItem as CloudRecordItem } from '../../services/bookkeeping/bookkeeping';

interface DisplayRecordItem {
  _id: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  note: string;
  date: string;
  amountText: string;
}

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    monthExpense: '0.00',
    monthIncome: '0.00',
    monthBalance: '0.00',
    records: [] as DisplayRecordItem[],
    loading: false,
    showAddPopup: false,
    showDeleteDialog: false,
    deleteTargetId: '',
    editRecord: null as DisplayRecordItem | null,
    swipeRight: [{ text: '删除', className: 'swipe-delete-btn', style: 'background-color: #e34d59; color: #fff;' }],
    confirmBtn: { content: '删除', theme: 'danger', variant: 'base' },
    cancelBtn: { content: '取消', variant: 'base' },
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
    });
  },

  onShow() {
    this.getTabBar().init();
    this.loadRecords();
  },

  async loadRecords() {
    this.setData({ loading: true });
    try {
      const { currentYear, currentMonth } = this.data;
      const records: CloudRecordItem[] = await fetchRecords(currentYear, currentMonth);

      let monthExpense = 0;
      let monthIncome = 0;
      const displayRecords: DisplayRecordItem[] = records.map((r) => {
        if (r.type === 'expense') monthExpense += r.amount;
        else monthIncome += r.amount;
        return {
          _id: r._id!,
          amount: r.amount,
          type: r.type,
          category: r.category,
          note: r.note,
          date: r.date,
          amountText: (r.amount / 100).toFixed(2),
        };
      });

      this.setData({
        records: displayRecords,
        monthExpense: (monthExpense / 100).toFixed(2),
        monthIncome: (monthIncome / 100).toFixed(2),
        monthBalance: ((monthIncome - monthExpense) / 100).toFixed(2),
      });
    } catch (e) {
      console.error('加载记录失败', e);
      wx.showToast({ title: '加载失败，请检查云开发环境', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onPrevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth -= 1;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear -= 1;
    }
    this.setData({ currentYear, currentMonth }, () => this.loadRecords());
  },

  onNextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
    this.setData({ currentYear, currentMonth }, () => this.loadRecords());
  },

  openAddPopup() {
    this.setData({ showAddPopup: true, editRecord: null });
  },

  closeAddPopup() {
    this.setData({ showAddPopup: false, editRecord: null });
  },

  onAddSuccess() {
    this.setData({ showAddPopup: false, editRecord: null });
    wx.showToast({ title: '保存成功', icon: 'success' });
    this.loadRecords();
  },

  onRecordTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    const record = this.data.records.find((r) => r._id === id);
    if (record) {
      this.setData({ showAddPopup: true, editRecord: record });
    }
  },

  onSwipeActionClick(e: WechatMiniprogram.TouchEvent) {
    const action = e.detail;
    if (action.text === '删除') {
      const id = e.currentTarget.dataset.id;
      this.setData({
        showDeleteDialog: true,
        deleteTargetId: id,
      });
    }
  },

  async onConfirmDelete() {
    const { deleteTargetId } = this.data;
    try {
      await deleteRecord(deleteTargetId);
      wx.showToast({ title: '已删除', icon: 'success' });
    } catch (e) {
      console.error('删除记录失败', e);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
    this.setData({ showDeleteDialog: false, deleteTargetId: '' });
    this.loadRecords();
  },

  onCancelDelete() {
    this.setData({ showDeleteDialog: false, deleteTargetId: '' });
  },
});
