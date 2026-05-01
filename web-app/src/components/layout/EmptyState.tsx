/**
 * 空状态占位组件
 */

interface EmptyStateProps {
  icon?: string;
  message?: string;
}

export default function EmptyState({ icon = '📭', message = '暂无数据' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div>{message}</div>
    </div>
  );
}
