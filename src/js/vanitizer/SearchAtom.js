const selection = pydio._dataModel._selectedNodes;
if (selection.length <= 0) {
  Curate.ui.modals
    .curatePopup(
      { title: "Invalid Selection" },
      {
        afterLoaded: (c) => {
          c.querySelector(".config-main-options-container").innerHTML =
            "<p>Please select a node to connect to your AtoM instance</p>";
        },
      },
    )
    .fire();
} else if (selection.length == 1) {
  const node = selection[0];
  Curate.ui.modals
    .curatePopup(
      { title: "Connect Selected Node to an AtoM Description" },
      {
        afterLoaded: (c) => {
          const t = document.createElement("atom-search-interface");
          t.setNode(node);
          c.querySelector(".config-main-options-container").appendChild(t);
          t.addEventListener("description-linked", () => {
            c.remove();
          });
        },
      },
    )
    .fire();
} else {
  Curate.ui.modals
    .curatePopup(
      { title: "Connect Selected Nodes to AtoM Descriptions" },
      {
        afterLoaded: (c) => {
          const t = document.createElement("dip-slug-resolver");

          t.setNodes(selection);
          c.querySelector(".config-main-options-container").appendChild(t);
          t.shadowRoot.querySelector(".message").textContent =
            "Connect each item in your selection to an AtoM description";
        },
      },
    )
    .fire();
}
