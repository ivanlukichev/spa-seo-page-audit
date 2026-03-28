const globalApi = globalThis as typeof globalThis & {
  browser?: any;
  chrome?: any;
};

function getExtensionApi() {
  return typeof globalApi.browser !== "undefined" ? globalApi.browser : globalApi.chrome;
}

function getRuntimeError(): string | null {
  return globalApi.chrome?.runtime?.lastError?.message ?? null;
}

export async function queryActiveTab(): Promise<any | null> {
  const api = getExtensionApi();

  const maybePromise = api.tabs.query({ active: true, currentWindow: true });
  if (maybePromise && typeof maybePromise.then === "function") {
    const tabs = await maybePromise;
    return tabs[0] ?? null;
  }

  return new Promise((resolve, reject) => {
    api.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
      const runtimeError = getRuntimeError();
      if (runtimeError) {
        reject(new Error(runtimeError));
        return;
      }

      resolve(tabs[0] ?? null);
    });
  });
}

export async function sendRuntimeMessage<T>(message: unknown): Promise<T> {
  const api = getExtensionApi();

  const maybePromise = api.runtime.sendMessage(message);
  if (maybePromise && typeof maybePromise.then === "function") {
    return maybePromise as Promise<T>;
  }

  return new Promise((resolve, reject) => {
    api.runtime.sendMessage(message, (response: T) => {
      const runtimeError = getRuntimeError();
      if (runtimeError) {
        reject(new Error(runtimeError));
        return;
      }

      resolve(response);
    });
  });
}

export async function sendTabMessage<T>(tabId: number, message: unknown): Promise<T> {
  const api = getExtensionApi();

  const maybePromise = api.tabs.sendMessage(tabId, message);
  if (maybePromise && typeof maybePromise.then === "function") {
    return maybePromise as Promise<T>;
  }

  return new Promise((resolve, reject) => {
    api.tabs.sendMessage(tabId, message, (response: T) => {
      const runtimeError = getRuntimeError();
      if (runtimeError) {
        reject(new Error(runtimeError));
        return;
      }

      resolve(response);
    });
  });
}
