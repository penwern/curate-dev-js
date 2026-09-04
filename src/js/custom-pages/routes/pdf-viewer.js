import { Curate } from "../../core/CurateFunctions/CurateFunctions.js";

/**
 * PDF Viewer Route
 *
 * Hosts the Curate PDF viewer, which replaces the Cells editor.pdfjs viewer for
 * full-screen viewing. See web-components/pdf-viewer/pdfjs-setup.js for why.
 */
export function registerPdfViewerRoute() {
  Curate.router.addRoute(
    "/pdf-viewer",
    async (container, { params } = {}) => {
      const { fileUrl = "", fileName = "" } = params || {};

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
        container.textContent = "No document source provided.";
        return () => {
          container.textContent = "";
        };
      }

      await customElements.whenDefined("curate-pdf-viewer");

      const viewer = document.createElement("curate-pdf-viewer");
      viewer.fileName = fileName;
      viewer.fileUrl = fileUrl;
      viewer.style.cssText = `
        display: flex;
        flex: 1;
        min-height: 0;
        width: 100%;
      `;

      container.appendChild(viewer);

      return () => {
        viewer.remove();
      };
    },
    {
      title: "PDF Viewer",
      showHeader: true,
      allowUrlAccess: false,
    },
  );
}

export function openPdfViewerPage(params = {}, overrides = {}) {
  Curate.router.open("/pdf-viewer", params, overrides);
}
