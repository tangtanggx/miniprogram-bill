/**
 * 认证状态管理
 * 开发阶段使用 localStorage 模拟，后续对接后端 API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';

export interface UserInfo {
  username: string;
  nickname?: string;
}

interface AuthState {
  /** 当前登录用户（null 表示未登录） */
  user: UserInfo | null;
  /** 登录 */
  login: (username: string, password: string) => boolean;
  /** 登出 */
  logout: () => void;
  /** 是否已登录 */
  isLoggedIn: () => boolean;
  /** 注册 */
  register: (username: string, password: string) => boolean;
}

/** 用户数据存储在 localStorage 中的 key */
const USERS_KEY = 'accounting_users';

/** 获取已注册用户列表 */
function getStoredUsers(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 保存用户列表 */
function saveUsers(users: Record<string, string>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      login: (username: string, password: string): boolean => {
        const users = getStoredUsers();
        const savedPassword = users[username];
        if (savedPassword && savedPassword === password) {
          set({ user: { username, nickname: username } });
          return true;
        }
        // 兼容：首次使用时允许任意账号密码直接登录并注册
        if (Object.keys(users).length === 0) {
          users[username] = password;
          saveUsers(users);
          set({ user: { username, nickname: username } });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null });
      },

      isLoggedIn: (): boolean => {
        return get().user !== null;
      },

      register: (username: string, password: string): boolean => {
        const users = getStoredUsers();
        if (users[username]) {
          return false; // 用户已存在
        }
        users[username] = password;
        saveUsers(users);
        set({ user: { username, nickname: username } });
        return true;
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      // 只持久化 user，不持久化函数
      partialize: (state) => ({ user: state.user }),
    }
  )
);
