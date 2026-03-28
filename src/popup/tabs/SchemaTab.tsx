import type { AnalysisResult } from "../../shared/types";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

interface SchemaTabProps {
  analysis: AnalysisResult;
}

export function SchemaTab({ analysis }: SchemaTabProps) {
  if (!analysis.schema.length) {
    return <EmptyState title="No schema found" description="No JSON-LD blocks were detected on the current page." />;
  }

  const parsedCount = analysis.schema.filter((item) => item.parsed).length;
  const allTypes = Array.from(new Set(analysis.schema.flatMap((item) => item.types)));

  return (
    <div className="tab-content">
      <section className="metrics-grid">
        <MetricCard label="JSON-LD Blocks" value={`${analysis.schema.length}`} />
        <MetricCard label="Parsed Blocks" value={`${parsedCount}`} status={parsedCount === analysis.schema.length ? "good" : "warning"} />
        <MetricCard label="Types Found" value={allTypes.length ? `${allTypes.length}` : "0"} status={allTypes.length ? "good" : "warning"} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Detected Types</h3>
        </div>
        {allTypes.length ? (
          <div className="keyword-list">
            {allTypes.map((type) => (
              <div className="keyword-chip" key={type}>
                <strong>{type}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Schema blocks exist, but no @type values were recognized.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Raw JSON-LD</h3>
        </div>
        <div className="stack-list">
          {analysis.schema.map((item, index) => (
            <details className="schema-card" key={`schema-${index}`}>
              <summary>
                <span>Block {index + 1}</span>
                <StatusBadge status={item.parsed ? "good" : "warning"}>{item.parsed ? "Parsed" : "Warning"}</StatusBadge>
              </summary>
              <p className="muted">
                {item.types.length ? item.types.join(", ") : item.error ? item.error : "No explicit @type detected."}
              </p>
              <pre>{item.raw}</pre>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
