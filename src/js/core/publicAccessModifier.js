function sugIPrompt(msg) {
  let mD = document.createElement("div");
  let mC = document.createElement("button");
  let mA = document.createElement("span");
  let mM = document.createElement("text");
  let mL = document.createElement("hr");
  mM.textContent = msg;
  mM.style.marginTop = "1em";
  mA.style.ariaHidden = "true";
  mA.innerHTML = "&times;";
  mC.style.ariaLabel = "Close alert";
  mC.style.type = "button";
  mC.style.backgroundColor = "white";
  mC.style.border = "0";
  mC.style.position = "absolute";

  mC.style.top = "0";
  mC.style.right = "0";

  mC.onclick = function () {
    this.parentNode.className = "slideOut";
    setTimeout(function () {
      mD.remove();
    }, 1000);
  };
  mC.appendChild(mA);
  mD.style.backgroundColor = "white";
  mD.style.borderRadius = "0.5em";
  mD.style.width = "16em";
  mD.style.height = "auto";
  mD.style.padding = "1.8em";
  mD.style.paddingBottom = "0em";
  mD.style.margin = "2em";

  mD.style.position = "absolute";
  mD.style.bottom = "5em";
  mD.style.right = "0";
  mD.style.boxShadow = "0 10px 16px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19)";

  mD.className = "slideIn";
  mL.style.borderTop = "1px solid black";
  mL.style.marginTop = "1em";
  mL.className = "lineLoad";

  mC.appendChild(mA);
  mD.appendChild(mC);
  mD.appendChild(mM);
  mD.appendChild(mL);

  //main
  document.querySelector("body").appendChild(mD);
  setTimeout(function () {
    mD.classList.remove("slideIn");
  }, 1000);
  setTimeout(function () {
    mD.className = "slideOut";
    setTimeout(function () {
      mD.remove();
    }, 1000);
  }, 6000);
}
let waitFor = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
async function pL() {
  let v = 1;
  while (v !== 0) {
    await waitFor(100);
    let t = document.querySelector("#workspace_toolbar");
    if (t == null) {
      // noop — toolbar not yet rendered; wait and retry
    } else {
      v = 0;
      let u = window.location.href;
      if (u.includes("/public/")) {
        let h = document.querySelector("#pydio_shared_folder");
        if (h == null) {
          let h =
            document.querySelector("#pydio_dropbox_template").firstElementChild.firstElementChild;
          h.style.backgroundColor = "#9fd0c7";
          let l = h.firstElementChild;
          l.style.marginTop = "1em";
          l.style.marginBottom = "1em";
          l.style.marginLeft = "1em";
          let t = document.querySelector(".segment");
          t.textContent = "Directory: " + t.textContent;
          //drag drop upload interface selected
          sugIPrompt(
            "Welcome to Curate, simply drag and drop files in to the dashed area to upload.",
          );
        } else {
          let h =
            document.querySelector("#pydio_shared_folder").firstElementChild.firstElementChild;
          h.style.backgroundColor = "#9fd0c7";
          let l = h.firstElementChild;
          l.style.marginTop = "1em";
          l.style.marginBottom = "1em";
          l.style.marginLeft = "1em";
          //drag drop upload interface selected
          let uP = pydio.Controller.actions.toJSON()[8][1].deny;
          let msg1 =
            "Welcome to Curate, here you can view or download files shared with you by your collaborators.";
          let msg2 = " You can also create folders and upload new files.";
          var msg;
          if (uP == false) {
            msg = msg1 + msg2;
          } else {
            msg = msg1;
          }
          sugIPrompt(msg);
        }
      }
    }
  }
}

function oMc() {
  setTimeout(function () {
    let cFs = ["Generate mimetype report", "Export Archivematica JSON"];
    for (let x = 0; x < cFs.length; x++) {
      let xpath = "//div[text()='" + cFs[x] + "']";
      try {
        let matchingElement = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue;
        matchingElement.parentElement.parentElement.parentElement.parentElement.remove();
      } catch (_e) {
        // noop — element may not exist on this page layout; safe to ignore
      }
    }
  }, 1);
}
document.addEventListener("DOMContentLoaded", function () {
  pL();
  let sF;
  try {
    sF = document.querySelector("#pydio_shared_folder");
  } catch (_nSF) {
    // noop — querySelector throws only if document is not ready; safe to ignore
  }
  if (sF) {
    setTimeout(function () {
      document.querySelector(".toolbars-button-menu").addEventListener("click", oMc);
    }, 3000);
  }
});
