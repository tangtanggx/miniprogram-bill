import { addRecord, updateRecord } from '../../../../services/bookkeeping/bookkeeping';

const CATEGORY_EXPENSE = [
  { label: '餐饮', icon: 'noodle', value: '餐饮' },
  { label: '交通', icon: 'vehicle', value: '交通' },
  { label: '购物', icon: 'shop', value: '购物' },
  { label: '娱乐', icon: 'gamepad', value: '娱乐' },
  { label: '居住', icon: 'home', value: '居住' },
  { label: '医疗', icon: 'hospital', value: '医疗' },
  { label: '教育', icon: 'book', value: '教育' },
  { label: '通讯', icon: 'call', value: '通讯' },
  { label: '服饰', icon: 'heart', value: '服饰' },
  { label: '其他', icon: 'ellipsis', value: '其他' },
];

const CATEGORY_INCOME = [
  { label: '工资', icon: 'wallet', value: '工资' },
  { label: '兼职', icon: 'work', value: '兼职' },
  { label: '理财', icon: 'chart', value: '理财' },
  { label: '红包', icon: 'gift', value: '红包' },
  { label: '退款', icon: 'rollback', value: '退款' },
  { label: '其他', icon: 'ellipsis', value: '其他' },
];

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    editRecord: {
      type: Object,
      value: null,
    },
  },

  data: {
    addType: 'expense' as 'expense' | 'income',
    addAmount: '',
    addNote: '',
    addCategory: '',
    addDate: '',
    addTime: '',
    categories: CATEGORY_EXPENSE,
    submitting: false,
    isEdit: false,
    editId: '',
  },

  observers: {
    visible(val: boolean) {
      if (val) {
        this.initForm();
      }
    },
  },

  methods: {
    resetForm() {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      this.setData({
        addAmount: '',
        addNote: '',
        addCategory: '',
        addType: 'expense',
        addDate: dateStr,
        addTime: timeStr,
        categories: CATEGORY_EXPENSE,
        isEdit: false,
        editId: '',
      });
    },

    initForm() {
      const edit = this.data.editRecord;
      if (edit && edit._id) {
        // 编辑模式：回填数据
        const [datePart, timePart] = (edit.date || '').split(' ');
        this.setData({
          addType: edit.type || 'expense',
          addAmount: edit.amount ? String(edit.amount / 100) : '',
          addNote: edit.note || '',
          addCategory: edit.category || '',
          addDate: datePart || '',
          addTime: timePart || '',
          categories: edit.type === 'income' ? CATEGORY_INCOME : CATEGORY_EXPENSE,
          isEdit: true,
          editId: edit._id,
        });
      } else {
        this.resetForm();
      }
    },

    onClose() {
      this.triggerEvent('close');
    },

    onVisibleChange(e: WechatMiniprogram.CustomEvent) {
      if (!e.detail.visible) {
        this.triggerEvent('close');
      }
    },

    switchType(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type as 'expense' | 'income';
      this.setData({
        addType: type,
        addCategory: '',
        categories: type === 'expense' ? CATEGORY_EXPENSE : CATEGORY_INCOME,
      });
    },

    onAmountInput(e: WechatMiniprogram.Input) {
      this.setData({ addAmount: e.detail.value });
    },

    onNoteInput(e: WechatMiniprogram.Input) {
      this.setData({ addNote: e.detail.value });
    },

    onSelectCategory(e: WechatMiniprogram.TouchEvent) {
      this.setData({ addCategory: e.currentTarget.dataset.value });
    },

    onDateChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ addDate: e.detail.value as string });
    },

    onTimeChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ addTime: e.detail.value as string });
    },

    async onConfirm() {
      const { addAmount, addCategory, addType, addNote, addDate, addTime, isEdit, editId } = this.data;
      const amount = parseFloat(addAmount);

      if (!amount || amount <= 0) {
        wx.showToast({ title: '请输入金额', icon: 'none' });
        return;
      }
      if (!addCategory) {
        wx.showToast({ title: '请选择分类', icon: 'none' });
        return;
      }

      this.setData({ submitting: true });

      const dateStr = `${addDate} ${addTime}`;
      const [yearStr, monthStr] = addDate.split('-');
      const recordYear = parseInt(yearStr, 10);
      const recordMonth = parseInt(monthStr, 10);

      const recordData = {
        amount: Math.round(amount * 100),
        type: addType,
        category: addCategory,
        note: addNote,
        date: dateStr,
        year: recordYear,
        month: recordMonth,
      };

      try {
        if (isEdit && editId) {
          await updateRecord(editId, recordData);
        } else {
          await addRecord(recordData);
        }

        this.triggerEvent('success');
      } catch (e) {
        console.error('保存记录失败', e);
        wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      } finally {
        this.setData({ submitting: false });
      }
    },
  },
});
