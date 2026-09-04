import { LitElement, html, css } from "lit";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/button/text-button.js";
import "@material/web/progress/circular-progress.js";

import {
  chevronUpIcon,
  chevronDownIcon,
  downloadIcon,
  zoomInIcon,
  zoomOutIcon,
} from "../utils/icons.js";
import { openPdfDocument, PDFJS_VERSION } from "./pdfjs-setup.js";

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const MAX_CANVAS_SCALE = 2; // cap on devicePixelRatio oversampling

// How many pages either side of the visible range to keep rendered, and how far
// out to keep them before releasing. RETAIN must exceed RENDER, or a page can be
// released and immediately re-rendered as the scroll position jitters.
const RENDER_RADIUS = 2;
const RETAIN_RADIUS = 5;

// How long the scroll must settle before rendering starts.
const RENDER_SETTLE_MS = 120;

/**
 * Full-page PDF viewer backed by a correctly configured pdf.js.
 *
 * Cells' built-in viewer cannot decode JPEG 2000 (see pdfjs-setup.js), which
 * renders ABBYY mixed-raster-content scans as blank pages. This one can.
 *
 * Rendering is windowed: pages near the viewport are rendered, pages that fall
 * outside the retain window are released again. Both halves matter. These scans
 * hold one full-page JPEG 2000 image per page, and pdf.js caches the decoded
 * image on the page object, so a viewer that only ever renders will accumulate
 * roughly 8MB per page visited. Scrolling a 166-page file end to end that way
 * cost 1.2GB of renderer memory and killed the tab.
 */
