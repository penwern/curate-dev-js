/* global AWS */
function createPresignedDownloadUrl(path) {
  return new Promise((resolve, reject) => {
    PydioApi.getRestClient()
      .getOrUpdateJwt()
      .then((jwt) => {
        PydioApi._PydioClient.buildPresignedGetUrl(pydio._dataModel._selectedNodes[0]).then(() => {
          AWS.config.update({
            accessKeyId: "gateway",
            secretAccessKey: "gatewaysecret",
            s3ForcePathStyle: true,
          });
          let params = {
            Bucket: "io",
            Key: path,
            Expires: 6000,
          };
          const frontU = pydio.getFrontendUrl();
          const url = `${frontU.protocol}//${frontU.host}`;
          const s3 = new AWS.S3({ endpoint: url });
          const signed = s3.getSignedUrl("getObject", params);
          const output = signed + "&pydio_jwt=" + jwt;
          resolve(output); // Resolve the Promise with the generated URL
        });
      })
      .catch((error) => {
        reject(error); // Reject the Promise if there's an error
      });
  });
}

PydioApi.getRestClient()
  .getOrUpdateJwt()
  .then(() => {
    var paths = pydio._dataModel._selectedNodes.map(
      (node) => Curate.workspaces.getOpenWorkspace() + node._path,
    );
    var uploadData = {}; // Array to aggregate data from Promise.all
    uploadData.Children = []; // Promises array to track all fetchCurate Promises
    var fetchPromises = paths.map((path) => {
      return Curate.api
        .fetchCurate("/a/tree/admin/list", "POST", {
          Node: {
            Path: path,
          },
          Recursive: true,
        })
        .then((response) => {
          if (!response.status == 200) {
            throw new Error("Network response was not ok");
          }
          return response;
        })
        .then((data) => {
          if (!data.Children) {
            window.alert("Record " + path + " contains no children");
            return;
          }

          var parentRef = JSON.parse(data.Parent.MetaStore["usermeta-isadg-reference-codes"]);
          var parentUuid = data.Parent.Uuid;
          delete data.Parent;

          // Promise.all to generate presigned URLs for all children
          return Promise.all(
            data.Children.map((entry) => {
              return createPresignedDownloadUrl(entry.Path)
                .then((downloadUrl) => {
                  entry.DownloadUrl = downloadUrl;
                  entry.ParentRef = parentRef;
                  entry.ParentUuid = parentUuid;
                })
                .catch((error) => {
                  console.error("Error generating download URL:", error);
                });
            }),
          ).then(() => {
            // Push data to uploadData array
            data.Children.forEach((c) => uploadData.Children.push(c));
          });
        })
        .catch((error) => {
          console.error("There was a problem with the fetch operation:", error);
        });
    });

    // Execute all fetchPromises
    Promise.all(fetchPromises)
      .then(() => {
        console.log("All download URLs generated, sending data...");
        console.log(uploadData); // Array of data to be uploaded
        var parentMap = pydio._dataModel._selectedNodes.map((node) => node._metadata.get("uuid"));
        var propMap = parentMap.map((uuid) => ({
          NodeUuid: uuid,
          JsonValue: JSON.stringify("connecting"),
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
        }));

        // Update meta data
        Curate.api
          .fetchCurate("/a/user-meta/update", "PUT", {
            MetaDatas: propMap,
            Operation: "PUT",
          })
          .then((response) => {
            console.log(response);
          });
        // Send aggregated data in one batch to atom connector upload endpoint
        fetch("http://127.0.0.1:5000/api/atom_connector/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uploadData),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json();
          })
          .then((data) => {
            // Handle response
            console.log(data);

            // Prepare propMap for update
            var propMap = data.completed.map((uuid) => ({
              NodeUuid: uuid,
              JsonValue: JSON.stringify("connected"),
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
            }));

            // Update meta data
            Curate.api
              .fetchCurate("/a/user-meta/update", "PUT", {
                MetaDatas: propMap,
                Operation: "PUT",
              })
              .then((response) => {
                console.log(response);
              })
              .catch((error) => {
                console.error("There was a problem updating meta data:", error);
              });
          })
          .catch((error) => {
            console.error("There was a problem with the fetch operation:", error);
          });
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  });
