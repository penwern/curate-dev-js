// Shared function to handle WARC file detection and viewing
function getReplayWebBaseUrl() {
  console.log("ReplayWeb base resolver: starting");
  const base = document.querySelector("base");
  const baseHref = base ? base.getAttribute("href") : null;
  if (baseHref && baseHref !== "/") {
    console.log("ReplayWeb base resolver: using <base>", baseHref);
    return new URL(baseHref, document.baseURI).toString();
  }
  if (baseHref === "/") {
    console.log("ReplayWeb base resolver: ignoring <base> '/'");
  }

  if (typeof globalThis !== "undefined" && globalThis.src) {
    console.log("ReplayWeb base resolver: using global src", globalThis.src);
    return new URL(".", globalThis.src).toString();
  }

  if (typeof __webpack_require__ !== "undefined" && __webpack_require__.p) {
    console.log("ReplayWeb base resolver: using webpack public path", __webpack_require__.p);
    return new URL(__webpack_require__.p, window.location.href).toString();
  }

  if (document.currentScript && document.currentScript.src) {
    console.log("ReplayWeb base resolver: using currentScript", document.currentScript.src);
    return new URL(".", document.currentScript.src).toString();
  }

  const { origin, pathname } = window.location;
  const versionedMatch = pathname.match(/^(.*\/@latest\/|.*\/\d+\.\d+\.\d+\/)/);
  if (versionedMatch) {
    console.log("ReplayWeb base resolver: using versioned path", versionedMatch[0]);
    return `${origin}${versionedMatch[0]}`;
  }

  console.log("ReplayWeb base resolver: using origin root", origin);
  return `${origin}/`;
}

function getReplayWebUrl(path) {
  return new URL(path, getReplayWebBaseUrl()).toString();
}

async function ensureReplayWebPageLoaded() {
  if (window.replayWebPageLoaded) {
    return;
  }

  const script = document.createElement("script");
  script.src = getReplayWebUrl("replaywebpage-ui.js");

  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  await customElements.whenDefined("replay-web-page");
  window.replayWebPageLoaded = true;
}

function handleWarcFileAction(node) {
  console.log("Checking node for WARC compatibility:", node);

  // Check if it's a WARC-compatible file FIRST
  const fileName = node.getLabel();
  const isWarcCompatible = fileName.match(/\.(warc|warc\.gz|wacz)$/i);

  if (!isWarcCompatible) {
    console.log("Not a WARC-compatible file, ignoring");
    return false; // Return false immediately - don't block anything
  }

  console.log("WARC-compatible file detected, launching viewer");

  // Check if it's a WACZ file (skip options) or WARC file (show options)
  const isWaczFile = fileName.match(/\.wacz$/i);

  // Handle the async URL generation
  (async () => {
    try {
      const fileUrl = await PydioApi._PydioClient.buildPresignedGetUrl(node);
      await ensureReplayWebPageLoaded();

      if (isWaczFile) {
        // Skip options for WACZ files - go straight to viewer
        const viewerModal = Curate.ui.modals.curatePopup(
          {
            title: "Preview Web-Archive",
          },
          {
            afterLoaded: (container) => {
              // Style the popup for maximum size
              const modalContent = container.querySelector(
                ".config-modal-content"
              );
              if (modalContent) {
                modalContent.style.width = "95vw";
                modalContent.style.height = "90vh";
                modalContent.style.maxWidth = "1400px";
                modalContent.style.maxHeight = "900px";
                modalContent.style.padding = "16px";
              }
              // Find the main content container and update it
              const mainContent = container.querySelector(
                ".config-main-options-container"
              );
              if (mainContent) {
                // Style the main content to take full space
                mainContent.style.height = "100%";
                mainContent.style.display = "flex";
                mainContent.style.flexDirection = "column";
                // Create wrapper with border radius
                const viewerWrapper = document.createElement("div");
                viewerWrapper.style.cssText = `
                      flex: 1;
                      border-radius: 12px;
                      overflow: hidden;
                      border: 1px solid var(--md-sys-color-outline-variant);
                      background: var(--md-sys-color-surface);
                    `;
                // Clear existing content and add the replay component inside wrapper
                mainContent.innerHTML = "";
                viewerWrapper.innerHTML = `<replay-web-page
                      source="${fileUrl}"
                      url=""
                      replayBase="${getReplayWebUrl("workers/")}"
                      embed="default"
                      style="width: 100%; height: 100%; display: block; border-radius: inherit;">
                    </replay-web-page>`;
                mainContent.appendChild(viewerWrapper);
              }
            },
          }
        );
        // Fire the viewer modal
        viewerModal.fire();
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
    console.log("Double-click in main files list:", e);
    if (e.target.closest(".material-list-entry")) {
      const nodes = pydio._dataModel._selectedNodes;
      if (nodes.length === 1) {
        console.log("Single node double clicked:", nodes[0]);
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
    console.log("Double-click in masonry grid:", e);
    if (e.target.closest(".masonry-card")) {
      const nodes = pydio._dataModel._selectedNodes;
      if (nodes.length === 1) {
        console.log("Single node double clicked:", nodes[0]);
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
      console.log("Open context menu clicked");
      const nodes = pydio._dataModel._selectedNodes;
      if (nodes.length === 1) {
        console.log("Single node from context menu:", nodes[0]);
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
