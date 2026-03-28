import type { AnalysisResult } from "../../shared/types";
import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

interface ImagesTabProps {
  analysis: AnalysisResult;
}

export function ImagesTab({ analysis }: ImagesTabProps) {
  if (!analysis.images.length) {
    return <EmptyState title="No images found" description="This page did not expose any img elements in the live DOM." />;
  }

  const withAlt = analysis.images.filter((image) => image.hasAlt).length;
  const missingAlt = analysis.images.filter((image) => image.missingAlt).length;
  const lazyImages = analysis.images.filter((image) => image.lazy).length;
  const visibleImages = analysis.images.slice(0, 200);

  return (
    <div className="tab-content">
      <section className="metrics-grid">
        <MetricCard label="Total Images" value={`${analysis.images.length}`} />
        <MetricCard label="With ALT" value={`${withAlt}`} status={withAlt === analysis.images.length ? "good" : "warning"} />
        <MetricCard label="Missing ALT" value={`${missingAlt}`} status={missingAlt ? "error" : "good"} />
        <MetricCard label="Lazy Loaded" value={`${lazyImages}`} />
      </section>

      <section className="panel">
        <div className="table-head">
          <span>Image</span>
          <span>Status</span>
        </div>
        <div className="stack-list">
          {visibleImages.map((image, index) => (
            <div className="link-row" key={`${image.src}-${index}`}>
              <div className="link-row-main">
                <strong>{image.alt || "(empty alt)"}</strong>
                <p>{image.src || "(missing src)"}</p>
                <span className="muted">
                  {image.width ?? "?"}×{image.height ?? "?"} {image.lazy ? "• lazy" : ""}
                </span>
              </div>
              <div className="link-row-side">
                <StatusBadge status={image.status} />
                <span className="muted">{image.note}</span>
              </div>
            </div>
          ))}
        </div>
        {analysis.images.length > visibleImages.length ? (
          <p className="muted">Showing the first {visibleImages.length} images to keep rendering lightweight.</p>
        ) : null}
      </section>
    </div>
  );
}
