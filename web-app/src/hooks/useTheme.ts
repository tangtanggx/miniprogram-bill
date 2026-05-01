/**
 * 主题切换 Hook
 */

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores';
import { LIGHT_THEME, DARK_THEME } from '@/constants';

export function useTheme() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const updateTheme = useSettingsStore((s) => s.updateTheme);
  const applySystemTheme = useSettingsStore((s) => s.applySystemTheme);

  useEffect(() => {
    // 监听系统深色模式变化
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => applySystemTheme(e.matches);
    mq.addEventListener('change', handler);
    // 初始化
    applySystemTheme(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [applySystemTheme]);

  useEffect(() => {
    // 应用CSS变量到 :root
    const vars = resolvedTheme === 'dark' ? DARK_THEME : LIGHT_THEME;
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [resolvedTheme]);

  return { theme, resolvedTheme, updateTheme };
}
