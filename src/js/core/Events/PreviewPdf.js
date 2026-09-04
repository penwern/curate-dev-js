import { openPdfViewerPage } from "../../custom-pages/routes/pdf-viewer.js";

/**
 * Routes PDF opens to the Curate PDF viewer instead of the Cells editor.pdfjs
 * one, which cannot decode JPEG 2000 and so renders ABBYY mixed-raster-content
 * scans as blank pages. See web-components/pdf-viewer/pdfjs-setup.js.
 *
 * Interception follows the same set of entry points as PreviewWarc.js: the file
 * list, the image gallery, the "open with" action and the context menu.
 *
 * The inline preview in the info panel is a separate Cells code path and is not
 * covered here; it stays on the built-in renderer.
 */
function handlePdfFileAction(node) {
  const fileName = node.getLabel();
  if (!/\.pdf$/i.test(fileName)) {
    return false;
  }

  (async () => {
    try {
      const fileUrl = await PydioApi._PydioClient.buildPresignedGetUrl(node);
      openPdfViewerPage({ fileUrl, fileName });
    } catch (error) {
      console.error("PreviewPdf: could not build presigned URL", error);
    }
  })();

  return true;
}

function intercept(selector, eventName, guard = () => true) {
  Curate.eventDelegator.addEventListener(
    selector,
    eventName,
    (e) => {
      if (!guard(e)) {
        return;
      }
      const nodes = pydio._dataModel._selectedNodes;
      if (nodes.length === 1 && handlePdfFileAction(nodes[0])) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    },
    true, // capture phase
  );
}

intercept(".action-open_with", "click");
intercept(".main-files-list", "dblclick", (e) => !!e.target.closest(".material-list-entry"));
intercept(".masonry-grid", "dblclick", (e) => !!e.target.closest(".masonry-card"));
intercept(
  ".context-menu [role=menuitem]",
  "click",
  (e) => e.target.innerText.toLowerCase() === "open",
);
