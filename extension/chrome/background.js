importScripts("shared.js");

(function () {
  const api = SEOShared.getApi();
  const MESSAGE_TYPES = SEOShared.MESSAGE_TYPES;
  const STORE_PREFIX = "analysis:";
  const memoryStore = new Map();

  function sendResponseSafe(sendResponse, payload) {
    try {
      sendResponse(payload);
    } catch (_error) {
      return;
    }
  }

  function storageSessionAvailable() {
    return Boolean(api.storage && api.storage.session);
  }

  function storageKey(tabId) {
    return STORE_PREFIX + String(tabId);
  }

  function getFromSession(tabId) {
    if (!storageSessionAvailable()) {
      return Promise.resolve(null);
    }

    return new Promise(function (resolve) {
      api.storage.session.get(storageKey(tabId), function (result) {
        resolve((result && result[storageKey(tabId)]) || null);
      });
    });
  }

  function setInSession(tabId, value) {
    if (!storageSessionAvailable()) {
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      const payload = {};
      payload[storageKey(tabId)] = value;
      api.storage.session.set(payload, function () {
        resolve();
      });
    });
  }

  function removeFromSession(tabId) {
    if (!storageSessionAvailable()) {
      return Promise.resolve();
    }

    return new Promise(function (resolve) {
      api.storage.session.remove(storageKey(tabId), function () {
        resolve();
      });
    });
  }

  function getTab(tabId) {
    return new Promise(function (resolve, reject) {
      api.tabs.get(tabId, function (tab) {
        const runtimeError = SEOShared.getRuntimeError();
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve(tab || null);
      });
    });
  }

  function getStoredAnalysis(tabId) {
    if (memoryStore.has(tabId)) {
      return Promise.resolve(memoryStore.get(tabId));
    }

    return getFromSession(tabId).then(function (stored) {
      if (stored) {
        memoryStore.set(tabId, stored);
      }

      return stored;
    });
  }

  function setStoredAnalysis(tabId, stored) {
    memoryStore.set(tabId, stored);
    return setInSession(tabId, stored);
  }

  function clearStoredAnalysis(tabId) {
    memoryStore.delete(tabId);
    return removeFromSession(tabId);
  }

  function emitAnalysisUpdated(tabId, stored) {
    try {
      api.runtime.sendMessage({
        type: MESSAGE_TYPES.ANALYSIS_UPDATED,
        tabId: tabId,
        payload: stored
      });
    } catch (_error) {
      return;
    }
  }

  function analyzeTab(tabId) {
    return getTab(tabId).then(function (tab) {
      const currentUrl = tab && tab.url ? tab.url : "";

      if (SEOShared.isRestrictedPage(currentUrl)) {
        return {
          ok: false,
          state: "unsupported",
          tabId: tabId,
          error: SEOShared.getRestrictedPageMessage()
        };
      }

      return new Promise(function (resolve) {
        api.tabs.sendMessage(tabId, { type: "SEO_ANALYZE_PAGE" }, function (response) {
          const runtimeError = SEOShared.getRuntimeError();
          if (runtimeError) {
            resolve({
              ok: false,
              state: "error",
              tabId: tabId,
              error: runtimeError.message || "Unable to reach the current tab."
            });
            return;
          }

          if (!response || !response.ok || !response.analysis) {
            resolve({
              ok: false,
              state: "error",
              tabId: tabId,
              error: (response && response.error) || "Page analysis failed."
            });
            return;
          }

          const stored = SEOShared.buildStoredAnalysis(tabId, currentUrl, response.analysis);
          setStoredAnalysis(tabId, stored).then(function () {
            emitAnalysisUpdated(tabId, stored);
            resolve({
              ok: true,
              state: "success",
              tabId: tabId,
              payload: stored,
              fromCache: false
            });
          });
        });
      });
    }).catch(function (error) {
      return {
        ok: false,
        state: "error",
        tabId: tabId,
        error: error && error.message ? error.message : "Unable to load the selected tab."
      };
    });
  }

  function getAnalysisForTab(tabId, forceRefresh) {
    return Promise.all([getTab(tabId), getStoredAnalysis(tabId)]).then(function (values) {
      const tab = values[0];
      const stored = values[1];
      const currentUrl = tab && tab.url ? tab.url : "";

      if (SEOShared.isRestrictedPage(currentUrl)) {
        return {
          ok: false,
          state: "unsupported",
          tabId: tabId,
          error: SEOShared.getRestrictedPageMessage()
        };
      }

      const isFresh = Boolean(stored && stored.url === currentUrl);

      if (!forceRefresh && isFresh) {
        return {
          ok: true,
          state: "success",
          tabId: tabId,
          payload: stored,
          fromCache: true
        };
      }

      return analyzeTab(tabId);
    }).catch(function (error) {
      return {
        ok: false,
        state: "error",
        tabId: tabId,
        error: error && error.message ? error.message : "Unexpected background error."
      };
    });
  }

  function openFullView(tabId) {
    const url = api.runtime.getURL("full.html?tabId=" + encodeURIComponent(String(tabId)));

    return new Promise(function (resolve, reject) {
      api.tabs.create({ url: url }, function (tab) {
        const runtimeError = SEOShared.getRuntimeError();
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }

        resolve({
          ok: true,
          tabId: tabId,
          createdTabId: tab && typeof tab.id === "number" ? tab.id : null
        });
      });
    });
  }

  api.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (!message || !message.type) {
      return false;
    }

    if (message.type === MESSAGE_TYPES.GET_ANALYSIS_BY_TAB_ID) {
      getAnalysisForTab(message.tabId, false).then(function (result) {
        sendResponseSafe(sendResponse, result);
      });
      return true;
    }

    if (message.type === MESSAGE_TYPES.RUN_ANALYSIS) {
      getAnalysisForTab(message.tabId, true).then(function (result) {
        sendResponseSafe(sendResponse, result);
      });
      return true;
    }

    if (message.type === MESSAGE_TYPES.OPEN_FULL_VIEW) {
      openFullView(message.tabId)
        .then(function (result) {
          sendResponseSafe(sendResponse, result);
        })
        .catch(function (error) {
          sendResponseSafe(sendResponse, {
            ok: false,
            error: error && error.message ? error.message : "Unable to open the full view."
          });
        });
      return true;
    }

    return false;
  });

  api.tabs.onRemoved.addListener(function (tabId) {
    clearStoredAnalysis(tabId);
  });

  api.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if ((changeInfo && changeInfo.status === "loading") || (tab && tab.url && SEOShared.isRestrictedPage(tab.url))) {
      clearStoredAnalysis(tabId);
      return;
    }

    if (changeInfo && changeInfo.url) {
      clearStoredAnalysis(tabId);
    }
  });
})();
