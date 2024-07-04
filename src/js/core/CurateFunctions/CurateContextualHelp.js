

// Initialize a variable to hold the reference to the last right-clicked element
let lastRightClickedElement = null;

const CurateContextualHelp = {
    lastRightClickedElement,
};

// Function to handle the contextmenu event
function handleRightClick(event) {
  // Update the lastRightClickedElement with the target of the right click
  lastRightClickedElement = event.target;
  console.log("Last right-clicked element:", lastRightClickedElement);
}

// Add the event listener to the document
document.addEventListener("contextmenu", handleRightClick);

export default CurateContextualHelp;