import type { AnalysisResult, ScoreBreakdown, TextStatItem } from "../../shared/types";
import { MetricCard } from "../components/MetricCard";
import { ScoreRing } from "../components/ScoreRing";
import { StatusBadge } from "../components/StatusBadge";

interface OverviewTabProps {
  analysis: AnalysisResult;
  score: ScoreBreakdown;
}

function KeywordGroup({ label, items }: { label: string; items: TextStatItem[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3>{label}</h3>
      </div>
      {items.length ? (
        <div className="keyword-list">
          {items.map((item) => (
            <div className="keyword-chip" key={`${label}-${item.term}`}>
              <strong>{item.term}</strong>
              <span>
                {item.count} • {item.density}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">Not enough visible text to extract meaningful phrases yet.</p>
      )}
    </section>
  );
}

export function OverviewTab({ analysis, score }: OverviewTabProps) {
  return (
    <div className="tab-content">
      <section className="hero-card">
        <ScoreRing score={score.overall} label={score.label} color={score.color} />
        <div className="hero-copy">
          <div className="hero-headline">
            <span className="eyebrow">On-Page SEO Score</span>
            <StatusBadge status={score.color}>{score.label}</StatusBadge>
          </div>
          <p className="hero-note">
            Score is based on common on-page SEO best practices and browser-detectable page signals.
          </p>
          <div className="section-scores">
            <MetricCard label="Content Score" value={`${score.sections.content}/100`} />
            <MetricCard label="Technical Score" value={`${score.sections.technical}/100`} />
            <MetricCard label="Links Score" value={`${score.sections.links}/100`} />
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Signals Overview</h3>
          <span className="muted">Analyzed {new Date(analysis.analyzedAt).toLocaleTimeString()}</span>
        </div>
        <div className="overview-grid">
          {score.overviewItems.map((item) => (
            <article className="overview-item" key={item.id}>
              <div className="overview-item-head">
                <span>{item.label}</span>
                <StatusBadge status={item.status} />
              </div>
              <strong>{item.value}</strong>
              <p>{item.message}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-header">
            <h3>Top Issues</h3>
          </div>
          {score.issues.length ? (
            <div className="stack-list">
              {score.issues.map((item) => (
                <div className="list-card" key={item.id}>
                  <div className="list-card-head">
                    <strong>{item.title}</strong>
                    <StatusBadge status={item.severity === "high" ? "error" : item.severity === "medium" ? "warning" : "neutral"}>
                      {item.severity}
                    </StatusBadge>
                  </div>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No major issues surfaced in the top-priority checks.</p>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Quick Wins</h3>
          </div>
          {score.quickWins.length ? (
            <div className="stack-list">
              {score.quickWins.map((item) => (
                <div className="list-card" key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No quick wins to suggest right now.</p>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Keyword Snapshot</h3>
          <span className="muted">{analysis.textStats.wordCount} total words</span>
        </div>
        <div className="keyword-columns">
          <KeywordGroup label="Top Words" items={analysis.textStats.topWords} />
          <KeywordGroup label="Top 2-Word Phrases" items={analysis.textStats.topBigrams} />
          <KeywordGroup label="Top 3-Word Phrases" items={analysis.textStats.topTrigrams} />
        </div>
      </section>
    </div>
  );
}
