import React, { useState, useRef } from 'react';
import { NavBar, Dialog, Toast, SwipeAction, SearchBar, Tabs, Popup } from 'antd-mobile';
import { AddCircleOutline } from 'antd-mobile-icons';
import { useCategories } from '@/hooks/useCategories';
import './index.css';

/** 可选图标列表 */
const ICON_LIST = [
  '🍔', '🛒', '🚗', '🏠', '✈️', '🎮', '📱', '💊', '👗', '📚',
  '🎁', '💼', '🎬', '🐕', '🏖️', '🏀', '🎨', '🎵', '☕', '🍕',
  '🚌', '💡', '🔧', '💳', '📊', '🏆', '❤️', '🌟', '📌', '🔄',
  '🍜', '💰', '📈', '💎', '📥', '🐱', '🏦', '📉', '🎤', '🍺',
  '🥐', '🍱', '🍽️', '🧋', '🍿', '🥬', '🚇', '🚕', '🚲', '⛽',
  '👔', '🧴', '🍼', '🛋️', '🍳', '💪', '⚽', '⭐', '🌎', '🐟',
];

type EditTarget =
  | { type: 'addPrimary'; direction: 'expense' | 'income' }
  | { type: 'addSub'; direction: 'expense' | 'income'; parentName: string }
  | { type: 'editPrimary'; direction: 'expense' | 'income'; name: string }
  | { type: 'editSub'; direction: 'expense' | 'income'; parentName: string; name: string }
  | null;

