function convertJSON(inputJSON) {
  const nodePaths = [];
  for (const key in inputJSON) {
    if (inputJSON.hasOwnProperty(key)) {
      nodePaths.push(`quarantine/${key}`);
    }
  }
  return { NodePaths: nodePaths };
}
function compareChecksum(inputJSON, responseJSON) {
  const successfulResults = {};
  const failedResults = {};

  for (const key in inputJSON) {
    if (inputJSON.hasOwnProperty(key)) {
      const path = `quarantine/${key}`;
      const checksum = inputJSON[key];

      const matchedNode = responseJSON.Nodes.find((node) => node.Path === path);
      if (matchedNode) {
        const etag = matchedNode.Etag;
        if (checksum === etag) {
          successfulResults[path] = "Checksum matched.";
        } else {
          failedResults[path] = "Checksum mismatch.";
        }
      } else {
        failedResults[path] = "File not found in response.";
      }
    }
  }

  return { successfulResults, failedResults };
}

// Convert JSON
const manifestData = Curate.api.getFileData(pydio._dataModel._selectedNodes[0], "text");
const result = convertJSON(manifestData);
console.log(result);
Curate.api.fetchCurate("/a/tree/stats", "POST", result).then((result) => {
  // Call the function with input and response JSON
  const { successfulResults, failedResults } = compareChecksum(jsonData, result);
  console.log("Successful results:", successfulResults);
  console.log("Failed results:", failedResults);
  //todo emulate webuploader style feedback
});
