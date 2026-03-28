export type StatusLevel = "good" | "warning" | "error" | "neutral";
export type LinkType = "internal" | "external" | "other";
export type ScoreLabel = "Excellent" | "Good" | "Needs Improvement" | "Weak";
export type SeverityLevel = "high" | "medium" | "low";

export interface PageMeta {
  url: string;
  title: string;
  metaDescription: string | null;
  canonical: string | null;
  robots: string | null;
  viewport: string | null;
  lang: string | null;
  charset: string | null;
  favicon: string | null;
}

export interface HeadingItem {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  id: string | null;
  index: number;
}

export interface HeadingCounts {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
}

export interface TextStatItem {
  term: string;
  count: number;
  density: number;
}

export interface TextStats {
  wordCount: number;
  topWords: TextStatItem[];
  topBigrams: TextStatItem[];
  topTrigrams: TextStatItem[];
}

export interface LinkItem {
  href: string;
  absoluteUrl: string | null;
  hostname: string | null;
  type: LinkType;
  rel: string[];
  nofollow: boolean;
  sponsored: boolean;
  ugc: boolean;
  anchorText: string;
  emptyAnchor: boolean;
  status: StatusLevel;
  note: string;
}

export interface ImageItem {
  src: string;
  alt: string | null;
  hasAlt: boolean;
  missingAlt: boolean;
  width: number | null;
  height: number | null;
  lazy: boolean;
  status: StatusLevel;
  note: string;
}

export interface SchemaItem {
  raw: string;
  parsed: boolean;
  types: string[];
  error: string | null;
}

export interface SocialMeta {
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
}

export interface AnalysisResult extends PageMeta {
  headings: HeadingItem[];
  headingCounts: HeadingCounts;
  textStats: TextStats;
  links: LinkItem[];
  images: ImageItem[];
  schema: SchemaItem[];
  social: SocialMeta;
  iframesCount: number;
  analyzedAt: string;
}

export interface CheckResult {
  score: number;
  maxScore: number;
  status: StatusLevel;
  message: string;
  value: string;
}

export interface IssueItem {
  id: string;
  title: string;
  detail: string;
  severity: SeverityLevel;
}

export interface RecommendationItem {
  id: string;
  title: string;
  detail: string;
}

export interface OverviewItem {
  id: string;
  label: string;
  value: string;
  status: StatusLevel;
  message: string;
}

export interface ScoreBreakdown {
  overall: number;
  label: ScoreLabel;
  color: StatusLevel;
  sections: {
    content: number;
    technical: number;
    links: number;
  };
  rawSections: {
    content: number;
    technical: number;
    links: number;
  };
  checks: Record<string, CheckResult>;
  issues: IssueItem[];
  quickWins: RecommendationItem[];
  overviewItems: OverviewItem[];
}

export interface RuntimeRequestAnalysis {
  type: "SEO_REQUEST_ANALYSIS";
  tabId: number;
  forceRefresh?: boolean;
}

export interface RuntimeGetCachedAnalysis {
  type: "SEO_GET_CACHED_ANALYSIS";
  tabId: number;
}

export interface ContentAnalyzePage {
  type: "SEO_ANALYZE_PAGE";
}

export type RuntimeMessage = RuntimeRequestAnalysis | RuntimeGetCachedAnalysis;
export type ContentMessage = ContentAnalyzePage;
