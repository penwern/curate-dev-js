const getMetaItem = (item) => {
    try {
        return pydio._dataModel._selectedNodes[0]._metadata.get(item) || null;
    } catch (err) {
        return null;
    }
}

const removeRows = () => {
    Array.from(document.querySelectorAll(".panelCard")) // get all panelCards
        .find(c => c.textContent.includes("File Info")) // find fileInfoPanel
        ?.querySelector("#curateAdditionalInfo") // if fileInfoPanel exists, get #curateAdditionalInfo
        ?.remove(); // if curateAdditionalInfo exists, remove it
}
const daysSince = (scanDate) => Math.floor((new Date() - new Date(scanDate)) / 86400000);

const getQuarantineStatus = (scan, scan2, scanTag, scanDate) => {
    const openWs = Curate.workspaces.getOpenWorkspace()
    if ((!scanTag || scan == 'File has not been scanned') && openWs == 'quarantine' && scanTag !== 'SizeLimitTag') {
        return 'This file has not been scanned and is at risk.'
    }
    // commenting out for now because I believe a file will not be rescanned if uploaded to a different workspace and then moved to quarantine
    //if ((!scanTag || scan == 'File has not been scanned') && openWs !== 'quarantine' && scanTag !== 'Scan Limit Exceeded') {
    //    return 'This file has not been scanned and is at risk. Please move it into the Quarantine workspace to be scanned.'
    //}
    if (scanTag == 'QuarantineTag') {
        return `File in quarantine, current period: ${daysSince(scanDate)} days.`
    }
    if (scanTag == 'SizeLimitTag') {
        return `File is too large to be scanned.`
    }
    if (scanTag == 'PassTag' && (openWs == 'personal-files' || openWs == 'common files')) {
        return `File has passed the ${openWs.replace('-', ' ')} scan.`
    }else if (scanTag == 'PassTag'){
        return `File has passed an initial scan but will not be scanned again, please move it into the Quarantine workspace.`
    }
    if (scanTag == 'ReleaseTag') {
        return `File has been released from quarantine.`
    }
    if (scanTag == 'FailTag') {
        return `File has not completed its quarantine period and is at risk.`
    }
}

const genNewRow = (label, value) => {
    const createElement = (className, textContent, styles = {}) => {
        const el = document.createElement("div");
        el.className = className;
        el.textContent = textContent;
        Object.assign(el.style, styles);
        return el;
    };
    const row = createElement("infoPanelRow", null, { padding: "0px 16px 6px" });
    const labelDiv = createElement("infoPanelLabel", label, { fontWeight: "415" });
    const valueDiv = createElement("infoPanelValue", value);
    
    row.appendChild(labelDiv);
    row.appendChild(valueDiv);
    
    return row;

};

