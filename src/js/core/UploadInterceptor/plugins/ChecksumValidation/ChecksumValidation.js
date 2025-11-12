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
}

function waitForPremisAndApplyTag(node, filePath, integrityTag, retryCount = 0) {
  const maxRetries = 10; // Max number of retries waiting for Premis and virus scan
  const retryDelay = 3000; // Delay in ms before retrying

  // Check if both required metadata exist on the node
  const hasPremis = node.MetaStore && node.MetaStore.Premis;
  const hasVirusScan = node.MetaStore && node.MetaStore["usermeta-virus-scan-first"];

  if (hasPremis && hasVirusScan) {
    // Both required metadata exist, safe to apply the integrity tag
    console.log(`Premis and virus scan metadata found for ${filePath}, applying integrity tag.`);
    updateMetaField(
      node.Uuid,
      "usermeta-file-integrity",
      integrityTag
    );
  } else if (retryCount < maxRetries) {
    // Required metadata not yet available, retry after delay
    const missing = [];
    if (!hasPremis) missing.push("Premis");
    if (!hasVirusScan) missing.push("virus-scan");
    console.log(
      `Waiting for metadata (${missing.join(", ")}) on ${filePath}. Retrying (${
        retryCount + 1
      }/${maxRetries})...`
    );
    setTimeout(() => {
      waitForPremisAndApplyTag(node, filePath, integrityTag, retryCount + 1);
    }, retryDelay);
  } else {
    // Max retries reached, apply tag anyway
    console.warn(
      `Max retries reached waiting for required metadata on ${filePath}. Applying integrity tag anyway.`
    );
    updateMetaField(
      node.Uuid,
      "usermeta-file-integrity",
      integrityTag
    );
  }
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
    // Defer tag writing until Premis metadata exists
    waitForPremisAndApplyTag(
      node,
      filePath,
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
    // Defer tag writing until Premis metadata exists
    waitForPremisAndApplyTag(
      node,
      filePath,
      "X Integrity compromised"
    );
  }
}

// Initialize worker manager (singleton for all checksum operations)
let workerManager = null;

async function generateChecksum(uploadItem) {
  if (!workerManager) {
    workerManager = new ChecksumWorkerManager();
  }

  const multipartDecisionThreshold = PydioApi.getMultipartThreshold();
  const multipartPartSize = PydioApi.getMultipartPartSize();

  let finalChecksum;

  try {
    // Calculate checksum: use multipart calculation for large files, single MD5 for smaller ones.
    if (uploadItem._file.size > multipartDecisionThreshold) {
      // Multipart checksum logic:
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
  console.log("constructing file path for item: ", uploadItem);

  // Extract the file path from the presigned URL responseURL.
  // This is the source of truth for where the file was actually uploaded.
  const responseURL = uploadItem.xhr?.responseURL;

  if (responseURL) {
    try {
      // Parse the URL to extract the path between /io/ and the query parameters
      const url = new URL(responseURL);
      const pathname = url.pathname;

      // Extract everything after /io/
      const ioIndex = pathname.indexOf('/io/');
      if (ioIndex !== -1) {
        const pathAfterIo = pathname.substring(ioIndex + 4); // +4 to skip '/io/'
        // Decode URI components to handle encoded characters
        const decodedPath = decodeURIComponent(pathAfterIo);
        console.log("Extracted path from responseURL:", decodedPath);
        return decodedPath;
      }
    } catch (error) {
      console.error("Failed to parse responseURL:", error);
      // Fall through to legacy path construction
    }
  }

  // Fallback to legacy path construction if responseURL is unavailable
  console.warn("responseURL not available, using legacy path construction");
  const workspace = Curate.workspaces.getOpenWorkspace();
  const targetPath = uploadItem._targetNode._path;
  const relativeFilePath = uploadItem._file.webkitRelativePath;
  const finalLabel = uploadItem._label;

  const normWorkspace = workspace.endsWith("/") ? workspace : workspace + "/";
  let normTarget = "";
  if (targetPath && targetPath !== "/") {
    normTarget = targetPath.replace(/^\/+|\/+$/g, "");
  }

  let fileComponent = "";
  if (relativeFilePath) {
    const lastSlashIndex = relativeFilePath.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      const dirPart = relativeFilePath.substring(0, lastSlashIndex + 1);
      fileComponent = dirPart + finalLabel;
    } else {
      fileComponent = finalLabel;
    }
    if (fileComponent.startsWith("/")) {
      fileComponent = fileComponent.substring(1);
    }
  } else {
    fileComponent = finalLabel;
  }

  let filename = normWorkspace;
  if (normTarget) {
    filename += normTarget + "/";
  }
  filename += fileComponent;
  filename = filename.replace(/\/+/g, "/");

  return filename;
}

// Export the plugin
export default {
  name: 'ChecksumValidation',

  hooks: {
    onUploadComplete: async (uploadItem) => {

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