// Shared function to handle WARC file detection and viewing
function handleWarcFileAction(node) {
  console.log("Checking node for WARC compatibility:", node);

  // Check if it's a WARC-compatible file
  const fileName = node.getLabel();
  const isWarcCompatible = fileName.match(/\.(warc|warc\.gz|wacz)$/i);

  if (!isWarcCompatible) {
    console.log("Not a WARC-compatible file, ignoring");
    return false; // Return false to indicate we didn't handle it
  }

  console.log("WARC-compatible file detected, launching viewer");

  // Get the file URL using your existing logic
  const fileUrl = `${window.location.origin}/io/quarantine/${fileName}${window.location.search}`;

  // Create and show the WARC options modal
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
          const warcOptions = document.createElement("warc-options-modal");
          warcOptions.setFileInfo(fileUrl, fileName);
          warcOptions.closeSelf = optionsModal.close;
          mainContent.appendChild(warcOptions);
        }
      },
    }
  );

  optionsModal.fire();
  return true; // Return true to indicate we handled it
}

// Event handler for "open" button clicks
Curate.eventDelegator.addEventListener(
  ".action-open",
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
