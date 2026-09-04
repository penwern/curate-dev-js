/**
 * pdf.js configuration for the Curate PDF viewer.
 *
 * Cells' own editor.pdfjs plugin ships pdfjs-dist 5.4.296 but never publishes
 * the sibling wasm/ directory, and never passes the wasmUrl, cMapUrl or
 * standardFontDataUrl options. pdf.js 5.x decodes JPEG 2000 through an OpenJPEG
 * WebAssembly module rather than in JavaScript, so with those options unset it
 * turns JPEG 2000 decoding off and pages built entirely from JPEG 2000 images
 * render blank, with nothing in the console.
 *
 * ABBYY FineReader mixed-raster-content scans are exactly that shape: every
 * paintable image is JPEG 2000, and the bitonal text layers are masks attached
 * to those images rather than independent drawables, so a failed JPEG 2000
 * decode leaves the page completely empty.
 *
 * This module wires the three options up. The deployed CSP is the constraint on
 * how:
 *
 *   worker-src 'self'   the pdf.js worker cannot come from our bundle origin,
 *                       in production or in dev, so we reuse the worker Cells
 *                       already serves. It is byte-identical to the one in our
 *                       pinned pdfjs-dist, which also satisfies pdf.js's
 *                       API/worker version check.
 *   connect-src 'self'  openjpeg.wasm cannot be fetched from our bundle origin
 *                       in production, so it is inlined into this chunk at build
 *                       time and handed to pdf.js through a custom WasmFactory.
 *                       That needs useWorkerFetch: false, which also routes the
 *                       standard font fetch through the main thread.
 */
// Asset root of the Cells editor.pdfjs plugin. Same origin as the running app,
// so everything under it is reachable under connect-src 'self'.
const CELLS_PDFJS_BASE = "plug/editor.pdfjs/res/dist/pdfjs/";

const onOrigin = (path) => new URL(path, window.location.origin).toString();

/** pdf.js version this viewer is pinned to. Must match the Cells-shipped worker. */
export const PDFJS_VERSION = "5.4.296";

export const WORKER_SRC = onOrigin(`${CELLS_PDFJS_BASE}build/pdf.worker.mjs`);
export const STANDARD_FONT_DATA_URL = onOrigin(`${CELLS_PDFJS_BASE}web/standard_fonts/`);

// Cells does not currently ship this directory. Pointing at it anyway means CJK
// encodings start working if it is ever published host-side, and costs only a
// 404 on documents that actually need a CMap until then.
export const CMAP_URL = onOrigin(`${CELLS_PDFJS_BASE}web/cmaps/`);

// Where pdf.js would look for the wasm if it were fetching it itself. Our
// factory answers before it gets there; this only matters if pdf.js falls
// through to its pure-JS OpenJPEG fallback, and it must end in a slash.
export const WASM_URL = onOrigin(`${CELLS_PDFJS_BASE}web/wasm/`);

let openjpegBytes = null;

/**
 * The wasm is imported dynamically, under the same chunk name as pdf.js itself,
 * so its ~334KB of base64 rides in the lazily-loaded viewer chunk rather than in
 * main.js. webpack turns the import into a data URL (see webpack.config.js).
 */
async function getOpenjpegBytes() {
  if (!openjpegBytes) {
    const module = await import(/* webpackChunkName: "pdfjs" */ "pdfjs-dist/wasm/openjpeg.wasm");
    const dataUrl = module.default;
    const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
    openjpegBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      openjpegBytes[i] = binary.charCodeAt(i);
    }
  }
  return openjpegBytes;
}

/**
 * Serves pdf.js's wasm requests from the bytes bundled into this chunk instead
 * of fetching them. Same shape as pdf.js's own BaseWasmFactory.
 */
class BundledWasmFactory {
  constructor({ baseUrl = null } = {}) {
    this.baseUrl = baseUrl;
  }

  async fetch({ filename }) {
    if (filename === "openjpeg.wasm") {
      return getOpenjpegBytes();
    }
    // qcms_bg.wasm is the only other one pdf.js asks for, and it is already
    // disabled upstream whenever useWorkerFetch is false.
    throw new Error(`No bundled wasm module for "${filename}".`);
  }
}

let pdfjsPromise = null;

/**
 * Loads and configures pdf.js. Resolves with the pdfjs-dist module namespace.
 */
export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* webpackChunkName: "pdfjs" */ "pdfjs-dist")
      .then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
        return pdfjs;
      })
      .catch((error) => {
        pdfjsPromise = null;
        throw error;
      });
  }
  return pdfjsPromise;
}

/**
 * Opens a PDF with JPEG 2000 decoding enabled.
 *
 * @param {string} url Same-origin URL of the PDF, normally a presigned Cells URL.
 * @returns {Promise<import("pdfjs-dist").PDFDocumentProxy>}
 */
export async function openPdfDocument(url) {
  const pdfjs = await loadPdfjs();

  return pdfjs.getDocument({
    url,
    // Must stay false: it is what makes pdf.js consult WasmFactory below rather
    // than fetching the wasm from within the worker.
    useWorkerFetch: false,
    WasmFactory: BundledWasmFactory,
    wasmUrl: WASM_URL,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise;
}
