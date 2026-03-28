import { useState } from "react";
import type { AnalysisResult, LinkItem } from "../../shared/types";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

interface LinksTabProps {
  analysis: AnalysisResult;
}

type LinkFilter = "all" | "internal" | "external" | "nofollow" | "empty";

function filterLinks(links: LinkItem[], filter: LinkFilter) {
  switch (filter) {
    case "internal":
      return links.filter((link) => link.type === "internal");
    case "external":
      return links.filter((link) => link.type === "external");
    case "nofollow":
      return links.filter((link) => link.nofollow);
    case "empty":
      return links.filter((link) => link.emptyAnchor);
    default:
      return links;
  }
}

export function LinksTab({ analysis }: LinksTabProps) {
  const [filter, setFilter] = useState<LinkFilter>("all");

  if (!analysis.links.length) {
    return <EmptyState title="No links found" description="This page did not expose any anchor elements with href values." />;
  }

  const filteredLinks = filterLinks(analysis.links, filter);
  const visibleLinks = filteredLinks.slice(0, 200);
  const nofollowCount = analysis.links.filter((link) => link.nofollow).length;
  const sponsoredCount = analysis.links.filter((link) => link.sponsored).length;
  const ugcCount = analysis.links.filter((link) => link.ugc).length;
  const emptyAnchors = analysis.links.filter((link) => link.emptyAnchor).length;

  return (
    <div className="tab-content">
      <section className="metrics-grid">
        <MetricCard label="Total Links" value={`${analysis.links.length}`} />
        <MetricCard label="Internal" value={`${analysis.links.filter((link) => link.type === "internal").length}`} />
        <MetricCard label="External" value={`${analysis.links.filter((link) => link.type === "external").length}`} />
        <MetricCard label="Nofollow" value={`${nofollowCount}`} />
        <MetricCard label="Sponsored" value={`${sponsoredCount}`} />
        <MetricCard label="UGC" value={`${ugcCount}`} />
        <MetricCard label="Empty Anchors" value={`${emptyAnchors}`} status={emptyAnchors ? "error" : "good"} />
      </section>

      <section className="panel">
        <div className="filter-row">
          {(["all", "internal", "external", "nofollow", "empty"] as LinkFilter[]).map((value) => (
            <button
              type="button"
              key={value}
              className={`filter-chip ${filter === value ? "filter-chip-active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="table-head">
          <span>URL / Anchor</span>
          <span>Type</span>
        </div>
        <div className="stack-list">
          {visibleLinks.map((link, index) => (
            <div className="link-row" key={`${link.absoluteUrl ?? link.href}-${index}`}>
              <div className="link-row-main">
                <strong>{link.anchorText || "(empty anchor)"}</strong>
                <p>{link.absoluteUrl ?? link.href}</p>
                <span className="muted">{link.note}</span>
              </div>
              <div className="link-row-side">
                <StatusBadge status={link.status}>{link.type}</StatusBadge>
                {link.rel.length ? <code>{link.rel.join(" ")}</code> : <span className="muted">rel: none</span>}
              </div>
            </div>
          ))}
        </div>
        {filteredLinks.length > visibleLinks.length ? (
          <p className="muted">Showing the first {visibleLinks.length} links to keep the popup responsive.</p>
        ) : null}
      </section>
    </div>
  );
}
