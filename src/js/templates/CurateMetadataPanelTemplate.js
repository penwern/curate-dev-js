export default `
<div id="curateMetadataPanel">
    <style>
        /*move this to brand css*/

        /*CSS*/
        .metadataPanel-accordion {
            margin-top: 1em !important;
            margin-bottom: 1em !important;
        }

        .metadataPanel-accordion-item {
            background: linear-gradient(white, white) padding-box,
                linear-gradient(to right, var(--customerColourPrimary), var(--customerColourHighlight)) border-box;
            border: 2px solid transparent;
            border-radius: 0.5em;
            margin-bottom: 0.5em !important;
            overflow: hidden;
        }

        .metadataPanel-accordion-header {
            background-color: #f6f6f6;
            padding: 0.9em !important;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.3s;
            border-radius: 0.5em;
            font-size: 1em;
            cursor: pointer;
        }

        .metadataPanel-accordion-icon {
            min-width: 1.5em;
            max-width: 1.5em;
            min-height: 1.5em;
            max-height: 1.5em;
            margin: 0.5em;
            background-color: #EFEEEE;
            border-radius: 50%;
            transition: transform 0.3s;
            transform: rotate(0deg);
        }

        .metadataPanel-accordion-content {
            background-color: inherit;
            max-height: 0;
            overflow: hidden;
            transition: all 0.3s ease-out;
        }

        .dropdown-item {
            margin-bottom: 0.5em;
        }

        .metadataPanel-accordion-subfield {
            margin-bottom: 0.5em !important;
            background-color: inherit;
        }

        /* Add this style to show the expanded content */
        .metadataPanel-accordion-content.expanded {
            display: block;
            margin: 1em;
        }

        /* Add this style to rotate the icon when expanded */
        .metadataPanel-accordion-icon.expanded {
            transform: rotate(180deg);
        }

        .metadataPanel-accordion-icon::before,
        .metadataPanel-accordion-icon::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0.1em;
            height: 0.8em;
            background-color: var(--customerColourPrimary);
            transition: transform 0.3s;
        }

        .metadataPanel-accordion-icon::before {
            transform: translate(-50%, -50%) rotate(90deg);
        }

        .metadataPanel-accordion-icon::after {
            transform: translate(-50%, -50%) scaleX(0.8);
        }

        .metadataPanel-accordion-icon.expanded::after {
            transform: translate(-50%, -50%) rotate(90deg) scaleX(0.8);
        }

        .drop-zone {

            border-radius: 10px;
            background-color: #F5F5F5;
            background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='13' ry='13' stroke='%23B1B1B1FF' stroke-width='3' stroke-dasharray='6%2c 14' stroke-dashoffset='13' stroke-linecap='square'/%3e%3c/svg%3e");
            border-radius: 13px;
            height: 8em;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: ease all 0.3s;
        }

        .drop-zone p {

            font-size: 16px;
            color: #73d3ff;
            pointer-events: none;
        }

        .drop-zone input[type="file"] {
            display: none;
        }

        .dropzone-hover {
            background-color: #Eaeaea;
            color: #5cccff;
        }

        .dropzone-hover p {
            color: #5cccff;
        }

        .sidecar-file {
            display: flex;
            padding: 0.2em !important;
            margin: 0.4em !important;
            border-bottom: 1px solid;
            transition: all ease 0.3s;
            cursor: pointer;
        }

        .sidecar-file :hover {
            color: #5cccff;
        }

        .sidecar-open {
            margin-left: auto;
        }
    </style>
    <div class="metadataPanel-accordion">
        <div class="metadataPanel-accordion-item" id="tagsSection">
            <div class="metadataPanel-accordion-header" >
                <span class="metadataPanel-accordion-title">TAGS</span>
                <span class="metadataPanel-accordion-icon"></span>
            </div>
            <div class="metadataPanel-accordion-content">
                <!-- Dropdown content for Tags section -->
            </div>
        </div>
        <div class="metadataPanel-accordion-item" id="importSection">
            <div class="metadataPanel-accordion-header" >
                <span class="metadataPanel-accordion-title">IMPORT</span>
                <span class="metadataPanel-accordion-icon"></span>
            </div>
            <div class="metadataPanel-accordion-content">
                <!-- Dropdown content for Import section -->
                <div class="metadataPanel-accordion-subfield" id="sidecarArea">
                    <div class="metadataPanel-accordion-header" >
                        <span class="metadataPanel-accordion-title">Sidecar Files</span>
                        <span class="metadataPanel-accordion-icon"></span>
                    </div>
                    <div class="metadataPanel-accordion-content">
                        <!-- Dropdown content for ISAD Description Control -->
                        <div class="sidecar-list">


                        </div>
                    </div>
                </div>

                <div class="drop-zone">
                    <p>Drop a file, or browse</p>
                    <input type="file" id="file-input" />
                </div>

            </div>
        </div>
        <div class="metadataPanel-accordion-item" id="exportSection">
            <div class="metadataPanel-accordion-header" >
                <span class="metadataPanel-accordion-title">EXPORT</span>
                <span class="metadataPanel-accordion-icon"></span>
            </div>
            <div class="metadataPanel-accordion-content">
                <!-- Dropdown content for Export section -->
            </div>
        </div>
    </div>
    <script id="metadataPanelHandlers">
        /*Event handlers and utilities to make modified Curate metadata panel functional
        adds resizing on state change for accordions, state changes for dropzone and all other dropzone functionality*/

        // Select all accordion headers
        var accordionHeaders = document.querySelectorAll('.metadataPanel-accordion-header');
        function accordionHeader(e) {
            // Get the content and icon elements
            var content = e.nextElementSibling;
            var icon = e.querySelector('.metadataPanel-accordion-icon');

            // Check if the current header is a subfield
            var isSubfield = e.parentElement.classList.contains('metadataPanel-accordion-subfield');

            // Determine the main content element based on whether it's a subfield or not
            var mainContent = isSubfield ? e.parentElement.parentElement : content;

            // Toggle the 'expanded' class on the content and icon elements
            content.classList.toggle('expanded');
            icon.classList.toggle('expanded');

            // Update the max-height of the content based on its expanded state
            if (content.classList.contains('expanded')) {
                content.style.maxHeight = content.scrollHeight * 1.1 + 'px';
                adjustMainContentHeight(mainContent, content.scrollHeight);
            } else {
                content.style.maxHeight = null;
                adjustMainContentHeight(mainContent, -content.scrollHeight);
            }
        }
        // Function to adjust the max-height of the main content element
        function adjustMainContentHeight(mainContent, heightChange) {
            var mainContentHeight = mainContent.style.maxHeight;

            // Update the max-height based on the heightChange value
            if (!mainContentHeight) {
                mainContent.style.maxHeight = mainContent.scrollHeight + heightChange + 'px';
            } else {
                mainContent.style.maxHeight = parseInt(mainContentHeight) + heightChange + 'px';
            }
        }
        //add accordion handlers
        document.querySelectorAll(".metadataPanel-accordion-header").forEach(a=>{
            a.addEventListener("click",function(){accordionHeader})
        })
        //Select dropzone
        var dropzone = document.querySelector(".drop-zone")
        dropzone.addEventListener("dragenter", function () {
            this.classList.toggle('dropzone-hover');
            this.getElementsByTagName('p')[0].textContent = 'Drop Here';
        })
        dropzone.addEventListener("dragleave", function () {
            this.classList.toggle('dropzone-hover');
            this.getElementsByTagName('p')[0].textContent = 'Drop a file, or browse';
        })
        dropzone.addEventListener("click", function () {
            this.querySelector('#file-input').click();
        })
        function sidecarHandler(e) {
            const fileInput = document.querySelector("#file-input")
            if (fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.name === "metadata.json") {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const contents = event.target.result;
                        try {
                            const metadata = JSON.parse(contents);
                            // Handle the parsed metadata object
                            console.log("Parsed metadata:", metadata);
                        } catch (error) {
                            console.error("Error parsing metadata JSON:", error);
                        }
                    };
                    reader.readAsText(file);
                } else {
                    // File is not "metadata.json", add to sidecar files
                    PydioApi._PydioRestClient.getAuthToken()
                        .then(token => {
                            var nodeId = Object.fromEntries(pydio._dataModel._selectedNodes[0]._metadata).uuid
                            //Get current sidecar files
                            var curSidecarRequest = {
                                "Namespace": "usermeta-sidecar-files",
                                "NodeUuids": [
                                    nodeId
                                ]
                            }
                            fetch("https://" + window.location.hostname + "/a/user-meta/search", {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token
                                },
                                body: JSON.stringify(curSidecarRequest)
                            })
                                .then(response => response.json())
                                .then(data => {
                                    // Handle the response data
                                    var sideId = crypto.randomUUID()
                                    var preU = pydio.ApiClient.buildPresignedPutUrl("othermeta/" + sideId + ":" + file.name)
                                    if (data.Metadatas) {
                                        var curData = JSON.parse(data.Metadatas[0].JsonValue)
                                        curData.files.push(sideId + ":" + file.name)
                                        var newSidecars = curData
                                    } else {
                                        var newSidecars = { "files": [sideId + ":" + file.name] }
                                    }
                                    preU.then(data => {
                                        fetch(data.url, {
                                            method: 'PUT',
                                            headers: {
                                                ...data.headers
                                            },
                                            body: file // Replace 'file' with the actual file you want to send as the request body
                                        })
                                            .then(response => {
                                                // Handle the response
                                                response.text().then(body => {
                                                    setTimeout(function () {
                                                        retrieveSidecarInfo()
                                                    }, 200)
                                                })
                                            })
                                            .catch(error => {
                                                // Handle any errors
                                                console.error("sidecar file upload error: ", error);
                                            });
                                    })
                                    var sideCarRequest = createRequestObject(newSidecars, "usermeta-sidecar-files", nodeId)
                                    fetch("https://" + window.location.hostname + "/a/user-meta/update", {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': 'Bearer ' + token
                                        },
                                        body: JSON.stringify(sideCarRequest)
                                    })
                                        .then(response => response.json())
                                        .then(data => {
                                            // Handle the response data
                                            console.info("sidecar file successfully added: ", data);


                                        })
                                        .catch(error => {
                                            // Handle any errors
                                            console.error('Error updating sidecar files:', error);
                                        });

                                })
                                .catch(error => {
                                    // Handle any errors
                                    console.error('Error getting sidecar files:', error);
                                });

                        })
                }
            }
        }

        dropzone.addEventListener("change", sidecarHandler)
        document.addEventListener("drop", function (e) {
            if (e.target.className !== "drop-zone dropzone-hover") {
                return
            } else {
                e.stopImmediatePropagation()
                document.querySelector("#file-input").files = e.dataTransfer.files;
                sidecarHandler()
                retrieveSidecarInfo()
                e.target.classList.toggle("dropzone-hover")
                e.target.firstElementChild.textContent = "Drop a file, or browse"
            }
        })
        function createRequestObject(value, namespace, nodeid) {
            const requestObject = {
                MetaDatas: [
                    {
                        NodeUuid: nodeid,
                        Namespace: namespace,
                        JsonValue: JSON.stringify(value),
                        Policies: [
                            {
                                Action: "READ",
                                Effect: "allow",
                                Subject: "*"
                            },
                            {
                                Action: "WRITE",
                                Effect: "allow",
                                Subject: "*"
                            }
                        ]
                    }
                ],
                Operation: "PUT"
            };
            return requestObject;
        }
    </script>
</div>
`;
