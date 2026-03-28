import { sendTabMessage } from "../shared/browser";
import { MESSAGE_TYPES } from "../shared/constants";
import type { AnalysisResult, RuntimeMessage } from "../shared/types";

const cache = new Map<number, AnalysisResult>();
const globalApi = globalThis as typeof globalThis & {
  browser?: any;
  chrome?: any;
};

function getApi() {
  return typeof globalApi.browser !== "undefined" ? globalApi.browser : globalApi.chrome;
}

async function requestAnalysis(tabId: number, forceRefresh = false) {
  if (!forceRefresh && cache.has(tabId)) {
    return { ok: true, analysis: cache.get(tabId) };
  }

  try {
    const response = await sendTabMessage<{ ok: boolean; analysis?: AnalysisResult; error?: string }>(tabId, {
      type: MESSAGE_TYPES.ANALYZE_PAGE
    });

    if (!response?.ok || !response.analysis) {
      return {
        ok: false,
        error: response?.error ?? "Page analysis failed."
      };
    }

    cache.set(tabId, response.analysis);
    return {
      ok: true,
      analysis: response.analysis
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to reach the current tab. Try reloading the page or opening an http/https URL."
    };
  }
}

getApi().runtime.onMessage.addListener((message: RuntimeMessage, _sender: unknown, sendResponse: (response: unknown) => void) => {
  if (message.type === MESSAGE_TYPES.GET_CACHED_ANALYSIS) {
    sendResponse({ ok: true, analysis: cache.get(message.tabId) ?? null });
    return false;
  }

  if (message.type !== MESSAGE_TYPES.REQUEST_ANALYSIS) {
    return false;
  }

  requestAnalysis(message.tabId, message.forceRefresh)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected background error."
      });
    });

  return true;
});

getApi().tabs.onRemoved.addListener((tabId: number) => {
  cache.delete(tabId);
});

getApi().tabs.onUpdated.addListener((tabId: number, changeInfo: { status?: string }) => {
  if (changeInfo.status === "loading") {
    cache.delete(tabId);
  }
});
