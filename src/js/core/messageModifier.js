const systemName = window.curateDistrobution || "Soteria+"; // could be replaced with something that figures out whether we're in Soteria+ or Curate

const welcomeMessage = () => {
  // console.log("message modifier");
  const messages = pydioBootstrap.parameters.get("i18nMessages");

  // Function to handle both "Cells" and "Pydio Cells" replacements
  const replaceSystemNames = (text) => {
    return text
      .replace(/Pydio\s*Cells/gi, systemName) // Replace "Pydio Cells" or "PydioCells"
      .replace(/(?<!Pydio\s*)Cells/gi, systemName); // Replace standalone "Cells" not preceded by "Pydio"
  };

  // Process all messages that might contain "Cells" references
  Object.keys(messages).forEach((key) => {
    if (typeof messages[key] === "string") {
      messages[key] = replaceSystemNames(messages[key]);
    }
  });
  window.removeEventListener("load", welcomeMessage);
};

window.addEventListener("load", welcomeMessage);
