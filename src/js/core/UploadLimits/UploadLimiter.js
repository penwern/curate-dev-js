/* global maxUploadFiles */
import eventDelegator from "../CurateFunctions/CurateEvents.js";
import CurateUi from "../CurateFunctions/CurateUi.js";

// Track active uploads count
let activeUploadsCount = 0;
const DEFAULT_MAX_UPLOAD_FILES = 1000;
function getMaxUploadFiles() {
  // maxUploadFiles is a global constant, not a window property
  // this is so that it cannot be overwritten by the user
  // this could be done with Object.defineProperty,
  // but that's more complicated and not necessary
  let configuredLimit;
  try {
    configuredLimit = maxUploadFiles; // Will throw ReferenceError if not declared
  } catch (_e) {
    configuredLimit = undefined;
  }
  if (typeof configuredLimit === "number" && configuredLimit > 0) {
    return configuredLimit;
  }
  return DEFAULT_MAX_UPLOAD_FILES;
}

// Track which files should be disabled
const disabledFiles = new Set();

function showUploadLimitModal(fileCount) {
  const maxFiles = getMaxUploadFiles();
  const message = `Cannot upload more than ${maxFiles} files. You currently have ${activeUploadsCount} upload(s) in progress and tried to add ${fileCount} more.`;

  const popup = new CurateUi.modals.curatePopup(
    {
      title: "Upload Limit Reached",
      type: "warning",
      message,
      buttonType: "close",
    },
    {
      afterClosed: () => {},
    },
  );

  popup.fire();
}

// Lazily resolve the upload store because it may not be available at load
let uploadStoreInstance = null;
let uploadStoreReadyPromise = null;

async function waitForUploadStore() {
  if (uploadStoreInstance) {
    return uploadStoreInstance;
  }

  if (!uploadStoreReadyPromise) {
    uploadStoreReadyPromise = new Promise((resolve) => {
      const findStore = () => {
        const store = window?.UploaderModel?.Store?.getInstance?.();
        if (store) {
          uploadStoreInstance = store;
          patchUploadStore(uploadStoreInstance);
          resolve(uploadStoreInstance);
        } else {
          setTimeout(findStore, 50);
        }
      };

      findStore();
    });
  }

  return uploadStoreReadyPromise;
}

function patchUploadStore(store) {
  if (!store || store._uploadLimiterPatched) {
    return;
  }

  store._uploadLimiterPatched = true;

  const originalPushSession = store.pushSession.bind(store);
  store.pushSession = function patchedPushSession(session) {
    const result = originalPushSession(session);
    observeSessionForLimiter(store, session);
    return result;
  };

  // Attach to already existing sessions if any
  if (Array.isArray(store._sessions)) {
    store._sessions.forEach((session) => observeSessionForLimiter(store, session));
  }
}

// Helper function to recursively count files in folders
async function traverseFileTree(item, files) {
  if (item.isFile) {
    files.push(item);
  } else if (item.isDirectory) {
    const dirReader = item.createReader();
    // A reader may return only part of a directory (100 entries in Chromium).
    // Keep reading the same reader until it returns an empty batch.
    while (true) {
      const entries = await new Promise((resolve, reject) => {
        dirReader.readEntries(resolve, reject);
      });
      if (entries.length === 0) break;
      for (const entry of entries) {
        await traverseFileTree(entry, files);
      }
    }
  }
}

// Function to disable a specific file in the UI
function disableFileInUI(relativePath) {
  disabledFiles.add(relativePath);
  const element = document.getElementById(relativePath);
  if (element) {
    element.style.pointerEvents = "none";
    element.style.opacity = "0.6";
  }
}

// Function to enable a specific file in the UI
function enableFileInUI(relativePath) {
  disabledFiles.delete(relativePath);
  const element = document.getElementById(relativePath);
  if (element) {
    element.style.pointerEvents = "";
    element.style.opacity = "";
  }
}

// Reapply disabled state (handles rerenders)
function reapplyDisabledStates() {
  disabledFiles.forEach((relativePath) => {
    const element = document.getElementById(relativePath);
    if (element && element.style.pointerEvents !== "none") {
      element.style.pointerEvents = "none";
      element.style.opacity = "0.6";
    }
  });
}

// Listen for context changes (reload, navigation, etc.)
if (typeof pydio !== "undefined") {
  pydio.observe("context_changed", () => {
    if (disabledFiles.size > 0) {
      setTimeout(() => {
        reapplyDisabledStates();
      }, 100);
    }
  });
}