const CategoriesPage: React.FC = () => {
  const {
    categories,
    getCatsForDirection,
    addPrimaryCategory,
    addSubCategory,
    removeCategory,
    editPrimaryCategory,
    editSubCategory,
  } = useCategories();

  const [activeTab, setActiveTab] = useState<string>('expense');
  const [searchText, setSearchText] = useState('');
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [form, setForm] = useState({ name: '', icon: '📌' });

  // 长按定时器
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const direction = activeTab as 'expense' | 'income';
  const catList = getCatsForDirection(direction);

  // 搜索过滤
  const filteredList = searchText
    ? catList.filter(
        (c) =>
          c.name.includes(searchText) ||
          c.subCategories.some((s) => s.name.includes(searchText))
      )
    : catList;

  // ======== 弹窗操作 ========

  const openAddPrimary = () => {
    setEditTarget({ type: 'addPrimary', direction });
    setForm({ name: '', icon: '📌' });
  };

  const openAddSub = (parentName: string) => {
    setEditTarget({ type: 'addSub', direction, parentName });
    setForm({ name: '', icon: '📌' });
  };

  const openEditPrimary = (name: string, icon: string) => {
    setEditTarget({ type: 'editPrimary', direction, name });
    setForm({ name, icon });
  };

  const openEditSub = (parentName: string, name: string, icon: string) => {
    setEditTarget({ type: 'editSub', direction, parentName, name });
    setForm({ name, icon });
  };

  const closeEdit = () => {
    setEditTarget(null);
    setForm({ name: '', icon: '📌' });
  };

  const handleConfirm = () => {
    if (!form.name.trim()) {
      Toast.show({ content: '请输入名称' });
      return;
    }
    if (!editTarget) return;

    switch (editTarget.type) {
      case 'addPrimary':
        addPrimaryCategory(editTarget.direction, { name: form.name, icon: form.icon });
        Toast.show({ content: '添加成功' });
        break;
      case 'addSub':
        addSubCategory(editTarget.direction, editTarget.parentName, { name: form.name, icon: form.icon });
        Toast.show({ content: '添加成功' });
        break;
      case 'editPrimary':
        editPrimaryCategory(editTarget.direction, editTarget.name, {
          name: form.name,
          icon: form.icon,
        });
        Toast.show({ content: '修改成功' });
        break;
      case 'editSub':
        editSubCategory(editTarget.direction, editTarget.parentName, editTarget.name, {
          name: form.name,
          icon: form.icon,
        });
        Toast.show({ content: '修改成功' });
        break;
    }
    closeEdit();
  };

  const handleDelete = (primaryName: string, subName?: string) => {
    const label = subName ? `"${subName}"` : `"${primaryName}"`;
    Dialog.confirm({
      content: `确定要删除分类 ${label} 吗？`,
      onConfirm: () => {
        removeCategory(direction, primaryName, subName);
        Toast.show({ content: '已删除' });
      },
    });
  };

  // ======== 长按处理 ========

  const handleTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    callback: () => void
  ) => {
    longPressTimer.current = setTimeout(() => {
      callback();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ======== 弹窗标题 ========
  const getPopupTitle = () => {
    if (!editTarget) return '';
    switch (editTarget.type) {
      case 'addPrimary': return '添加一级分类';
      case 'addSub': return `添加子分类（${editTarget.parentName}）`;
      case 'editPrimary': return '编辑分类';
      case 'editSub': return '编辑子分类';
    }
  };

  return (
    <div className="categories-page">
      <NavBar className="page-navbar" onBack={() => window.history.back()}>
        分类管理
      </NavBar>

      <SearchBar
        placeholder="搜索分类"
        value={searchText}
        onChange={setSearchText}
        className="categories-search"
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab} className="categories-tabs">
        <Tabs.Tab key="expense" title="支出" />
        <Tabs.Tab key="income" title="收入" />
      </Tabs>

      <div className="categories-list">
        {filteredList.map((group) => (
          <div key={group.name} className="category-group">
            <SwipeAction
              rightActions={[
                {
                  text: '编辑',
                  key: 'edit',
                  color: 'primary',
                  onClick: () => openEditPrimary(group.name, group.icon),
                },
                {
                  text: '删除',
                  key: 'delete',
                  color: 'danger',
                  onClick: () => handleDelete(group.name),
                },
              ]}
            >
              <div
                className="group-header"
                onTouchStart={(e) => handleTouchStart(e, () => openEditPrimary(group.name, group.icon))}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleTouchStart(e, () => openEditPrimary(group.name, group.icon))}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                <span className="group-header-title">
                  <span className="group-icon">{group.icon}</span>
                  <span>{group.name}</span>
                </span>
                <span className="group-count">{group.subCategories.length}项</span>
              </div>
            </SwipeAction>

            <div className="group-grid">
              {group.subCategories.map((sub) => (
                <SwipeAction
                  key={sub.name}
                  rightActions={[
                    {
                      text: '编辑',
                      key: 'edit',
                      color: 'primary',
                      onClick: () => openEditSub(group.name, sub.name, sub.icon),
                    },
                    {
                      text: '删除',
                      key: 'delete',
                      color: 'danger',
                      onClick: () => handleDelete(group.name, sub.name),
                    },
                  ]}
                >
                  <div
                    className="category-grid-item"
                    onTouchStart={(e) => handleTouchStart(e, () => openEditSub(group.name, sub.name, sub.icon))}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={(e) => handleTouchStart(e, () => openEditSub(group.name, sub.name, sub.icon))}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                  >
                    <span className="cat-icon">{sub.icon}</span>
                    <span className="cat-name">{sub.name}</span>
                  </div>
                </SwipeAction>
              ))}

              {/* 添加子分类按钮 */}
              <div className="category-grid-item add-sub-btn" onClick={() => openAddSub(group.name)}>
                <span className="cat-icon add-icon">+</span>
                <span className="cat-name">添加</span>
              </div>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="categories-empty">
            <p>暂无分类</p>
          </div>
        )}
      </div>

      {/* 悬浮添加按钮 */}
      <div className="categories-fab" onClick={openAddPrimary}>
        <AddCircleOutline fontSize={28} color="#fff" />
      </div>

      {/* 编辑/添加弹窗 */}
      <Popup
        visible={editTarget !== null}
        onMaskClick={closeEdit}
        position="bottom"
        bodyClassName="categories-popup"
      >
        <div className="popup-header">
          <span className="popup-cancel" onClick={closeEdit}>取消</span>
          <span className="popup-title">{getPopupTitle()}</span>
          <span className="popup-confirm" onClick={handleConfirm}>确定</span>
        </div>
        <div className="popup-body">
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              placeholder="输入分类名称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>图标</label>
            <div className="icon-grid">
              {ICON_LIST.map((icon) => (
                <span
                  key={icon}
                  className={`icon-item ${form.icon === icon ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, icon })}
                >
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default CategoriesPage;