export class CuratePdfViewer extends LitElement {
  static properties = {
    fileUrl: { type: String },
    fileName: { type: String },
    _status: { state: true },
    _errorMessage: { state: true },
    _pageCount: { state: true },
    _currentPage: { state: true },
    _zoom: { state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 0;
      background: var(--md-sys-color-surface-container-low, #f4f4f4);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      flex-shrink: 0;
      background: var(--md-sys-color-surface, #fff);
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #d8d8d8);
    }

    .file-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface, #1a1a1a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    .page-indicator,
    .zoom-indicator {
      font-size: 0.85rem;
      color: var(--md-sys-color-on-surface-variant, #555);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .divider {
      width: 1px;
      height: 24px;
      background: var(--md-sys-color-outline-variant, #d8d8d8);
    }

    .pages {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .page {
      position: relative;
      background: #fff;
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.22);
      flex-shrink: 0;
    }

    .page canvas {
      display: block;
    }

    .page-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      color: var(--md-sys-color-on-surface-variant, #666);
    }

    .centred {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px;
      text-align: center;
      color: var(--md-sys-color-on-surface-variant, #555);
    }

    .error-card {
      max-width: 520px;
      padding: 24px;
      border-radius: 12px;
      background: var(--md-sys-color-error-container, #fdecea);
      color: var(--md-sys-color-on-error-container, #5f1412);
    }

    .error-card h4 {
      margin: 0 0 8px;
    }

    .error-card p {
      margin: 0 0 12px;
      font-size: 0.9rem;
    }

    .error-detail {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: 0.78rem;
      word-break: break-word;
      opacity: 0.85;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    }
  `;

  constructor() {
    super();
    this.fileUrl = "";
    this.fileName = "";
    this._status = "idle";
    this._errorMessage = "";
    this._pageCount = 0;
    this._currentPage = 1;
    this._zoom = 1;

    this._pdf = null;
    this._pageEntries = [];
    this._syncQueued = false;
    this._renderTimer = null;
    this._scrollHandler = () => this._queueSync();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardown();
  }

  updated(changed) {
    if (changed.has("fileUrl") && this.fileUrl) {
      this._load();
    }
  }

  _teardown() {
    clearTimeout(this._renderTimer);
    this._renderTimer = null;
    this._pageEntries.forEach((entry) => this._releasePage(entry));
    this._pageEntries = [];
    this.renderRoot?.querySelector(".pages")?.removeEventListener("scroll", this._scrollHandler);
    this._pdf?.destroy();
    this._pdf = null;
  }

  async _load() {
    this._teardown();
    this._status = "loading";
    this._errorMessage = "";

    try {
      const pdf = await openPdfDocument(this.fileUrl);
      this._pdf = pdf;
      this._pageCount = pdf.numPages;
      this._currentPage = 1;
      this._status = "ready";
      await this.updateComplete;
      await this._buildPages();
    } catch (error) {
      console.error("CuratePdfViewer: failed to open document", error);
      this._errorMessage = error?.message || String(error);
      this._status = "error";
    }
  }

  /**
   * Lays out one sized placeholder per page, then renders each as it nears the
   * viewport. Sizing every page up front keeps the scrollbar honest.
   */
  async _buildPages() {
    const host = this.renderRoot.querySelector(".pages");
    if (!host || !this._pdf) {
      return;
    }

    host.textContent = "";
    this._pageEntries = [];

    const scale = this._zoom;
    for (let pageNumber = 1; pageNumber <= this._pdf.numPages; pageNumber += 1) {
      const page = await this._pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      const wrapper = document.createElement("div");
      wrapper.className = "page";
      wrapper.dataset.pageNumber = String(pageNumber);
      wrapper.style.width = `${Math.floor(viewport.width)}px`;
      wrapper.style.height = `${Math.floor(viewport.height)}px`;

      const placeholder = document.createElement("div");
      placeholder.className = "page-placeholder";
      placeholder.textContent = `Page ${pageNumber}`;
      wrapper.appendChild(placeholder);

      host.appendChild(wrapper);
      this._pageEntries.push({
        pageNumber,
        page,
        wrapper,
        rendered: false,
        renderTask: null,
        releaseRequested: false,
        offsetTop: 0,
        height: Math.floor(viewport.height),
      });
    }

    this._pageEntries.forEach((entry) => {
      entry.offsetTop = entry.wrapper.offsetTop;
      entry.height = entry.wrapper.offsetHeight;
    });

    host.addEventListener("scroll", this._scrollHandler, { passive: true });
    this._syncWindow();
  }

  /**
   * Coalesces scroll events into one window sync per frame.
   */
  _queueSync() {
    if (this._syncQueued) {
      return;
    }
    this._syncQueued = true;
    requestAnimationFrame(() => {
      this._syncQueued = false;
      this._syncWindow();
    });
  }

  /**
   * The single owner of what is rendered. Derives the visible page range from
   * the scroll position, renders what is close to it, and releases what is not.
   *
   * This deliberately replaced an IntersectionObserver. An observer only fires
   * on transitions, so a page released while still intersecting would never be
   * asked to render again. Deriving both decisions from one scroll measurement
   * keeps them from disagreeing.
   */
  _syncWindow() {
    const host = this.renderRoot?.querySelector(".pages");
    if (!host || !this._pageEntries.length) {
      return;
    }

    const top = host.scrollTop;
    const bottom = top + host.clientHeight;

    // Offsets are cached at build time: they only move on zoom, which rebuilds.
    // Reading them off the DOM here would mean two layout reads per page on
    // every frame of a scroll.
    let first = this._pageEntries.length - 1;
    let last = 0;
    let dominant = 0;
    let dominantOverlap = -1;
    this._pageEntries.forEach((entry, index) => {
      const entryBottom = entry.offsetTop + entry.height;
      if (entryBottom > top && entry.offsetTop < bottom) {
        first = Math.min(first, index);
        last = Math.max(last, index);
        // The page indicator names whichever page fills most of the viewport,
        // not the first one to peek into it: scrolling to the top of page 80
        // leaves a sliver of 79 showing, and naming that reads as off by one.
        const overlap = Math.min(entryBottom, bottom) - Math.max(entry.offsetTop, top);
        if (overlap > dominantOverlap) {
          dominantOverlap = overlap;
          dominant = index;
        }
      }
    });
    if (first > last) {
      first = last = dominant = Math.min(first, this._pageEntries.length - 1);
    }

    const current = this._pageEntries[dominant]?.pageNumber;
    if (current && current !== this._currentPage) {
      this._currentPage = current;
    }

    // Release straight away, so memory tracks the scroll position closely.
    this._pageEntries.forEach((entry, index) => {
      if (index < first - RETAIN_RADIUS || index > last + RETAIN_RADIUS) {
        this._releasePage(entry);
      }
    });

    // Rendering waits for the scroll to settle. Cancelling a render does not
    // pull the JPEG 2000 decode back out of the pdf.js worker queue, so
    // starting one per frame during a fast scroll buries the pages the user
    // actually lands on behind a hundred decodes they will never see. A fast
    // scroll through 166 pages started 164 renders and finished 7 of them, and
    // the landing page then took several seconds to appear.
    clearTimeout(this._renderTimer);
    this._renderTimer = setTimeout(() => {
      for (let index = first - RENDER_RADIUS; index <= last + RENDER_RADIUS; index += 1) {
        this._renderPage(this._pageEntries[index]);
      }
    }, RENDER_SETTLE_MS);
  }

  /**
   * Frees everything a rendered page holds: the canvas backing store, and the
   * decoded image data pdf.js caches on the page object. Zeroing the canvas
   * dimensions releases its buffer immediately rather than at the next GC, and
   * page.cleanup() is what actually returns the JPEG 2000 bitmap, which is by
   * far the larger of the two.
   */
  /**
   * Asks for a page's resources back.
   *
   * A cancelled pdf.js render does not unwind synchronously, so this must not
   * clear renderTask itself. Doing so would let the next sync start a second
   * render on a page whose first render was still settling, and run
   * page.cleanup() underneath it. Instead, flag the intent and let the render's
   * own finally block do the teardown once it has actually stopped.
   */
  _releasePage(entry) {
    // Cheap exit so the per-frame sweep over every page costs nothing for the
    // pages that are already released.
    if (!entry || (!entry.rendered && !entry.renderTask)) {
      return;
    }

    if (entry.renderTask) {
      entry.releaseRequested = true;
      entry.renderTask.cancel();
      return;
    }

    this._teardownPage(entry);
  }

  /**
   * Frees everything a rendered page holds: the canvas backing store, and the
   * decoded image data pdf.js caches on the page object. Zeroing the canvas
   * dimensions releases its buffer immediately rather than at the next GC, and
   * page.cleanup() is what actually returns the JPEG 2000 bitmap, which is by
   * far the larger of the two.
   *
   * Only ever called with no render in flight for this page.
   */
  _teardownPage(entry) {
    if (entry.rendered) {
      const canvas = entry.wrapper.querySelector("canvas");
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas.remove();
      }
      const placeholder = document.createElement("div");
      placeholder.className = "page-placeholder";
      placeholder.textContent = `Page ${entry.pageNumber}`;
      entry.wrapper.appendChild(placeholder);
      entry.rendered = false;
    }

    entry.page?.cleanup();
  }

  async _renderPage(entry) {
    if (!entry || entry.rendered || entry.renderTask) {
      return;
    }

    const scale = this._zoom;
    const outputScale = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_SCALE);
    const viewport = entry.page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    try {
      entry.renderTask = entry.page.render({
        canvasContext: canvas.getContext("2d"),
        viewport,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
      });
      await entry.renderTask.promise;
      entry.wrapper.textContent = "";
      entry.wrapper.appendChild(canvas);
      entry.rendered = true;
    } catch (error) {
      if (error?.name !== "RenderingCancelledException") {
        console.error(`CuratePdfViewer: page ${entry.pageNumber} failed to render`, error);
        const placeholder = entry.wrapper.querySelector(".page-placeholder");
        if (placeholder) {
          placeholder.textContent = `Page ${entry.pageNumber} could not be rendered`;
        }
      }
    } finally {
      entry.renderTask = null;
      // A release asked for while this render was in flight was deferred until
      // now, so that cleanup never runs under a live render.
      if (entry.releaseRequested) {
        entry.releaseRequested = false;
        this._teardownPage(entry);
      }
    }
  }

  async _setZoom(nextZoom) {
    if (nextZoom === this._zoom) {
      return;
    }
    const anchor = this._currentPage;
    this._zoom = nextZoom;
    this._pageEntries.forEach((entry) => this._releasePage(entry));
    await this._buildPages();
    this._goToPage(anchor);
  }

  _zoomBy(direction) {
    const index = ZOOM_STEPS.indexOf(this._zoom);
    const from = index === -1 ? ZOOM_STEPS.indexOf(1) : index;
    const next = Math.min(Math.max(from + direction, 0), ZOOM_STEPS.length - 1);
    this._setZoom(ZOOM_STEPS[next]);
  }

  _goToPage(pageNumber) {
    const entry = this._pageEntries[pageNumber - 1];
    if (entry) {
      entry.wrapper.scrollIntoView({ block: "start" });
      this._currentPage = pageNumber;
      // scrollIntoView fires no scroll event when already in position, so sync
      // explicitly rather than relying on the handler.
      this._queueSync();
    }
  }

  _download() {
    const link = document.createElement("a");
    link.href = this.fileUrl;
    link.download = this.fileName || "document.pdf";
    link.rel = "noopener";
    link.click();
  }

  _renderToolbar() {
    const atFirst = this._currentPage <= 1;
    const atLast = this._currentPage >= this._pageCount;

    return html`
      <div class="toolbar">
        <span class="file-name" title=${this.fileName}>${this.fileName || "Document"}</span>

        <md-icon-button
          ?disabled=${atFirst}
          title="Previous page"
          @click=${() => this._goToPage(this._currentPage - 1)}
        >
          ${chevronUpIcon}
        </md-icon-button>
        <span class="page-indicator">${this._currentPage} / ${this._pageCount || "?"}</span>
        <md-icon-button
          ?disabled=${atLast}
          title="Next page"
          @click=${() => this._goToPage(this._currentPage + 1)}
        >
          ${chevronDownIcon}
        </md-icon-button>

        <span class="divider"></span>

        <md-icon-button title="Zoom out" @click=${() => this._zoomBy(-1)}>
          ${zoomOutIcon}
        </md-icon-button>
        <span class="zoom-indicator">${Math.round(this._zoom * 100)}%</span>
        <md-icon-button title="Zoom in" @click=${() => this._zoomBy(1)}>
          ${zoomInIcon}
        </md-icon-button>

        <span class="divider"></span>

        <md-icon-button title="Download" @click=${() => this._download()}>
          ${downloadIcon}
        </md-icon-button>
      </div>
    `;
  }

  render() {
    if (this._status === "error") {
      return html`
        <div class="centred">
          <div class="error-card">
            <h4>This PDF could not be opened</h4>
            <p>
              The file itself is intact and can still be downloaded. Curate's viewer is pinned to
              pdf.js ${PDFJS_VERSION} and reuses the worker Cells publishes, so a Cells upgrade that
              changes that version will show up here.
            </p>
            <p class="error-detail">${this._errorMessage}</p>
          </div>
          <div class="actions">
            <md-text-button @click=${() => this._download()}>Download</md-text-button>
            <md-text-button @click=${() => this._load()}>Try again</md-text-button>
          </div>
        </div>
      `;
    }

    if (this._status !== "ready") {
      return html`
        <div class="centred">
          <md-circular-progress indeterminate></md-circular-progress>
          <span>Loading document...</span>
        </div>
      `;
    }

    return html`${this._renderToolbar()}
      <div class="pages"></div>`;
  }
}

customElements.define("curate-pdf-viewer", CuratePdfViewer);
