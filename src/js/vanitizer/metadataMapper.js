function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const csv = event.target.result;
      const lines = csv.split("\n");
      const headings = lines[0].split(",").map((heading) => heading.trim());
      resolve(headings);
    };

    reader.onerror = function (event) {
      reject("File could not be read! Code " + event.target.error.code);
    };

    reader.readAsText(file);
  });
}
function connectElements(element1, element2, instantDraw = false) {
  const cont = document.querySelector("#metadata-mapper");
  const connectorCanvas = document.querySelector("#connectorCanvas");
  let animationFrameId;

  // Select existing canvases with matching 'fromNode' and 'toNode' attributes and remove them
  document.querySelectorAll("canvas").forEach((canvas) => {
    if (
      canvas.getAttribute("fromNode") === element1.getAttribute("forNode") &&
      canvas.getAttribute("toNode") === element2.getAttribute("forNode")
    ) {
      canvas.remove();
    }
  });

  var canvas = document.createElement("canvas");
  canvas.setAttribute("fromNode", element1.getAttribute("forNode"));
  canvas.setAttribute("toNode", element2.getAttribute("forNode"));
  var ctx = canvas.getContext("2d");

  // Get bounding info of elements
  var rect1 = element1.getBoundingClientRect();
  var rect2 = element2.getBoundingClientRect();

  // Set canvas size to cover entire document
  canvas.width = cont.scrollWidth;
  canvas.height = cont.scrollHeight;
  canvas.width = window.screen.width;
  canvas.height = window.screen.height;
  // Append canvas to body
  connectorCanvas.appendChild(canvas);

  // Draw line instantly if instantDraw is true, otherwise animate
  if (instantDraw) {
    drawLineInstantly(ctx, rect1, rect2);
  } else {
    drawLineAnimated(ctx, rect1, rect2);
  }

  // Debounce scroll event handler to approximately 30 times per second
  let timeout;
  cont.addEventListener("scroll", function () {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(function () {
      repositionLineOnScroll(canvas);
    });
  });
  window.addEventListener("resize", function () {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(function () {
      repositionLineOnScroll(canvas);
    });
  });
  function getTopmostYCoordOfElement(element) {
    const rect = element.getBoundingClientRect();
    return rect.top + window.pageYOffset;
  }
  function getBottomMostYCoordOfElement(element) {
    const rect = element.getBoundingClientRect();
    return rect.top + rect.height + window.pageYOffset;
  }

  // Function to draw line between two points instantly
  function drawLineInstantly(ctx, rect1, rect2) {
    ctx.beginPath();
    const ceil = getTopmostYCoordOfElement(cont);
    const lowCeil = getBottomMostYCoordOfElement(cont);
    // Adjusting rect1 left value if its top is less than ceil
    var x1 = rect1.left + rect1.width / 2;
    var y1 = rect1.top + rect1.height / 2;
    var x2 = rect2.left + rect2.width / 2;
    var y2 = rect2.top + rect2.height / 2;
    if (rect1.top < ceil) {
      // Calculate the new left position maintaining the same slope
      x1 += ((ceil - rect1.top) * (rect2.left - rect1.left)) / (rect2.top - rect1.top);
      y1 = ceil;
    }
    if (rect2.top < ceil) {
      x2 += ((ceil - rect2.top) * (rect1.left - rect2.left)) / (rect1.top - rect2.top);
      y2 = ceil;
    }
    if (rect1.top > lowCeil) {
      y1 = lowCeil;
      x1 += ((lowCeil - rect1.top) * (rect2.left - rect1.left)) / (rect2.top - rect1.top); // angle correction
    }
    if (rect2.top > lowCeil) {
      y2 = lowCeil;
      x2 += ((lowCeil - rect2.top) * (rect1.left - rect2.left)) / (rect1.top - rect2.top); // angle correction
    }

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#9fd0c7";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawLineAnimated(ctx, rect1, rect2) {
    var x1 = rect1.left + rect1.width / 2;
    var y1 = rect1.top + rect1.height / 2;
    var x2 = rect2.left + rect2.width / 2;
    var y2 = rect2.top + rect2.height / 2;
    const ceil = getTopmostYCoordOfElement(cont);
    const lowCeil = getBottomMostYCoordOfElement(cont);
    // Animation variables
    var steps = 100;
    var currentStep = 0;

    // Angle correction for rect1
    if (rect1.top < ceil) {
      x1 += ((ceil - rect1.top) * (rect2.left - rect1.left)) / (rect2.top - rect1.top);
      y1 = ceil;
    }
    if (rect1.top > lowCeil) {
      y1 = lowCeil;
      x1 += ((lowCeil - rect1.top) * (rect2.left - rect1.left)) / (rect2.top - rect1.top); // angle correction
    }

    // Angle correction for rect2
    if (rect2.top < ceil) {
      x2 += ((ceil - rect2.top) * (rect1.left - rect2.left)) / (rect1.top - rect2.top);
      y2 = ceil;
    }
    if (rect2.top > lowCeil) {
      y2 = lowCeil;
      x2 += ((lowCeil - rect2.top) * (rect1.left - rect2.left)) / (rect1.top - rect2.top); // angle correction
    }

    function animateLine() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var currentX = x1 + ((x2 - x1) * currentStep) / steps;
      var currentY = y1 + ((y2 - y1) * currentStep) / steps;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = "#9fd0c7";
      ctx.lineWidth = 2;
      ctx.stroke();
      currentStep++;
      if (currentStep <= steps) {
        animationFrameId = requestAnimationFrame(animateLine);
      }
    }

    animateLine();
  }

  function repositionLineOnScroll(canvas) {
    // Clear canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Get updated positions
    var rect1 = element1.getBoundingClientRect();
    var rect2 = element2.getBoundingClientRect();
    // Redraw line with updated positions
    drawLineInstantly(ctx, rect1, rect2);
  }
  function getCenterPointFromBoundRect(rect) {
    // Calculate the center point of the bounding box
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;

    return { x: centerX, y: centerY };
  }
}

