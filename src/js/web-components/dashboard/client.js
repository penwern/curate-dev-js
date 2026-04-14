// Override for testing: set window.CURATE_API_BASE and/or window.CURATE_API_TOKEN
// before the dashboard loads, e.g.:
//   window.CURATE_API_BASE = "https://your-instance.curate.example/a";
//   window.CURATE_API_TOKEN = "your-jwt-token-here";

const DEFAULT_BASE_PATH = "/a";

function getBasePath() {
  return window.CURATE_API_BASE ?? DEFAULT_BASE_PATH;
}

const CACHE_PREFIX = "curate_dash_";

class ApiCache {
  constructor() {
    this._inflight = new Map();
  }

  _key(endpoint, body) {
    return `${CACHE_PREFIX}${endpoint}::${JSON.stringify(body ?? {})}`;
  }

  get(endpoint, body, ttl) {
    const k = this._key(endpoint, body);
    try {
      const raw = sessionStorage.getItem(k);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (Date.now() - entry.ts > ttl) {
        sessionStorage.removeItem(k);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  set(endpoint, body, data) {
    const k = this._key(endpoint, body);
    try {
      sessionStorage.setItem(k, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // sessionStorage full — silently ignore
    }
  }

  getInflight(endpoint, body) {
    return this._inflight.get(this._key(endpoint, body)) ?? null;
  }

  setInflight(endpoint, body, promise) {
    const k = this._key(endpoint, body);
    this._inflight.set(k, promise);
    promise.finally(() => this._inflight.delete(k));
  }

  invalidate(pattern) {
    if (!pattern) {
      const keys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => sessionStorage.removeItem(k));
      return;
    }
    const fullPattern = `${CACHE_PREFIX}${pattern}`;
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(fullPattern)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  }
}

const cache = new ApiCache();

const TTL_LONG = 15 * 60 * 1000;
const TTL_SHORT = 5 * 60 * 1000;
const TTL_SESSION = 30 * 60 * 1000;

async function getToken() {
  if (window.CURATE_API_TOKEN) return window.CURATE_API_TOKEN;
  try {
    return await PydioApi._PydioRestClient.getOrUpdateJwt();
  } catch {
    console.warn("Could not get JWT — running without auth");
    return null;
  }
}

async function apiCall(method, endpoint, body = null, ttl = TTL_LONG) {
  const cached = cache.get(endpoint, body, ttl);
  if (cached) return cached;

  const inflight = cache.getInflight(endpoint, body);
  if (inflight) return inflight;

  const promise = (async () => {
    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${getBasePath()}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText} — ${endpoint}`);
    }

    const data = await res.json();
    cache.set(endpoint, body, data);
    return data;
  })();

  cache.setInflight(endpoint, body, promise);
  return promise;
}

export async function getWorkspaces() {
  const res = await apiCall("POST", "/workspace", {}, TTL_SESSION);
  return res.Workspaces ?? [];
}

export async function statWorkspace(slug) {
  return apiCall("POST", "/tree/admin/stat", {
    Node: { Path: slug },
    WithExtendedStats: true,
  });
}

export async function listRootStats() {
  return apiCall("POST", "/tree/admin/list", {
    Node: { Path: "/" },
    StatFlags: [5],
  });
}

export async function statWorkspaces(slugs) {
  const results = await Promise.all(slugs.map((s) => statWorkspace(s)));
  return results;
}

export async function searchNodes(query, from = 0, size = 0) {
  return apiCall("POST", "/search/nodes", {
    Query: query,
    From: from,
    Size: size,
    Details: true,
  });
}

export async function countByExtension(extension, pathPrefix = [], minDate, maxDate, minSize, maxSize) {
  const query = {
    Extension: extension,
    Type: "LEAF",
  };
  if (pathPrefix.length) query.PathPrefix = pathPrefix;
  if (minDate) query.MinDate = String(minDate);
  if (maxDate) query.MaxDate = String(maxDate);
  if (minSize) query.MinSize = String(minSize);
  if (maxSize) query.MaxSize = String(maxSize);

  return searchNodes(query, 0, 0);
}

export async function countByExtensions(extensions, pathPrefix = [], minDate, maxDate, minSize, maxSize) {
  const results = {};
  // Batch in groups of 4 to avoid hammering the API
  for (let i = 0; i < extensions.length; i += 4) {
    const batch = extensions.slice(i, i + 4);
    const batchResults = await Promise.all(
      batch.map(async (ext) => {
        const res = await countByExtension(ext, pathPrefix, minDate, maxDate, minSize, maxSize);
        return [ext, res.Total ?? 0];
      }),
    );
    for (const [ext, count] of batchResults) {
      results[ext] = count;
    }
  }
  return results;
}

export async function searchAllFiles(pathPrefix = [], minDate, maxDate, minSize, maxSize) {
  const query = { Type: "LEAF" };
  if (pathPrefix.length) query.PathPrefix = pathPrefix;
  if (minDate) query.MinDate = String(minDate);
  if (maxDate) query.MaxDate = String(maxDate);
  if (minSize) query.MinSize = String(minSize);
  if (maxSize) query.MaxSize = String(maxSize);

  return searchNodes(query, 0, 0);
}

export async function getBulkMeta(nodePaths, limit = 200, offset = 0) {
  return apiCall("POST", "/meta/bulk/get", {
    NodePaths: nodePaths,
    AllMetaProviders: true,
    Limit: limit,
    Offset: offset,
  }, TTL_SHORT);
}

export async function getRecycleBin(workspaceSlug, limit = 200, offset = 0) {
  return getBulkMeta(
    [`${workspaceSlug}/recycle_bin`, `${workspaceSlug}/recycle_bin/*`],
    limit,
    offset,
  );
}

export async function searchUserMeta(namespace, limit = 200, offset = 0) {
  return apiCall("POST", "/user-meta/search", {
    Namespace: namespace,
    Limit: limit,
    Offset: offset,
  }, TTL_LONG);
}

export async function getActivityStream(boxName, contextType, contextData, limit = 100, offset = 0) {
  return apiCall("POST", "/activity/stream", {
    BoxName: boxName,
    Context: contextType,
    ContextData: contextData,
    Limit: String(limit),
    Offset: String(offset),
    Language: "en-us",
  }, TTL_SHORT);
}

export async function getAuditChartData(msgId, timeRangeType, refTime) {
  return apiCall("POST", "/log/audit/chartdata", {
    MsgId: String(msgId),
    RefTime: refTime ?? Math.floor(Date.now() / 1000),
    TimeRangeType: timeRangeType,
  }, TTL_SHORT);
}

export async function getAuditLogs(query, page = 0, size = 25) {
  return apiCall("POST", "/log/audit", {
    Page: page,
    Size: size,
    Query: query,
  }, TTL_SHORT);
}

async function apiMutate(method, endpoint, body = null) {
  const token = await getToken();
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${getBasePath()}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText} — ${endpoint}`);
  return res.json();
}

export async function deleteNodes(paths, permanently = false) {
  return apiMutate("POST", "/tree/delete", {
    Nodes: paths.map((p) => ({ Path: p })),
    RemovePermanently: permanently,
  });
}

export async function restoreNodes(paths) {
  return apiMutate("POST", "/tree/restore", {
    Nodes: paths.map((p) => ({ Path: p })),
  });
}

// ─── Format / MIME Reporting API ─────────────────────────────────────────────
// Calls the format reporting service. baseUrl is the shared reporting base,
// e.g. "https://example.com/api".

async function formatApiCall(baseUrl, path) {
  const token = await getToken();
  const headers = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { headers });
  if (!res.ok) throw new Error(`Format API ${res.status}: ${res.statusText} — ${path}`);
  return res.json();
}

export async function getFormatSnapshot(baseUrl) {
  return formatApiCall(baseUrl, "/snapshots/latest");
}

export async function getMimeBreakdown(baseUrl, datasource = null) {
  const path = datasource
    ? `/mime-breakdown/latest/${encodeURIComponent(datasource)}`
    : "/mime-breakdown/latest";
  return formatApiCall(baseUrl, path);
}

export async function getMimeTimeseries(baseUrl, { metric = "file_count", datasource, mimeOrExt, from, to } = {}) {
  const params = new URLSearchParams({ metric });
  if (datasource) params.set("datasource", datasource);
  if (mimeOrExt) params.set("mime_or_ext", mimeOrExt);
  if (from) params.set("from_snapshot_at", from);
  if (to) params.set("to_snapshot_at", to);
  return formatApiCall(baseUrl, `/timeseries/chart?${params}`);
}

export async function getMimeTimeseriesByDatasource(baseUrl, { metric = "file_count", mimeOrExt, from, to } = {}) {
  const params = new URLSearchParams({ metric });
  if (mimeOrExt) params.set("mime_or_ext", mimeOrExt);
  if (from) params.set("from_snapshot_at", from);
  if (to) params.set("to_snapshot_at", to);
  return formatApiCall(baseUrl, `/timeseries/chart/by-datasource?${params}`);
}

export async function getMimeTimeseriesByFormat(baseUrl, { metric = "file_count", datasource, from, to } = {}) {
  const params = new URLSearchParams({ metric });
  if (datasource) params.set("datasource", datasource);
  if (from) params.set("from_snapshot_at", from);
  if (to) params.set("to_snapshot_at", to);
  return formatApiCall(baseUrl, `/timeseries/chart/by-format?${params}`);
}

/**
 * Maps a mime_or_ext string (e.g. "image/png" or "ext:pdf") to a broad
 * file-type category matching the FILE_TYPE_GROUPS keys.
 */
export function categorizeMime(mimeOrExt) {
  if (!mimeOrExt) return "Other";
  if (mimeOrExt.startsWith("ext:")) {
    const ext = mimeOrExt.slice(4).toLowerCase();
    for (const [group, { extensions }] of Object.entries(FILE_TYPE_GROUPS)) {
      if (extensions.includes(ext)) return group;
    }
    return "Other";
  }
  const m = mimeOrExt.split(";")[0].trim().toLowerCase();
  if (m === "application/pdf") return "PDF";
  if (m.startsWith("image/")) return "Images";
  if (m.startsWith("audio/")) return "Audio";
  if (m.startsWith("video/")) return "Video";
  if (m === "text/csv" || m === "text/tab-separated-values") return "Spreadsheets";
  if (m.startsWith("text/")) return "Documents";
  if (m.includes("wordprocessing") || m === "application/msword" || m === "application/rtf") return "Documents";
  if (m.includes(".sheet") || m.includes("spreadsheet") || m.includes("excel") || m === "application/vnd.ms-excel") return "Spreadsheets";
  if (m.includes("presentation") || m === "application/vnd.ms-powerpoint") return "Presentations";
  if (["application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
       "application/x-tar", "application/gzip", "application/x-bzip2", "application/x-xz"].includes(m)) return "Archives";
  return "Other";
}

// ─── Storage Reporting API ────────────────────────────────────────────────────
// These call the storage reporting service. baseUrl is the shared reporting
// base, e.g. "https://example.com/api".

async function storageApiCall(baseUrl, path) {
  const token = await getToken();
  const headers = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { headers });
  if (!res.ok) throw new Error(`Storage API ${res.status}: ${res.statusText} — ${path}`);
  return res.json();
}

export async function getStorageDatasources(baseUrl) {
  return storageApiCall(baseUrl, "/datasources");
}

export async function getStorageHistory(baseUrl, { bucket = "day", from, to, datasource } = {}) {
  const params = new URLSearchParams({ bucket });
  if (from != null) params.set("from", String(from));
  if (to != null) params.set("to", String(to));
  if (datasource) params.set("datasource", datasource);
  return storageApiCall(baseUrl, `/storage/history?${params}`);
}

// ─────────────────────────────────────────────────────────────────────────────

export function configure({ basePath, token } = {}) {
  if (basePath !== undefined) window.CURATE_API_BASE = basePath;
  if (token !== undefined) window.CURATE_API_TOKEN = token;
  cache.invalidate();
}

export function invalidateCache(pattern) {
  cache.invalidate(pattern);
}

export function currentUserCanViewDashboard() {
  const user = window.pydio?.user;
  if (!user) return false;
  return (
    user.isAdmin ||
    user.idmUser?.Roles?.some((r) => r.Label === "SuperUser")
  );
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatNumber(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString();
}

export function formatDate(ts) {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function extensionFromPath(path) {
  if (!path) return "";
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.slice(dot + 1).toLowerCase() : "";
}

export const FILE_TYPE_GROUPS = {
  Documents: { extensions: ["doc", "docx", "odt", "rtf", "txt"], color: "var(--md-sys-color-custom-doc-color)", containerColor: "var(--md-sys-color-custom-doc-colorContainer)" },
  Spreadsheets: { extensions: ["xls", "xlsx", "ods", "csv"], color: "var(--md-sys-color-custom-xls-color)", containerColor: "var(--md-sys-color-custom-xls-colorContainer)" },
  Presentations: { extensions: ["ppt", "pptx", "odp"], color: "var(--md-sys-color-custom-ppt-color)", containerColor: "var(--md-sys-color-custom-ppt-colorContainer)" },
  Images: { extensions: ["jpg", "jpeg", "png", "gif", "tiff", "tif", "bmp", "svg", "webp", "raw", "cr2", "nef", "dng"], color: "var(--md-sys-color-primary)", containerColor: "var(--md-sys-color-primary-container)" },
  Audio: { extensions: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"], color: "var(--md-sys-color-custom-music-color)", containerColor: "var(--md-sys-color-custom-music-colorContainer)" },
  Video: { extensions: ["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v"], color: "var(--md-sys-color-custom-video-color)", containerColor: "var(--md-sys-color-custom-video-colorContainer)" },
  Archives: { extensions: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"], color: "var(--md-sys-color-custom-archive-color)", containerColor: "var(--md-sys-color-custom-archive-colorContainer)" },
  PDF: { extensions: ["pdf"], color: "var(--md-sys-color-custom-pdf-color)", containerColor: "var(--md-sys-color-custom-pdf-colorContainer)" },
};
