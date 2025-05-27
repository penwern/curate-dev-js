  async function submitPreservationRequest(configId) {
        const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
        const url = `${window.location.origin}/a/scheduler/hooks/a3m-transfer`;
        const paths = pydio._dataModel._selectedNodes.map(n => ({
            path: Curate.workspaces.getOpenWorkspace() + n._path,
            slug: n._metadata.get("usermeta-atom-linked-description") || ""
        }));
        const bodyData = JSON.stringify({ "Paths": paths, "JobParameters": { "ConfigId": configId.toString() } })
        const headers = {
            "accept": "application/json",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            "authorization": `Bearer ${token}`,
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-pydio-language": "en-us"
        }
        fetch(url, {
            method: "POST",
            mode: "cors",
            headers: headers,
            body: bodyData
        })
            .then(response => {
                if (!response.ok) {
                    // Handle non-successful response (e.g., 404 or 500 errors)
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Handle the successful response data here
                console.info("Preservation config initiated successfully");
            })
            .catch(error => {
                // Handle any network or other errors that occurred
                console.error("Fetch error:", error);
            });

    }
    // Retrieves saved preservation configs from the server at route GET /api/preservation
    // Stores the configs in sessionStorage under the key "preservationConfigs"
    async function getPreservationConfigs() {
        const url = `${window.location.origin}/api/preservation`;
        const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
        return fetch(url, {headers: {"Authorization": `Bearer ${token}`}, method: "GET"})
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                //save configs to session
                sessionStorage.setItem("preservationConfigs", JSON.stringify(data))
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }

    function createDivBesideElement(targetElement, content, childItems) {
        const div = document.createElement('div');
        div.id = "preservationConfigsSubMenu"
        div.style.maxHeight = "8em"
        div.style.overflowY = "scroll"
        div.innerHTML = content;
        childItems.forEach(item => {
            let c = document.createElement('div')
            const bookmark = JSON.parse(localStorage.getItem(item.id))
            c.style.transition = "0.3s ease all"
            c.addEventListener("mouseenter", e => { e.target.style.background = "var(--md-sys-color-outline-variant-50)" })
            c.addEventListener("mouseleave", e => { e.target.style.background = "none" })
            c.addEventListener("click", e => {
                if (e.target.classList.contains("mdi-star-outline")) {
                    console.info("bookmarked!")
                    localStorage.setItem(item.id, JSON.stringify({ "name": item.name, "bookmarked": true }))
                    e.target.classList.remove("mdi-star-outline")
                    e.target.classList.add("mdi-star")
                    div.remove()
                } else if (e.target.classList.contains("mdi-star")) {
                    console.info("un-bookmarked!")
                    localStorage.setItem(item.id, JSON.stringify({ "name": item.name, "bookmarked": false }))
                    e.target.classList.remove("mdi-star")
                    e.target.classList.add("mdi-star-outline")
                    div.remove()
                } else { //executing config
                    submitPreservationRequest(item.id)
                    div.remove()
                }

            }) //add run config handler

            c.innerHTML = '<span role="menuitem" tabindex="0" style="border: 10px; box-sizing: border-box; display: block; font-family: Roboto, sans-serif; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); cursor: pointer; text-decoration: none; margin: 0px; padding: 0px; outline: none; font-size: 15px; font-weight: inherit; position: relative; color: var(--md-sys-color-inverse-surface); line-height: 32px; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; min-height: 32px; white-space: nowrap; background: none;width:inherit;"><div style="width:inherit;"><div style="width:inherit;margin-left: 24px; position: relative; display:flex;align-content: center;flex-wrap: nowrap;flex-direction: row;align-items: center;justify-content: flex-start;"><div role="menuLabel" style="max-width:8em;overflow-x:clip;text-overflow:ellipsis;">Source Editor</div><span class="mdi mdi-star-outline menu-icons" color="#757575" style="color: rgb(117, 117, 117);font-size: 16px; display: block; user-select: none; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; height: 24px; width: 24px;padding: 5px; padding-left:10px; position:absolute; right:24px"></span></div></div></span>'
            c.querySelector('[role="menuLabel"]').innerText = item.name
            div.querySelector('[role="menu"]').appendChild(c)
            if (bookmark && bookmark.bookmarked) {
                let ic = c.querySelector(".mdi-star-outline")
                ic.classList.remove("mdi-star-outline")
                ic.classList.add("mdi-star")
            }

        })
        const noConfigs = document.createElement("div")
        noConfigs.innerHTML = '<span role="menuitem" tabindex="0" style="border: 10px; box-sizing: border-box; display: block; font-family: Roboto, sans-serif; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); cursor: pointer; text-decoration: none; margin: 0px; padding: 0px; outline: none; font-size: 15px; font-weight: inherit; position: relative; color: var(--md-sys-color-inverse-surface); line-height: 32px; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; min-height: 32px; white-space: nowrap; background: none;width:inherit;"><div style="width:inherit;"><div style="width:inherit;margin-left: 24px; position: relative; display:flex;align-content: center;flex-wrap: nowrap;flex-direction: row;align-items: center;justify-content: flex-start;"><div role="menuLabel" style="max-width:8em;overflow-x:clip;text-overflow:ellipsis;">Source Editor</div></div></div></span>'
        noConfigs.querySelector('[role="menuLabel"]').innerText = "Create New"
        noConfigs.style.transition = "0.3s ease all"
        noConfigs.addEventListener("mouseenter", e => { e.target.style.background = "var(--md-sys-color-outline-variant-50)" })
        noConfigs.addEventListener("mouseleave", e => { e.target.style.background = "none" })
        noConfigs.addEventListener("click", e => {
            document.querySelector("#preservationConfigsSubMenu").remove()
            createCuratePopup("Preservation Configs", inputs)
        })
        div.querySelector('[role="menu"]').appendChild(noConfigs)
        document.body.appendChild(div);
        // Get the position and dimensions of the second element
        const rect1 = div.firstChild.getBoundingClientRect();
        const rect2 = targetElement.getBoundingClientRect();
        const distanceFromLeftEdge = rect2.left;
        const distanceFromRightEdge = window.innerWidth - rect2.right;
        var newTop
        var newLeft
        // Compare the distances and determine the closest edge
        if (distanceFromLeftEdge < distanceFromRightEdge) {
            newTop = rect2.top;
            newRight = window.innerWidth - rect2.right;
            div.style.position = 'absolute';
            div.style.top = `${newTop}px`;
            div.style.right = `${newRight}px`;
        } else if (distanceFromLeftEdge > distanceFromRightEdge) {
            newTop = rect2.top;
            newRight = (window.innerWidth - rect2.left) + rect1.width
            div.style.position = 'absolute';
            div.style.top = `${newTop}px`;
            div.style.right = `${newRight}px`;
        } else {
            newTop = rect2.top;
            newRight = window.innerWidth - rect2.right;
            div.style.position = 'absolute';
            div.style.top = `${newTop}px`;
            div.style.right = `${newRight}px`;
        }
        return div
    }
    function createMenuItem(label, iconClass, fontSize = "16px", padding = "5px") {
        const clone = document.createElement("div")
        clone.style.transition = "0.3s ease all"
        clone.style.maxWidth = "20em"
        clone.addEventListener("mouseenter", e => { e.target.style.background = "var(--md-sys-color-outline-variant-50)" })
        clone.addEventListener("mouseleave", e => { e.target.style.background = "none" })
        clone.id = "preservationConfigDropdown"
        clone.innerHTML = '<span role="menuitem" tabindex="0" style="border: 10px; box-sizing: border-box; display: block; font-family: Roboto, sans-serif; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); cursor: pointer; text-decoration: none; margin: 0px; padding: 0px; outline: none; font-size: 15px; font-weight: inherit; position: relative; color:  color: var(--md-sys-color-inverse-surface); line-height: 32px; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; min-height: 32px; white-space: nowrap; background: none;"><div><div style="margin-left: 0px; padding: 0px 64px 0px 24px; position: relative;"><span class="mdi ' + iconClass + ' menu-icons" color="#757575" style="color: rgb(117, 117, 117); position: absolute; font-size:' + fontSize + ';display: block; user-select: none; transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; height: 24px; width: 24px; top: 4px; margin: 0px; right: 24px; fill: rgb(117, 117, 117); padding: ' + padding + ';"></span><div role="menuLabel" style="overflow-x:clip;text-overflow:ellipsis;">' + label + '</div></div></div></span>'
        return clone
    }
    function addPreservationWorkflows(menu) {
        const savedConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs"))
        const standardPreserveKeyw = "Preserve"
        setTimeout(() => {
            for (const a of menu.querySelectorAll("div")) {
                if (a.innerText == standardPreserveKeyw) {
                    const clone = createMenuItem("Preservation Configs", "mdi-menu-right", "24px", "0px")
                    menu.insertBefore(clone, a.nextSibling); // Insert the clone underneath the found element
                    const placedDiv = document.querySelector("#preservationConfigDropdown")
                    const clickCodes = [1, 3]

                    document.addEventListener("mousedown", e => {

                    }, { once: true })
                    placedDiv.addEventListener("click", e => {
                        const content = '<div style="color: var(--md-sys-color-inverse-surface); background-color: transparent; transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, opacity 250ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; box-sizing: border-box; font-family: Roboto, sans-serif; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px; border-radius: 20px; position: fixed; z-index: 2100; opacity: 1; transform: scale(1, 1); transform-origin: left top; max-height: 963px; overflow-y: auto;"><div style="max-height: 100%; overflow-y: auto; transform: scaleX(1); opacity: 1; transform-origin: left top; transition: transform 250ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, opacity 250ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;"><div style="opacity: 1; transform: scaleY(1); transform-origin: left top; transition: transform 500ms cubic-bezier(0.23, 1, 0.32, 1) 0ms, opacity 500ms cubic-bezier(0.23, 1, 0.32, 1) 0ms;"><div role="presentation" style="z-index: 1000; position: relative; width: 192px;max-height:10em;"><div role="menu" style="padding: 16px 0px; display: table-cell; user-select: none; width: 192px;"></div></div></div></div></div>';
                        const subMenuDiv = createDivBesideElement(placedDiv, content, savedConfigs); //create submenu
                        setTimeout(() => {
                            document.addEventListener("mousedown", e => {
                                if (clickCodes.includes(e.which)) {
                                    if (!subMenuDiv.contains(e.target)) {
                                        subMenuDiv.remove()
                                    }
                                }
                            }, { once: true })
                        }, 100)
                    })
                    savedConfigs.forEach(config => {
                        const bookmark = JSON.parse(localStorage.getItem(config.id.toString()))
                        if (bookmark && bookmark.bookmarked) {
                            const markedConfigDiv = createMenuItem(config.name, "mdi-console")

                            menu.insertBefore(markedConfigDiv, a.nextSibling)
                        }
                    })
                    return
                } else if (document.querySelector("#preservationConfigDropdown")) {
                    document.querySelector("#preservationConfigDropdown").remove()
                }
            }
        }, 10)

    }
    // Callback function to handle mutations
    function handleMutations(e) {
        if (document.querySelector("#\\/recycle_bin") && document.querySelector("#\\/recycle_bin").contains(e.target)) {
            if (document.querySelector("#preservationConfigDropdown")) {
                document.querySelector("#preservationConfigDropdown").remove()
            }
            return
        }
        const contextObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const menuElement = node.querySelector('.context-menu [role="menu"]');
                        if (menuElement) {
                            addPreservationWorkflows(menuElement);
                            contextObserver.disconnect(); // Disconnect this specific observer instance
                        }
                    }
                });
            });
        });
        contextObserver.observe(document.body, {
            childList: true,
            subtree: true,
            once: true,
        });
    }
    function createCuratePopup(title, inputs) {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.classList.add('config-modal-container');
        const modalScrollContainer = document.createElement('div')
        modalScrollContainer.classList.add('config-modal-scroll-container')
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.classList.add('config-modal-content');
        // Create title
        const titleElement = document.createElement('div');
        titleElement.textContent = title;
        titleElement.classList.add('config-popup-title');
    
        // Add title to modal content
        modalContent.appendChild(titleElement);
        //  add main controls container
        const mainOptionsContainer = document.createElement('div')
        mainOptionsContainer.classList.add('config-main-options-container')
        modalContent.appendChild(mainOptionsContainer)
        // Create inputs based on the input objects
        inputs.forEach((category) => {
            const catDiv = document.createElement("div")
            catDiv.classList.add('config-input-category')
            catDiv.id = category.category.replaceAll(" ", "_")
            const catLabel = document.createElement("div")
            catLabel.classList.add('config-text-label')
            catLabel.textContent = category.category
            catDiv.appendChild(catLabel)
            category.inputs.forEach(input => {
                createInput(input, catDiv)
            })
            modalScrollContainer.appendChild(catDiv)
        });
        //create and add clear form button 
        const clearButton = document.createElement("button")
        clearButton.classList.add("config-clear-form")
        clearButton.textContent = "Clear Form"
        clearButton.addEventListener("click", e => {
            modalScrollContainer.querySelectorAll("input").forEach(input => {
                if (input.type == "text") {
                    input.value = ""
                }
                else if (input.type == "checkbox") {
                    input.checked = false
                } else {
                    input.value = 0
                }
                input.dispatchEvent(new CustomEvent('change', { bubbles: true }))
                input.dispatchEvent(new CustomEvent('input', { bubbles: true }))
            })
    
    
        })
        modalScrollContainer.appendChild(clearButton)
        const optionsContainer = document.createElement('div')
        optionsContainer.classList.add('config-options-container')
        optionsContainer.style = "display: flex;align-items: center;flex-wrap: nowrap;flex-direction: column;"
        //create and add title to modify/create area
        const modifyTitle = document.createElement('div')
        modifyTitle.classList.add("config-text-label")
        modifyTitle.textContent = "Create or Edit Configs"
        modifyTitle.style = "padding-bottom: 1em !important"
        optionsContainer.appendChild(modifyTitle)
        optionsContainer.appendChild(modalScrollContainer)
    
        const savedScrollContainer = document.createElement('div')
        savedScrollContainer.classList.add('config-modal-scroll-container')
        //create and append save button to config options area
        const saveConfig = document.createElement('button')
        saveConfig.classList.add('config-save-button')
        saveConfig.textContent = "Save Config"
        saveConfig.addEventListener("click", e => {
            //validate save
            const curConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs"))
            const saveName = optionsContainer.querySelector("#name").value
    
            // Flatten the input labels
            const inputIds = inputs.flatMap(category => {
                return category.inputs.map(input => input.name)
                    .concat(category.inputs.flatMap(input => {
                        if (input.suboptions) {
                            return input.suboptions.map(suboption => suboption.name); // Use suboption.name here
                        }
                        return [];
                    }));
            });
            const curConfig = {}
            const matchingObj = curConfigs?.find(obj => obj.name == saveName);
            if (matchingObj) {
                curConfig["id"] = matchingObj.id; // we're editing an already saved config
            } else {
                curConfig["user"] = pydio.user.id //created user is this one
            }
            inputIds.forEach(id => {
                const input = document.querySelector("#" + id)
                if (!input) {
                    return
                }
                if (input.type == "submit") { //do not add "go to atom config" button
                    return
                }
                if (input.disabled) {
                    curConfig[id.toLowerCase()] = false
                }
                if (input.type == "checkbox") {
                    curConfig[id.toLowerCase()] = +input.checked
                } else if (input.querySelector("input[type='range']")) {
                    curConfig[id.toLowerCase()] = input.querySelector("input[type='range']").value
                }
                else if (id == "name") {
                    curConfig["name"] = input.value
                } else if (id == "image_normalization_tiff") {
                    curConfig[id.toLowerCase()] = (input.value === "TIFF") ? 1 : 0;
                }
                else {
                    if (typeof input.value == "string") {
                        curConfig[id.toLowerCase()] = input.value.toLowerCase()
                    } else {
                        curConfig[id.toLowerCase()] = input.value
                    }
                }
            })
            if (matchingObj){ //edit existing config
                editPreservationConfig(curConfig)
            }else{
                setPreservationConfig(curConfig) //save new config
                .then(r => {
                    if (r) {
                        const curConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs"))
                        getPreservationConfigs()
                            .then(r => {
                                const newConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs"))
                                if (curConfig.id) {
                                    document.querySelector("#config-" + curConfig.id).remove()
                                    createConfigsBox(savedScrollContainer, [newConfigs.find(obj => obj.id === curConfig.id)])
                                } else {
                                    const newObject = newConfigs.find(newObj => !curConfigs.some(curObj => curObj.id === newObj.id));
                                    createConfigsBox(savedScrollContainer, [newObject])
                                }
                            })
                    }
                })
            }
    
        })
        optionsContainer.appendChild(saveConfig)
        mainOptionsContainer.appendChild(optionsContainer)
        optionsContainer.addEventListener("input", e => {
            let cname = optionsContainer.querySelector("#name").value
            if (cname.length == 0) {
                saveConfig.style.display = "none"
            } else if (cname.trim().length < 3) {
                saveConfig.textContent = "Add a name 3 characters or longer"
                saveConfig.style.display = "block"
            } else {
                saveConfig.textContent = "Save Config"
                saveConfig.style.display = "block"
            }
        })
        //create and add the saved configs area
        const savedConfigsContainer = document.createElement('div')
        savedConfigsContainer.classList.add('config-options-container')
        savedConfigsContainer.id = "savedConfigsContainer"
        savedConfigsContainer.style = "display:flex;align-items:center;justify-content:flex-start;flex-direction:column;"
        //create and add title to saved configs area
        const savedTitle = document.createElement('div')
        savedTitle.classList.add("config-text-label")
        savedTitle.style = "padding-bottom: 1em; !important"
        savedTitle.textContent = "Saved Configs"
        savedConfigsContainer.appendChild(savedTitle)
        const savedConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs"))
        createConfigsBox(savedScrollContainer, savedConfigsContainer, savedConfigs)
        savedConfigsContainer.appendChild(savedScrollContainer)
        mainOptionsContainer.appendChild(savedConfigsContainer);
        // Append modal container to the body
        modalContainer.appendChild(modalContent);
        // Create close button
        const closeButtonContainer = document.createElement('div');
        closeButtonContainer.classList.add('action-buttons');
        const closeButton = document.createElement('button');
        closeButton.classList.add('config-modal-close-button')
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        closeButtonContainer.appendChild(closeButton)
        modalContent.appendChild(closeButtonContainer);
        document.body.appendChild(modalContainer);
        // Display the modal
        modalContainer.style.display = 'flex';
    
    }
    
    function createConfigsBox(target, container, configs) {
        console.log(configs)
        configs?.forEach(config => {
            const configItem = document.createElement('div')
            configItem.id = "config-" + config.id
            configItem.classList.add('saved-config-item')
            configItem.style.opacity = "0"
            configItem.addEventListener("mouseenter", e => {
                configItem.style.backgroundColor = "var(--md-sys-color-outline-variant)"
            })
            configItem.addEventListener("mouseleave", e => {
                configItem.style.backgroundColor = "var(--md-sys-color-on-secondary)"
            })
            configItem.addEventListener("click", e => {
                if (["saved-config-delete", "config-bookmark-container", "mdi-star", "mdi-star-outline"].includes(e.target.className)) {
                    //delete key pressed instead, dont load
                    return
                }
                // Iterate through the object properties and populate the corresponding fields
                for (var prop in config) {
                    if (config.hasOwnProperty(prop)) {
                        // Construct the input field ID using the object property key
                        var inputFieldId = '#' + prop; // Assuming the input IDs have a "#" prefix
                        var inputField = document.querySelector(inputFieldId);
    
                        // Check if an input field with the corresponding ID exists
                        if (inputField) {
                            if (inputField.type == "checkbox") {
                                inputField.checked = !!config[prop];
                            } else if (inputField.type == "select-one") {
                                if (inputField.id == "image_normalization_tiff") {
                                    inputField.value = config[prop] === 1 ? "TIFF" : "JPEG2000";
                                }
                            } else if (inputField.type == "range") {
                                inputField.value = config[prop];
                                inputField.dispatchEvent(new CustomEvent('input', { bubbles: true }))
                            } else {
                                inputField.value = config[prop];
                            }
                            inputField.dispatchEvent(new CustomEvent('change', { bubbles: true }))
                        }
                    }
                }
            })
            const configInfo = document.createElement('div')
            configInfo.classList.add('saved-config-information')
            const configLabel = document.createElement('label')
            configLabel.textContent = config.name
            configLabel.style.fontWeight = "500"
            configLabel.style.marginBottom = "0"
            const configDetails = document.createElement('label')
            configDetails.classList.add('config-text-label')
    
            const configDescription = document.createElement('div')
            const descriptionLabel = document.createElement('label')
            descriptionLabel.for = "config-description-" + config.id
            descriptionLabel.textContent = "Description: "
            const descriptionText = document.createElement('span')
            descriptionText.textContent = config.description
            descriptionText.id = "config-description-" + config.id
            configDescription.appendChild(descriptionLabel)
            configDescription.appendChild(descriptionText)
    
    
           
    
            const configUser = document.createElement('div')
            const userLabel = document.createElement('label')
            userLabel.id = "config-user-" + config.id
            userLabel.textContent = "User: "
            const userText = document.createElement('span')
            userText.id = "config-user-" + config.id
            userText.textContent = config.user
            configUser.appendChild(userLabel)
            configUser.appendChild(userText)
    
            configDetails.appendChild(configDescription)
    
            configDetails.appendChild(configUser)
    
            configInfo.appendChild(configLabel)
            configInfo.appendChild(configDetails)
            const configDelete = document.createElement('button')
            configDelete.classList.add('saved-config-delete')
            configDelete.addEventListener("mouseenter", e => {
                configItem.style.backgroundColor = "var(--md-sys-color-on-secondary)"
                configDelete.style.backgroundColor = "#ff2c2c"
            })
            configDelete.addEventListener("mouseleave", e => {
                configDelete.style.backgroundColor = "var(--md-sys-color-error-container)"
                if (e.toElement == configItem || e.toElement == configItem.querySelector('.saved-config-information')) {
                    configItem.style.backgroundColor = "var(--md-sys-color-outline-variant)"
                } else {
                    configItem.style.backgroundColor = "var(--md-sys-color-on-secondary)"
                }
            })
            configDelete.addEventListener("click", e => {
                if (!confirm("Deleting a config is permanent and cannot be reverted, do you wish to continue?")) {
                    return
                }
                configItem.style.opacity = "1"
                deletePreservationConfig(config.id)
                    .then(responseData => {
                        // The delete was successful
                        console.info('Delete successful:', responseData);
                        configItem.style.animation = 'none'; // Reset the animation
                        void configItem.offsetWidth; // Trigger reflow to reset animation
                        configItem.style.animation = 'config-slide-and-fade-in 0.4s forwards reverse'; // Reverse and play animation
                        setTimeout(e => {
                            configItem.remove()
                        }, 400)
                    })
                    .catch(error => {
                        // Handle the error if the delete failed
                        configItem.style.animation = 'delete-failed-shake-animation 0.5s 0s infinite'
                        const preCol = configItem.style.backgroundColor
                        configItem.style.backgroundColor = "red"
                        console.error('Delete failed:', error);
                        // Reset animation and color after a brief delay
                        setTimeout(() => {
                            configItem.style.animation = 'none'
                            configItem.style.backgroundColor = preCol
                        }, 500); // Adjust the delay as needed (1 second in this example)
                    });
            })
            configDelete.textContent = "Delete Config"
            //create and append bookmark button
            const bookmarkDiv = document.createElement("div")
            bookmarkDiv.classList.add("config-bookmark-container")
            bookmarkDiv.addEventListener("click", e => {
                if (e.target.classList.contains("mdi-star-outline")) {
                    console.info("bookmarked!")
                    localStorage.setItem(config.id, JSON.stringify({ "name": config.name, "bookmarked": true }))
                    e.target.classList.remove("mdi-star-outline")
                    e.target.classList.add("mdi-star")
                } else if (e.target.classList.contains("mdi-star")) {
                    console.info("un-bookmarked!")
                    localStorage.setItem(config.id, JSON.stringify({ "name": config.name, "bookmarked": false }))
                    e.target.classList.remove("mdi-star")
                    e.target.classList.add("mdi-star-outline")
                }
            })
            const bookmarkIcon = document.createElement("span")
            const bookmarkCheck = JSON.parse(localStorage.getItem(config.id.toString()))
            if (bookmarkCheck && bookmarkCheck.bookmarked) {
                bookmarkIcon.classList.add("mdi-star")
            } else {
                bookmarkIcon.classList.add("mdi-star-outline")
            }
            bookmarkDiv.appendChild(bookmarkIcon)
            configItem.appendChild(bookmarkDiv)
            configItem.appendChild(configInfo)
            configItem.appendChild(configDelete)
            target.appendChild(configItem)
        })
        const savedItems = target.querySelectorAll(".saved-config-item")
        savedItems?.forEach((el, index) => el.style.animationDelay = `${(index * 0.55) / savedItems.length}s`);
        savedItems?.forEach((el, index, array) => {
            const delay = 0.05 * (index + 1);
            const duration = 1.0 - delay;
            el.style.animationDelay = `${delay}s`;
            el.style.animationDuration = `${duration}s`;
        });
        if (!configs || configs?.length == 0) {
    
            const noConfigs = document.createElement("div")
            noConfigs.textContent = "No Saved Preservation Configs Found"
            noConfigs.style.margin = "3em";
            noConfigs.style.width = "80%";
            noConfigs.style.height = "10%";
            noConfigs.style.textAlign = "center";
            noConfigs.style.display = "flex";
            noConfigs.style.color = "white";
            noConfigs.style.background = "var(--md-sys-color-outline-variant-50)";
            noConfigs.style.justifyContent = "center";
            noConfigs.style.alignItems = "center";
            noConfigs.style.borderRadius = "1.5em";
            container.appendChild(noConfigs)
        }
    
    }
    function createInput(input, target) {
        const inputContainer = document.createElement('div');
        inputContainer.classList.add('input-container');
        if (input.type === 'info') {
            const infoDiv = document.createElement('div');
            infoDiv.classList.add('config-info')
            infoDiv.textContent = input.text
            inputContainer.appendChild(infoDiv)
        }
        if (input.type === 'text') {
            const label = document.createElement('label');
            label.textContent = input.label;
            label.classList.add('config-text-label');
            const inputElement = document.createElement('input');
            inputElement.id = input.name
            inputElement.setAttribute('type', 'text');
            inputElement.classList.add('config-text-input');
            inputContainer.appendChild(label);
            inputContainer.appendChild(inputElement);
        } else if (input.type === 'toggle') {
            const label = document.createElement('label');
            label.textContent = input.label;
            label.classList.add('config-text-label');
            const toggleSwitch = document.createElement('input');
            toggleSwitch.setAttribute('type', 'checkbox');
            toggleSwitch.classList.add('tgl');
            toggleSwitch.classList.add('tgl-light')
            toggleSwitch.id = input.name
            const toggleLabel = document.createElement('label');
            toggleLabel.classList.add('tgl-btn');
            toggleLabel.htmlFor = input.name
            inputContainer.appendChild(label);
            inputContainer.appendChild(toggleSwitch);
            inputContainer.appendChild(toggleLabel);
        } else if (input.type === 'dropdown') {
            const selectLabel = document.createElement('label');
            selectLabel.textContent = input.label;
            selectLabel.classList.add('config-text-label');
            const selectElement = document.createElement('select');
            selectElement.id = input.name
            selectElement.classList.add('config-dropdown-select');
            // You can add options to the select element here if needed
            input.options.forEach(optionTitle => {
                const opDiv = document.createElement("option")
                opDiv.value = optionTitle
                opDiv.textContent = optionTitle
                selectElement.appendChild(opDiv)
            })
            inputContainer.appendChild(selectLabel);
            inputContainer.appendChild(selectElement);
        } else if (input.type == "slider") {
            const label = document.createElement('label');
            label.textContent = input.label;
            label.classList.add('config-text-label');
            // Create slider container
            const sliderContainer = document.createElement('div');

            sliderContainer.classList.add('config-slider-container');
            // Create slider value display
            const sliderValue = document.createElement('div');
            sliderValue.classList.add('config-slider-value');
            sliderValue.textContent = input.min;
            // Create slider element
            const slider = document.createElement('input');
            slider.id = input.name
            slider.setAttribute('type', 'range');
            slider.classList.add('config-slider');
            slider.setAttribute('min', input.min);
            slider.setAttribute('max', input.range);
            slider.setAttribute('step', input.step);
            slider.setAttribute('value', input.min);
            // Create min and max value display
            const minmaxContainer = document.createElement("div")
            minmaxContainer.classList.add("config-slider-minmax-container")
            const minValue = document.createElement('span');
            minValue.classList.add('config-slider-minmax');
            minValue.textContent = input.min;
            const maxValue = document.createElement('span');
            maxValue.classList.add('config-slider-minmax');
            maxValue.textContent = input.range;
            slider.addEventListener('input', () => {
                const value = slider.value;
                sliderValue.textContent = value;
            });
            // Append elements to the container
            minmaxContainer.appendChild(minValue)
            for (var x = 0; x < input.range - 2; x++) {
                const dot = document.createElement("div")
                dot.classList.add('config-slider-dot')
                minmaxContainer.appendChild(dot)
            }
            minmaxContainer.appendChild(maxValue)
            sliderContainer.appendChild(minmaxContainer);
            sliderContainer.appendChild(sliderValue);
            sliderContainer.appendChild(slider);
            inputContainer.appendChild(label)
            inputContainer.appendChild(sliderContainer);
        }

        if (input.suboptions) {
            inputContainer.addEventListener("change", e => {
                const idLabel = input.name
                if (e.target.id != idLabel) {
                    return
                } else if (e.target.checked) {
                    input.suboptions.forEach(s => {
                        if (s.type == "info") {
                            return
                        }
                        const subLabel = "#" + (s.name)
                        document.querySelector(subLabel).disabled = false
                        document.querySelector(subLabel).parentElement.style.opacity = "1";
                    })
                } else {
                    input.suboptions.forEach(s => {
                        if (s.type == "info") {
                            return
                        }
                        const subLabel = "#" + (s.name)
                        document.querySelector(subLabel).disabled = true
                        document.querySelector(subLabel).checked = false
                        document.querySelector(subLabel).parentElement.style.opacity = "0.3";
                    })
                }
            })

        }
        target.appendChild(inputContainer);
        if (input.suboptions) {
            input.suboptions.forEach(subinput => {
                createInput(subinput, inputContainer)
                setTimeout(e => {
                    if (subinput.type == "info") {
                        return
                    }
                    const subLabel = "#" + subinput.name
                    document.querySelector(subLabel).disabled = true
                    document.querySelector(subLabel).parentElement.style.opacity = "0.3";
                }, 50)

            })
        }
    }
    async function deletePreservationConfig(id) {
        const url = `${window.location.origin}/preservation/${id}`;
        const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
        return fetch(url, {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Check if the delete was successful based on the response data or status
            if (data) {
                getPreservationConfigs()
                return data; // Return the response data
            } else {
                throw new Error('Delete operation failed.');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            Curate.ui.modals.curatePopup({"title": "Error", "type": "error","content": "There was an error deleting your configuration. Please try again, or contact support if the problem persists."}).fire()
        });
    }
    // Saves the given preservation config to the server at route POST /preservation
    async function setPreservationConfig(config) {
        const url = `${window.location.origin}/preservation`;
        const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
        return fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(config)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            } else {
                //save configs to session
                console.info("config saved successfully")
                return response.json();
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            Curate.ui.modals.curatePopup({"title": "Error", "type": "error","content": "There was an error saving your configuration. Please try again, or contact support if the problem persists."}).fire()
        });
    }
    function flattenAndReplaceSpaces(input) {
        if (!input || typeof input !== "string") return "";
        return input.replaceAll(" ", "_");
    }
    async function editPreservationConfig(config) {
        const url = `${window.location.origin}/api/preservation/${config.id}`;
        const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
        return fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(config)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error while updating config, Status: ${response.status}`);
                }else if (response.status == 200) {
                    //save configs to session
                    console.info("config saved successfully")
                    return response.json();
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                Curate.ui.modals.curatePopup({"title": "Error", "type": "error","content": "There was an error saving your modified configuration. Please try again, or contact support if the problem persists."}).fire()
            });
        }

    // inputs for preservation config fields
    const inputs = [
        { category: "Details", inputs: [
          { label: "Config Name", name: "name", type: "text" },
          { label: "Config Description", name: "description", type: "text" }
        ]},
        { category: "Normalisation", inputs: [
          { label: "Normalise Objects", name: "normalize",type: "toggle", suboptions:[
            { label: "Image Normalisation Format", name: "image_normalization_tiff",type: "dropdown", options:["TIFF", "JPEG2000"] },
          ]},
        ]},
        { category: "Dissemination", inputs: [
            { label: "Create Dissemination Package", name: "dip_enabled", type:"toggle", suboptions: [
                { label: "Dissemination Information", name: "dip_info", type:"info", text:"Create dissemination packages from AIPs generated by this config. Created DIPs will automatically be connected to the linked description of the source data. For this option to work, you must configure a connected AtoM instance."},
                { label: "Go to AtoM Configuration", name: "atom_config", type:"button", text:"Go to AtoM Configuration", onclick:e => {
                    const p = Curate.ui.modals.curatePopup({"title": "Connect to Your AtoM Instance"},{
                        "afterLoaded":(c)=>{
                            const t = document.createElement("connect-to-atom")
                            c.querySelector(".config-main-options-container").appendChild(t)
                        }
                    })
                    p.fire()
                }},
            ]
            }]
        },
        { category: "Packaging and Compression", inputs: [
          { label: "AIP Packaging Type", name: "process_type", type:"dropdown", options:["standard", "eark"] },
          { label: "Compress AIPs", name: "compress_aip",type:"toggle", suboptions:[
            { label: "Warning", name: "compression_warning", type:"info", text:"Compressing AIPs will make their contents unsearchable and prevent descriptive metadata from being reassociated with output objects. You can compress your AIPs for distribution or deep-storage while conserving the uncompressed AIP by right-clicking an AIP in a workspace."},
            { label:"Compression Algorithm", name: "compression_algorithm",type:"dropdown", options:[
              "tar",
              "tar_bzip2",
              "tar_gzip",
              "s7_copy ",
              "s7_bzip2",
              "s7_lzma",
            ] 
            },
            { label:"Compression Level", name: "compression_level",type:"slider", min:1,range:9, step:1},  
          ]},
        ]},
        { category: "Transfer Options", inputs: [
          { label:"Generate Transfer Structure Report", name: "gen_transfer_struct_report", type:"toggle"},
          { label:"Document Empty Directories", name: "document_empty_directories", type:"toggle"},
          { label:"Extract Packages", name: "extract_packages", type:"toggle", suboptions:[
            { label:"Delete Packages After Extraction", name: "delete_packages_after_extraction", type:"toggle"}
          ]}
        ]}   
        ];

    window.addEventListener("load", e => {
        (async function() {
            const waitForGlobalVariable = (varName, interval = 50) => {
              return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                  if (window[varName] !== undefined) {
                    clearInterval(checkInterval);
                    resolve(window[varName]);
                  }
                }, interval);
              });
            };
          
            try {
              const glob = await waitForGlobalVariable('PydioApi');
              getPreservationConfigs()
            } catch (error) {
              console.error('An error occurred:', error);
            }
          })();
        
        setTimeout(() => {
            document.addEventListener("mousedown", e => {
                if (document.querySelector('.context-menu [role="menu"]') && document.querySelector('.context-menu [role="menu"]').contains(e.target)) {
                    return
                }
                if (!document.querySelector(".main-files-list")) {
                    return
                }
                if (e.which == 3 && document.querySelector(".main-files-list").contains(e.target)) {
                    if (document.querySelector('.context-menu [role="menu"]') && !document.querySelector('#preservationConfigDropdown')) {
                        setTimeout(() => {
                            addPreservationWorkflows(document.querySelector('.context-menu [role="menu"]'))
                        }, 100)

                    } else {
                        handleMutations(e)
                    }
                } else if (document.querySelector('#preservationConfigDropdown')) {
                    setTimeout(() => {
                        if (document.querySelector('#preservationConfigDropdown')) {
                            document.querySelector('#preservationConfigDropdown').remove()
                        }

                    }, 150)
                }
            }, 150)
        })
    })
