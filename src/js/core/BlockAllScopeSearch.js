// A search with no path scope makes the Cells search child hold GBs of memory, so on hosts that
// set window.curateBlockAllScopeSearch the browser never sends it. fetch is left alone on purpose.
const NOTICE = "Searching all workspaces is turned off on this site. Open a workspace and search within it.";
const NOTICE_INTERVAL_MS = 30000;

const empty = (v) => !Array.isArray(v) || v.length === 0;

// body is the raw request body; anything that is not a JSON search request is allowed through.
export function isAllScopeSearch(body) {
  let query;
  try {
    query = JSON.parse(body).Query;
  } catch {
    return false;
  }
  if (!query || typeof query !== "object") return false;
  return empty(query.PathPrefix) && empty(query.UUIDs) && empty(query.Paths);
}

function install() {
  const meta = new WeakMap();
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  let lastNotice = 0;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    meta.set(this, { method: String(method).toUpperCase(), url: String(url) });
    return origOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const m = meta.get(this);
    const path = m && m.url.split("?")[0];
    if (m && m.method === "POST" && path.endsWith("/a/search/nodes") && isAllScopeSearch(body)) {
      const now = Date.now();
      if (now - lastNotice > NOTICE_INTERVAL_MS) {
        lastNotice = now;
        if (typeof pydio !== "undefined") pydio.displayMessage("ERROR", NOTICE);
      }
      // superagent reads status, responseText/response, content-type and onreadystatechange
      const fake = {
        readyState: 4,
        status: 200,
        statusText: "OK",
        responseText: "{}",
        response: "{}",
        getAllResponseHeaders: () => "content-type: application/json\r\n",
        getResponseHeader: (h) => (String(h).toLowerCase() === "content-type" ? "application/json" : null),
      };
      for (const [k, value] of Object.entries(fake)) {
        Object.defineProperty(this, k, { value, configurable: true });
      }
      setTimeout(() => {
        for (const type of ["readystatechange", "load", "loadend"]) this.dispatchEvent(new Event(type));
      }, 0);
      return;
    }
    return origSend.call(this, body);
  };
}

if (typeof window !== "undefined" && window.curateBlockAllScopeSearch === true) install();
