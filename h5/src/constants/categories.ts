/**
 * 分类配置常量
 * 融合 web-app 完整分类体系：12支出 + 5收入 = 17个一级分类
 */

import type { CategoriesConfig } from '@/types';

export const DEFAULT_CATEGORIES: CategoriesConfig = {
  expense: [
    { name: '餐饮美食', icon: '🍜', subCategories: [
      { name: '早餐', icon: '🥐' }, { name: '午餐', icon: '🍱' }, { name: '晚餐', icon: '🍽️' },
      { name: '夜宵', icon: '🌙' }, { name: '饮品', icon: '🧋' }, { name: '零食', icon: '🍿' },
      { name: '水果', icon: '🍎' }, { name: '外卖', icon: '🛵' }, { name: '聚餐', icon: '🎉' },
      { name: '食材', icon: '🥬' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '交通出行', icon: '🚗', subCategories: [
      { name: '公交地铁', icon: '🚇' }, { name: '打车', icon: '🚕' }, { name: '网约车', icon: '📱' },
      { name: '共享单车', icon: '🚲' }, { name: '加油', icon: '⛽' }, { name: '停车费', icon: '🅿️' },
      { name: '高速费', icon: '🛣️' }, { name: '火车', icon: '🚄' }, { name: '飞机', icon: '✈️' },
      { name: '违章罚款', icon: '📝' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '购物消费', icon: '🛒', subCategories: [
      { name: '衣服鞋帽', icon: '👔' }, { name: '电子产品', icon: '📱' }, { name: '日用百货', icon: '🧴' },
      { name: '化妆品护肤', icon: '💄' }, { name: '母婴用品', icon: '🍼' }, { name: '家居家装', icon: '🛋️' },
      { name: '厨具', icon: '🍳' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '休闲娱乐', icon: '🎮', subCategories: [
      { name: '电影', icon: '🎬' }, { name: '游戏', icon: '🎮' }, { name: 'KTV', icon: '🎤' },
      { name: '旅游', icon: '✈️' }, { name: '健身', icon: '💪' }, { name: '运动', icon: '⚽' },
      { name: '追星', icon: '⭐' }, { name: '酒吧', icon: '🍺' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '居住物业', icon: '🏠', subCategories: [
      { name: '房租', icon: '🏠' }, { name: '水电燃气', icon: '💧' }, { name: '物业费', icon: '🏢' },
      { name: '维修', icon: '🔧' }, { name: '家政', icon: '🧹' }, { name: '网费', icon: '🌐' },
      { name: '其他', icon: '🔄' },
    ]},
    { name: '医疗健康', icon: '💊', subCategories: [
      { name: '挂号', icon: '🩺' }, { name: '药品', icon: '💊' }, { name: '体检', icon: '🏥' },
      { name: '保健品', icon: '🌿' }, { name: '牙科', icon: '🦷' }, { name: '心理咨询', icon: '💭' },
      { name: '其他', icon: '🔄' },
    ]},
    { name: '教育学习', icon: '📚', subCategories: [
      { name: '书籍', icon: '📖' }, { name: '培训', icon: '📋' }, { name: '网课', icon: '💻' },
      { name: '考试', icon: '📝' }, { name: '文具', icon: '✏️' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '通讯网络', icon: '📱', subCategories: [
      { name: '话费', icon: '📞' }, { name: '宽带', icon: '🌐' }, { name: '会员订阅', icon: '📺' },
      { name: '其他', icon: '🔄' },
    ]},
    { name: '人情往来', icon: '🎁', subCategories: [
      { name: '红包', icon: '🧧' }, { name: '礼物', icon: '🎁' }, { name: '请客', icon: '🍽️' },
      { name: '份子钱', icon: '🤝' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '金融保险', icon: '🏦', subCategories: [
      { name: '保险', icon: '🛡️' }, { name: '手续费', icon: '💸' }, { name: '利息', icon: '📊' },
      { name: '罚款', icon: '📝' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '宠物', icon: '🐱', subCategories: [
      { name: '猫粮', icon: '🐟' }, { name: '狗粮', icon: '🦴' }, { name: '医疗', icon: '💊' },
      { name: '美容', icon: '✂️' }, { name: '玩具用品', icon: '🧸' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '其他支出', icon: '📌', subCategories: [
      { name: '捐赠', icon: '💝' }, { name: '丢失', icon: '🔍' }, { name: '退款支出', icon: '↩️' },
      { name: '其他', icon: '🔄' },
    ]},
  ],
  income: [
    { name: '工资收入', icon: '💰', subCategories: [
      { name: '基本工资', icon: '💵' }, { name: '绩效奖金', icon: '🏆' }, { name: '年终奖', icon: '🧧' },
      { name: '津贴补贴', icon: '📋' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '兼职副业', icon: '💼', subCategories: [
      { name: '兼职', icon: '👔' }, { name: '外包', icon: '💻' }, { name: '稿费', icon: '✍️' },
      { name: '咨询', icon: '💬' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '投资收益', icon: '📈', subCategories: [
      { name: '股票', icon: '📊' }, { name: '基金', icon: '💹' }, { name: '债券', icon: '📃' },
      { name: '数字货币', icon: '₿' }, { name: '其他', icon: '🔄' },
    ]},
    { name: '理财收入', icon: '💎', subCategories: [
      { name: '利息', icon: '🏦' }, { name: '理财', icon: '💰' }, { name: '分红', icon: '📈' },
      { name: '其他', icon: '🔄' },
    ]},
    { name: '其他收入', icon: '📥', subCategories: [
      { name: '红包', icon: '🧧' }, { name: '中奖', icon: '🎰' }, { name: '礼金', icon: '💝' },
      { name: '二手出售', icon: '🏷️' }, { name: '报销', icon: '📋' }, { name: '其他', icon: '🔄' },
    ]},
  ],
};
