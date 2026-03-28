import type { IssueItem, RecommendationItem, ScoreLabel, SeverityLevel, StatusLevel } from "../shared/types";
import { clamp } from "../shared/utils";

export function scoreToLabel(score: number): { label: ScoreLabel; color: StatusLevel } {
  if (score >= 90) {
    return { label: "Excellent", color: "good" };
  }

  if (score >= 75) {
    return { label: "Good", color: "good" };
  }

  if (score >= 60) {
    return { label: "Needs Improvement", color: "warning" };
  }

  return { label: "Weak", color: "error" };
}

export function percentage(raw: number, max: number): number {
  return Math.round(clamp((raw / max) * 100, 0, 100));
}

export function normalizeComparableUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
    const search = parsed.search ? parsed.search : "";
    return `${parsed.origin}${normalizedPath}${search}`.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

export function looksLikeUrlText(title: string, currentUrl: string): boolean {
  const normalizedTitle = title.toLowerCase().trim();

  if (!normalizedTitle) {
    return false;
  }

  try {
    const parsed = new URL(currentUrl);
    const pathname = parsed.pathname.replace(/[-_/]+/g, " ").trim();
    const hostname = parsed.hostname.replace(/^www\./, "").replace(/\./g, " ");

    return normalizedTitle === currentUrl.toLowerCase() || normalizedTitle === pathname || normalizedTitle === hostname;
  } catch {
    return false;
  }
}

export function issue(id: string, title: string, detail: string, severity: SeverityLevel): IssueItem {
  return { id, title, detail, severity };
}

export function quickWin(id: string, title: string, detail: string): RecommendationItem {
  return { id, title, detail };
}

export function severityWeight(severity: SeverityLevel): number {
  switch (severity) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}