function addFileInfo(fileInfoPanel) {
    // aggressive nullish coalescing to avoid errors since seigfried info is not always present
    var pid = getMetaItem("files")?.[0]?.matches?.[0]?.id ?? "File has not been characterised";
    var scans = ["usermeta-virus-scan-first", "usermeta-virus-scan-second"].map(item => getMetaItem(item) || 'File has not been scanned');
    var tag = pydio._dataModel._selectedNodes[0]._metadata.get("etag")
    if (tag.endsWith('-1')) {
        tag = "Local hash"
    }
    var mime = getMetaItem("mime")
    const scanTag = getMetaItem("usermeta-virus-scan")
    const firstScanDate = getMetaItem("usermeta-virus-scan-passed-date")
    var status = getQuarantineStatus(...scans, scanTag,firstScanDate)
    
    setTimeout(function () {
        let newRows = document.createElement("div")
        newRows.style.marginTop = "-11px"
        newRows.id = "curateAdditionalInfo"
        let newinfodivPronom = genNewRow("Pronom ID", pid)
        if (pid !== "File has not been characterised") {
            newinfodivPronom.style.cursor = "pointer"
            newinfodivPronom.style.transition = "all 0.2s ease-in-out"
            newinfodivPronom.addEventListener("mouseenter", e => {
                newinfodivPronom.style.textDecoration = "underline"
                newinfodivPronom.style.backgroundColor = "rgba(153, 153, 153, 0.2)"
            })
            newinfodivPronom.addEventListener("mouseleave", e => {
                newinfodivPronom.style.textDecoration = "none"
                newinfodivPronom.style.backgroundColor = "transparent"
            })
            newinfodivPronom.addEventListener("click", e => {
                window.open(`https://www.nationalarchives.gov.uk/pronom/${pid}`)
            })
        }
        let newinfodivScan = genNewRow("First virus scan result", scans[0])
        let newinfodivScan2 = genNewRow("Second virus scan result", scans[1])
        let newinfodivMime = genNewRow("Mimetype", mime)
        let newinfodivStatus = genNewRow("Status", status)
        
        fileInfoPanel.querySelector(".panelContent").childNodes.forEach(row => {
            if (row.innerText.includes('ETag')) {
                row.firstChild.innerText = 'Checksum'
                row.querySelector(".infoPanelValue").innerText = tag
            }
        })
        
        let sepDiv = document.createElement("HR")
        let qInfo = document.createElement("div")
        let bCap = document.createElement("div")
        bCap.style.marginBottom = '5px'
        qInfo.textContent = "Quarantine Info"
        qInfo.id = "quarantineInfoLabel"
        qInfo.style.color = 'rgb(77, 122, 143)'
        qInfo.style.fontSize = '14px'
        qInfo.style.fontWeight = '500'
        qInfo.style.marginLeft = "15px"
        qInfo.style.marginBottom = "10px"

        newRows.appendChild(newinfodivPronom)
        newRows.appendChild(sepDiv)
        newRows.appendChild(qInfo)
        newRows.appendChild(newinfodivStatus)
        newRows.appendChild(newinfodivScan)
        newRows.appendChild(newinfodivScan2)
        newRows.appendChild(bCap)

        if (!fileInfoPanel.querySelector("#curateAdditionalInfo")) {
            fileInfoPanel.appendChild(newRows)
        } else {
            removeRows()
            fileInfoPanel.appendChild(newRows)
        }
    }, 5);
}
const selectHandler = (e, fileInfoPanel) => {
    var fileInfoPanel = Array.from(document.querySelectorAll('.panelCard')).find(el => el.textContent.includes('File Info'));
    
    if (!e.memo._selectedNodes || e.memo._selectedNodes.length == 0 || e.memo._selectedNodes[0] == selectedNode) {
        return
    }
    if (fileInfoPanel && fileInfoPanel.querySelector(".panelContent")) {
        addFileInfo(fileInfoPanel)
        selectedNode = e.memo._selectedNodes[0]
    }
}
var selectedNode
const processFileInfoPanel = (fileInfoPanel) => {
    if (fileInfoPanel) {

        //found fileInfoPanel

        // Check if "selectHandler" is in the observers array
        if (!pydio._dataModel._observers.selection_changed.includes(selectHandler)) {
            pydio._dataModel.observe("selection_changed", e => { selectHandler(e) })
        }
        fileInfoPanel.firstElementChild.addEventListener("click", e => {
            if (fileInfoPanel.querySelector('[class*="mdi-chevron-"]').classList.contains("mdi-chevron-up")) {
                //fileInfoPanel.querySelector("#curateAdditionalInfo").remove()
            } else if (fileInfoPanel.querySelector('[class*="mdi-chevron-"]').classList.contains("mdi-chevron-down")) {
                //addFileInfo(fileInfoPanel)
            }
        })
        onElementRemoved(fileInfoPanel.querySelector(".panelContent"), () => {
            fileInfoPanel.querySelector("#curateAdditionalInfo").remove()
        })
        if (fileInfoPanel.querySelector(".panelContent")) {
            
            addFileInfo(fileInfoPanel)
        }
        return;
    }
}
const fileInfoObserver = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLElement && node.classList.contains("panelCard") && node.innerText.includes("File Info")) {
                    processFileInfoPanel(node)
                }else if (node instanceof HTMLElement && node.classList.contains("panelContent") && node.parentElement.classList.contains("panelCard") && node.parentElement.innerText.includes("File Info")) {
                    processFileInfoPanel(node.parentElement)
                }
                
            }
        }
    }
});
function onElementRemoved(element, callback) {
    // Ensure the element exists and has a parent node to observe
    if (!element || !element.parentElement) {
      console.error('The element or its parent is not defined.');
      return;
    }
  
    // Create a MutationObserver to watch for changes in the parent element
    const observer = new MutationObserver(mutations => {
      for (let mutation of mutations) {
        // Check each mutation record for removed nodes
        if (mutation.removedNodes.length) {
          for (let removedNode of mutation.removedNodes) {
            // Check if the removed node is the target element or contains the target element
            if (removedNode === element || removedNode.contains(element)) {
              callback(); // Execute the callback function
              observer.disconnect(); // Disconnect the observer to clean up resources
              return; // Exit after handling the removal
            }
          }
        }
      }
    });
  
    // Start observing the parent element for changes in its child elements
    observer.observe(element.parentElement, { childList: true, subtree: true });
  }
fileInfoObserver.observe(document.documentElement, { childList: true, subtree: true });
