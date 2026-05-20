const requestApiKey = (refreshDuration) => {
  const expiryDate = new Date(Date.now() + refreshDuration * 86400 * 1000);
  return Curate.api
    .fetchCurate("/a/auth/token/impersonate", "POST", {
      Label: "Manually generated Curate API Key, created by: " + pydio.user.id,
      UserLogin: pydio.user.id,
      AutoRefresh: refreshDuration * 86400, // Convert days to seconds
    })
    .then((r) => {
      return { ...r, expiryDate };
    });
};

const apiKeyPopup = Curate.ui.modals.curatePopup(
  {
    title: "Generate a new API Key",
  },
  {
    afterLoaded: function (e) {
      const modalContent = document.createElement("div");
      modalContent.style =
        "padding: 30px; text-align: center; margin: auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;";

      const infoText = document.createElement("p");
      infoText.textContent =
        "Generate a new API key by selecting the refresh duration and clicking the button below.";
      infoText.style = "margin-bottom: 20px; font-size: 16px; color: #333;";

      const durationContainer = document.createElement("div");
      durationContainer.style =
        "margin-bottom: 20px; display: flex; justify-content: center; align-items: center;";

      const durationLabel = document.createElement("label");
      durationLabel.textContent = "Key Refresh Duration (days):";
      durationLabel.style = "margin-right: 10px; font-size: 14px; color: #333;";

      const durationInput = document.createElement("input");
      durationInput.type = "number";
      durationInput.min = 1;
      durationInput.value = 7; // Default value of 7 days
      durationInput.style =
        "padding: 8px 10px; border: 1px solid #ccc; border-radius: 5px; width: 80px;";

      durationContainer.appendChild(durationLabel);
      durationContainer.appendChild(durationInput);

      const generateButton = document.createElement("button");
      generateButton.textContent = "Generate API Key";
      generateButton.style =
        "padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); transition: background-color 0.3s;";
      generateButton.addEventListener("mouseover", () => {
        generateButton.style.backgroundColor = "#45a049";
      });
      generateButton.addEventListener("mouseout", () => {
        generateButton.style.backgroundColor = "#007bff";
      });

      const keyContainer = document.createElement("div");
      keyContainer.style =
        "display: flex; flex-direction: row; align-items: center; margin-top: 20px;";

      const keyDisplay = document.createElement("input");
      keyDisplay.placeholder = "Your API Key will appear here...";
      keyDisplay.setAttribute("readonly", true);
      keyDisplay.style =
        "flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 14px;";

      const keyCopy = document.createElement("button");
      keyCopy.innerHTML = '<i class="mdi mdi-content-copy" style="font-size: 16px;"></i>';
      keyCopy.style =
        "background-color: #007bff; border: none; padding: 8px 10px; cursor: pointer; border-radius: 5px; margin-left: 10px; color: white;";
      keyCopy.title = "Copy API Key";

      keyContainer.appendChild(keyDisplay);
      keyContainer.appendChild(keyCopy);

      const refreshDateDisplay = document.createElement("p");
      refreshDateDisplay.style = "margin-top: 20px; font-size: 14px; color: #555;";

      const safetyText = document.createElement("p");
      safetyText.innerHTML =
        "<strong>Important:</strong> Keep your API key secure. Do not share it, and ensure it is stored safely. Remember, you cannot retrieve it once this window is closed.";
      safetyText.style = "margin-top: 20px; font-size: 14px; color: #dc3545;";

      modalContent.appendChild(infoText);
      modalContent.appendChild(durationContainer);
      modalContent.appendChild(generateButton);
      modalContent.appendChild(keyContainer);
      modalContent.appendChild(refreshDateDisplay);
      modalContent.appendChild(safetyText);

      generateButton.addEventListener("click", () => {
        const refreshDuration = parseInt(durationInput.value);
        const accessKey = requestApiKey(refreshDuration);
        accessKey.then((r) => {
          keyDisplay.value = r.AccessToken;
          refreshDateDisplay.textContent = `This key will refresh on ${r.expiryDate.toLocaleDateString()} unless refreshed sooner, meaning its expiry is extended whenever it's used.`;
        });
      });

      keyCopy.addEventListener("click", () => {
        keyDisplay.select();
        document.execCommand("copy");
        keyCopy.textContent = "Copied!";
        setTimeout(() => {
          keyCopy.innerHTML = '<i class="mdi mdi-content-copy" style="font-size: 16px;"></i>';
        }, 2000);
      });

      e.querySelector(".config-main-options-container").appendChild(modalContent);
    },
    afterClosed: function () {
      console.log("Modal has been closed");
    },
  },
);

apiKeyPopup.fire();