// Monitor upload progress and disable/enable files using PREPARED names
function monitorUploadProgress(store) {
  if (!store || !Array.isArray(store._sessions)) {
    return;
  }

  store._sessions.forEach((session) => {
    session.walk(
      (item) => {
        const preparedLabel = item.getLabel();
        const relativePath = "/" + preparedLabel;
        const status = item.getStatus();

        // Watch for status changes on this item
        if (!item._statusObserverAttached) {
          item._statusObserverAttached = true;

          item.observe("status", (newStatus) => {
            if (newStatus === "loading") {
              disableFileInUI(relativePath);
            } else if (newStatus === "loaded") {
              enableFileInUI(relativePath);
            }
          });
        }

        // Handle current state
        if (status === "loading") {
          disableFileInUI(relativePath);
        } else if (status === "loaded") {
          enableFileInUI(relativePath);
        }
      },
      (_item) => true,
      "file",
    );
  });
}

function observeSessionForLimiter(store, session) {
  if (!session) {
    return;
  }

  const triggerMonitor = () => monitorUploadProgress(store);

  const checkPreparationComplete = () => {
    const status = session.getStatus?.();

    if (status === "ready" || status === "loading") {
      triggerMonitor();
    } else {
      setTimeout(checkPreparationComplete, 100);
    }
  };

  session.observe?.("status", (newStatus) => {
    if (newStatus === "ready" || newStatus === "loading") {
      triggerMonitor();
    }
  });

  setTimeout(checkPreparationComplete, 100);
}

const handleDropEvent = async (e) => {
  const dataTransfer = e.dataTransfer;
  const transferTypes = Array.from(dataTransfer?.types || []);
  const hasFilePayload =
    transferTypes.includes("Files") ||
    (dataTransfer?.files && dataTransfer.files.length > 0) ||
    (dataTransfer?.items && Array.from(dataTransfer.items).some((item) => item.kind === "file"));

  if (!hasFilePayload) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  // The browser's drag data store is readable only during the synchronous
  // drop handler. Capture entries, not just DataTransferItem references, before
  // awaiting directory traversal or the upload store.
  const droppedFiles = Array.from(dataTransfer.files || []);
  const droppedItems = Array.from(dataTransfer.items || [])
    .filter((item) => item.kind === "file")
    .map((item) => {
      const entry = item.getAsEntry?.() || item.webkitGetAsEntry?.();
      const file = item.getAsFile?.();
      const capturedEntry =
        entry ||
        (file && {
          isFile: true,
          isDirectory: false,
          fullPath: "/" + file.name,
          file: (resolve) => resolve(file),
        });
      return capturedEntry
        ? {
            kind: "file",
            webkitGetAsEntry: () => capturedEntry,
            getAsFile: () => file,
          }
        : null;
    })
    .filter(Boolean);
  const targetNode = pydio.getContextHolder().getContextNode();

  try {
    // Count files (handles folders properly via async traversal)
    let fileCount = 0;

    if (droppedItems.length > 0) {
      const files = [];
      for (const item of droppedItems) {
        await traverseFileTree(item.webkitGetAsEntry(), files);
      }
      fileCount = files.length;
    } else {
      fileCount = droppedFiles.length;
    }

    const store = await waitForUploadStore();

    // Check limit
    if (activeUploadsCount + fileCount > getMaxUploadFiles()) {
      showUploadLimitModal(fileCount);
      return;
    }

    // Manually call Pydio's upload handler
    if (!store) {
      console.error("UploadLimiter: Unable to resolve upload store.");
      return;
    }

    store.handleDropEventResults(droppedItems, droppedFiles, targetNode);

    activeUploadsCount += fileCount;
  } catch (error) {
    console.error("UploadLimiter: Unable to process dropped files.", error);
    new CurateUi.modals.curatePopup({
      title: "Unable to Read Upload",
      type: "error",
      message: "Could not read the dropped files or directory. Please try again.",
      buttonType: "close",
    }).fire();
  }
};

const handleFileInputChange = (e) => {
  if (e.target.type === "file" && e.target.files.length > 0) {
    const fileCount = e.target.files.length;

    // Check limit
    if (activeUploadsCount + fileCount > getMaxUploadFiles()) {
      showUploadLimitModal(fileCount);
      e.target.value = "";
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    activeUploadsCount += fileCount;
  }
};

eventDelegator.addEventListener("body", "drop", handleDropEvent, { capture: true });
eventDelegator.addEventListener("input[type='file']", "change", handleFileInputChange, {
  capture: true,
});

// Hook into task completion for counting
if (typeof pydio !== "undefined") {
  pydio.observe("task_message", (e) => {
    if (
      e.TaskUpdated?.JobID === "curate-curation" &&
      e.TaskUpdated?.Status === "Finished" &&
      e.TaskUpdated?.TriggerOwner === pydio.user.id
    ) {
      if (activeUploadsCount > 0) {
        activeUploadsCount--;
      }
    }
  });
}

// Kick off the async lookup so the store is ready by the time uploads start
waitForUploadStore();
