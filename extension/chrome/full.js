(function () {
  const app = document.getElementById("app");
  const MESSAGE_TYPES = SEOShared.MESSAGE_TYPES;
  const TABS = SEOShared.FULL_VIEW_TABS;
  const PROJECT_LINKS = SEOShared.PROJECT_LINKS;
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get("view");
  const state = {
    tabId: Number(params.get("tabId")) || null,
    requestState: "loading",
    activeTab: TABS.some(function (item) { return item.id === initialTab; }) ? initialTab : "overview",
    linkFilter: "all",
    imageFilter: "all",
    selectedImageIndex: null,
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

  function renderKeywordGroup(label, items) {
    return [
      '<section class="panel">',
      '<div class="panel-header"><h3>' + SEOShared.escapeHtml(label) + "</h3></div>",
      items.length ? '<div class="keyword-list">' + items.map(function (item) {
        return '<div class="keyword-chip"><strong>' + SEOShared.escapeHtml(item.term) + "</strong><span>" + SEOShared.escapeHtml(item.count + " • " + item.density + "%") + "</span></div>";
      }).join("") + "</div>" : '<p class="muted">Not enough visible text to extract meaningful phrases yet.</p>',
      "</section>"
    ].join("");
  }

  function renderOverview(stored) {
    const analysis = stored.analysis;
    const score = stored.score;

    return [
      '<div class="tab-content">',
      '<section class="panel"><div class="panel-header"><h3>Signals Overview</h3><span class="muted">Complete page snapshot</span></div><div class="overview-grid">',
      score.overviewItems.map(function (item) {
        return '<article class="overview-item"><div class="overview-item-head"><span>' + SEOShared.escapeHtml(item.label) + "</span>" + renderBadge(item.status, item.status) + '</div><strong>' + SEOShared.escapeHtml(item.value) + '</strong><p>' + SEOShared.escapeHtml(item.message) + "</p></article>";
      }).join(""),
      "</div></section>",
      '<section class="two-column">',
      '<article class="panel"><div class="panel-header"><h3>Top Issues</h3></div>',
      score.issues.length ? '<div class="stack-list">' + score.issues.map(function (item) {
        const status = item.severity === "high" ? "error" : item.severity === "medium" ? "warning" : "neutral";
        return '<div class="list-card"><div class="list-card-head"><strong>' + SEOShared.escapeHtml(item.title) + "</strong>" + renderBadge(status, item.severity) + '</div><p>' + SEOShared.escapeHtml(item.detail) + "</p></div>";
      }).join("") + "</div>" : '<p class="muted">No major issues surfaced in the current analysis.</p>',
      "</article>",
      '<article class="panel"><div class="panel-header"><h3>Quick Wins</h3></div>',
      score.quickWins.length ? '<div class="stack-list">' + score.quickWins.map(function (item) {
        return '<div class="list-card"><strong>' + SEOShared.escapeHtml(item.title) + '</strong><p>' + SEOShared.escapeHtml(item.detail) + "</p></div>";
      }).join("") + "</div>" : '<p class="muted">No quick wins suggested right now.</p>',
      "</article>",
      "</section>",
      '<section class="panel"><div class="panel-header"><h3>Keywords Snapshot</h3><span class="muted">' + SEOShared.escapeHtml(String(analysis.textStats.wordCount)) + ' total words</span></div><div class="keyword-columns">',
      renderKeywordGroup("Top Words", analysis.textStats.topWords),
      renderKeywordGroup("Top 2-Word Phrases", analysis.textStats.topBigrams),
      renderKeywordGroup("Top 3-Word Phrases", analysis.textStats.topTrigrams),
      "</div></section>",
      "</div>"
    ].join("");
  }

  function renderHeadings(stored) {
    const analysis = stored.analysis;
    if (!analysis.headings.length) {
      return '<section class="empty-state"><strong>No headings found</strong><p>This page did not expose any H1-H6 headings in the live DOM.</p></section>';
    }

    return [
      '<div class="tab-content">',
      '<section class="metrics-grid">',
      Object.keys(analysis.headingCounts).map(function (level) {
        const count = analysis.headingCounts[level];
        const status = level === "h1" && count !== 1 ? (count === 0 ? "error" : "warning") : "good";
        return renderMetricCard(level.toUpperCase(), String(count), status);
      }).join(""),
      "</section>",
      '<section class="panel"><div class="panel-header"><h3>Document Order</h3><span class="muted">' + SEOShared.escapeHtml(String(analysis.headings.length)) + ' headings</span></div><div class="stack-list">',
      analysis.headings.map(function (heading) {
        return '<div class="heading-row"><div class="heading-row-head">' + renderBadge(heading.level === 1 ? "good" : "neutral", "H" + heading.level) + (heading.id ? "<code>#" + SEOShared.escapeHtml(heading.id) + "</code>" : "") + '</div><p>' + SEOShared.escapeHtml(heading.text) + "</p></div>";
      }).join(""),
      "</div></section>",
      "</div>"
    ].join("");
  }

  function getFilteredLinks(links) {
    if (state.linkFilter === "internal") {
      return links.filter(function (link) { return link.type === "internal"; });
    }
    if (state.linkFilter === "external") {
      return links.filter(function (link) { return link.type === "external"; });
    }
    if (state.linkFilter === "nofollow") {
      return links.filter(function (link) { return link.nofollow; });
    }
    if (state.linkFilter === "empty") {
      return links.filter(function (link) { return link.emptyAnchor; });
    }
    if (state.linkFilter === "image-links") {
      return links.filter(function (link) { return link.isImageOnlyLink; });
    }
    if (state.linkFilter === "accessible-non-text") {
      return links.filter(function (link) {
        return ["aria-label", "aria-labelledby", "img-alt", "title"].indexOf(link.anchorSource) !== -1;
      });
    }
    return links;
  }

  function renderLinks(stored) {
    const analysis = stored.analysis;
    if (!analysis.links.length) {
      return '<section class="empty-state"><strong>No links found</strong><p>This page did not expose any anchor elements with href values.</p></section>';
    }

    const filteredLinks = getFilteredLinks(analysis.links);

    return [
      '<div class="tab-content">',
      '<section class="metrics-grid">',
      renderMetricCard("Total Links", String(analysis.links.length)),
      renderMetricCard("Internal", String(analysis.links.filter(function (link) { return link.type === "internal"; }).length)),
      renderMetricCard("External", String(analysis.links.filter(function (link) { return link.type === "external"; }).length)),
      renderMetricCard("Nofollow", String(analysis.links.filter(function (link) { return link.nofollow; }).length)),
      renderMetricCard("Empty Anchors", String(analysis.links.filter(function (link) { return link.anchorSource === "empty"; }).length), analysis.links.some(function (link) { return link.anchorSource === "empty"; }) ? "error" : "good"),
      renderMetricCard("Image Links", String(analysis.links.filter(function (link) { return link.isImageOnlyLink; }).length)),
      "</section>",
      '<section class="panel">',
      '<div class="filter-row">',
      ["all", "internal", "external", "nofollow", "empty", "image-links", "accessible-non-text"].map(function (value) {
        return '<button type="button" class="filter-chip ' + (state.linkFilter === value ? "filter-chip-active" : "") + '" data-link-filter="' + SEOShared.escapeHtml(value) + '">' + SEOShared.escapeHtml(value) + "</button>";
      }).join(""),
      "</div>",
      '<div class="table-head table-head-wide"><span>URL / Anchor</span><span>Type / rel</span></div>',
      '<div class="stack-list">',
      filteredLinks.map(function (link) {
        return '<div class="link-row wide-row"><div class="link-row-main"><strong>' + SEOShared.escapeHtml(link.accessibleAnchorName || "(empty anchor)") + "</strong><p>" + SEOShared.escapeHtml(link.absoluteUrl || link.href || "") + "</p><span class=\"muted\">" + SEOShared.escapeHtml(link.message || link.note) + '</span></div><div class="link-row-side">' + renderBadge(link.status, link.type) + '<span class="muted">source: ' + SEOShared.escapeHtml(link.anchorSource) + '</span>' + (link.isImageOnlyLink ? '<span class="muted">image link</span>' : '') + (link.rel.length ? "<code>" + SEOShared.escapeHtml(link.rel.join(" ")) + "</code>" : '<span class="muted">rel: none</span>') + "</div></div>";
      }).join(""),
      "</div></section></div>"
    ].join("");
  }

  function getFilteredImages(images) {
    if (state.imageFilter === "missing-alt") {
      return images.filter(function (image) { return image.missingAlt; });
    }
    if (state.imageFilter === "with-alt") {
      return images.filter(function (image) { return image.hasAlt; });
    }
    return images;
  }

  function renderImages(stored) {
    const analysis = stored.analysis;
    if (!analysis.images.length) {
      return '<section class="empty-state"><strong>No images found</strong><p>This page did not expose any img elements in the live DOM.</p></section>';
    }

    const filteredImages = getFilteredImages(analysis.images);

    return [
      '<div class="tab-content">',
      '<section class="metrics-grid">',
      renderMetricCard("Total Images", String(analysis.images.length)),
      renderMetricCard("With ALT", String(analysis.images.filter(function (image) { return image.hasAlt; }).length), analysis.images.every(function (image) { return image.hasAlt; }) ? "good" : "warning"),
      renderMetricCard("Missing ALT", String(analysis.images.filter(function (image) { return image.missingAlt; }).length), analysis.images.some(function (image) { return image.missingAlt; }) ? "error" : "good"),
      renderMetricCard("Lazy Loaded", String(analysis.images.filter(function (image) { return image.lazy; }).length)),
      "</section>",
      '<section class="panel"><div class="filter-row">',
      ["all", "missing-alt", "with-alt"].map(function (value) {
        return '<button type="button" class="filter-chip ' + (state.imageFilter === value ? "filter-chip-active" : "") + '" data-image-filter="' + SEOShared.escapeHtml(value) + '">' + SEOShared.escapeHtml(value) + "</button>";
      }).join(""),
      '</div><div class="stack-list">',
      filteredImages.map(function (image) {
        const sizeText = (image.width || "?") + "×" + (image.height || "?") + (image.lazy ? " • lazy" : "");
        const originalIndex = stored.analysis.images.indexOf(image);
        return '<div class="link-row wide-row image-row">' +
          '<button type="button" class="image-thumb-button" data-image-preview="' + SEOShared.escapeHtml(String(originalIndex)) + '">' +
          (image.src ? '<img class="image-thumb" src="' + SEOShared.escapeHtml(image.src) + '" alt="' + SEOShared.escapeHtml(image.alt || "Image preview") + '" />' : '<span class="image-thumb image-thumb-empty">No preview</span>') +
          "</button>" +
          '<div class="link-row-main"><strong>' + SEOShared.escapeHtml(image.alt || "(empty alt)") + "</strong><p>" + SEOShared.escapeHtml(image.src || "(missing src)") + "</p><span class=\"muted\">" + SEOShared.escapeHtml(sizeText) + '</span></div><div class="link-row-side">' + renderBadge(image.status, image.status) + '<span class="muted">' + SEOShared.escapeHtml(image.note) + "</span></div></div>";
      }).join(""),
      "</div></section></div>"
    ].join("");
  }

  function renderSchema(stored) {
    const analysis = stored.analysis;
    if (!analysis.schema.length) {
      return '<section class="empty-state"><strong>No schema found</strong><p>No JSON-LD blocks were detected on the current page.</p></section>';
    }

    const parsedCount = analysis.schema.filter(function (item) { return item.parsed; }).length;
    const allTypes = Array.from(new Set(analysis.schema.flatMap(function (item) { return item.types; })));

    return [
      '<div class="tab-content">',
      '<section class="metrics-grid">',
      renderMetricCard("JSON-LD Blocks", String(analysis.schema.length)),
      renderMetricCard("Parsed Blocks", String(parsedCount), parsedCount === analysis.schema.length ? "good" : "warning"),
      renderMetricCard("Types Found", String(allTypes.length), allTypes.length ? "good" : "warning"),
      "</section>",
      '<section class="panel"><div class="panel-header"><h3>Detected Types</h3></div>',
      allTypes.length ? '<div class="keyword-list">' + allTypes.map(function (type) {
        return '<div class="keyword-chip"><strong>' + SEOShared.escapeHtml(type) + "</strong></div>";
      }).join("") + "</div>" : '<p class="muted">Schema blocks exist, but no @type values were recognized.</p>',
      "</section>",
      '<section class="panel"><div class="panel-header"><h3>Raw JSON-LD</h3></div><div class="stack-list">',
      analysis.schema.map(function (item, index) {
        return '<details class="schema-card"><summary><span>Block ' + SEOShared.escapeHtml(String(index + 1)) + "</span>" + renderBadge(item.parsed ? "good" : "warning", item.parsed ? "Parsed" : "Warning") + "</summary><p class=\"muted\">" + SEOShared.escapeHtml(item.types.length ? item.types.join(", ") : (item.error || "No explicit @type detected.")) + "</p><pre>" + SEOShared.escapeHtml(item.raw) + "</pre></details>";
      }).join(""),
      "</div></section></div>"
    ].join("");
  }

  function renderSocial(stored) {
    const social = stored.analysis.social;

    function field(label, value) {
      const hasValue = Boolean(value);
      return '<div class="social-field"><div class="social-field-head"><span>' + SEOShared.escapeHtml(label) + "</span>" + renderBadge(hasValue ? "good" : "error", hasValue ? "Found" : "Missing") + '</div><strong>' + SEOShared.escapeHtml(value || "Not found") + "</strong></div>";
    }

    return [
      '<div class="tab-content">',
      '<section class="metrics-grid">',
      renderMetricCard("Open Graph", String([social.ogTitle, social.ogDescription, social.ogImage, social.ogType].filter(Boolean).length) + "/4"),
      renderMetricCard("Twitter", String([social.twitterCard, social.twitterTitle, social.twitterDescription, social.twitterImage].filter(Boolean).length) + "/4"),
      "</section>",
      '<section class="two-column">',
      '<article class="panel"><div class="panel-header"><h3>Open Graph</h3></div><div class="stack-list">' + field("og:title", social.ogTitle) + field("og:description", social.ogDescription) + field("og:image", social.ogImage) + field("og:type", social.ogType) + "</div></article>",
      '<article class="panel"><div class="panel-header"><h3>Twitter</h3></div><div class="stack-list">' + field("twitter:card", social.twitterCard) + field("twitter:title", social.twitterTitle) + field("twitter:description", social.twitterDescription) + field("twitter:image", social.twitterImage) + "</div></article>",
      "</section></div>"
    ].join("");
  }

  function renderKeywords(stored) {
    const textStats = stored.analysis.textStats;

    return [
      '<div class="tab-content">',
      '<section class="metrics-grid">',
      renderMetricCard("Total Words", String(textStats.wordCount)),
      renderMetricCard("Top Words", String(textStats.topWords.length)),
      renderMetricCard("Top Bigrams", String(textStats.topBigrams.length)),
      renderMetricCard("Top Trigrams", String(textStats.topTrigrams.length)),
      "</section>",
      '<div class="keyword-columns">',
      renderKeywordGroup("Top Words", textStats.topWords),
      renderKeywordGroup("Top 2-Word Phrases", textStats.topBigrams),
      renderKeywordGroup("Top 3-Word Phrases", textStats.topTrigrams),
      "</div>",
      "</div>"
    ].join("");
  }

  function renderTechnical(stored) {
    const analysis = stored.analysis;
    const overviewItems = stored.score.overviewItems.filter(function (item) {
      return ["canonical", "robots", "schema", "openGraph", "twitter", "lang", "viewport"].indexOf(item.id) !== -1;
    });

    return [
      '<div class="tab-content">',
      '<section class="metrics-grid">',
      renderMetricCard("Iframes", String(analysis.iframesCount)),
      renderMetricCard("Charset", SEOShared.formatNullable(analysis.charset, "Not found")),
      renderMetricCard("Favicon", analysis.favicon ? "Found" : "Not found", analysis.favicon ? "good" : "warning"),
      "</section>",
      '<section class="panel"><div class="panel-header"><h3>Technical Signals</h3></div><div class="overview-grid">',
      overviewItems.map(function (item) {
        return '<article class="overview-item"><div class="overview-item-head"><span>' + SEOShared.escapeHtml(item.label) + "</span>" + renderBadge(item.status, item.status) + '</div><strong>' + SEOShared.escapeHtml(item.value) + '</strong><p>' + SEOShared.escapeHtml(item.message) + "</p></article>";
      }).join(""),
      "</div></section></div>"
    ].join("");
  }

  function renderContent() {
    if (state.requestState === "loading") {
      return '<section class="loading-card">Loading analysis for the selected tab…</section>';
    }

    if (state.requestState === "error" || state.requestState === "unsupported") {
      return '<section class="empty-state"><strong>Analysis unavailable</strong><p>' + SEOShared.escapeHtml(state.error || "Unable to analyze the current page.") + "</p></section>";
    }

    if (!state.stored) {
      return '<section class="empty-state"><strong>No analysis found</strong><p>Open the popup on a supported page and run an analysis first.</p></section>';
    }

    if (state.activeTab === "headings") {
      return renderHeadings(state.stored);
    }

    if (state.activeTab === "links") {
      return renderLinks(state.stored);
    }

    if (state.activeTab === "images") {
      return renderImages(state.stored);
    }

    if (state.activeTab === "schema") {
      return renderSchema(state.stored);
    }

    if (state.activeTab === "social") {
      return renderSocial(state.stored);
    }

    if (state.activeTab === "keywords") {
      return renderKeywords(state.stored);
    }

    if (state.activeTab === "technical") {
      return renderTechnical(state.stored);
    }

    return renderOverview(state.stored);
  }

  function renderImageViewer() {
    if (!state.stored || state.selectedImageIndex == null) {
      return "";
    }

    const image = state.stored.analysis.images[state.selectedImageIndex];
    if (!image) {
      return "";
    }

    return [
      '<div class="image-viewer-backdrop" data-image-viewer-backdrop="true">',
      '<div class="image-viewer-card" role="dialog" aria-modal="true" aria-label="Image preview">',
      '<button type="button" class="image-viewer-close" data-action="close-image-viewer">Close</button>',
      '<div class="image-viewer-media">',
      image.src ? '<img class="image-viewer-image" src="' + SEOShared.escapeHtml(image.src) + '" alt="' + SEOShared.escapeHtml(image.alt || "Image preview") + '" />' : '<div class="image-viewer-empty">Preview unavailable</div>',
      "</div>",
      '<div class="image-viewer-meta">',
      '<strong>' + SEOShared.escapeHtml(image.alt || "(empty alt)") + "</strong>",
      '<p>' + SEOShared.escapeHtml(image.src || "(missing src)") + "</p>",
      '<span class="muted">' + SEOShared.escapeHtml((image.width || "?") + "×" + (image.height || "?") + (image.lazy ? " • lazy" : "")) + "</span>",
      "</div>",
      "</div>",
      "</div>"
    ].join("");
  }

  function render() {
    const stored = state.stored;
    const score = stored ? stored.score : null;

    app.innerHTML = [
      '<main class="app-shell full-shell">',
      '<section class="hero-card full-hero">',
      score ? renderScoreRing(score.overall, score.label, score.color) : '<div class="score-ring score-ring-neutral"><div class="score-ring-inner"><strong>--</strong><span>Idle</span></div></div>',
      '<div class="hero-copy">',
      '<div class="hero-headline"><span class="eyebrow">Full Page View</span>' + (score ? renderBadge(score.color, score.label) : "") + "</div>",
      '<h1 class="full-title">SPA: SEO Page Audit</h1>',
      '<p class="hero-note">' + SEOShared.escapeHtml(stored ? stored.url : state.error || "Analyze a supported page to see the full audit view.") + "</p>",
      '<div class="section-scores">' +
      renderMetricCard("Content Score", score ? score.sections.content + "/100" : "--") +
      renderMetricCard("Technical Score", score ? score.sections.technical + "/100" : "--") +
      renderMetricCard("Links Score", score ? score.sections.links + "/100" : "--") +
      "</div>",
      '<div class="button-row">',
      '<button type="button" class="refresh-button" data-action="reanalyze">Re-analyze</button>',
      stored ? '<span class="pill pill-neutral">Last analyzed ' + SEOShared.escapeHtml(SEOShared.formatTime(stored.analyzedAt)) + "</span>" : "",
      "</div>",
      "</div>",
      "</section>",
      '<nav class="tab-nav full-tab-nav" aria-label="Full page audit tabs">',
      TABS.map(function (tab) {
        return '<button type="button" class="tab-button ' + (state.activeTab === tab.id ? "tab-button-active" : "") + '" data-tab="' + SEOShared.escapeHtml(tab.id) + '">' + SEOShared.escapeHtml(tab.label) + "</button>";
      }).join(""),
      "</nav>",
      renderContent(),
      '<footer class="project-footer full-footer">',
      '<a class="project-link" href="' + SEOShared.escapeHtml(PROJECT_LINKS.repository) + '" target="_blank" rel="noreferrer">Repository</a>',
      '<a class="project-link" href="' + SEOShared.escapeHtml(PROJECT_LINKS.github) + '" target="_blank" rel="noreferrer">GitHub</a>',
      '<a class="project-link" href="' + SEOShared.escapeHtml(PROJECT_LINKS.website) + '" target="_blank" rel="noreferrer">Website</a>',
      '<a class="project-link" href="' + SEOShared.escapeHtml(PROJECT_LINKS.privacy) + '" target="_blank" rel="noreferrer">Privacy</a>',
      "</footer>",
      renderImageViewer(),
      "</main>"
    ].join("");
  }

  function loadAnalysis(forceRefresh) {
    if (state.tabId == null) {
      state.requestState = "error";
      state.error = "Missing tabId in full view URL.";
      render();
      return;
    }

    state.requestState = "loading";
    state.error = "";
    render();

    SEOShared.sendRuntimeMessage({
      type: forceRefresh ? MESSAGE_TYPES.RUN_ANALYSIS : MESSAGE_TYPES.GET_ANALYSIS_BY_TAB_ID,
      tabId: state.tabId
    })
      .then(function (response) {
        if (!response || !response.ok || !response.payload) {
          state.requestState = response && response.state ? response.state : "error";
          state.error = (response && response.error) || "Unable to analyze the selected tab.";
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
        state.error = error && error.message ? error.message : "Unexpected full view error.";
        state.stored = null;
        render();
      });
  }

  app.addEventListener("click", function (event) {
    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) {
      state.activeTab = tabButton.getAttribute("data-tab");
      render();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      if (actionButton.getAttribute("data-action") === "reanalyze") {
        loadAnalysis(true);
        return;
      }

      if (actionButton.getAttribute("data-action") === "close-image-viewer") {
        state.selectedImageIndex = null;
        render();
        return;
      }
    }

    const imageViewerBackdrop = event.target.closest("[data-image-viewer-backdrop]");
    if (imageViewerBackdrop && event.target === imageViewerBackdrop) {
      state.selectedImageIndex = null;
      render();
      return;
    }

    const linkFilterButton = event.target.closest("[data-link-filter]");
    if (linkFilterButton) {
      state.linkFilter = linkFilterButton.getAttribute("data-link-filter");
      render();
      return;
    }

    const imageFilterButton = event.target.closest("[data-image-filter]");
    if (imageFilterButton) {
      state.imageFilter = imageFilterButton.getAttribute("data-image-filter");
      render();
      return;
    }

    const imagePreviewButton = event.target.closest("[data-image-preview]");
    if (imagePreviewButton) {
      state.selectedImageIndex = Number(imagePreviewButton.getAttribute("data-image-preview"));
      render();
    }
  });

  render();
  loadAnalysis(false);
})();
