import type { StatusLevel } from "../../shared/types";

interface StatusBadgeProps {
  status: StatusLevel;
  children?: string;
}

const STATUS_LABELS: Record<StatusLevel, string> = {
  good: "Good",
  warning: "Warning",
  error: "Error",
  neutral: "Neutral"
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{children ?? STATUS_LABELS[status]}</span>;
}
