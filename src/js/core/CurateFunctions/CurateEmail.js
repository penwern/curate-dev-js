const CurateEmail = {
  /**
   * Launch the archive processing modal for the currently selected MBOX or PST file.
   * Validates the selection and file type before launching the processing workflow.
   */
  processArchive: function () {
    const API_BASE_URL = `${window.location.origin}/api/email/api`;

    const selection = window.pydio?._dataModel?._selectedNodes || [];
    if (!selection.length || selection.length > 1) {
      Curate.ui.modals.curatePopup(
        {
          title: "Process Archive",
          type: "error",
          message: "Select a single archive to process before launching this action.",
          buttonType: "close",
        },
        {}
      ).fire();
      return;
    }

    const selectedNode = selection[0];
    const meta = selectedNode._metadata;
    const fileName = meta.get("name");
    const mimeType = meta.get("mime");

    // Validate file extension
    if (!fileName.endsWith(".pst") && !fileName.endsWith(".mbox")) {
      Curate.ui.modals.curatePopup(
        {
          title: "Process Archive",
          type: "error",
          message: "Selected item must be an MBOX or PST file.",
          buttonType: "close",
        },
        {}
      ).fire();
      return;
    }

    // Validate MIME type matches file extension
    const isPst = fileName.endsWith(".pst");
    const isMbox = fileName.endsWith(".mbox");
    const validMimeForPst = mimeType === "application/octet-stream";
    const validMimeForMbox = mimeType === "text/plain" || mimeType.startsWith("text/plain;");

    if ((isPst && !validMimeForPst) || (isMbox && !validMimeForMbox)) {
      Curate.ui.modals.curatePopup(
        {
          title: "Process Archive",
          type: "error",
          message: "Selected item must be an MBOX or PST file.",
          buttonType: "close",
        },
        {}
      ).fire();
      return;
    }

    const nodeLabel =
      selectedNode.getLabel?.() ||
      selectedNode.getPath?.() ||
      selectedNode._label ||
      selectedNode._path ||
      "Archive";

    const workspaceSlug = Curate.workspaces.getOpenWorkspace?.() || "";
    const relativePath = String(selectedNode._path || "")
      .replace(/^\/+/, "")
      .trim();
    if (!relativePath) {
      Curate.ui.modals.curatePopup(
        {
          title: "Process Archive",
          message: "Could not determine the path for the selected item.",
          buttonType: "close",
          type: "error",
        },
        {}
      ).fire();
      return;
    }
    const sourceUri = workspaceSlug
      ? `${workspaceSlug}/${relativePath}`
      : relativePath;

    const POLL_INTERVAL_MS = 5000;
    const TERMINAL_STATUSES = new Set(["completed", "failed"]);

    let modalInstance;
    let pollTimeoutId = null;
    let latestStatus = null;
    let previousBodyOverflow = null;

    const templateContent = `
      <archive-processing-status style="display:flex; justify-content:center;" data-role="status-card"></archive-processing-status>
    `;

    let statusComponent = null;

    function stopPolling() {
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId);
        pollTimeoutId = null;
      }
    }

    function schedulePoll(jobId) {
      stopPolling();
      pollTimeoutId = window.setTimeout(() => pollJobStatus(jobId), POLL_INTERVAL_MS);
    }

    function updateBadgeForStatus(status) {
      if (!modalInstance?.updateBadge) return;
      if (status && TERMINAL_STATUSES.has(status)) {
        modalInstance.updateBadge(0);
      } else if (status) {
        modalInstance.updateBadge(1);
      }
    }

    function setJobDetails(job) {
      latestStatus = job.status;
      if (statusComponent) {
        statusComponent.loading = false;
        statusComponent.error = "";
        statusComponent.job = job;
      }

      updateBadgeForStatus(job.status);
      const minimizeLabel = TERMINAL_STATUSES.has(job.status)
        ? `Processed: ${nodeLabel}`
        : `Processing: ${nodeLabel}`;
      modalInstance.updateMinimizeLabel?.(minimizeLabel);
    }

    function showError(message) {
      if (statusComponent) {
        statusComponent.loading = false;
        statusComponent.error = message;
      }
      updateBadgeForStatus("failed");
    }

    async function requestJobStatus(jobId) {
      return Curate.api.fetchCurate(
        `/archives/status/${encodeURIComponent(jobId)}`,
        "GET",
        undefined,
        API_BASE_URL
      );
    }

    async function requestJobSubmission() {
      return Curate.api.fetchCurate(
        "/archives/ingest",
        "POST",
        {
          sourceUri,
        },
        API_BASE_URL
      );
    }

    async function pollJobStatus(jobId) {
      try {
        const job = await requestJobStatus(jobId);
        setJobDetails(job);
        if (!TERMINAL_STATUSES.has(job.status)) {
          schedulePoll(job.jobId);
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
        showError(error.message || "Unable to retrieve job status.");
        schedulePoll(jobId);
      }
    }

    async function submitJob() {
      try {
        const job = await requestJobSubmission();
        setJobDetails(job);
        if (!TERMINAL_STATUSES.has(job.status)) {
          schedulePoll(job.jobId);
        }
      } catch (error) {
        console.error("Failed to submit archive processing job:", error);
        showError(error.message || "Failed to submit archive for processing.");
      }
    }

    modalInstance = new Curate.ui.modals.curatePopup(
      {
        title: `Process Archive - ${nodeLabel}`,
        buttonType: "close",
        minimizable: true,
        minimizeLabel: `Processing: ${nodeLabel}`,
        minimizeIcon: "mdi-progress-clock",
        badgeCount: 1,
        content: templateContent,
      },
      {
        afterLoaded(container) {
          previousBodyOverflow = document.body.style.overflow;
          document.body.style.overflow = "hidden";

          container.style.overflow = "hidden";
          container.style.alignItems = "center";
          container.style.justifyContent = "center";
          container.style.paddingTop = "0";
          container.style.paddingBottom = "0";

          const modalContent = container.querySelector(".config-modal-content");
          if (modalContent) {
            modalContent.style.overflow = "hidden";
            modalContent.style.maxHeight = "none";
            modalContent.style.paddingBottom = "24px";
            modalContent.style.paddingTop = "24px";
          }

          const modalScrollRegion = container.querySelector(".config-modal-main-options-container") ||
            container.querySelector(".config-main-options-container");
          if (modalScrollRegion) {
            modalScrollRegion.style.overflow = "hidden";
            modalScrollRegion.style.maxHeight = "none";
            modalScrollRegion.style.display = "block";
            modalScrollRegion.style.padding = "0";
          }

          const actionButtons = container.querySelector(".action-buttons");
          if (actionButtons) {
            actionButtons.style.marginTop = "16px";
          }

          statusComponent = container.querySelector("archive-processing-status");
          if (statusComponent) {
            statusComponent.sourceUri = sourceUri;
            statusComponent.loading = true;
          }
          submitJob();
        },
        afterClosed() {
          stopPolling();
          if (previousBodyOverflow !== null) {
            document.body.style.overflow = previousBodyOverflow;
            previousBodyOverflow = null;
          }
        },
        afterMinimized() {
          updateBadgeForStatus(latestStatus);
        },
        afterRestored() {
          updateBadgeForStatus(latestStatus);
        },
      }
    );

    modalInstance.fire();
  }
};

export default CurateEmail;