async function csvToNodes(csvFile, destinationMap) {
  try {
    // Parse the CSV file to get column headings
    const columnHeadings = await parseCSV(csvFile);

    // Get container div
    const container = document.querySelector("#map-nodes-container");

    // Create source list div
    const sourceList = document.createElement("div");
    sourceList.id = "sourceList";
    sourceList.classList.add("list");

    const sourceListHead = document.createElement("div");
    const sourceHeadLabel = document.createElement("div");
    const sourceHeadNameInput = document.createElement("input");
    sourceHeadNameInput.style =
      "border: none;border-radius: 0.3em;padding: 0.2em;width: 60%;margin-bottom: 0.5em;";
    sourceHeadNameInput.placeholder = "Enter source schema name";
    sourceHeadLabel.textContent = "Source Schema: ";
    sourceListHead.appendChild(sourceHeadLabel);
    sourceListHead.appendChild(sourceHeadNameInput);

    sourceList.appendChild(sourceListHead);

    // Create destination list div
    const destinationList = document.createElement("div");
    destinationList.id = "destinationList";
    destinationList.classList.add("list");

    const destinationListHead = document.createElement("div");
    const destinationHeadLabel = document.createElement("div");
    destinationHeadLabel.textContent =
      "Destination Schema: " + destinationMap[0].field.split("-")[0];
    destinationHeadLabel.style =
      "margin-right: auto;margin-left: auto;width: 50%;position: relative;left: 15%;";
    destinationListHead.appendChild(destinationHeadLabel);
    destinationList.appendChild(destinationListHead);
    // Create nodes for source list based on column headings
    columnHeadings.forEach((heading, index) => {
      const sourceNode = document.createElement("div");
      sourceNode.classList.add("node");
      const sourceItem = document.createElement("div");
      sourceItem.classList.add("item");
      sourceItem.setAttribute("draggable", "true");
      sourceItem.id = "node_" + (index + 1);
      const sourceLabel = document.createElement("label");
      sourceLabel.textContent = heading;
      sourceLabel.for = sourceItem;
      sourceItem.appendChild(sourceLabel);
      const deleteConnections = document.createElement("span");
      deleteConnections.classList = "mdi mdi-delete";
      deleteConnections.style.color = "var(--md-sys-color-error)";
      deleteConnections.style.cursor = "pointer";
      deleteConnections.style.visibility = "hidden";
      deleteConnections.addEventListener("click", (e) => {
        document.querySelectorAll("#connectorCanvas canvas").forEach((c) => {
          if (c.getAttribute("fromNode") == sourceItem.id) {
            document
              .getElementById(c.getAttribute("toNode"))
              .parentElement.querySelector(".nodeConnector")
              .classList.remove("connected");
            c.remove();
            let s = sourceNode.querySelector(".nodeConnector");
            s.classList.remove("connected");
            s.textContent = "+";
            s.previousSibling.querySelector(".mdi-delete").style.visibility = "hidden";
          }
        });
      });
      sourceItem.appendChild(deleteConnections);
      sourceNode.appendChild(sourceItem);

      const nodeConnector = document.createElement("span");
      nodeConnector.classList.add("nodeConnector");
      nodeConnector.setAttribute("forNode", sourceItem.id);
      nodeConnector.textContent = "+";
      nodeConnector.style.cursor = "pointer";
      nodeConnector.addEventListener("click", (e) => {
        document.querySelectorAll("#sourceList .nodeConnector").forEach((n) => {
          if (n.classList.contains("chooseConnection")) {
            n.classList.remove("chooseConnection");
            n.textContent = "+";
          }
        });
        nodeConnector.classList.add("chooseConnection");
        nodeConnector.textContent = "";
        document.querySelectorAll("#destinationList .nodeConnector").forEach((n) => {
          if (!n.classList.contains("connected")) {
            n.classList.add("chooseDestination");
          }
        });
      });
      sourceNode.appendChild(nodeConnector);
      sourceList.appendChild(sourceNode);
    });

    // Create nodes for destination list based on destination map
    Object.entries(destinationMap).forEach(([key, value], index) => {
      const destinationNode = document.createElement("div");
      destinationNode.classList.add("node");
      const nodeConnector = document.createElement("span");
      nodeConnector.classList.add("nodeConnector");
      nodeConnector.style.cursor = "pointer";
      nodeConnector.setAttribute("forNode", "node_" + (columnHeadings.length + index + 1));
      nodeConnector.addEventListener("click", (e) => {
        if (nodeConnector.classList.contains("connected")) {
          return;
        }
        const startNode = document.querySelector(".nodeConnector.chooseConnection");
        connectElements(startNode, nodeConnector);
        startNode.classList.remove("chooseConnection");
        startNode.classList.add("connected");
        startNode.previousSibling.querySelector(".mdi-delete").style.visibility = "visible";
        nodeConnector.classList.add("connected");
        document.querySelectorAll("#destinationList .nodeConnector").forEach((n) => {
          n.classList.remove("chooseDestination");
        });
      });
      destinationNode.appendChild(nodeConnector);
      const destinationItem = document.createElement("div");
      destinationItem.classList.add("item");
      destinationItem.setAttribute("draggable", "true");
      destinationItem.id = "node_" + (columnHeadings.length + index + 1);
      destinationItem.textContent = value.field;
      destinationNode.appendChild(destinationItem);
      destinationList.appendChild(destinationNode);
    });

    // Append source list and destination list to container
    container.textContent = "";
    container.appendChild(sourceList);
    container.appendChild(destinationList);
    document.querySelector("#metadata-mapper-dropzone").style.display = "none";
    document.querySelector("#metadata-mapper .curate-select-container").style.display = "none";
    return container;
  } catch (error) {
    console.error(error);
  }
}
function setupCSV() {
  const destinationSchemas = [];

  Curate.api
    .fetchCurate("/a/user-meta/namespace", "GET", null)
    .then((data) => {
      // Do something with the returned data
      data.Namespaces.forEach((obj) => {
        const nsSet = obj.Label.split("-")[0];
        if (nsSet !== nsSet.toUpperCase() || nsSet === "IMPORT" || nsSet === "EXPORT") {
          return;
        }
        const label = obj.Label.replace(/ /g, ""); // remove spaces from label for field name
        const field = {
          field: `${obj.Label}`,
          props: {},
        };

        const destinationSchema = destinationSchemas.find((item) => item.schema === nsSet);
        if (!destinationSchema) {
          destinationSchemas.push({ schema: nsSet, fields: [field] });
        } else {
          destinationSchema.fields.push(field);
        }
      });

      // Code that depends on the fetched data

      const mapper = document.querySelector("#metadata-mapper");
      const csvInput = document.querySelector("#file-input");
      csvInput.addEventListener("change", function (event) {
        const file = event.target.files[0];
        csvToNodes(
          file,
          destinationSchemas.find(
            (schema) => schema.schema === document.querySelector("#destinationSchema").value,
          ).fields,
        );
      });
      const controlsContainer = document.createElement("div");
      const destinationSelectorContainer = document.createElement("div");
      destinationSelectorContainer.classList.add("curate-select-container");
      const destinationSelector = document.createElement("select");
      destinationSelector.id = "destinationSchema";

      const destinationLabel = document.createElement("label");
      destinationLabel.textContent = "Select a destination schema ";
      destinationLabel.for = destinationSelector;
      destinationSchemas.forEach((s) => {
        let o = document.createElement("option");
        o.value = s.schema;
        o.textContent = s.schema;
        destinationSelector.appendChild(o);
      });
      destinationSelectorContainer.appendChild(destinationLabel);
      destinationSelectorContainer.appendChild(destinationSelector);

      controlsContainer.appendChild(destinationSelectorContainer);
      const generateMapButton = document.createElement("button");
      generateMapButton.classList.add("curate-basic-button");
      const genIcon = document.createElement("span");
      genIcon.style.marginRight = "0.2em";
      genIcon.classList.add("mdi");
      genIcon.classList.add("mdi-format-list-checks");
      generateMapButton.textContent = "Generate Map";
      generateMapButton.addEventListener("click", (e) => {
        console.log(getMapping());
      });
      generateMapButton.prepend(genIcon);
      mapper.appendChild(controlsContainer);
      mapper.appendChild(generateMapButton);
    })
    .catch((error) => {
      // Handle errors from the fetch
      console.error("Error fetching data:", error);
    });
}

