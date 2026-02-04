import { Curate } from "../../core/CurateFunctions/CurateFunctions.js";

const REPLAY_UI_SRC = "/js/ui.js";
const REPLAY_SW_URL = "/workers/sw.js";
const REPLAY_SW_SCOPE = "/workers/";

let replayUiLoadPromise = null;

function loadReplayUi() {
  if (window.replayWebPageLoaded) {
    return Promise.resolve();
  }

  if (!replayUiLoadPromise) {
    replayUiLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = REPLAY_UI_SRC;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    })
      .then(() => customElements.whenDefined("replay-web-page"))
      .then(() => {
        window.replayWebPageLoaded = true;
      })
      .catch((error) => {
        replayUiLoadPromise = null;
        throw error;
      });
  }

  return replayUiLoadPromise;
}

function waitForActivation(registration, timeoutMs = 8000) {
  if (!registration) {
    return Promise.resolve(false);
  }

  if (registration.active?.state === "activated") {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      registration.installing?.removeEventListener("statechange", onInstalling);
      registration.waiting?.removeEventListener("statechange", onWaiting);
      registration.active?.removeEventListener("statechange", onActive);
    };

    const onStateChange = (sw) => {
      if (sw?.state === "activated" && !resolved) {
        resolved = true;
        cleanup();
        resolve(true);
      }
    };

    const onInstalling = () => onStateChange(registration.installing);
    const onWaiting = () => onStateChange(registration.waiting);
    const onActive = () => onStateChange(registration.active);

    registration.installing?.addEventListener("statechange", onInstalling);
    registration.waiting?.addEventListener("statechange", onWaiting);
    registration.active?.addEventListener("statechange", onActive);

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(false);
      }
    }, timeoutMs);
  });
}

async function ensureReplayServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration(
      REPLAY_SW_SCOPE
    );
    if (existing) {
      await waitForActivation(existing);
      return existing;
    }

    const registration = await navigator.serviceWorker.register(REPLAY_SW_URL, {
      scope: REPLAY_SW_SCOPE,
    });
    await waitForActivation(registration);
    return registration;
  } catch (error) {
    console.error("❌ ReplayWeb SW registration failed:", error);
    return null;
  }
}

export function registerWarcViewerRoute() {
  Curate.router.addRoute(
    "/web-archive-viewer",
    async (container, { params } = {}) => {
      const { fileUrl = "", startingUrl = "" } = params || {};

      container.style.cssText = `
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        height: 100%;
        width: 100%;
        padding: 0;
        overflow: hidden;
        background: var(--md-sys-color-surface);
        box-sizing: border-box;
      `;

      if (!fileUrl) {
        container.textContent = "No archive source provided.";
        return () => {
          container.textContent = "";
        };
      }

      await loadReplayUi();
      await ensureReplayServiceWorker();

      const viewerWrapper = document.createElement("div");
      viewerWrapper.style.cssText = `
        flex: 1;
        min-height: 0;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
      `;

      const replayElement = document.createElement("replay-web-page");
      replayElement.replaybase = REPLAY_SW_SCOPE;
      replayElement.setAttribute("replaybase", REPLAY_SW_SCOPE);
      replayElement.newWindowBase = window.location.origin + "/";
      replayElement.setAttribute("newwindowbase", window.location.origin + "/");
      replayElement.source = fileUrl;
      replayElement.setAttribute("source", fileUrl);
      if (startingUrl) {
        replayElement.url = startingUrl;
        replayElement.setAttribute("url", startingUrl);
      }
      replayElement.style.width = "100%";
      replayElement.style.height = "100%";
      replayElement.style.display = "block";

      viewerWrapper.appendChild(replayElement);
      container.appendChild(viewerWrapper);

      return () => {
        replayElement.remove();
        viewerWrapper.remove();
      };
    },
    {
      title: "Web Archive Viewer",
      showHeader: true,
      allowUrlAccess: false,
    }
  );
}

export function openWarcViewerPage(params = {}, overrides = {}) {
  Curate.router.open("/web-archive-viewer", params, overrides);
}
