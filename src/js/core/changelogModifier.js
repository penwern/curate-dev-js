/* global __webpack_public_path__ */
/**
 * Changelog Modifier
 *
 * Shows a "What's new in Curate" modal once, on the first authenticated page
 * load after new release notes are published. It is deliberately quiet:
 *
 *   - It only fires once the user is past the login screen (so it reads as an
 *     on-login notice, not an interruption while already working).
 *   - A per-session guard (sessionStorage) stops it re-appearing on reloads or
 *     in-app navigation within the same session.
 *   - A per-user record of seen entry ids (localStorage) stops anything
 *     reappearing once acknowledged.
 *
 * Content is NOT baked into the bundle. It is fetched at runtime from
 * `changelog.json`, published next to the bundle (see webpack CopyWebpackPlugin
 * and core release docs). To update release notes, edit that one file and push
 * it; no code change or bundle rebuild is required. Because the feed is fetched
 * relative to the bundle's own location, a pinned/older bundle reads the
 * changelog from its own version directory and never shows notes for features it
 * does not have.
 *
 * Entries are keyed by a stable `id`, not by version, so a note appears whether
 * it was added at a release cut-over or on the fly.
 *
 * Manual testing from the browser console:
 *   Curate.changelog.reset()  // clear seen-ids + session guard, then reload
 *   Curate.changelog.show()   // force the modal regardless of seen-state
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const STORAGE_PREFIX = "curate_changelog_seen"; // + "_<userId>", stores seen ids
const SESSION_GUARD = "curate_changelog_shown_this_session";
const FEED_FILE = "changelog.json";

// On a user's very first run (no seen record yet), only entries dated within
// this many days are shown; everything older is silently marked seen. This
// avoids dumping the full history on existing users the day this ships.
const FIRST_RUN_MAX_AGE_DAYS = 30;

// The bundle's own URL, captured at module-eval time (currentScript is null
// later, inside async callbacks). Used as a fallback for resolving the feed.
const BUNDLE_SRC = document.currentScript?.src || "";

// ── Feed location & fetching ──────────────────────────────────────────────────
// Resolve changelog.json against the bundle's published directory. webpack's
// publicPath is "auto", so __webpack_public_path__ resolves at runtime to the
// absolute directory main.js was served from (e.g. .../curate-dev-js/latest/).
function feedUrl() {
  let base = "";
  try {
    if (typeof __webpack_public_path__ === "string" && __webpack_public_path__) {
      base = __webpack_public_path__;
    }
  } catch {
    base = "";
  }
  if (!base) base = BUNDLE_SRC || window.location.href;
  try {
    return new URL(FEED_FILE, base).href;
  } catch {
    return null;
  }
}

// Fetch and validate the feed. Returns an array of well-formed entries, or []
// on any network/parse/shape error (the modal simply never shows in that case).
async function fetchEntries() {
  const url = feedUrl();
  if (!url) return [];
  try {
    const resp = await fetch(url, { cache: "no-cache", credentials: "omit" });
    if (!resp.ok) return [];
    const data = await resp.json();
    const entries = Array.isArray(data) ? data : data?.entries;
    if (!Array.isArray(entries)) return [];
    return entries.filter(
      (e) => e && typeof e.id === "string" && e.changes && typeof e.changes === "object",
    );
  } catch {
    return [];
  }
}

// ── Seen-state helpers ────────────────────────────────────────────────────────
function storageKey() {
  const userId = window.pydio?.user?.id || "anonymous";
  return `${STORAGE_PREFIX}_${userId}`;
}

// Returns the set of seen ids, or null if the user has no record yet (first run).
function getSeen(key) {
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeen(key, set) {
  window.localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

function daysSince(dateStr) {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return Infinity; // undated/garbage → treat as old
  return (Date.now() - t) / 86400000;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function renderEntry(entry) {
  const groups = Object.entries(entry.changes || {})
    .map(([kind, items]) => {
      if (!Array.isArray(items) || !items.length) return "";
      const lis = items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
      return `
        <div class="cc-group">
          <span class="cc-kind cc-kind--${escapeHtml(String(kind).toLowerCase())}">${escapeHtml(kind)}</span>
          <ul>${lis}</ul>
        </div>`;
    })
    .join("");

  const heading = entry.title ? escapeHtml(entry.title) : formatDate(entry.date);
  const date = entry.title ? formatDate(entry.date) : "";

  return `
    <section class="cc-entry">
      <header class="cc-entry__head">
        <span class="cc-title">${heading}</span>
        ${date ? `<span class="cc-date">${date}</span>` : ""}
      </header>
      ${groups}
    </section>`;
}

// Brand styling is scoped to .cc-* classes and injected once. Colours follow the
// Penwern palette (aqua #9fd0c7, deep teal #1a3d36, near-black foreground).
function ensureStyles() {
  if (document.getElementById("curate-changelog-styles")) return;
  const style = document.createElement("style");
  style.id = "curate-changelog-styles";
  style.textContent = `
    .cc-popup { border-radius: 0.75rem !important; }
    .cc-popup .swal2-html-container { margin: 0 !important; text-align: left; }
    .cc-body { max-height: 60vh; overflow-y: auto; padding: 4px 4px 4px 2px; }
    .cc-entry { padding: 16px 0; border-top: 1px solid hsl(220 13% 91%); }
    .cc-entry:first-child { border-top: none; padding-top: 4px; }
    .cc-entry__head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
    .cc-title { font-weight: 600; color: #1a3d36; font-size: 1.05em; }
    .cc-date { color: hsl(220 9% 46%); font-size: 0.85em; }
    .cc-group { margin: 8px 0; }
    .cc-kind {
      display: inline-block; font-size: 0.72em; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.04em;
      padding: 2px 8px; border-radius: 999px; margin-bottom: 4px;
      color: #1a3d36; background: rgba(159, 208, 199, 0.35);
    }
    .cc-kind--fixed { background: rgba(131, 171, 163, 0.30); }
    .cc-kind--improved { background: rgba(166, 232, 206, 0.40); }
    .cc-body ul { margin: 4px 0 0; padding-left: 20px; }
    .cc-body li { margin: 3px 0; color: hsl(224 71% 4%); line-height: 1.45; }
  `;
  document.head.appendChild(style);
}

function fireModal(entries) {
  if (!entries.length) return;
  if (!window.Swal) {
    // SweetAlert2 is bundled globally; if it is not ready yet, try shortly.
    setTimeout(() => fireModal(entries), 200);
    return;
  }
  ensureStyles();
  const html = `<div class="cc-body">${entries.map(renderEntry).join("")}</div>`;
  window.Swal.fire({
    title: "What’s new in Curate",
    html,
    background: "#fff",
    width: 560,
    padding: "20px",
    showCloseButton: true,
    confirmButtonText: "Got it",
    confirmButtonColor: "#9fd0c7",
    allowEscapeKey: true,
    customClass: { popup: "cc-popup" },
  });
}

// ── Public, console-friendly API ──────────────────────────────────────────────
async function show() {
  const entries = await fetchEntries();
  fireModal(entries);
}

function reset() {
  window.localStorage.removeItem(storageKey());
  window.sessionStorage.removeItem(SESSION_GUARD);
  console.info("[Curate] changelog state cleared; reload to see the notice.");
}

// ── Boot ──────────────────────────────────────────────────────────────────────
let pollCount = 0;
async function evaluate() {
  const entries = await fetchEntries();
  if (!entries.length) return; // feed unavailable/empty: do nothing, retry next session

  const key = storageKey();
  const seen = getSeen(key); // null === first ever run for this user
  let toShow;
  if (seen === null) {
    // First run: show only recent entries, baseline everything else as seen.
    toShow = entries.filter((e) => daysSince(e.date) <= FIRST_RUN_MAX_AGE_DAYS);
  } else {
    toShow = entries.filter((e) => !seen.has(e.id));
  }

  // Record every current id as seen, regardless of whether it was shown, so old
  // or already-acknowledged entries never reappear.
  const nextSeen = seen || new Set();
  entries.forEach((e) => nextSeen.add(e.id));
  saveSeen(key, nextSeen);

  fireModal(toShow);
}

function maybeShowChangelog() {
  // Wait until the user has navigated away from the login screen, so the notice
  // reads as a post-login welcome rather than an interruption mid-session.
  if (window.location.pathname.includes("/login")) {
    const navObserver = new MutationObserver(() => {
      if (!window.location.pathname.includes("/login")) {
        navObserver.disconnect();
        maybeShowChangelog();
      }
    });
    navObserver.observe(document.documentElement, { childList: true, subtree: true });
    return;
  }

  // Wait for the authenticated user object before keying any per-user state.
  // Cap the polling so we never spin forever on a genuinely logged-out page.
  if (!window.pydio?.user?.id) {
    if (++pollCount > 600) return; // ~60s
    setTimeout(maybeShowChangelog, 100);
    return;
  }

  // Once per browser session only: silences reloads and in-app navigation, and
  // guarantees a single feed fetch per session.
  if (window.sessionStorage.getItem(SESSION_GUARD)) return;
  window.sessionStorage.setItem(SESSION_GUARD, "1");

  evaluate();
  window.removeEventListener("load", maybeShowChangelog);
}

// Expose a small API on the Curate namespace for QA / support.
if (window.Curate && typeof window.Curate === "object") {
  window.Curate.changelog = { show, reset };
}

// Run on load, but if the page has already finished loading by the time this
// bundle evaluates (Cells injects the header script after the load event), the
// 'load' event will never fire again — so kick off immediately in that case.
if (document.readyState === "complete") {
  maybeShowChangelog();
} else {
  window.addEventListener("load", maybeShowChangelog);
}
