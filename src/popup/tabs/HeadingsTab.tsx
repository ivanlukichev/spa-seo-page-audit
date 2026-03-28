import type { AnalysisResult } from "../../shared/types";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

interface HeadingsTabProps {
  analysis: AnalysisResult;
}

export function HeadingsTab({ analysis }: HeadingsTabProps) {
  if (!analysis.headings.length) {
    return <EmptyState title="No headings found" description="This page did not expose any H1-H6 headings in the live DOM." />;
  }

  return (
    <div className="tab-content">
      <section className="metrics-grid">
        {Object.entries(analysis.headingCounts).map(([level, count]) => (
          <MetricCard key={level} label={level.toUpperCase()} value={`${count}`} status={level === "h1" && count !== 1 ? (count === 0 ? "error" : "warning") : "good"} />
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Heading Summary</h3>
        </div>
        <p className="muted">
          {analysis.headingCounts.h1} H1 found, {analysis.headingCounts.h2} H2 found, {analysis.headingCounts.h3} H3 found.
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Document Order</h3>
        </div>
        <div className="stack-list">
          {analysis.headings.map((heading) => (
            <div className="heading-row" key={`${heading.level}-${heading.index}-${heading.text}`}>
              <div className="heading-row-head">
                <StatusBadge status={heading.level === 1 ? "good" : "neutral"}>{`H${heading.level}`}</StatusBadge>
                {heading.id ? <code>#{heading.id}</code> : null}
              </div>
              <p>{heading.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
