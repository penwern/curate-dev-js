import ChecksumWorkerManager from "./ChecksumWorkerManager.js";

/**
 * ChecksumValidation Plugin for UploadInterceptor
 *
 * Generates client-side checksums for uploaded files and validates them
 * against server-side checksums to ensure file integrity.
 */

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function updateMetaField(uuid, namespace, value) {
  const url = "/a/user-meta/update";
  const metadatas = {
    MetaDatas: [
      {
        NodeUuid: uuid,
        Namespace: namespace,
        JsonValue: JSON.stringify(value),
        Policies: [
          { Action: "READ", Effect: "allow", Subject: "*" },
          { Action: "WRITE", Effect: "allow", Subject: "*" },
        ],
      },
    ],
    Operation: "PUT",
  };

  Curate.api.fetchCurate(url, "PUT", metadatas);
  console.log(`Attempted to update metadata '${namespace}' for UUID ${uuid}`);
}

function fetchCurateStats(filePath, expectedChecksum, retryCount) {
  Curate.api
    .fetchCurate("/a/tree/stats", "POST", {
      NodePaths: [filePath],
    })
    .then((data) => {
      const node = data.Nodes.find((node) => node.Path === filePath);
      if (node) {
        // If node data is found, proceed to validate its checksum.
        validateChecksum(node, expectedChecksum, filePath, retryCount);
      } else {
        // Handle case where the specific node wasn't found in the API response.
        // This might happen if path construction failed or the node doesn't exist.
        console.error("Node not found in stats response:", filePath);
        // Consider updating meta here to indicate a lookup failure if desired.
      }
    })
    .catch((error) => {
      // Handle errors during the API call itself (network issues, server errors).
      console.error("Error fetching node stats:", error, filePath);
      // Consider retrying or updating meta based on the error type if desired.
    });
}

function validateChecksum(node, expectedChecksum, filePath, retryCount) {
  const maxRetries = 3; // Max number of retries for 'temporary' Etag state.
  const retryDelay = 2000; // Delay in ms before retrying.

  // The backend might return 'temporary' if its Etag calculation isn't finished.
  // Retry fetching stats a few times if this occurs.
  if (node.Etag === "temporary" && retryCount < maxRetries) {
    console.log(
      `Checksum temporary for ${filePath}. Retrying (${
        retryCount + 1
      }/${maxRetries})...`
    );
    setTimeout(() => {
      fetchCurateStats(filePath, expectedChecksum, retryCount + 1);
    }, retryDelay);
  } else if (node.Etag === expectedChecksum) {
    // Checksum matches the expected value.
    console.log(`Checksum validation passed for ${filePath}.`);
    updateMetaField(
      node.Uuid,
      "usermeta-file-integrity", // Namespace for integrity status
      "✓ Integrity verified"
    );
  } else {
    // Checksum mismatch, or max retries for 'temporary' reached.
    console.error(
      `Checksum validation FAILED for ${filePath}.`,
      "Expected:",
      expectedChecksum,
      "Received:",
      node.Etag,
      `(Attempt ${retryCount + 1})`
    );
    updateMetaField(
      node.Uuid,
      "usermeta-file-integrity",
      "X Integrity compromised" // Status indicating failure
    );
  }
}

// Initialize worker manager (singleton for all checksum operations)
let workerManager = null;