function activateDropZone(e) {
  e = e || window.event;
  if (e.target.id == "file-input") {
    return;
  }
  document.querySelector('.drop-zone input[type="file"]').click();
}
function getMapping() {
  return Array.from(document.querySelectorAll("#connectorCanvas canvas")).map((c) => {
    let from = document
      .getElementById(c.getAttribute("fromNode"))
      .querySelector("label").textContent;
    let to = document.getElementById(c.getAttribute("toNode")).textContent;
    return { field: from, mapsTo: to };
  });
}

// Usage
const metdataMapperPopup = new Curate.ui.modals.curatePopup(
  { title: "Metadata Mappings" },
  {
    afterLoaded: function (popup) {
      let p = document.createElement("div");
      p.innerHTML =
        '<div id="metadata-mapper" class="metadata-mapper-main-containers"><div class="config-text-label">Create or Edit Mappings</div><div id="map-nodes-container" class="map-nodes-container">Choose a source schema CSV to get started.</div><div id="connectorCanvas"></div><div id="metadata-mapper-dropzone" class="drop-zone" style="background-color: rgb(245, 245, 245);margin-bottom:0.5em;"><p>Drop a Source Schema CSV, or Browse</p><input type="file" id="file-input"></div></div><div id="saved-mappings" class="metadata-mapper-main-containers"><div class="config-text-label">Saved Mappings</div></div>';
      p.style.width = "100%";
      p.style.maxHeight = "inherit";
      p.style.display = "flex";
      p.style.justifyContent = "space-between";
      popup.querySelector(".config-main-options-container").appendChild(p);
      p.querySelector("#metadata-mapper-dropzone").addEventListener("click", (e) => {
        activateDropZone(e);
      });
      setupCSV();
    },
    afterClosed: function () {},
  },
);

// To spawn the popup
metdataMapperPopup.fire();
