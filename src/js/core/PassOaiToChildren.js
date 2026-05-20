function checkBox() {
  // Create the main container div and set its style
  const container = document.createElement("div");
  container.style = "margin: 12px 0px 6px;";

  const innerDiv = document.createElement("div");
  innerDiv.style =
    "cursor: pointer; position: relative; overflow: visible; display: table; height: 52px; width: 100%; background-color: var(--md-sys-color-surface-variant); border-radius: 4px; margin-top: 8px; font-size: 15px; padding: 15px 10px 4px;";

  // Create the checkbox and set its style
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "inheritValues";
  checkbox.checked = false;
  checkbox.style =
    "position: absolute; cursor: inherit; pointer-events: all; opacity: 0; width: 100%; height: 100%; z-index: 2; left: 0px; box-sizing: border-box; padding: 0px; margin: 0px;";

  // Create the flex container for the checkbox and label
  const flexDiv = document.createElement("div");
  flexDiv.style = "display: flex; width: 100%; height: 100%;";

  // Create the graphical checkbox container
  const graphicContainer = document.createElement("div");
  graphicContainer.style =
    "transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; float: left; position: relative; display: block; flex-shrink: 0; width: 36px; margin-right: 8px; margin-left: 0px; padding: 4px 0px 6px 2px;";

  const baseCircle = document.createElement("div");
  baseCircle.style =
    "transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; width: 100%; height: 14px; border-radius: 30px; background-color: var(--md-sys-color-outline-variant);";

  const indicator = document.createElement("div");
  indicator.style =
    "color: rgb(25, 28, 30); background-color: var(--md-sys-color-primary); transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; box-sizing: border-box; font-family: Roboto, sans-serif; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px; border-radius: 50%; position: absolute; top: 1px; left: 100%; width: 20px; height: 20px; line-height: 24px; margin-left: -20px;";

  // Create the label
  const label = document.createElement("label");
  label.style =
    "float: left; position: relative; display: block; width: calc(100% - 46px); line-height: 24px; color: rgb(25, 28, 30); font-family: Roboto, sans-serif;";
  label.textContent = "Update Children With New Value ";

  // Append children to their respective parents
  graphicContainer.appendChild(baseCircle);
  graphicContainer.appendChild(indicator);
  flexDiv.appendChild(graphicContainer);
  flexDiv.appendChild(label);
  innerDiv.appendChild(checkbox);
  innerDiv.appendChild(flexDiv);
  container.appendChild(innerDiv);

  // Setup event listener for checkbox
  checkbox.addEventListener("change", function () {
    if (checkbox.checked) {
      baseCircle.style.backgroundColor = "rgba(0, 102, 137, 0.5)";
      indicator.style.left = "100%";
      label.textContent = "Update Children With New Value (yes)";
    } else {
      indicator.style.left = "55%";
      baseCircle.style.backgroundColor = "var(--md-sys-color-outline-variant)";
      label.textContent = "Update Direct Descendant Files With New Value (no)";
    }
  });

  // Initialize the state
  checkbox.dispatchEvent(new Event("change"));
  return container;
}

async function retrieveAllNodes(startPath, limit = 100) {
  const fetchNodes = async (path, offset = 0) => {
    const payload = {
      NodePaths: [path + "/*"],
      Limit: limit.toString(),
      Offset: offset.toString(),
    };

    const response = await Curate.api.fetchCurate("/a/tree/stats", "POST", payload);

    return response;
  };

  let allNodes = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const responseData = await fetchNodes(startPath, offset);
    const children = responseData.Nodes || [];
    allNodes = allNodes.concat(children);

    // Check if we've received fewer nodes than the limit, indicating this is the last batch
    hasMore = children.length === limit;
    offset += children.length;
  }

  return allNodes;
}

const updateMetaObject = (uuids, enabled) => {
  return {
    MetaDatas: uuids.map((n) => {
      return {
        NodeUuid: n,
        Namespace: "usermeta-export-oai-harvest-enabled",
        JsonValue: enabled.toString(),
        Policies: [
          {
            Action: "READ",
            Effect: "allow",
            Subject: "*",
          },
          {
            Action: "WRITE",
            Effect: "allow",
            Subject: "*",
          },
        ],
      };
    }),
    Operation: "PUT",
  };
};
const splitArray = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
document.addEventListener("change", function (event) {
  // Checking if the event target is a checkbox
  if (pydio._dataModel._selectedNodes.length !== 1) return;
  if (!event.target.nextElementSibling?.textContent.includes("Enable OAI Harvesting")) return;
  if (event.target.type === "checkbox") {
    // Logging the checkbox's id (or name if id is not available) and its new checked state
    const siblingText = event.target.nextElementSibling?.textContent.includes(
      "Enable OAI-PMH Harvesting",
    );
    const selectedNode = pydio._dataModel._selectedNodes[0];
    const isFolder = !selectedNode._isLeaf;
    if (siblingText && isFolder) {
      Curate.ui.modals
        .curatePopup(
          { title: "Send Update to Children", buttonType: "okCancel" },
          {
            afterLoaded: (c) => {
              c.querySelector(".config-main-options-container").appendChild(checkBox());
            },
            onOk: () => {
              const check = this.querySelector("#inheritValues[type='checkbox']");
              if (check && check.checked) {
                const startPath = Curate.workspaces.getOpenWorkspace() + "/" + selectedNode._path;

                retrieveAllNodes(startPath)
                  .then((result) => {
                    const fileUuids = [];
                    result.forEach((r) => (r.Type === "LEAF" ? fileUuids.push(r.Uuid) : null));
                    const uuids = splitArray(fileUuids, 50);
                    uuids.forEach((u) => {
                      const updateBody = updateMetaObject(u, event.target.checked);
                      Curate.api.fetchCurate("/a/user-meta/update", "PUT", updateBody);
                    });
                  })
                  .catch((error) => {
                    console.error("Error retrieving nodes:", error);
                  });
              }
            },
          },
        )
        .fire();
    }
  }
});
