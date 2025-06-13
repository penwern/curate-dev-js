  async function submitPreservationRequest(configId) {
        const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
        const url = `${window.location.origin}/a/scheduler/hooks/a3m-transfer`;
        const paths = pydio._dataModel._selectedNodes.map(n => ({
            path: Curate.workspaces.getOpenWorkspace() + n._path,
            slug: n._metadata.get("usermeta-atom-linked-description") || ""
        })); // change this to be something like:
        /**
         * JSON.stringify({
            "Paths": ["quarantine/dublin-old-photos.jpg"],
            "JobParameters": {"ConfigId": "3"}
         * })
         */
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
            
            const preservationConfigsPopup = new Curate.ui.modals.curatePopup({title:"Preservation Configs"},{
                afterLoaded: (popup)=>{
                    const configsInterface = document.createElement("preservation-config-manager");
                    popup.querySelector(".config-main-options-container").appendChild(configsInterface);
            }}).fire();
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
