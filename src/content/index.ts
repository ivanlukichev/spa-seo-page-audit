import { extractHeadings } from "./extractors/headings";
import { extractImages } from "./extractors/images";
import { extractLinks } from "./extractors/links";
import { extractMeta } from "./extractors/meta";
import { extractSchema } from "./extractors/schema";
import { extractSocial } from "./extractors/social";
import { extractTextStats } from "./extractors/text";
import { MESSAGE_TYPES } from "../shared/constants";
import type { AnalysisResult, ContentMessage } from "../shared/types";

const globalApi = globalThis as typeof globalThis & {
  browser?: any;
  chrome?: any;
};

function getRuntime() {
  return typeof globalApi.browser !== "undefined" ? globalApi.browser.runtime : globalApi.chrome.runtime;
}

async function waitForDocumentReady() {
  if (document.readyState !== "loading") {
    return;
  }

  await new Promise<void>((resolve) => {
    document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  });
}

async function analyzePage(): Promise<AnalysisResult> {
  await waitForDocumentReady();

  const meta = extractMeta();
  const { headings, headingCounts } = extractHeadings();

  return {
    ...meta,
    headings,
    headingCounts,
    textStats: extractTextStats(),
    links: extractLinks(),
    images: extractImages(),
    schema: extractSchema(),
    social: extractSocial(),
    iframesCount: document.querySelectorAll("iframe").length,
    analyzedAt: new Date().toISOString()
  };
}

getRuntime().onMessage.addListener((message: ContentMessage, _sender: unknown, sendResponse: (response: unknown) => void) => {
  if (message.type !== MESSAGE_TYPES.ANALYZE_PAGE) {
    return false;
  }

  analyzePage()
    .then((analysis) => {
      sendResponse({ ok: true, analysis });
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Failed to analyze the page."
      });
    });

  return true;
});
