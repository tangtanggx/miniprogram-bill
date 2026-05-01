/**
 * 页面头部统一封装
 */

import { NavBar } from 'antd-mobile';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export default function PageHeader({ title, onBack, right }: PageHeaderProps) {
  return (
    <NavBar
      onBack={onBack}
      right={right}
      style={{ background: 'var(--color-bg-card)' }}
    >
      {title}
    </NavBar>
  );
}
