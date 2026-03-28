import type { AnalysisResult } from "../../shared/types";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";

interface SocialTabProps {
  analysis: AnalysisResult;
}

function SocialField({ label, value }: { label: string; value: string | null }) {
  const hasValue = Boolean(value);

  return (
    <div className="social-field">
      <div className="social-field-head">
        <span>{label}</span>
        <StatusBadge status={hasValue ? "good" : "error"}>{hasValue ? "Found" : "Missing"}</StatusBadge>
      </div>
      <strong>{value || "Not found"}</strong>
    </div>
  );
}

export function SocialTab({ analysis }: SocialTabProps) {
  const ogCount = [analysis.social.ogTitle, analysis.social.ogDescription, analysis.social.ogImage, analysis.social.ogType].filter(Boolean).length;
  const twitterCount = [
    analysis.social.twitterCard,
    analysis.social.twitterTitle,
    analysis.social.twitterDescription,
    analysis.social.twitterImage
  ].filter(Boolean).length;

  return (
    <div className="tab-content">
      <section className="metrics-grid">
        <MetricCard label="Open Graph" value={`${ogCount}/4`} status={ogCount >= 3 ? "good" : ogCount > 0 ? "warning" : "error"} />
        <MetricCard label="Twitter Cards" value={`${twitterCount}/4`} status={twitterCount >= 2 ? "good" : twitterCount > 0 ? "warning" : "error"} />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-header">
            <h3>Open Graph</h3>
          </div>
          <div className="stack-list">
            <SocialField label="og:title" value={analysis.social.ogTitle} />
            <SocialField label="og:description" value={analysis.social.ogDescription} />
            <SocialField label="og:image" value={analysis.social.ogImage} />
            <SocialField label="og:type" value={analysis.social.ogType} />
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Twitter</h3>
          </div>
          <div className="stack-list">
            <SocialField label="twitter:card" value={analysis.social.twitterCard} />
            <SocialField label="twitter:title" value={analysis.social.twitterTitle} />
            <SocialField label="twitter:description" value={analysis.social.twitterDescription} />
            <SocialField label="twitter:image" value={analysis.social.twitterImage} />
          </div>
        </article>
      </section>
    </div>
  );
}
