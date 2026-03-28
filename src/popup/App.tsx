import { startTransition, useEffect, useState } from "react";
import { scoreAnalysis } from "../scoring/scoreEngine";
import { queryActiveTab, sendRuntimeMessage } from "../shared/browser";
import { MESSAGE_TYPES } from "../shared/constants";
import type { AnalysisResult, ScoreBreakdown } from "../shared/types";
import { EmptyState } from "./components/EmptyState";
import { TabNav } from "./components/TabNav";
import { HeadingsTab } from "./tabs/HeadingsTab";
import { ImagesTab } from "./tabs/ImagesTab";
import { LinksTab } from "./tabs/LinksTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { SchemaTab } from "./tabs/SchemaTab";
import { SocialTab } from "./tabs/SocialTab";

type LoadState = "loading" | "ready" | "error";

interface AnalysisResponse {
  ok: boolean;
  analysis?: AnalysisResult | null;
  error?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  async function loadAnalysis(forceRefresh = false) {
    setLoadState("loading");
    setError("");

    try {
      const activeTabInfo = await queryActiveTab();
      const tabId = activeTabInfo?.id;
      const tabUrl = activeTabInfo?.url ?? "";
      setPageUrl(tabUrl);

      if (typeof tabId !== "number") {
        throw new Error("No active browser tab was found.");
      }

      const response = await sendRuntimeMessage<AnalysisResponse>({
        type: MESSAGE_TYPES.REQUEST_ANALYSIS,
        tabId,
        forceRefresh
      });

      if (!response.ok || !response.analysis) {
        throw new Error(response.error ?? "Unable to analyze the current page.");
      }

      startTransition(() => {
        setAnalysis(response.analysis);
        setScore(scoreAnalysis(response.analysis));
        setLoadState("ready");
      });
    } catch (loadError) {
      setLoadState("error");
      setAnalysis(null);
      setScore(null);
      setError(loadError instanceof Error ? loadError.message : "Unknown analysis error.");
    }
  }

  useEffect(() => {
    void loadAnalysis(false);
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <span className="eyebrow">SEO Lite Analyzer</span>
          <h1>On-Page SEO Inspector</h1>
        </div>
        <button type="button" className="refresh-button" onClick={() => void loadAnalysis(true)}>
          Refresh
        </button>
      </header>

      {pageUrl ? <p className="current-url">{pageUrl}</p> : null}

      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {loadState === "loading" ? <section className="loading-card">Analyzing the current page locally…</section> : null}

      {loadState === "error" ? (
        <EmptyState
          title="Analysis unavailable"
          description={
            error ||
            "This page may be restricted. Try reloading the page or opening a regular http/https URL."
          }
        />
      ) : null}

      {loadState === "ready" && analysis && score ? (
        <>
          {activeTab === "overview" ? <OverviewTab analysis={analysis} score={score} /> : null}
          {activeTab === "headings" ? <HeadingsTab analysis={analysis} /> : null}
          {activeTab === "links" ? <LinksTab analysis={analysis} /> : null}
          {activeTab === "images" ? <ImagesTab analysis={analysis} /> : null}
          {activeTab === "schema" ? <SchemaTab analysis={analysis} /> : null}
          {activeTab === "social" ? <SocialTab analysis={analysis} /> : null}
        </>
      ) : null}
    </main>
  );
}
