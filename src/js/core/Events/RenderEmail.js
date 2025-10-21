import { mdiOpenInNew, mdiEye } from "@mdi/js";

// Create icon SVG helper (plain HTML strings, not Lit templates)
const createIconSVG = (path) => `<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor;display:flex;align-items:center;"><path d="${path}"></path></svg>`;

// Create icon SVGs
const openIcon = createIconSVG(mdiOpenInNew);
const renderIcon = createIconSVG(mdiEye);

// Create the popup instance
const actionPopup = new Curate.ui.modals.curatePopup(
  {
    title: "Choose Action",
    message: "",
    type: "info",
    content: `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; height: 10em; justify-content:center;">
        <p style="margin: 0; text-align: center;">Would you like to open or render this item?</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <md-filled-button id="openBtn" style="--md-sys-color-primary: #1976d2;">
            <span slot="icon" id="openIconSlot" style="display: flex; align-items: center;"></span>
            Open
          </md-filled-button>
          <md-filled-tonal-button id="renderBtn" style="--md-sys-color-secondary: #7b1fa2;">
            <span slot="icon" id="renderIconSlot" style="display: flex; align-items: center;"></span>
            Render
          </md-filled-tonal-button>
        </div>
      </div>
    `,
    buttonType: "close"
  },
  {
    afterLoaded: (container) => {
      // Get button references
      const openBtn = container.querySelector("#openBtn");
      const renderBtn = container.querySelector("#renderBtn");

      // Inject the SVG icons
      const openIconSlot = container.querySelector("#openIconSlot");
      const renderIconSlot = container.querySelector("#renderIconSlot");

      if (openIconSlot) {
        openIconSlot.innerHTML = openIcon;
      }
      if (renderIconSlot) {
        renderIconSlot.innerHTML = renderIcon;
      }

      // Add click handlers
      openBtn.addEventListener("click", () => {
        console.log("Open action selected");
        actionPopup.close();

        // Use Pydio's goTo to navigate into the folder
        pydio.goTo(pydio._dataModel._selectedNodes[0]);
      });

      renderBtn.addEventListener("click", () => {
        console.log("Render action selected");
        // TODO: Add render logic here
        actionPopup.close();
      });
    },
    afterClosed: () => {
      console.log("Popup closed");
    }
  }
);

const handleEmailFileAction = async (node) => {
    const nodeData = await Curate.api.files.getNodeMetadata(node, 100, true)
    const containsManifest = nodeData.Nodes.some(n=>n.Path.endsWith("manifest.json"))

    if (containsManifest){
        console.log("it's a custom email file!")
        // Show the popup
        actionPopup.fire();
    }
}

// Register the event handler
Curate.eventDelegator.addEventListener(
  ".main-files-list",
  "dblclick",
  (e) => {
    const nodes = pydio._dataModel._selectedNodes;
    if (nodes.length === 1) {
      const node = nodes[0];
      const isMbox = node._label.endsWith(".mbox");

      // Synchronously block the event if it's an mbox file
      if (isMbox) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // Then asynchronously check for manifest and show popup
        handleEmailFileAction(node);
        return false;
      }
    }
  },
  true
); // Use capture phase