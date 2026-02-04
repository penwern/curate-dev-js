import { openWarcViewerPage } from "../../custom-pages/routes/warc-viewer.js";

// Shared function to handle WARC file detection and viewing
function handleWarcFileAction(node) {
  // Check if it's a WARC-compatible file FIRST
  const fileName = node.getLabel();
  const isWarcCompatible = fileName.match(/\.(warc|warc\.gz|wacz)$/i);

  if (!isWarcCompatible) {
    return false; // Return false immediately - don't block anything
  }

  // Check if it's a WACZ file (skip options) or WARC file (show options)
  const isWaczFile = fileName.match(/\.wacz$/i);

  // Handle the async URL generation
  (async () => {
    try {
      const fileUrl = await PydioApi._PydioClient.buildPresignedGetUrl(node);

      if (isWaczFile) {
        openWarcViewerPage({ fileUrl });
      } else {
        // Show options modal for WARC files
        const optionsModal = Curate.ui.modals.curatePopup(
          {
            title: "Preview Web Archive",
          },
          {
            afterLoaded: (container) => {
              const mainContent = container.querySelector(
                ".config-main-options-container"
              );
              if (mainContent) {
                const warcOptions =
                  document.createElement("warc-options-modal");
                warcOptions.setFileInfo(fileUrl, fileName);
                warcOptions.closeSelf = optionsModal.close;
                mainContent.appendChild(warcOptions);
              }
            },
          }
        );

        optionsModal.fire();
      }
    } catch (error) {
      console.error("Error building presigned URL:", error);
    }
  })();

  return true; // Block propagation immediately for WARC files
}

// Event handler for "open" button clicks (your original working code)
Curate.eventDelegator.addEventListener(
  ".action-open_with",
  "click",
  (e) => {
    const nodes = pydio._dataModel._selectedNodes;
    if (nodes.length === 1) {
      const handled = handleWarcFileAction(nodes[0]);
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }
  },
  true
); // Use capture phase

// Event handler for double-click in main files list
Curate.eventDelegator.addEventListener(
  ".main-files-list",
  "dblclick",
  (e) => {
    if (e.target.closest(".material-list-entry")) {
      const nodes = pydio._dataModel._selectedNodes;
      if (nodes.length === 1) {
        const handled = handleWarcFileAction(nodes[0]);
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    }
  },
  true
); // Use capture phase

// Event handler for double-click in image gallery (masonry grid)
Curate.eventDelegator.addEventListener(
  ".masonry-grid",
  "dblclick",
  (e) => {
    if (e.target.closest(".masonry-card")) {
      const nodes = pydio._dataModel._selectedNodes;
      if (nodes.length === 1) {
        const handled = handleWarcFileAction(nodes[0]);
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    }
  },
  true
); // Use capture phase

// Event handler for context menu "Open" clicks
Curate.eventDelegator.addEventListener(
  ".context-menu [role=menuitem]",
  "click",
  (e) => {
    if (e.target.innerText.toLowerCase() === "open") {
      const nodes = pydio._dataModel._selectedNodes;
      if (nodes.length === 1) {
        const handled = handleWarcFileAction(nodes[0]);
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    }
  },
  true
); // Use capture phase