async function generateChecksum(uploadItem) {
  if (!workerManager) {
    workerManager = new ChecksumWorkerManager();
    console.log("ChecksumWorkerManager initialized");
  }

  const multipartDecisionThreshold = PydioApi.getMultipartThreshold();
  const multipartPartSize = PydioApi.getMultipartPartSize();

  let finalChecksum;

  try {
    // Calculate checksum: use multipart calculation for large files, single MD5 for smaller ones.
    if (uploadItem._file.size > multipartDecisionThreshold) {
      // Multipart checksum logic:
      console.log(
        "File exceeds multipart threshold, generating part checksums for:",
        uploadItem._label
      );
      const partSize = multipartPartSize;
      const parts = Math.ceil(uploadItem._file.size / partSize);
      const partChecksumsHex = []; // Store hex for potential debugging
      // Allocate space for concatenated *binary* MD5 digests (16 bytes per digest).
      const partDigestsBinary = new Uint8Array(16 * parts);

      for (let i = 0; i < parts; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, uploadItem._file.size);
        const blob = uploadItem._file.slice(start, end);
        const checksumData = await workerManager.generateChecksum(blob);
        partChecksumsHex.push(checksumData.hash);

        // Convert the hex checksum to bytes and add it to the concatenated array.
        const digestBytes = hexToBytes(checksumData.hash);
        partDigestsBinary.set(digestBytes, i * 16);
      }

      const digestBlob = new Blob([partDigestsBinary]);
      const finalChecksumData = await workerManager.generateChecksum(digestBlob);
      finalChecksum = `${finalChecksumData.hash}-${parts}`; // Append part count

      console.log(
        "Generated multipart checksum:",
        finalChecksum,
        "Parts:",
        parts
      );
    } else {
      // Single part checksum calculation for smaller files.
      console.log(
        "File below multipart threshold, generating single checksum for:",
        uploadItem._label
      );
      const checksumData = await workerManager.generateChecksum(uploadItem._file);
      finalChecksum = checksumData.hash;
      console.log("Generated single checksum:", finalChecksum);
    }

    return finalChecksum;
  } catch (error) {
    console.error(
      "Client-side checksum generation failed:",
      error,
      "for file:",
      uploadItem._label
    );
    throw error;
  }
}

function constructFilePath(uploadItem) {
  // This logic determines the correct path to query for stats, accounting for
  // potential server-side renaming on filename collision (e.g., file.txt -> file-1.txt).
  const workspace = Curate.workspaces.getOpenWorkspace();
  const targetPath = uploadItem._targetNode._path; // Path of the destination folder.
  const relativeFilePath = uploadItem._file.webkitRelativePath; // Original path *within* an uploaded folder structure, or "" for single files.
  const finalLabel = uploadItem._label; // This property is updated by the UploaderModel to reflect the FINAL filename after potential renaming.

  // Normalize workspace and target paths to ensure correct slash handling.
  const normWorkspace = workspace.endsWith("/") ? workspace : workspace + "/";
  let normTarget = "";
  if (targetPath && targetPath !== "/") {
    // Handle root path '/'
    normTarget = targetPath.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes
  }

  let fileComponent = "";
  // Check if a folder structure was uploaded (relativeFilePath is not empty).
  if (relativeFilePath) {
    // Combine the original directory structure from relativeFilePath with the FINAL filename from finalLabel.
    const lastSlashIndex = relativeFilePath.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      // Extract the directory part (e.g., "folder/subfolder/")
      const dirPart = relativeFilePath.substring(0, lastSlashIndex + 1);
      fileComponent = dirPart + finalLabel; // Append the final filename
    } else {
      // Relative path contained only the original filename, so just use the final label.
      fileComponent = finalLabel;
    }
    // Ensure no leading slash inherited from relativeFilePath.
    if (fileComponent.startsWith("/")) {
      fileComponent = fileComponent.substring(1);
    }
  } else {
    // Single file upload, use the final label directly as the file component.
    fileComponent = finalLabel;
  }

  // Combine all parts into the final path.
  let filename = normWorkspace;
  if (normTarget) {
    filename += normTarget + "/"; // Add normalized target path if not root
  }
  filename += fileComponent; // Add the final file/path component
  filename = filename.replace(/\/+/g, "/"); // Clean up any resulting double slashes.

  return filename;
}

// Export the plugin
export default {
  name: 'ChecksumValidation',

  hooks: {
    onUploadComplete: async (uploadItem) => {
      console.log('ChecksumValidation: Processing upload completion for:', uploadItem._label);

      try {
        // Generate checksum for the uploaded file
        const finalChecksum = await generateChecksum(uploadItem);

        // Construct the file path for validation
        const filePath = constructFilePath(uploadItem);
        console.log("Constructed final path for stats API:", filePath);

        // Introduce a small delay before fetching stats.
        // Delay scales slightly with file size but is capped.
        const delay = Math.min(5000, Math.max(500, uploadItem._file.size * 0.01));
        setTimeout(() => {
          // Initiate the checksum validation process using the final path.
          fetchCurateStats(filePath, finalChecksum, 0);
        }, delay);

      } catch (error) {
        console.error(
          "ChecksumValidation: Failed to process upload:",
          error,
          "for file:",
          uploadItem._label
        );
      }
    }
  }
};