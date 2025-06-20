import getMetadataHierarchies from '../core/MetadataHierarchies.js';
import WorkerManager from '../core/WorkerManager.js';
const Curate = (function() {
    
    /**
     * Generic Curate fetch helper to make API interactions simple.
     *
     * @param {string} endpoint the API endpoint to make a request to, e.g: "/a/tree/stat"
     * @param {string} method HTTP method to use in the request
     * @param {string} body string body to be used in the request
     * @returns {json} JSON body of successful Curate request
     */
    api.fetchCurate = async function(endpoint, method, body) {
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
    };

    api.files = {}
    
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
    api.files.createFiles = async function (nodes) {
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
    }

    api.files.getFileData = async function(node,type="text") {
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
      }

    const workspaces = {};

    /**
     * Get the slug of the currently open workspace.
     * @returns {string} slug of the currently open workspace.
     */
    workspaces.getOpenWorkspace = function() {
        if (pydio._dataModel._rootNode._label.toLowerCase() == pydio.user.id.toLowerCase()) {
            return ("personal-files");
        }
        return (pydio._dataModel._rootNode._label.toLowerCase().replace(/^\d+\.\s*/, ''));
    };
    
    /**
     * Functions and helpers for the Curate UI
     * @module modals Create and control modal elements
     */
    const ui = {
        modals:{},
        metadataPanel:{}
    };

    /**
     * Create a Curate popup. Add content in the afterLoaded callback. 
     * clickAway, standard action buttons and base styling provided.
     * 
     * afterClosed callback also provided.
     * 
     * @usage const myPopup = new Curate.ui.modals.curatePopup(props, callbacks)
     * @param {object} props An object of popup parameters
     * @function fire() Initiates the popup in the DOM
     * @param {Object} callbacks Functions hooked to new popup
     * @property {function} callbacks.afterLoaded - Fires after the popup is spawned in the DOM
     * @property {function} callbacks.afterClosed - Fires after the popup is removed from the DOM
     * 
     */
    ui.modals.curatePopup = function(props, callbacks) {
        // Extracting props
        var title = props.title;
    
        // Extracting callbacks or defaulting to empty objects
        var afterLoaded = callbacks && callbacks.afterLoaded ? callbacks.afterLoaded : function(){};
        var afterClosed = callbacks && callbacks.afterClosed ? callbacks.afterClosed : function(){};
    
        // Define fire method
        function fire() {
            // Create the container element
            var container = document.createElement('div');
            container.classList.add('config-modal-container');
            container.style.display = 'flex';
            container.addEventListener("click", function (e) {
                clickAway(e, container);
            }, { once: true });
    
            // Create the content element
            var content = document.createElement('div');
            content.classList.add('config-modal-content');
    
            // Create the title element
            var titleElem = document.createElement('div');
            titleElem.classList.add('config-popup-title');
            titleElem.textContent = title;
    
            // Create the main body container
            var mainContent = document.createElement("div");
            mainContent.classList.add("config-main-options-container");
            mainContent.style.width = "100%";
    
            // Create the action buttons container
            var actionButtons = document.createElement('div');
            actionButtons.classList.add('action-buttons');
    
            // Create the close button
            var closeButton = document.createElement('button');
            closeButton.classList.add('config-modal-close-button');
            closeButton.textContent = 'Close';
            closeButton.addEventListener('click', closePopup);
    
            // Append elements to their respective parents
            actionButtons.appendChild(closeButton);
            content.appendChild(titleElem);
            content.appendChild(mainContent);
            content.appendChild(actionButtons);
            container.appendChild(content);
    
            // Append the container to the document body or any other desired parent element
            document.body.appendChild(container);
    
            // Call afterLoaded callback with the created popup
            afterLoaded(container);
    
            function closePopup() {
                container.remove();
                // Call afterClosed callback
                afterClosed();
            }
    
            function clickAway(e, t) {
                if (e.target === container) {
                    closePopup();
                } else {
                    t.addEventListener("click", function (e) {
                        clickAway(e, t);
                    }, { once: true });
                }
            }
        }
    
        // Return an object with the fire method
        return {
            fire: fire
        };
    };

    const metadata = {
        schemas:{}
    }

    /**
     * Gets globally supported descriptive schemas 
     * @returns {object} Object containing objects that describe the fields and structure of a schema
     * @param {string} schema Specific schema to get
     * 
     */
    metadata.schemas.getSchemas = function(schema){
        return getMetadataHierarchies(schema)
    }

    // Expose public methods
    return {
        api: api,
        workspaces: workspaces,
        ui: ui,
        metadata
    };
})();

// Export Curate so it's accessible globally
window.Curate = Curate;
