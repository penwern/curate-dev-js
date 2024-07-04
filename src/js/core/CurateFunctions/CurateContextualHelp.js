

// Initialize a variable to hold the reference to the last right-clicked element
let lastRightClickedElement = null;
let page = window.location.pathname;
let selection = null;

const CurateContextualHelp = {
    context:{
        page,
        lastRightClickedElement,
        selection
    }
};

function handleRightClick(event) {
  // Update the lastRightClickedElement with the target of the right click
  if (event.button === 2) {
    lastRightClickedElement = event.target;
    page = window.location.pathname;
    selection = pydio?._dataModel._selectedNodes || null;
  }
}

// Add the event listener to the document
window.addEventListener("load", ()=>document.addEventListener("mousedown", handleRightClick));

export default CurateContextualHelp;