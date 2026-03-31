(function () {
  if (globalThis.__SPA_SEO_PAGE_AUDIT_CONTENT_READY__) {
    return;
  }

  globalThis.__SPA_SEO_PAGE_AUDIT_CONTENT_READY__ = true;
  const runtime = typeof browser !== "undefined" ? browser.runtime : chrome.runtime;
  const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have", "how",
    "if", "in", "into", "is", "it", "its", "of", "on", "or", "that", "the", "their", "this", "to",
    "was", "were", "what", "when", "where", "which", "who", "why", "will", "with", "about", "after",
    "all", "also", "any", "can", "do", "does", "each", "few", "more", "most", "no", "not", "other",
    "our", "out", "over", "she", "some", "than", "them", "then", "there", "they", "too", "very",
    "you", "your", "я", "мы", "вы", "он", "она", "оно", "они", "это", "как", "что", "для", "при",
    "под", "над", "или", "если", "есть", "был", "была", "были", "так", "там", "тут", "уже", "еще",
    "ещё", "его", "ее", "её", "их", "наш", "ваш", "кто", "где", "когда", "почему", "зачем", "чтобы",
    "ли", "же", "не", "ни", "но", "да", "от", "до", "из", "по", "за", "во", "на", "к", "ко", "о",
    "об", "у", "с", "со", "без", "про", "через", "этот", "эта", "эти", "тот", "та", "те", "может",
    "можно", "нужно", "очень"
  ]);
  const WEAK_ANCHORS = [
    "click here",
    "read more",
    "learn more",
    "more",
    "here",
    "details",
    "подробнее",
    "читать далее",
    "узнать больше",
    "далее"
  ];

  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function resolveUrl(value, base) {
    if (!value) {
      return null;
    }

    try {
      return new URL(value, base).toString();
    } catch (_error) {
      return null;
    }
  }

  function normalizeHost(hostname) {
    return String(hostname || "").replace(/^www\./i, "").toLowerCase();
  }

  function getMetaContent(selector) {
    const node = document.querySelector(selector);
    return normalizeWhitespace(node && node.content) || null;
  }

  function extractMeta() {
    const canonicalHref = document.querySelector('link[rel~="canonical"]');
    const iconNode = document.querySelector('link[rel~="icon"]') || document.querySelector('link[rel="shortcut icon"]');

    return {
      url: window.location.href,
      title: normalizeWhitespace(document.title),
      metaDescription: getMetaContent('meta[name="description"]'),
      canonical: resolveUrl(canonicalHref && canonicalHref.getAttribute("href"), window.location.href),
      robots: getMetaContent('meta[name="robots"]'),
      viewport: getMetaContent('meta[name="viewport"]'),
      lang: normalizeWhitespace(document.documentElement.lang) || null,
      charset: normalizeWhitespace(document.characterSet) || null,
      favicon: resolveUrl(iconNode && iconNode.getAttribute("href"), window.location.href)
    };
  }

  function extractHeadings() {
    const headings = Array.prototype.slice.call(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map(function (heading, index) {
        const text = normalizeWhitespace(heading.textContent);
        if (!text) {
          return null;
        }

        return {
          level: Number(heading.tagName.slice(1)),
          text: text,
          id: heading.id || null,
          index: index
        };
      })
      .filter(Boolean);

    const counts = {
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0
    };

    headings.forEach(function (heading) {
      counts["h" + heading.level] += 1;
    });

    return {
      headings: headings,
      headingCounts: counts
    };
  }

  function tokenize(text) {
    const tokens = String(text || "").toLowerCase().match(/[a-zа-яё][a-zа-яё'-]*/giu) || [];
    return tokens
      .map(function (token) {
        return token.replace(/^[-']+|[-']+$/g, "");
      })
      .filter(function (token) {
        return token.length >= 2;
      });
  }

  function buildTopTerms(tokens, size) {
    if (tokens.length < size) {
      return [];
    }

    const counts = new Map();
    const total = tokens.length - size + 1;

    for (let index = 0; index < total; index += 1) {
      const term = tokens.slice(index, index + size).join(" ");
      counts.set(term, (counts.get(term) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(function (left, right) {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0]);
      })
      .slice(0, 10)
      .map(function (entry) {
        return {
          term: entry[0],
          count: entry[1],
          density: Number(((entry[1] / total) * 100).toFixed(2))
        };
      });
  }

  function extractTextStats() {
    const visibleText = document.body ? document.body.innerText : "";
    const tokens = tokenize(visibleText);
    const keywords = tokens.filter(function (token) {
      return token.length >= 3 && !STOP_WORDS.has(token);
    });
    const counts = new Map();

    keywords.forEach(function (token) {
      counts.set(token, (counts.get(token) || 0) + 1);
    });

    const topWords = Array.from(counts.entries())
      .sort(function (left, right) {
        if (right[1] !== left[1]) {
          return right[1] - left[1];
        }

        return left[0].localeCompare(right[0]);
      })
      .slice(0, 10)
      .map(function (entry) {
        return {
          term: entry[0],
          count: entry[1],
          density: Number(((entry[1] / Math.max(keywords.length, 1)) * 100).toFixed(2))
        };
      });

    return {
      wordCount: tokens.length,
      topWords: topWords,
      topBigrams: buildTopTerms(keywords, 2),
      topTrigrams: buildTopTerms(keywords, 3)
    };
  }

  function getVisibleAnchorText(anchor) {
    return normalizeWhitespace(anchor.innerText || anchor.textContent);
  }

  function getAnchorAriaLabel(anchor) {
    return normalizeWhitespace(anchor.getAttribute("aria-label"));
  }

  function getAnchorAriaLabelledByText(anchor) {
    const labelledBy = normalizeWhitespace(anchor.getAttribute("aria-labelledby"));
    if (!labelledBy) {
      return "";
    }

    const text = labelledBy
      .split(/\s+/)
      .map(function (id) {
        const element = document.getElementById(id);
        return normalizeWhitespace(element ? (element.innerText || element.textContent) : "");
      })
      .filter(Boolean)
      .join(" ");

    return normalizeWhitespace(text);
  }

  function getFirstMeaningfulImageAlt(anchor) {
    const image = Array.prototype.slice.call(anchor.querySelectorAll("img")).find(function (item) {
      return Boolean(normalizeWhitespace(item.getAttribute("alt")));
    });

    return image ? normalizeWhitespace(image.getAttribute("alt")) : "";
  }

  function getAccessibleAnchorName(anchor) {
    const visibleAnchorText = getVisibleAnchorText(anchor);
    if (visibleAnchorText) {
      return {
        visibleAnchorText: visibleAnchorText,
        accessibleAnchorName: visibleAnchorText,
        anchorSource: "visible-text"
      };
    }

    const ariaLabel = getAnchorAriaLabel(anchor);
    if (ariaLabel) {
      return {
        visibleAnchorText: "",
        accessibleAnchorName: ariaLabel,
        anchorSource: "aria-label"
      };
    }

    const ariaLabelledBy = getAnchorAriaLabelledByText(anchor);
    if (ariaLabelledBy) {
      return {
        visibleAnchorText: "",
        accessibleAnchorName: ariaLabelledBy,
        anchorSource: "aria-labelledby"
      };
    }

    const imageAlt = getFirstMeaningfulImageAlt(anchor);
    if (imageAlt) {
      return {
        visibleAnchorText: "",
        accessibleAnchorName: imageAlt,
        anchorSource: "img-alt"
      };
    }

    const title = normalizeWhitespace(anchor.getAttribute("title"));
    if (title) {
      return {
        visibleAnchorText: "",
        accessibleAnchorName: title,
        anchorSource: "title"
      };
    }

    return {
      visibleAnchorText: "",
      accessibleAnchorName: "",
      anchorSource: "empty"
    };
  }

  function classifyLinkType(absoluteUrl) {
    if (!absoluteUrl) {
      return "other";
    }

    try {
      const parsed = new URL(absoluteUrl);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return "other";
      }

      return normalizeHost(parsed.hostname) === normalizeHost(window.location.hostname) ? "internal" : "external";
    } catch (_error) {
      return "other";
    }
  }

  function extractLinks() {
    return Array.prototype.slice.call(document.querySelectorAll("a[href]")).map(function (anchor) {
      const href = anchor.getAttribute("href") || "";
      const absoluteUrl = resolveUrl(href, window.location.href);
      const rel = normalizeWhitespace(anchor.getAttribute("rel"))
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const anchorNameData = getAccessibleAnchorName(anchor);
      const accessibleAnchorName = anchorNameData.accessibleAnchorName;
      const visibleAnchorText = anchorNameData.visibleAnchorText;
      const anchorSource = anchorNameData.anchorSource;
      const emptyAnchor = anchorSource === "empty";
      const type = classifyLinkType(absoluteUrl);
      const hasImage = Boolean(anchor.querySelector("img"));
      const isImageOnlyLink = !visibleAnchorText && hasImage && anchorSource !== "empty";
      let status = "good";
      let note = "Anchor text looks usable.";

      if (emptyAnchor) {
        status = "error";
        note = "No visible text, no alt, no aria-label, no aria-labelledby, no title.";
      } else if (anchorSource === "title") {
        status = "warning";
        note = "Source: title.";
      } else if (anchorSource === "img-alt") {
        note = "Source: image alt.";
      } else if (anchorSource === "aria-label") {
        note = "Source: aria-label.";
      } else if (anchorSource === "aria-labelledby") {
        note = "Source: aria-labelledby.";
      } else if (WEAK_ANCHORS.indexOf(accessibleAnchorName.toLowerCase()) !== -1) {
        status = "warning";
        note = "Anchor text is weak and could be more descriptive.";
      } else if (type === "other") {
        status = "neutral";
        note = "Link uses a non-HTTP scheme or browser-only target.";
      }

      return {
        href: href,
        absoluteUrl: absoluteUrl,
        hostname: absoluteUrl ? new URL(absoluteUrl).hostname : null,
        type: type,
        rel: rel,
        nofollow: rel.indexOf("nofollow") !== -1,
        sponsored: rel.indexOf("sponsored") !== -1,
        ugc: rel.indexOf("ugc") !== -1,
        visibleAnchorText: visibleAnchorText,
        accessibleAnchorName: accessibleAnchorName,
        anchorSource: anchorSource,
        anchorText: accessibleAnchorName,
        emptyAnchor: emptyAnchor,
        isEmptyAnchor: emptyAnchor,
        hasImage: hasImage,
        isImageOnlyLink: isImageOnlyLink,
        status: status,
        note: note,
        message: note
      };
    });
  }

  function extractImages() {
    return Array.prototype.slice.call(document.querySelectorAll("img")).map(function (image) {
      const alt = normalizeWhitespace(image.getAttribute("alt")) || null;
      const hasAlt = image.hasAttribute("alt");
      let status = "good";
      let note = "Alt text is present.";

      if (!hasAlt) {
        status = "error";
        note = "Image is missing an alt attribute.";
      } else if (!alt) {
        status = "neutral";
        note = "Empty alt suggests a decorative image.";
      }

      return {
        src: resolveUrl(image.currentSrc || image.getAttribute("src"), window.location.href) || "",
        alt: alt,
        hasAlt: hasAlt,
        missingAlt: !hasAlt,
        width: image.naturalWidth || image.width || null,
        height: image.naturalHeight || image.height || null,
        lazy: String(image.getAttribute("loading") || "").toLowerCase() === "lazy",
        status: status,
        note: note
      };
    });
  }

  function collectSchemaTypes(value, collector) {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(function (item) {
        collectSchemaTypes(item, collector);
      });
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    const typeValue = value["@type"];
    if (typeof typeValue === "string") {
      collector.add(typeValue);
    } else if (Array.isArray(typeValue)) {
      typeValue.forEach(function (item) {
        if (typeof item === "string") {
          collector.add(item);
        }
      });
    }

    Object.keys(value).forEach(function (key) {
      collectSchemaTypes(value[key], collector);
    });
  }

  function extractSchema() {
    return Array.prototype.slice.call(document.querySelectorAll('script[type="application/ld+json"]')).map(function (script) {
      const raw = normalizeWhitespace(script.textContent);
      try {
        const parsed = JSON.parse(raw);
        const types = new Set();
        collectSchemaTypes(parsed, types);
        return {
          raw: raw,
          parsed: true,
          types: Array.from(types),
          error: null
        };
      } catch (error) {
        return {
          raw: raw,
          parsed: false,
          types: [],
          error: error && error.message ? error.message : "Failed to parse JSON-LD."
        };
      }
    });
  }

  function extractSocial() {
    function get(selector) {
      const node = document.querySelector(selector);
      return normalizeWhitespace(node && node.content) || null;
    }

    return {
      ogTitle: get('meta[property="og:title"]'),
      ogDescription: get('meta[property="og:description"]'),
      ogImage: resolveUrl(get('meta[property="og:image"]'), window.location.href),
      ogType: get('meta[property="og:type"]'),
      twitterCard: get('meta[name="twitter:card"]'),
      twitterTitle: get('meta[name="twitter:title"]'),
      twitterDescription: get('meta[name="twitter:description"]'),
      twitterImage: resolveUrl(get('meta[name="twitter:image"]'), window.location.href)
    };
  }

  function analyzePage() {
    const meta = extractMeta();
    const headingData = extractHeadings();

    return {
      url: meta.url,
      title: meta.title,
      metaDescription: meta.metaDescription,
      canonical: meta.canonical,
      robots: meta.robots,
      viewport: meta.viewport,
      lang: meta.lang,
      charset: meta.charset,
      favicon: meta.favicon,
      headings: headingData.headings,
      headingCounts: headingData.headingCounts,
      textStats: extractTextStats(),
      links: extractLinks(),
      images: extractImages(),
      schema: extractSchema(),
      social: extractSocial(),
      iframesCount: document.querySelectorAll("iframe").length,
      analyzedAt: new Date().toISOString()
    };
  }

  runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (!message || message.type !== "SEO_ANALYZE_PAGE") {
      return false;
    }

    try {
      sendResponse({ ok: true, analysis: analyzePage() });
    } catch (error) {
      sendResponse({
        ok: false,
        error: error && error.message ? error.message : "Failed to analyze the page."
      });
    }

    return true;
  });
})();
