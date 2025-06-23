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
        const curConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs") || "[]")
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
        const curConfig = {
            user: pydio.user.id
        }
        const matchingObj = curConfigs?.find(obj => obj.name == saveName);
        if (matchingObj) {
            curConfig["id"] = matchingObj.id; // we're editing an already saved config
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
            editPreservationConfig(curConfig).then(r => {
                console.log(r)
                if (r) {
                    const curConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs") || "[]")
                    getPreservationConfigs()
                        .then(r => {
                            const newConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs") || "[]")
                            console.log(newConfigs)
                            if (curConfig.id) {
                                document.querySelector("#config-" + curConfig.id).remove()
                                createConfigsBox(savedScrollContainer, savedConfigsContainer,[newConfigs.find(obj => obj.id === curConfig.id)])
                            } else {
                                const newObject = newConfigs.find(newObj => !curConfigs.some(curObj => curObj.id === newObj.id));
                                createConfigsBox(savedScrollContainer, savedConfigsContainer,[newObject])
                            }
                        })
                saveConfig.style.display = "none"
                }
            })
        }else{
            console.log("saving new config")
            setPreservationConfig(curConfig) //save new config
            .then(r => {
                console.log(r)
                if (r) {
                    console.log("saved new config")
                    const curConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs") || "[]")
                    getPreservationConfigs()
                        .then(r => {
                            const newConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs") || "[]")
                            console.log(newConfigs)
                            
                            const newObject = newConfigs.find(newObj => !curConfigs.some(curObj => curObj.id === newObj.id));
                            createConfigsBox(savedScrollContainer,savedConfigsContainer, [newObject])
                            
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
    const savedConfigs = JSON.parse(sessionStorage.getItem("preservationConfigs") || "[]")
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
async function getPreservationConfigs() {
    const url = `${window.location.origin}/api/preservation`;
    const token = await PydioApi._PydioRestClient.getOrUpdateJwt();
    return fetch(url, {
        method: 'GET',
        headers: {
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
            //save configs to session
            sessionStorage.setItem("preservationConfigs", JSON.stringify(data))
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
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
async function setPreservationConfig(config) {
    const url = `${window.location.origin}/api/preservation`;
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
            throw new Error(`HTTP error while creating config, Status: ${response.status}`);
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
async function deletePreservationConfig(id) {
    const url = `${window.location.origin}/api/preservation/${id}`;
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
        const bookmarkCheck = JSON.parse(localStorage.getItem(config.id.toString()) || "{}")
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
    }else if(input.type == "button"){
        const label = document.createElement('label');
        label.textContent = input.label;
        label.classList.add('config-text-label');
        label.style.visibility = "hidden";
        const button = document.createElement('button');
        button.id = input.name
        button.classList.add('config-button');
        button.textContent = input.text;
        button.onclick = input.onclick;
        inputContainer.appendChild(label);
        inputContainer.appendChild(button);
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
createCuratePopup("Preservation Configs",inputs);
