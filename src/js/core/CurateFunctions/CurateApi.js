
const CurateApi = {
    /**
     * Generic Curate fetch helper to make API interactions simple.
     *
     * @param {string} endpoint the API endpoint to make a request to, e.g: "/a/tree/stat"
     * @param {string} method HTTP method to use in the request
     * @param {string} body string body to be used in the request
     * @returns {json} JSON body of successful Curate request
    */
    fetchCurate : async function(endpoint, method="POST", body) {
        if (!endpoint){
            throw new Error("No endpoint provided");
        }
        try {
            const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
            const fetchProps = {
                method: method,
                headers: {
                    "accept": "application/json",
                    "accept-language": navigator.language + ",en-GB,en-US;q=0.9,en;q=0.8",
                    "authorization": "Bearer " + token,
                    "content-type": "application/json",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-pydio-language": pydio.user.getPreference("lang")
                },
                referrer: window.location.href,
                referrerPolicy: "strict-origin-when-cross-origin",
                mode: "cors",
                credentials: "include"
            };
            if (!["GET", "HEAD"].includes(method)) {
                fetchProps.body = JSON.stringify(body);
            }
            const response = await fetch(window.location.origin + endpoint, fetchProps);

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const serverNodes = await response.json();
            return serverNodes;
        } catch (error) {
            console.error("Curate fetch error:", error);
            throw error;
        }
    },
    /**
     * File related Curate API functions
     * @namespace CurateApi.files
     * @memberof CurateApi
     */
    files: {
        /**
         * Function to create one or more files in Curate and update their metadata at the same time.
         * @param {object} nodes Object of nodes to create
         * @example Example usage:
         *             Curate.api.files.createFiles({
         *               nodes: [
         *                   {
         *                       path: "quarantine/file1.txt",
         *                       dc: [
         *                           { field: "title", value: "test" },
         *                           { field: "description", value: "test" }
         *                       ],
         *                       isadg: [
         *                           { field: "title", value: "test" },
         *                           { field: "reference-codes", value: "test" }
         *                       ]
         *                   },
         *                   {
         *                       path: "quarantine/file2.txt",
         *                       dc: [
         *                           { field: "title", value: "test" },
         *                           { field: "description", value: "test" }
         *                       ],
         *                       isadg: [
         *                           { field: "title", value: "test" },
         *                           { field: "reference-codes", value: "test" }
         *                       ]
         *                  }
         *               ]
         *           });
         */
        createFiles : async function (nodes) {
            if (!nodes){
                throw new Error("No nodes provided");
            }
            async function convertObject(inputObj, uuid) {
                const outputObj = {
                    MetaDatas: [],
                    Operation: "PUT"
                };
        
                for (const key in inputObj) {
                    if (key !== "path") {
                        inputObj[key].forEach(item => {
                            const namespace = `usermeta-${key}-${item.field}`;
                            const metaData = {
                                NodeUuid: uuid,
                                Namespace: namespace,
                                JsonValue: JSON.stringify(item.value),
                                Policies: [
                                    { Action: "READ", Effect: "allow", Subject: "*" },
                                    { Action: "WRITE", Effect: "allow", Subject: "*" }
                                ]
                            };
                            outputObj.MetaDatas.push(metaData);
                        });
                    }
                }
        
                return outputObj;
            }
        
            // Step 1: Create the file
            const promises = nodes.nodes.map(async node => {
                const filename = node.path.split('/').pop(); // Extract filename from path
                const createData = await Curate.api.fetchCurate("/a/tree/create", "POST", {
                    Nodes: [{ Path: node.path, Type: "LEAF" }],
                    TemplateUUID: ""
                });
        
                const path = createData.Children[0].Path; // Path of the created file
                const getData = await Curate.api.fetchCurate("/a/meta/bulk/get", "POST", { Limit: 200, NodePaths: [path] }); // Use the path of the created file
        
                const uuid = getData.Nodes[0].Uuid; // UUID of the created file
                return { filename, uuid, node };
            });
        
            const uuids = await Promise.all(promises);
            // Step 2: Update nodes
            for (const { filename, uuid, node } of uuids) {
                const updatedObject = await convertObject(node, uuid);
                const updateResponse = await Curate.api.fetchCurate("/a/user-meta/update", "PUT", updatedObject);
            }
        },
        /**
         * Get the data of a file in Curate
         * @param {object} node Node of the file to get data from
         * @param {string} type Type of data to get, currently only "text" is supported
         * @returns {string} Data of the file
         */
        getFileData : async function(node,type="text") {
            
            if (!node){
                throw new Error("No node provided");
            }
            try {
              const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
              const downloadUrl = await pydio.ApiClient.buildPresignedGetUrl(node);
              const response = await fetch(downloadUrl);
          
              if (!response.ok) {
                throw new Error("Network response was not ok");
              }
              let data;
              switch(type){
                  case "text":
                      data = await response.text();
              }
              return data; 
            } catch (error) {
              console.error("Error fetching object:", error);
              throw error; 
            }
        },
        /**
         * Update the metadata of a file in Curate
         * @param {object} node Node of the file to update
         * @param {object} metadata Metadata to update
         * @returns {object} Response from the Curate API
         */
        updateMetadata : async function(node,metadata){
            if (!metadata){
                throw new Error("No metadata provided");
            }
            if (!node){
                throw new Error("No node provided");
            }
            const createMetadata = (node, metadata) => {
                const outputObj = {
                    MetaDatas: [],
                    Operation: "PUT"
                };
            
                for (const key in metadata) {
                        metadata[key].forEach(item => {
                            const namespace = `usermeta-${key}-${item.field}`;
                            const metaData = {
                                NodeUuid: node._metadata.get("uuid"),
                                Namespace: namespace,
                                JsonValue: JSON.stringify(item.value),
                                Policies: [
                                    { Action: "READ", Effect: "allow", Subject: "*" },
                                    { Action: "WRITE", Effect: "allow", Subject: "*" }
                                ]
                            };
                            outputObj.MetaDatas.push(metaData);
                        });
                    
                }
                return outputObj
            }
            const body = createMetadata(node,metadata)
            const updateResponse = await Curate.api.fetchCurate("/a/user-meta/update", "PUT", body);


            return updateResponse
        }  
    }
};
export default CurateApi;