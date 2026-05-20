class SchemaFieldMapper extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.baseUrl = "127.0.0.1:8000";
    Object.assign(this, {
      _connections: new Map(),
      _activeNode: null,
      _sourceFields: [],
      _isNewSource: false,
      _availableSchemas: null,
      _availableSchemas1: [
        {
          id: "s1",
          name: "Customer Schema",
          fields: ["firstName", "lastName", "email"],
        },
        { id: "s2", name: "User Schema", fields: ["name", "contactEmail"] },
      ],
      _destinationSchemas: null,
    });

    // Create ResizeObserver for the mapping container
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const container = entry.target;
        const sourceList = container.querySelector("#sourceFields");
        const destList = container.querySelector("#destFields");
        const svg = container.querySelector("svg");

        if (sourceList && destList && svg) {
          const maxHeight = Math.max(
            sourceList.getBoundingClientRect().height,
            destList.getBoundingClientRect().height,
          );

          container.style.height = `${maxHeight}px`;
          svg.setAttribute("height", maxHeight);
          this._renderConnections();
        }
      }
    });
  }

  async connectedCallback() {
    const style = document.createElement("style");
    fetch("styles.css")
      .then((response) => response.text())
      .then((css) => {
        style.textContent = css;
        this.shadowRoot.appendChild(style);
      });

    this._resizeObserver = new ResizeObserver(() => this._renderConnections());
    this._resizeObserver.observe(this);

    this._availableSchemas = await fetch("http://" + this.baseUrl + "/schema/mappings/").then((r) =>
      r.json(),
    );

    this._destinationSchemas = await fetch("http://" + this.baseUrl + "/schema/schemas")
      .then((r) => r.json())
      .then((r) => r.metadata_schemas);

    this.shadowRoot.innerHTML = `
      <div class="container">
        <div class="header">
          <div class="input-group">
            <label for="sourceSelect">Source Schema</label>
            <select id="sourceSelect">
              <option value="">Select a Source Schema</option>
              <option value="">Create New Schema</option>
              
              ${Object.keys(this._availableSchemas)
                .map((s) => {
                  console.log("wanker: ", s);
                  return `<option value="${s}">${s}</option>`;
                })
                .join("")}
            </select>
          </div>
          <div class="input-group">
            <label for="destSelect">Destination Schema</label>
            <select id="destSelect">
              <option value="">Select Destination Schema</option>
              ${this._destinationSchemas
                .map((s) => `<option value="${s.name}">${s.label}</option>`)
                .join("")}
            </select>
          </div>
        </div>
        <div class="mapping-container">
          <div class="mapping-area">
            <div class="column-header">
              <input type="text" class="schema-name-input" id="sourceSchemaName" placeholder="Source Schema Name">
            </div>
            <div class="field-list" id="sourceFields"></div>
          </div>
          <svg></svg>
          <div class="mapping-area">
            <div class="column-header">
              <div id="destSchemaName"></div>
            </div>
            <div class="field-list" id="destFields"></div>
          </div>
        </div>
        <button class="save-btn" style="display:none;">Save Mapping</button>
      </div>
    `;
    this._attachEvents();
  }
  _schemaChange(type, e, nameElement) {
    const newValue = e.target.value;
    let selectedSchema;

    if (type === "source") {
      if (newValue) {
        selectedSchema = Object.entries(this._availableSchemas).find((s) => s[0] === newValue)[1];
        if (selectedSchema) {
          this._sourceSchema = selectedSchema;
          this._sourceFields = [...Object.keys(selectedSchema.mappings)];
          nameElement.value = selectedSchema.system_name;

          // Clear existing connections before loading new ones
          this._connections = new Map();

          // Load existing connections if we have both source and destination schemas
          if (this._destinationSchema) {
            this._loadExistingConnections();
          }
        }
      } else {
        this._sourceSchema = null;
        this._sourceFields = [""];
        nameElement.value = "";
        this._connections = new Map();
      }
    } else if (type === "destination") {
      selectedSchema = this._destinationSchemas.find((s) => s.name === newValue);
      if (selectedSchema) {
        this._destinationSchema = selectedSchema;
        nameElement.textContent = selectedSchema.label || "";

        // Load existing connections if we have both schemas
        if (this._sourceSchema) {
          this._loadExistingConnections();
        }
      } else {
        this._destinationSchema = null;
        nameElement.textContent = "";
        this._connections = new Map();
      }
    }

    this._updateView();
  }
  _saveMapping = () => {
    if (!this._sourceSchema || !this._destinationSchema) {
      console.error("Source or destination schema not selected");
      return;
    }

    // Get the source schema name
    const sourceSchemaName = this._sourceSchema.system_name;

    // Convert the connections to the required mapping format
    const newMappings = {};

    // Process each connection
    this._connections.forEach(({ source, dest }) => {
      // Get source field name from the source fields array
      const sourceIndex = parseInt(source.split("-")[1]);
      const sourceField = this._sourceFields[sourceIndex];

      // Get destination field info from the destination schema
      const destIndex = parseInt(dest.split("-")[1]);
      const destField = this._destinationSchema.fields[destIndex];

      // Initialize array for this source field if it doesn't exist
      if (!newMappings[sourceField]) {
        newMappings[sourceField] = [];
      }

      // Create the mapping object based on the destination schema type
      const mapping = {
        [destField.schema_type]: destField.name,
      };

      // Add the mapping to the array
      newMappings[sourceField].push(mapping);
    });

    // Create the updated schema object
    const updatedSchema = {
      ...this._sourceSchema,
      mappings: newMappings,
    };

    // Update the available schemas
    this._availableSchemas[sourceSchemaName] = updatedSchema;

    // Log the updated schemas (in practice, you might want to send this to your backend)
    console.log("Updated schemas:", this._availableSchemas);
  };
  _attachEvents() {
    const sourceSelect = this.shadowRoot.getElementById("sourceSelect");
    const destSelect = this.shadowRoot.getElementById("destSelect");
    const sourceSchemaName = this.shadowRoot.getElementById("sourceSchemaName");
    const destSchemaName = this.shadowRoot.getElementById("destSchemaName");
    const saveBtn = this.shadowRoot.querySelector(".save-btn");

    saveBtn.addEventListener("click", this._saveMapping);

    sourceSelect.addEventListener("change", (e) => {
      this._schemaChange("source", e, sourceSchemaName);
    });

    destSelect.addEventListener("change", (e) => {
      this._schemaChange("destination", e, destSchemaName);
    });

    // Handle schema name changes
    sourceSchemaName.addEventListener("change", (e) => {
      if (this._sourceSchema) {
        this._sourceSchema.name = e.target.value;
      }
    });

    destSchemaName.addEventListener("change", (e) => {
      if (this._destinationSchema) {
        this._destinationSchema.name = e.target.value;
      }
    });

    this.shadowRoot.addEventListener("click", (e) => {
      if (e.target.classList.contains("connection-node")) this._handleNodeClick(e.target);
    });
  }
  _getFieldConnections(fieldId) {
    const connections = [];
    this._connections.forEach(({ source, dest }, id) => {
      if (source === fieldId || dest === fieldId) {
        connections.push({
          id,
          otherField: source === fieldId ? dest : source,
        });
      }
    });
    return connections;
  }

  _getFieldName(fieldId) {
    if (fieldId.startsWith("src-")) {
      const index = parseInt(fieldId.split("-")[1]);
      return this._sourceFields[index] || "Unnamed Field";
    } else {
      const index = parseInt(fieldId.split("-")[1]);
      return this._destinationSchema?.fields[index].label || "Unnamed Field";
    }
  }
  _updateView() {
    if (!this._destinationSchema) return;
    const container = this.shadowRoot.querySelector(".mapping-container");
    const saveBtn = this.shadowRoot.querySelector(".save-btn");
    container.style.display = "grid";
    saveBtn.style.display = "inline";
    this._renderFields();
    this._resizeObserver.observe(container);
  }

  _renderFields() {
    const sourceContainer = this.shadowRoot.getElementById("sourceFields");
    const destContainer = this.shadowRoot.getElementById("destFields");

    // Render source fields with connection menu
    sourceContainer.innerHTML = `
      ${this._sourceFields
        .map((field, i) => {
          const fieldId = `src-${i}`;
          const connections = this._getFieldConnections(fieldId);
          return `
          <div class="field-item">
            <input type="text" class="field-input" placeholder="Field name" value="${field}">
            ${
              connections.length > 0
                ? `
              <div class="connection-menu" data-field="${fieldId}">
                ${connections.length} connection${connections.length > 1 ? "s" : ""}
              </div>
            `
                : ""
            }
            <div class="connection-node" data-field="${fieldId}"></div>
          </div>
        `;
        })
        .join("")}
      <button class="add-field-btn">+ Add Field</button>
    `;

    // Render destination fields without connection menu
    destContainer.innerHTML = this._destinationSchema.fields
      .map((field, i) => {
        const fieldId = `dst-${i}`;
        return `
        <div class="field-item">
          <div class="connection-node" data-field="${fieldId}"></div>
          <span>${field.label}</span>
        </div>
      `;
      })
      .join("");

    // Add field button functionality
    sourceContainer.querySelector(".add-field-btn").onclick = () => {
      this._sourceFields.push("");
      this._renderFields();
    };

    // Input change handler for source fields
    sourceContainer.addEventListener("input", (e) => {
      if (e.target.classList.contains("field-input")) {
        const index = [...sourceContainer.querySelectorAll(".field-input")].indexOf(e.target);
        this._sourceFields[index] = e.target.value;
      }
    });

    // Handle connection menu clicks
    this.shadowRoot.querySelectorAll(".connection-menu").forEach((menu) => {
      menu.addEventListener("click", (e) => {
        e.stopPropagation();
        const fieldId = menu.dataset.field;
        const connections = this._getFieldConnections(fieldId);

        // Remove any existing dropdowns
        this.shadowRoot.querySelectorAll(".connection-dropdown").forEach((d) => d.remove());

        const dropdown = document.createElement("div");
        dropdown.className = "connection-dropdown";
        dropdown.innerHTML = connections
          .map(
            ({ id, otherField }) => `
          <div class="connection-item" data-connection-id="${id}">
            <span>${this._getFieldName(otherField)}</span>
            <span class="disconnect-btn">Disconnect</span>
          </div>
        `,
          )
          .join("");

        menu.appendChild(dropdown);
        menu.classList.add("open");

        // Handle dropdown item clicks
        dropdown.addEventListener("click", (e) => {
          const item = e.target.closest(".connection-item");
          if (item && e.target.classList.contains("disconnect-btn")) {
            const connectionId = item.dataset.connectionId;
            this._connections.delete(connectionId);
            this._renderFields();
            this._renderConnections();
          }
        });

        // Close dropdown when clicking outside
        const closeDropdown = (e) => {
          if (!menu.contains(e.target)) {
            dropdown.remove();
            menu.classList.remove("open");
            document.removeEventListener("click", closeDropdown);
          }
        };
        document.addEventListener("click", closeDropdown);
      });
    });

    this._renderConnections();
  }

  _handleNodeClick(node) {
    if (!this._activeNode) {
      this._activeNode = node;
      node.classList.add("active");
    } else {
      const first = this._activeNode;
      const second = node;
      const isFirstSource = first.dataset.field.startsWith("src-");
      const isSecondSource = second.dataset.field.startsWith("src-");

      if (isFirstSource !== isSecondSource) {
        const sourceNode = isFirstSource ? first : second;
        const destNode = isFirstSource ? second : first;
        console.log("src: ", sourceNode.dataset.field, destNode.dataset.field);
        this._createConnection(sourceNode.dataset.field, destNode.dataset.field);
      }

      this._activeNode.classList.remove("active");
      this._activeNode = null;
    }
  }

  _createConnection = (sourceId, destId) => {
    const connectionId = `${sourceId}-${destId}`;
    if (!this._connections.has(connectionId)) {
      console.log("??????: ", connectionId, { source: sourceId, dest: destId });
      this._connections.set(connectionId, { source: sourceId, dest: destId });
      console.log("ththththth: ", this._connections);
      this._renderFields();
    }
  };

  _renderConnections() {
    const svg = this.shadowRoot.querySelector("svg");
    if (!svg) return;

    // Get container and its dimensions
    const container = this.shadowRoot.querySelector(".mapping-container");
    const sourceList = this.shadowRoot.getElementById("sourceFields");
    const destList = this.shadowRoot.getElementById("destFields");

    // Calculate the maximum height needed
    const maxHeight = Math.max(
      sourceList.getBoundingClientRect().height,
      destList.getBoundingClientRect().height,
    );

    // Set container and SVG height

    svg.setAttribute("width", container.getBoundingClientRect().width);
    svg.setAttribute("height", maxHeight);
    svg.innerHTML = "";

    this._connections.forEach(({ source, dest }, connectionId) => {
      console.log("fuucking cuunt asrrrrrrr: ");
      const sourceNode = this.shadowRoot.querySelector(`[data-field="${source}"].connection-node`);

      const destNode = this.shadowRoot.querySelector(`[data-field="${dest}"].connection-node`);

      if (sourceNode && destNode) {
        const sourceRect = sourceNode.getBoundingClientRect();
        const destRect = destNode.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const x1 = sourceRect.right - svgRect.left;
        const y1 = sourceRect.top - svgRect.top + sourceRect.height / 2;
        const x2 = destRect.left - svgRect.left;
        const y2 = destRect.top - svgRect.top + destRect.height / 2;

        // Create a group for the connection
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.classList.add("connection-group");
        group.setAttribute("data-connection-id", connectionId);

        // Create the path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.classList.add("connection-line");

        // Calculate control points for the curve
        const dx = x2 - x1;
        const midX = x1 + dx / 2;
        path.setAttribute("d", `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`);

        // Create the delete button
        const foreignObject = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "foreignObject",
        );
        foreignObject.setAttribute("width", "44"); // Increased width
        foreignObject.setAttribute("height", "44"); // Increased height

        // Adjust position to center the button
        foreignObject.setAttribute("x", midX - 12); // Subtract half the width
        foreignObject.setAttribute("y", (y1 + y2) / 2 - 12); // Subtract half the height

        const deleteButton = document.createElement("div");
        deleteButton.className = "delete-connection";
        deleteButton.innerHTML = "×";
        deleteButton.onclick = (e) => {
          e.stopPropagation();
          this._connections.delete(connectionId);
          this._renderConnections();
        };

        foreignObject.appendChild(deleteButton);
        group.appendChild(path);
        group.appendChild(foreignObject);
        svg.appendChild(group);
      }
    });
  }
  _loadExistingConnections() {
    // Clear existing connections
    this._connections = new Map();

    // Get the mappings from the source schema
    const mappings = this._sourceSchema.mappings;

    // Iterate through each source field
    Object.entries(mappings).forEach(([sourceField, mappingArray]) => {
      // Find the index of the source field in our _sourceFields array
      const sourceIndex = this._sourceFields.indexOf(sourceField);
      if (sourceIndex === -1) return;

      // For each mapping in the mapping array
      mappingArray.forEach((mapping) => {
        // Get the schema type and field name from the mapping
        const [schemaType, fieldName] = Object.entries(mapping)[0];

        // Only process if this mapping is for our selected destination schema
        if (schemaType === this._destinationSchema.metadata_prefix) {
          // Find the destination field index
          const destField = this._getDestinationFieldByName(fieldName);
          if (destField) {
            // Create the connection using field IDs
            const sourceId = `src-${sourceIndex}`;
            const destId = `dst-${destField.index}`;
            const connectionId = `${sourceId}-${destId}`;

            this._connections.set(connectionId, {
              source: sourceId,
              dest: destId,
            });
          }
        }
      });
    });
  }

  _getDestinationFieldByName(fieldName, fields = this._destinationSchema.fields, parentIndex = "") {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const currentIndex = parentIndex ? `${parentIndex}-${i}` : i;

      if (field.name === fieldName) {
        return { ...field, index: currentIndex };
      }

      // If this is a collection, recursively search its fields
      if (field.type === "collection" && field.fields) {
        const found = this._getDestinationFieldByName(fieldName, field.fields, currentIndex);
        if (found) return found;
      }
    }
    return null;
  }
}

customElements.define("schema-field-mapper", SchemaFieldMapper);
