/**
 * 全局设置状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, ThemeMode } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_SETTINGS } from '@/types';

interface SettingsState {
  settings: AppSettings;
  /** 应用主题（实际生效的主题，考虑 system） */
  resolvedTheme: 'light' | 'dark';
  updateTheme: (theme: ThemeMode) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  applySystemTheme: (isDark: boolean) => void;
}

function resolveTheme(theme: ThemeMode, systemDark?: boolean): 'light' | 'dark' {
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      resolvedTheme: 'light',

      updateTheme: (theme) => {
        set((s) => ({
          settings: { ...s.settings, theme },
          resolvedTheme: resolveTheme(theme),
        }));
      },

      updateSettings: (updates) => {
        set((s) => ({
          settings: { ...s.settings, ...updates },
        }));
      },

      applySystemTheme: (isDark) => {
        const { settings } = get();
        if (settings.theme === 'system') {
          set({ resolvedTheme: resolveTheme('system', isDark) });
        }
      },
    }),
    { name: STORAGE_KEYS.SETTINGS }
  )
);
