(function () {
  const app = document.getElementById("app");
  const MESSAGE_TYPES = SEOShared.MESSAGE_TYPES;
  const PROJECT_LINKS = SEOShared.PROJECT_LINKS;
  const state = {
    requestState: "loading",
    activeTabId: null,
    activeUrl: "",
    error: "",
    stored: null
  };

  function renderBadge(status, label) {
    return '<span class="status-badge status-' + SEOShared.escapeHtml(status) + '">' + SEOShared.escapeHtml(label || status) + "</span>";
  }

  function renderMetricCard(label, value, status, hint) {
    return [
      '<article class="metric-card">',
      '<div class="metric-card-head">',
      '<span class="metric-card-label">' + SEOShared.escapeHtml(label) + "</span>",
      status ? renderBadge(status, status) : "",
      "</div>",
      '<strong class="metric-card-value">' + SEOShared.escapeHtml(value) + "</strong>",
      hint ? '<p class="metric-card-hint">' + SEOShared.escapeHtml(hint) + "</p>" : "",
      "</article>"
    ].join("");
  }

  function renderScoreRing(score, label, color) {
    return [
      '<div class="score-ring score-ring-' + SEOShared.escapeHtml(color) + '" style="--score:' + SEOShared.escapeHtml(String(score)) + '%;">',
      '<div class="score-ring-inner">',
      "<strong>" + SEOShared.escapeHtml(String(score)) + "</strong>",
      "<span>" + SEOShared.escapeHtml(label) + "</span>",
      "</div>",
      "</div>"
    ].join("");
  }

  function renderLoading() {
    return '<section class="loading-card">Analyzing the current page locally…</section>';
  }

  function renderError() {
    return [
      '<section class="empty-state">',
      "<strong>Analysis unavailable</strong>",
      "<p>" + SEOShared.escapeHtml(state.error || "Unable to analyze the current page.") + "</p>",
      "</section>"
    ].join("");
  }

  function renderSuccess() {
    const stored = state.stored;
    const score = stored.score;
    const topIssues = score.issues.slice(0, 5);
    const keyChecks = [
      { label: "Title", check: score.checks.title },
      { label: "Meta Description", check: score.checks.description },
      { label: "H1", check: score.checks.h1 },
      { label: "Canonical", check: score.checks.canonical },
      { label: "Schema", check: score.checks.schema }
    ];

    return [
      '<div class="tab-content compact-stack">',
      '<section class="hero-card popup-hero">',
      renderScoreRing(score.overall, score.label, score.color),
      '<div class="hero-copy">',
      '<div class="hero-topline">',
      '<div class="hero-headline">',
      '<span class="eyebrow">SPA: SEO Page Audit</span>',
      renderBadge(score.color, score.label),
      "</div>",
      '<div class="button-row hero-actions">',
      '<button type="button" class="refresh-button" data-action="reanalyze">Refresh</button>',
      '<button type="button" class="action-button" data-action="expand">Open Full View</button>',
      "</div>",
      "</div>",
      '<p class="hero-note">' + SEOShared.escapeHtml(stored.url) + "</p>",
      '<p class="muted">Last analyzed ' + SEOShared.escapeHtml(SEOShared.formatTime(stored.analyzedAt)) + "</p>",
      '<div class="section-scores">',
      renderMetricCard("Content", score.sections.content + "/100"),
      renderMetricCard("Technical", score.sections.technical + "/100"),
      renderMetricCard("Links", score.sections.links + "/100"),
      "</div>",
      "</div>",
      "</section>",
      '<section class="panel compact-panel"><div class="panel-header"><h3>Top Issues</h3></div>',
      topIssues.length ? '<div class="stack-list">' + topIssues.map(function (item) {
        const status = item.severity === "high" ? "error" : item.severity === "medium" ? "warning" : "neutral";
        return '<div class="list-card compact-card"><div class="list-card-head"><strong>' + SEOShared.escapeHtml(item.title) + "</strong>" + renderBadge(status, item.severity) + '</div><p>' + SEOShared.escapeHtml(item.detail) + "</p></div>";
      }).join("") + "</div>" : '<p class="muted">No major issues surfaced in the main checks.</p>',
      "</section>",
      '<section class="panel compact-panel"><div class="panel-header"><h3>Key Checks</h3></div><div class="stack-list">',
      keyChecks.map(function (item) {
        return '<div class="list-card compact-card"><div class="list-card-head"><strong>' + SEOShared.escapeHtml(item.label) + "</strong>" + renderBadge(item.check.status, item.check.status) + '</div><p>' + SEOShared.escapeHtml(item.check.message) + "</p></div>";
      }).join(""),
      "</div></section>",
      "</div>"
    ].join("");
  }

  function render() {
    app.innerHTML = [
      '<main class="app-shell popup-shell">',
      '<header class="app-header">',
      '<div><span class="eyebrow">Extension Popup</span><h1>SPA: SEO Page Audit</h1></div>',
      "</header>",
      state.activeUrl && state.requestState !== "success" ? '<p class="current-url">' + SEOShared.escapeHtml(state.activeUrl) + "</p>" : "",
      state.requestState === "loading" ? renderLoading() : "",
      state.requestState === "error" || state.requestState === "unsupported" ? renderError() : "",
      state.requestState === "success" && state.stored ? renderSuccess() : "",
      '<footer class="project-footer">',
      '<a class="project-link" href="' + SEOShared.escapeHtml(PROJECT_LINKS.repository) + '" target="_blank" rel="noreferrer">Repository</a>',
      '<a class="project-link" href="' + SEOShared.escapeHtml(PROJECT_LINKS.github) + '" target="_blank" rel="noreferrer">GitHub</a>',
      '<a class="project-link" href="' + SEOShared.escapeHtml(PROJECT_LINKS.website) + '" target="_blank" rel="noreferrer">Website</a>',
      "</footer>",
      "</main>"
    ].join("");
  }

  function loadAnalysis(forceRefresh) {
    state.requestState = "loading";
    state.error = "";
    render();

    SEOShared.queryActiveTab()
      .then(function (tab) {
        state.activeTabId = tab && typeof tab.id === "number" ? tab.id : null;
        state.activeUrl = (tab && tab.url) || "";

        if (state.activeTabId == null) {
          throw new Error("No active browser tab was found.");
        }

        return SEOShared.sendRuntimeMessage({
          type: forceRefresh ? MESSAGE_TYPES.RUN_ANALYSIS : MESSAGE_TYPES.GET_ANALYSIS_BY_TAB_ID,
          tabId: state.activeTabId
        });
      })
      .then(function (response) {
        if (!response || !response.ok || !response.payload) {
          state.requestState = response && response.state ? response.state : "error";
          state.error = (response && response.error) || "Unable to analyze the current page.";
          state.stored = null;
          render();
          return;
        }

        state.requestState = "success";
        state.stored = response.payload;
        render();
      })
      .catch(function (error) {
        state.requestState = "error";
        state.stored = null;
        state.error = error && error.message ? error.message : "Unknown analysis error.";
        render();
      });
  }

  app.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const action = button.getAttribute("data-action");

    if (action === "reanalyze") {
      loadAnalysis(true);
      return;
    }

    if (action === "expand" && state.activeTabId != null) {
      SEOShared.sendRuntimeMessage({
        type: MESSAGE_TYPES.OPEN_FULL_VIEW,
        tabId: state.activeTabId
      }).catch(function (error) {
        state.requestState = "error";
        state.error = error && error.message ? error.message : "Unable to open the full view.";
        render();
      });
    }
  });

  render();
  loadAnalysis(false);
})();
