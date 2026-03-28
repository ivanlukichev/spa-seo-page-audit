import type { StatusLevel } from "../../shared/types";
import { StatusBadge } from "./StatusBadge";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  status?: StatusLevel;
}

export function MetricCard({ label, value, hint, status }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card-head">
        <span className="metric-card-label">{label}</span>
        {status ? <StatusBadge status={status} /> : null}
      </div>
      <strong className="metric-card-value">{value}</strong>
      {hint ? <p className="metric-card-hint">{hint}</p> : null}
    </article>
  );
}
