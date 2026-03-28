(function (global) {
  const MESSAGE_TYPES = {
    GET_ANALYSIS_BY_TAB_ID: "GET_ANALYSIS_BY_TAB_ID",
    RUN_ANALYSIS: "RUN_ANALYSIS",
    OPEN_FULL_VIEW: "OPEN_FULL_VIEW",
    ANALYSIS_UPDATED: "ANALYSIS_UPDATED"
  };

  const FULL_VIEW_TABS = [
    { id: "overview", label: "Overview" },
    { id: "headings", label: "Headings" },
    { id: "links", label: "Links" },
    { id: "images", label: "Images" },
    { id: "schema", label: "Schema" },
    { id: "social", label: "Social" },
    { id: "keywords", label: "Keywords" },
    { id: "technical", label: "Technical" }
  ];
  const PROJECT_LINKS = {
    repository: "https://github.com/ivanlukichev/spa-seo-page-audit",
    github: "https://github.com/ivanlukichev",
    website: "https://lukichev.biz/",
    privacy: "https://github.com/ivanlukichev/spa-seo-page-audit/blob/main/PRIVACY.md"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatNullable(value, fallback) {
    const normalized = String(value == null ? "" : value).trim();
    return normalized || fallback;
  }

  function formatTime(value) {
    const date = typeof value === "number" ? new Date(value) : new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleTimeString();
  }

  function getApi() {
    return typeof browser !== "undefined" ? browser : chrome;
  }

  function getRuntimeError() {
    return typeof chrome !== "undefined" && chrome.runtime ? chrome.runtime.lastError : null;
  }

  function queryActiveTab() {
    const api = getApi();

    return new Promise(function (resolve, reject) {
      api.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const runtimeError = getRuntimeError();
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve((tabs && tabs[0]) || null);
      });
    });
  }

  function sendRuntimeMessage(message) {
    const api = getApi();

    return new Promise(function (resolve, reject) {
      api.runtime.sendMessage(message, function (response) {
        const runtimeError = getRuntimeError();
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve(response);
      });
    });
  }

  function createTab(url) {
    const api = getApi();

    return new Promise(function (resolve, reject) {
      api.tabs.create({ url: url }, function (tab) {
        const runtimeError = getRuntimeError();
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve(tab);
      });
    });
  }

  function scoreToLabel(score) {
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

  function percentage(raw, max) {
    return Math.max(0, Math.min(100, Math.round((raw / max) * 100)));
  }

  function normalizeComparableUrl(url) {
    try {
      const parsed = new URL(url);
      parsed.hash = "";
      const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
      return (parsed.origin + normalizedPath + (parsed.search || "")).toLowerCase();
    } catch (_error) {
      return String(url || "").toLowerCase().trim();
    }
  }

  function looksLikeUrlText(title, currentUrl) {
    const normalizedTitle = String(title || "").toLowerCase().trim();
    if (!normalizedTitle) {
      return false;
    }

    try {
      const parsed = new URL(currentUrl);
      const pathname = parsed.pathname.replace(/[-_/]+/g, " ").trim();
      const hostname = parsed.hostname.replace(/^www\./, "").replace(/\./g, " ");
      return normalizedTitle === currentUrl.toLowerCase() || normalizedTitle === pathname || normalizedTitle === hostname;
    } catch (_error) {
      return false;
    }
  }

  function buildCheck(score, maxScore, status, message, value) {
    return {
      score: score,
      maxScore: maxScore,
      status: status,
      message: message,
      value: value
    };
  }

  function issue(id, title, detail, severity) {
    return { id: id, title: title, detail: detail, severity: severity };
  }

  function quickWin(id, title, detail) {
    return { id: id, title: title, detail: detail };
  }

  function severityWeight(severity) {
    if (severity === "high") {
      return 3;
    }

    if (severity === "medium") {
      return 2;
    }

    return 1;
  }

  function isRestrictedPage(url) {
    const value = String(url || "");

    if (!value) {
      return true;
    }

    if (/^(chrome|about|edge|moz-extension|chrome-extension|devtools):/i.test(value)) {
      return true;
    }

    if (/^https:\/\/chrome\.google\.com\/webstore/i.test(value)) {
      return true;
    }

    if (/^https:\/\/addons\.mozilla\.org\//i.test(value)) {
      return true;
    }

    return !/^https?:/i.test(value);
  }

  function getRestrictedPageMessage() {
    return "This page cannot be analyzed due to browser security restrictions.";
  }

  function buildStoredAnalysis(tabId, url, analysis) {
    return {
      tabId: tabId,
      url: url,
      analyzedAt: Date.now(),
      analysis: analysis,
      score: scoreAnalysis(analysis)
    };
  }

  function scoreAnalysis(analysis) {
    const checks = {};
    const issues = [];
    const quickWins = [];
    const titleLength = analysis.title.length;
    const descriptionLength = analysis.metaDescription ? analysis.metaDescription.length : 0;
    const descriptionDirection = descriptionLength > 160 ? "long" : "short";
    const h1Count = analysis.headingCounts.h1;
    const wordCount = analysis.textStats.wordCount;
    const totalImages = analysis.images.length;
    const imagesWithAlt = analysis.images.filter(function (image) { return image.hasAlt; }).length;
    const missingAltCount = analysis.images.filter(function (image) { return image.missingAlt; }).length;
    const altCoverage = totalImages ? (imagesWithAlt / totalImages) * 100 : 100;
    const parsedSchemaBlocks = analysis.schema.filter(function (item) { return item.parsed; });
    const schemaTypes = Array.from(new Set(parsedSchemaBlocks.flatMap(function (item) { return item.types; })));
    const ogCount = [analysis.social.ogTitle, analysis.social.ogDescription, analysis.social.ogImage].filter(Boolean).length;
    const twitterCount = [
      analysis.social.twitterCard,
      analysis.social.twitterTitle,
      analysis.social.twitterDescription,
      analysis.social.twitterImage
    ].filter(Boolean).length;
    const allLinks = analysis.links.filter(function (link) { return link.type !== "other"; });
    const internalLinks = analysis.links.filter(function (link) { return link.type === "internal"; });
    const externalLinks = analysis.links.filter(function (link) { return link.type === "external"; });
    const emptyAnchors = analysis.links.filter(function (link) { return link.emptyAnchor; });
    const weakAnchors = analysis.links.filter(function (link) { return link.status === "warning"; });

    if (!analysis.title) {
      checks.title = buildCheck(0, 10, "error", "Title is missing.", "Missing");
      issues.push(issue("title-missing", "Missing title tag", "Add a unique page title so search engines and users can understand the page topic.", "high"));
      quickWins.push(quickWin("title-add", "Add a descriptive title", "Aim for a title around 30-65 characters that reflects the page intent."));
    } else if (looksLikeUrlText(analysis.title, analysis.url)) {
      checks.title = buildCheck(4, 10, "warning", "Title looks too similar to the URL. Make it more descriptive.", analysis.title);
      issues.push(issue("title-url", "Title looks URL-like", "The current title may not communicate enough context in search results.", "medium"));
      quickWins.push(quickWin("title-rewrite", "Rewrite the title", "Use a human-readable title that summarizes the page rather than mirroring the URL."));
    } else if (titleLength >= 30 && titleLength <= 65) {
      checks.title = buildCheck(10, 10, "good", "Title length looks healthy for search results.", analysis.title);
    } else if ((titleLength >= 20 && titleLength < 30) || (titleLength > 65 && titleLength <= 75)) {
      checks.title = buildCheck(7, 10, "warning", "Title is slightly outside the ideal range. Consider refining it.", analysis.title);
      quickWins.push(quickWin("title-tune", "Tune title length", "Keep the title concise but descriptive, ideally around 30-65 characters."));
    } else {
      checks.title = buildCheck(3, 10, "error", "Title length is far from the recommended range.", analysis.title);
      issues.push(issue("title-length", "Title length needs work", "The title is likely too short or too long to perform well as a search snippet.", "high"));
      quickWins.push(quickWin("title-fix", "Adjust title length", "Shorten or expand the title into the recommended range."));
    }

    if (!analysis.metaDescription) {
      checks.description = buildCheck(0, 10, "error", "Meta description is missing.", "Missing");
      issues.push(issue("description-missing", "Missing meta description", "The page has no meta description for a strong search snippet.", "high"));
      quickWins.push(quickWin("description-add", "Add a meta description", "Write a clear description around 120-160 characters."));
    } else if (descriptionLength >= 120 && descriptionLength <= 160) {
      checks.description = buildCheck(10, 10, "good", "Meta description is present and reasonably sized.", analysis.metaDescription);
    } else if ((descriptionLength >= 80 && descriptionLength < 120) || (descriptionLength > 160 && descriptionLength <= 180)) {
      checks.description = buildCheck(
        7,
        10,
        "warning",
        "Meta description is slightly " + descriptionDirection + " for a strong snippet.",
        analysis.metaDescription
      );
      quickWins.push(quickWin("description-tune", "Refine the meta description", "Adjust the description toward roughly 120-160 characters."));
    } else {
      checks.description = buildCheck(
        3,
        10,
        "error",
        "Meta description is too " + descriptionDirection + ".",
        analysis.metaDescription
      );
      issues.push(issue("description-length", "Meta description length needs work", "The current description is too " + descriptionDirection + " to display well.", "medium"));
      quickWins.push(quickWin("description-fix", "Rewrite the meta description", "Make the description more informative and closer to the ideal range."));
    }

    if (h1Count === 1) {
      checks.h1 = buildCheck(10, 10, "good", "Exactly one H1 was found.", "1 H1");
    } else if (h1Count === 0) {
      checks.h1 = buildCheck(0, 10, "error", "No H1 was found.", "0 H1");
      issues.push(issue("h1-missing", "No H1 heading found", "A clear page-level H1 helps communicate the primary topic.", "high"));
      quickWins.push(quickWin("h1-add", "Add one clear H1", "Use a single descriptive H1 near the top of the page."));
    } else {
      checks.h1 = buildCheck(6, 10, "warning", "Multiple H1 tags were found.", h1Count + " H1");
      issues.push(issue("h1-multiple", "Multiple H1 headings detected", "A single primary H1 is usually easier for users and crawlers to interpret.", "medium"));
      quickWins.push(quickWin("h1-consolidate", "Consolidate H1 headings", "Keep one primary H1 and use H2/H3 for supporting sections."));
    }

    const hasLowerHeadings = analysis.headingCounts.h2 + analysis.headingCounts.h3 + analysis.headingCounts.h4 + analysis.headingCounts.h5 + analysis.headingCounts.h6 > 0;
    if (!analysis.headings.length) {
      checks.headingStructure = buildCheck(0, 5, "error", "No headings were found on the page.", "No headings");
    } else if (!hasLowerHeadings) {
      checks.headingStructure = buildCheck(2, 5, "warning", "Only one heading level was detected. Add supporting headings for structure.", "Limited hierarchy");
      quickWins.push(quickWin("heading-structure", "Add supporting headings", "Use H2 and H3 headings to make the page structure easier to scan."));
    } else if (analysis.headingCounts.h3 > 0 && analysis.headingCounts.h2 === 0) {
      checks.headingStructure = buildCheck(3, 5, "warning", "H3 headings appear without H2 support, which may weaken structure.", "H3 before H2");
    } else {
      checks.headingStructure = buildCheck(5, 5, "good", "Heading hierarchy looks usable.", analysis.headings.length + " headings");
    }

    if (wordCount >= 300) {
      checks.contentDepth = buildCheck(10, 10, "good", "Visible text depth looks healthy.", wordCount + " words");
    } else if (wordCount >= 100) {
      checks.contentDepth = buildCheck(6, 10, "warning", "Content is a bit light. Consider adding more helpful context.", wordCount + " words");
      quickWins.push(quickWin("content-expand", "Add more body copy", "Expand the visible text where useful to reduce thin-content risk."));
    } else if (wordCount > 0) {
      checks.contentDepth = buildCheck(2, 10, "error", "Very little visible text was found on the page.", wordCount + " words");
      issues.push(issue("content-thin", "Thin content risk", "The page has very little visible copy, which may limit topical clarity.", "high"));
      quickWins.push(quickWin("content-depth", "Add more useful page copy", "If this is a content page, add more descriptive text and subheadings."));
    } else {
      checks.contentDepth = buildCheck(0, 10, "error", "No visible text could be analyzed.", "0 words");
      issues.push(issue("content-empty", "No visible text detected", "The page may be empty, heavily script-driven, or blocked from readable extraction.", "high"));
    }

    if (!analysis.canonical) {
      checks.canonical = buildCheck(2, 5, "warning", "No canonical tag found.", "Missing");
      issues.push(issue("canonical-missing", "No canonical tag found", "Consider adding a canonical URL to clarify the preferred page version.", "medium"));
      quickWins.push(quickWin("canonical-add", "Add a canonical tag", "Point the canonical URL at the preferred version of the current page."));
    } else if (normalizeComparableUrl(analysis.canonical) === normalizeComparableUrl(analysis.url)) {
      checks.canonical = buildCheck(5, 5, "good", "Canonical points to the current page version.", analysis.canonical);
    } else {
      checks.canonical = buildCheck(3, 5, "warning", "Canonical points to a different URL. Double-check that this is intentional.", analysis.canonical);
    }

    const robotsValue = String(analysis.robots || "").toLowerCase();
    if (!analysis.robots) {
      checks.robots = buildCheck(4, 5, "neutral", "No robots meta tag found. That is often fine.", "Not found");
    } else if (robotsValue.indexOf("noindex") !== -1) {
      checks.robots = buildCheck(1, 5, "error", "Robots meta includes noindex.", analysis.robots);
      issues.push(issue("robots-noindex", "Page is marked noindex", "The page is explicitly asking search engines not to index it.", "high"));
    } else if (robotsValue.indexOf("nofollow") !== -1) {
      checks.robots = buildCheck(3, 5, "warning", "Robots meta includes nofollow.", analysis.robots);
    } else {
      checks.robots = buildCheck(5, 5, "good", "Robots meta does not show blocking directives.", analysis.robots);
    }

    if (analysis.lang) {
      checks.lang = buildCheck(3, 3, "good", "HTML lang attribute is present.", analysis.lang);
    } else {
      checks.lang = buildCheck(0, 3, "error", "HTML lang attribute is missing.", "Missing");
      quickWins.push(quickWin("lang-add", "Define the page language", "Add an html lang attribute to improve language targeting and accessibility."));
    }

    if (analysis.viewport) {
      checks.viewport = buildCheck(3, 3, "good", "Viewport meta tag is present.", analysis.viewport);
    } else {
      checks.viewport = buildCheck(0, 3, "error", "Viewport meta tag is missing.", "Missing");
      quickWins.push(quickWin("viewport-add", "Add viewport meta", "Set a responsive viewport tag for better mobile rendering."));
    }

    if (!totalImages) {
      checks.imagesAlt = buildCheck(7, 7, "neutral", "No images were found, so alt coverage is not applicable.", "No images");
    } else if (altCoverage === 100) {
      checks.imagesAlt = buildCheck(7, 7, "good", "All images include an alt attribute.", imagesWithAlt + "/" + totalImages + " with alt");
    } else if (altCoverage >= 70) {
      checks.imagesAlt = buildCheck(4, 7, "warning", "Some images are missing alt attributes.", missingAltCount + " missing alt");
      quickWins.push(quickWin("images-alt", "Improve image alt coverage", "Add alt attributes to the remaining images that need descriptive text."));
    } else {
      checks.imagesAlt = buildCheck(1, 7, "error", "A large share of images are missing alt attributes.", missingAltCount + " missing alt");
      issues.push(issue("images-alt", missingAltCount + " images missing alt text", "Missing alt attributes weaken image accessibility and on-page quality signals.", "high"));
      quickWins.push(quickWin("images-alt-fix", "Add missing alt attributes", "Review informative images first and add concise, descriptive alt text."));
    }

    if (!analysis.schema.length) {
      checks.schema = buildCheck(2, 6, "warning", "No structured data detected.", "Not found");
      issues.push(issue("schema-missing", "No structured data detected", "Structured data is missing from the current page.", "medium"));
      quickWins.push(quickWin("schema-add", "Add JSON-LD schema", "Consider adding structured data that matches the page type."));
    } else if (schemaTypes.length) {
      checks.schema = buildCheck(6, 6, "good", "Structured data was found and schema types were detected.", schemaTypes.join(", "));
    } else if (parsedSchemaBlocks.length) {
      checks.schema = buildCheck(3, 6, "warning", "Structured data exists, but schema types were not recognized.", analysis.schema.length + " JSON-LD block(s)");
    } else {
      checks.schema = buildCheck(2, 6, "warning", "JSON-LD blocks were found but could not be parsed cleanly.", analysis.schema.length + " JSON-LD block(s)");
      issues.push(issue("schema-parse", "Structured data could not be parsed", "At least one JSON-LD block appears invalid.", "medium"));
    }

    if (ogCount >= 3 && twitterCount >= 1) {
      checks.social = buildCheck(6, 6, "good", "Open Graph and Twitter card coverage looks solid.", ogCount + " OG / " + twitterCount + " Twitter");
    } else if (ogCount + twitterCount === 0) {
      checks.social = buildCheck(2, 6, "error", "No Open Graph or Twitter card tags were found.", "Missing");
      issues.push(issue("social-missing", "Social meta tags are missing", "The page is missing social preview tags for richer sharing snippets.", "medium"));
      quickWins.push(quickWin("social-add", "Add social preview tags", "Populate Open Graph tags and at least a Twitter card value."));
    } else {
      checks.social = buildCheck(4, 6, "warning", "Social metadata is partially populated.", ogCount + " OG / " + twitterCount + " Twitter");
      quickWins.push(quickWin("social-expand", "Complete social tags", "Add the missing OG or Twitter fields for more complete sharing previews."));
    }

    if (!internalLinks.length) {
      checks.internalLinks = buildCheck(1, 8, "error", "No internal links were found.", "0 internal");
      issues.push(issue("links-internal", "No internal links found", "Internal links help connect page context within the site.", "medium"));
      quickWins.push(quickWin("links-internal-add", "Add internal links", "Link to relevant related pages using descriptive anchor text."));
    } else if (internalLinks.length < 5) {
      checks.internalLinks = buildCheck(5, 8, "warning", "Only a small number of internal links were found.", internalLinks.length + " internal");
    } else {
      checks.internalLinks = buildCheck(8, 8, "good", "Internal linking looks healthy for a single page snapshot.", internalLinks.length + " internal");
    }

    if (!externalLinks.length) {
      checks.externalLinks = buildCheck(5, 6, "neutral", "No external links were found. That can be fine for many pages.", "0 external");
    } else if (externalLinks.length > Math.max(10, internalLinks.length * 2)) {
      checks.externalLinks = buildCheck(2, 6, "warning", "External links dominate the current page. Review if that is intentional.", externalLinks.length + " external");
    } else {
      checks.externalLinks = buildCheck(6, 6, "good", "External link balance looks reasonable.", externalLinks.length + " external");
    }

    if (!allLinks.length) {
      checks.anchorQuality = buildCheck(1, 6, "error", "No crawlable HTTP links were found.", "No crawlable links");
    } else {
      const emptyRate = emptyAnchors.length / allLinks.length;
      const weakRate = weakAnchors.length / allLinks.length;

      if (emptyAnchors.length === 0 && weakRate <= 0.15) {
        checks.anchorQuality = buildCheck(6, 6, "good", "Anchor text quality looks healthy overall.", allLinks.length + " links reviewed");
      } else if (emptyRate <= 0.1) {
        checks.anchorQuality = buildCheck(4, 6, "warning", "Some anchors are empty or too generic.", emptyAnchors.length + " empty anchors");
        quickWins.push(quickWin("anchor-fix", "Improve anchor text", "Replace empty or vague anchors with clearer descriptive text where possible."));
      } else {
        checks.anchorQuality = buildCheck(1, 6, "error", "Too many anchors are empty or low-signal.", emptyAnchors.length + " empty anchors");
        issues.push(issue("anchor-empty", "Many links have weak anchor text", "A meaningful share of links have empty or low-quality anchors.", "high"));
        quickWins.push(quickWin("anchor-quality", "Fix empty link anchors", "Ensure links include readable anchor text or accessible labels."));
      }
    }

    const contentRaw = checks.title.score + checks.description.score + checks.h1.score + checks.headingStructure.score + checks.contentDepth.score;
    const technicalRaw = checks.canonical.score + checks.robots.score + checks.lang.score + checks.viewport.score + checks.imagesAlt.score + checks.schema.score + checks.social.score;
    const linksRaw = checks.internalLinks.score + checks.externalLinks.score + checks.anchorQuality.score;
    const overall = contentRaw + technicalRaw + linksRaw;
    const labelMeta = scoreToLabel(overall);

    const overviewItems = [
      { id: "title", label: "Title", value: checks.title.value, status: checks.title.status, message: checks.title.message },
      { id: "description", label: "Meta Description", value: checks.description.value, status: checks.description.status, message: checks.description.message },
      { id: "url", label: "URL", value: analysis.url, status: "neutral", message: "Current page URL analyzed locally." },
      { id: "canonical", label: "Canonical", value: checks.canonical.value, status: checks.canonical.status, message: checks.canonical.message },
      { id: "robots", label: "Robots", value: checks.robots.value, status: checks.robots.status, message: checks.robots.message },
      { id: "h1", label: "H1", value: checks.h1.value, status: checks.h1.status, message: checks.h1.message },
      { id: "wordCount", label: "Word Count", value: checks.contentDepth.value, status: checks.contentDepth.status, message: checks.contentDepth.message },
      { id: "imagesAlt", label: "Images / ALT", value: checks.imagesAlt.value, status: checks.imagesAlt.status, message: checks.imagesAlt.message },
      { id: "internalLinks", label: "Internal Links", value: checks.internalLinks.value, status: checks.internalLinks.status, message: checks.internalLinks.message },
      { id: "externalLinks", label: "External Links", value: checks.externalLinks.value, status: checks.externalLinks.status, message: checks.externalLinks.message },
      { id: "schema", label: "Schema", value: checks.schema.value, status: checks.schema.status, message: checks.schema.message },
      {
        id: "openGraph",
        label: "Open Graph",
        value: ogCount ? ogCount + " field(s)" : "Not found",
        status: ogCount >= 3 ? "good" : ogCount > 0 ? "warning" : "error",
        message: ogCount >= 3 ? "Open Graph tags cover the core preview fields." : ogCount > 0 ? "Only part of the Open Graph set is present." : "Open Graph tags are missing."
      },
      {
        id: "twitter",
        label: "Twitter Cards",
        value: twitterCount ? twitterCount + " field(s)" : "Not found",
        status: twitterCount >= 2 ? "good" : twitterCount > 0 ? "warning" : "error",
        message: twitterCount >= 2 ? "Twitter card fields are present." : twitterCount > 0 ? "Twitter metadata is partial." : "Twitter card metadata is missing."
      },
      { id: "lang", label: "Lang", value: checks.lang.value, status: checks.lang.status, message: checks.lang.message },
      { id: "viewport", label: "Viewport", value: checks.viewport.value, status: checks.viewport.status, message: checks.viewport.message }
    ].map(function (item) {
      item.value = formatNullable(item.value, "Not found");
      return item;
    });

    const dedupQuickWins = Array.from(new Map(quickWins.map(function (item) { return [item.id, item]; })).values()).slice(0, 5);
    const sortedIssues = issues
      .sort(function (left, right) {
        const severityDiff = severityWeight(right.severity) - severityWeight(left.severity);
        return severityDiff || left.title.localeCompare(right.title);
      })
      .slice(0, 7);

    return {
      overall: overall,
      label: labelMeta.label,
      color: labelMeta.color,
      sections: {
        content: percentage(contentRaw, 45),
        technical: percentage(technicalRaw, 35),
        links: percentage(linksRaw, 20)
      },
      rawSections: {
        content: contentRaw,
        technical: technicalRaw,
        links: linksRaw
      },
      checks: checks,
      issues: sortedIssues,
      quickWins: dedupQuickWins,
      overviewItems: overviewItems
    };
  }

  global.SEOShared = {
    MESSAGE_TYPES: MESSAGE_TYPES,
    FULL_VIEW_TABS: FULL_VIEW_TABS,
    PROJECT_LINKS: PROJECT_LINKS,
    escapeHtml: escapeHtml,
    formatNullable: formatNullable,
    formatTime: formatTime,
    getApi: getApi,
    getRuntimeError: getRuntimeError,
    queryActiveTab: queryActiveTab,
    sendRuntimeMessage: sendRuntimeMessage,
    createTab: createTab,
    scoreAnalysis: scoreAnalysis,
    isRestrictedPage: isRestrictedPage,
    getRestrictedPageMessage: getRestrictedPageMessage,
    buildStoredAnalysis: buildStoredAnalysis
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
