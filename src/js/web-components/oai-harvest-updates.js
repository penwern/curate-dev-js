class OAIHarvestStatus extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.processQueue = [];
    this.runningProcesses = new Map();
    this.maxConcurrent = 5; // Maximum number of concurrent processes
  }

  connectedCallback() {
    this.render();
    this.processQueueInterval = setInterval(() => this.processQueuedItems(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this.processQueueInterval);
  }

  render() {
    this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 20px;
          }
          .status-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .status-item {
            background: var(--md-sys-color-background);
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            max-width:50vw;
          }
          .status-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          }
          .status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .status-title {
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
            margin-left: 10px;
          }
          .status-details {
            font-size: 0.9em;
            color: #666;
          }
          .status-message {
            margin-top: 10px;
            font-style: italic;
            color: #888;
          }
          .node-title {
            margin-top: 5px;
            font-size: 0.85em;
            color: #555;
          }
          .queued { background-color: #9e9e9e; }
          .loading { background-color: #ffd700; }
          .success { background-color: #4caf50; }
          .error { background-color: #f44336; }
          .progress-bar {
            height: 4px;
            background-color: #e0e0e0;
            border-radius: 2px;
            margin-top: 10px;
            overflow: hidden;
          }
          .progress-bar-fill {
            height: 100%;
            background-color: #2196f3;
            transition: width 0.3s ease;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          .pulsing {
            animation: pulse 1.5s infinite ease-in-out;
          }
        </style>
        <div class="status-container"></div>
      `;
  }

  addToQueue(node) {
    const id = this.generateUniqueId(node);
    const processInfo = {
      id,
      node,
      status: "queued",
      title: `Queued: ${node._metadata.get("usermeta-import-oai-link-id")}`,
      details: `Repository: ${node._metadata.get("usermeta-import-oai-repo-url")}`,
      nodeTitle: node._label,
    };
    this.processQueue.push(processInfo);
    this.updateStatusCard(processInfo);
  }

  async processQueuedItems() {
    while (this.runningProcesses.size < this.maxConcurrent && this.processQueue.length > 0) {
      const processInfo = this.processQueue.shift();
      this.runningProcesses.set(processInfo.id, processInfo);
      this.initiateHarvest(processInfo);
    }
  }

  async initiateHarvest(processInfo) {
    const { node, id } = processInfo;
    const repoUrl = node._metadata.get("usermeta-import-oai-repo-url");
    const identifier = node._metadata.get("usermeta-import-oai-link-id");
    const metadataPrefix = node._metadata.get("usermeta-import-oai-metadata-prefix");
    if (!repoUrl || !identifier || !metadataPrefix) {
      this.updateProcessStatus(
        id,
        "error",
        `Failed to harvest ${identifier}`,
        `Repository, identifier, or metadata prefix not found`,
        100,
      );
      return;
    }
    this.updateProcessStatus(
      id,
      "loading",
      `Harvesting ${identifier}`,
      `Repository: ${repoUrl}`,
      0,
    );

    try {
      const response = await fetch("http://127.0.0.1:5000/harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl, identifier, metadata_prefix: metadataPrefix }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw { message: errorData.error, data: errorData.data };
      }

      const data = await response.json();
      const updateMeta = this.convertJson(data);
      await Curate.api.files.updateMetadata(node, updateMeta);

      this.updateProcessStatus(
        id,
        "success",
        `Harvested ${identifier}`,
        `Successfully processed data from ${repoUrl}${identifier}`,
        100,
      );
    } catch (error) {
      this.updateProcessStatus(
        id,
        "error",
        `Failed to harvest ${identifier}`,
        `Error: ${error.message}: ${error.data ? error.data : ""}`,
        100,
      );
    } finally {
      this.runningProcesses.delete(id);
    }
  }

  updateProcessStatus(id, status, title, details, progress) {
    const processInfo = this.runningProcesses.get(id) || this.processQueue.find((p) => p.id === id);
    if (processInfo) {
      Object.assign(processInfo, { status, title, details, progress });
      this.updateStatusCard(processInfo);
    }
  }

  updateStatusCard(processInfo) {
    const container = this.shadowRoot.querySelector(".status-container");
    let statusItem = container.querySelector(`[data-id="${processInfo.id}"]`);

    if (!statusItem) {
      statusItem = document.createElement("div");
      statusItem.classList.add("status-item");
      statusItem.setAttribute("data-id", processInfo.id);
      container.appendChild(statusItem);
    }

    const { status, title, details, progress, nodeTitle } = processInfo;

    statusItem.innerHTML = `
        <div class="status-header">
          <span class="status-title" title="${title}">${title}</span>
          <span class="status-indicator ${status} ${status === "loading" ? "pulsing" : ""}"></span>
        </div>
        <div class="status-details" title="${details}">${details}</div>
        <div class="node-title" title="Node: ${nodeTitle}">Node: ${nodeTitle}</div>
        ${
          status === "loading"
            ? `
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${progress || 0}%"></div>
          </div>
        `
            : ""
        }
      `;
  }

  generateUniqueId(node) {
    return `${node._metadata.get("uuid")}-${node._metadata.get("usermeta-import-oai-link-id")}`;
  }

  convertJson(inputJson) {
    const schema = inputJson.schema;
    const dataFields = inputJson.data;
    let schemaArray = [];

    for (const key in dataFields) {
      if (Array.isArray(dataFields[key])) {
        let value = dataFields[key].join(", ");
        schemaArray.push({ field: key, value: value });
      }
    }

    let outputData = {};
    outputData[schema] = schemaArray;
    return outputData;
  }

  processAllNodes(nodes) {
    nodes.forEach((node) => this.addToQueue(node));
  }
}

// Register the web component
customElements.define("oai-harvest-status", OAIHarvestStatus);
