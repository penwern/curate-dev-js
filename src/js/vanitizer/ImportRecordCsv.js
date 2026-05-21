/* global Papa, he */
async function mapISADGToNodes(csvData) {
  const results = Papa.parse(csvData, {
    header: true, // Indicates your CSV has a header row
    dynamicTyping: true, // Automatically converts values to appropriate data types
  });

  const nodes = results.data.reduce(
    (accumulator, record) => {
      if (record.identifier && record.title) {
        // Check if both exist
        accumulator.Nodes.push({
          // Add to the valid nodes array
          Path: `appraisal/${record.identifier.replaceAll("/", "-")}-${he.decode(record.title)}`,
          Type: "COLLECTION",
          IsadMetadata: {
            "isadg-title": record.title,
            "isadg-reference-codes": record.identifier,
            "isadg-dates-of-descriptions": record.eventDates,
            "isadg-level-of-description": record.levelOfDescription,
            "isadg-extent-and-medium-of-the-unit-of-description": record.extentAndMedium,
            "isadg-archival-history": record.archivalHistory,
            "isadg-scope-and-content": record.scopeAndContent,
            "isadg-accruals": record.accruals,
            "isadg-system-of-arrangement": record.arrangement,
            "isadg-conditions-governing-access": record.accessConditions,
            "isadg-conditions-governing-reproduction": record.reproductionConditions,
            "isadg-languagescripts-of-material": record.script
              ? record.language + "," + record.script
              : record.language,
            "isadg-physical-characteristics-and-technical-requirements":
              record.physicalCharacteristics,
            "isadg-finding-aids": record.findingAids,
            "isadg-existence-and-location-of-originals": record.locationOfOriginals,
            "isadg-existence-and-location-of-copies": record.locationOfCopies,
            "isadg-related-units-of-description": record.relatedUnitsOfDescription,
            "isadg-publication-note": record.publicationNote,
            "isadg-note": record.generalNote,
            "isadg-archivists-note": record.archivistsNote,
            "isadg-rules-or-conventions": record.rules,
          },
          RelationIds: {
            "record-id": record.legacyId,
            "record-parent-id": record.parentId,
            "record-qubitparent-id": record.qubitParentId,
          },
        });
      } else {
        console.error(`Record missing title or identifier: ${JSON.stringify(record)}`); // Log the issue
      }
      return accumulator;
    },
    { Nodes: [] },
  ); // Initialize with an empty 'Nodes' array

  return nodes;
}

// Function to handle the file input
async function handleCSVData(csvData) {
  try {
    const jsonData = await mapISADGToNodes(csvData);
    const treeData = {
      Nodes: jsonData.Nodes.map((obj) => {
        const { IsadMetadata: _IsadMetadata, RelationIds: _RelationIds, ...rest } = obj; // Destructuring to omit these fields from rest
        return rest;
      }),
    };

    const serverNodes = await Curate.api.fetchCurate("/a/tree/create", "POST", treeData);

    // Assign Curate UUID to source record JSON
    jsonData.Nodes.forEach((item) => {
      item.Uuid = serverNodes.Children.find((obj) => obj.Path === item.Path).Uuid;
    });

    jsonData.Nodes.forEach((node) => {
      // Your existing code here...
      var propMap = [];
      if (node.IsadMetadata) {
        for (let prop in node.IsadMetadata) {
          if (!node.IsadMetadata[prop]) {
            continue;
          }
          propMap.push({
            NodeUuid: node.Uuid,
            JsonValue: JSON.stringify(he.decode(node.IsadMetadata[prop].toString())),
            Namespace: "usermeta-" + prop,
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
          });
        }
      }

      for (let prop in node.RelationIds) {
        if (!node.RelationIds[prop]) {
          continue;
        }
        propMap.push({
          NodeUuid: node.Uuid,
          JsonValue: JSON.stringify(he.decode(node.RelationIds[prop].toString())),
          Namespace: "usermeta-" + prop,
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
        });
      }
      propMap.push({
        NodeUuid: node.Uuid,
        JsonValue: JSON.stringify("unconnected"),
        Namespace: "usermeta-atom-connection",
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
      });
      Curate.api.fetchCurate("/a/user-meta/update", "PUT", {
        MetaDatas: propMap,
        Operation: "PUT",
      });
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getCsvData(node) {
  try {
    await PydioApi._PydioRestClient.getOrUpdateJwt(); // ensure JWT is fresh before presigned URL request
    const downloadUrl = await pydio.ApiClient.buildPresignedGetUrl(node);
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const textData = await response.text();
    return textData;
  } catch (error) {
    console.error("Error fetching object:", error);
    throw error; // Re-throw to allow catching in handleImportCsv
  }
}

async function handleImportCsv(_e) {
  var selectedNodes = pydio._dataModel._selectedNodes;
  if (!selectedNodes || selectedNodes.length > 1) {
    window.alert("You must select only one import document");
    return;
  }
  var selectedNode = pydio._dataModel._selectedNodes[0];
  if (selectedNode._path.split(".")[1] !== "csv") {
    window.alert("You must select a CSV document");
    return;
  }
  try {
    const csvData = await getCsvData(selectedNode);
    // Process the csvData here
    handleCSVData(csvData);
  } catch (error) {
    // Handle errors from getCsvData
    console.error("Error importing CSV:", error);
  }
}

handleImportCsv();
