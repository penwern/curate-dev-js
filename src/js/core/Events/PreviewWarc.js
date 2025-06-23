import { html } from "lit";
import { Curate } from "../CurateFunctions/CurateFunctions";

const handlerId = Curate.eventDelegator.addEventListener(
  ".action-open_with",
  "click",
  async function (e) {
    // 'this' is the matched element (.action-open_with button)
    if (pydio._dataModel._selectedNodes.length == 1) {
      const selectedNode = pydio._dataModel._selectedNodes[0];
      const mime = selectedNode._metadata.get("mime");
      const name = selectedNode._metadata.get("name");

      // extension parsing for archive files
      function getFileExtension(filename) {
        const lowerName = filename.toLowerCase();
        if (lowerName.endsWith(".warc.gz")) return "warc.gz";
        if (lowerName.endsWith(".warc")) return "warc";
        if (lowerName.endsWith(".wacz")) return "wacz";
        return null;
      }

      const extension = getFileExtension(name);
      const allowedMimes = ["application/zip", "application/gzip"];
      const allowedExtensions = ["warc", "warc.gz", "wacz"];

      if (
        extension &&
        allowedMimes.includes(mime) &&
        allowedExtensions.includes(extension)
      ) {
        console.log(
          "it's a good file!: extension: ",
          extension,
          " mime: ",
          mime
        );
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const url = await PydioApi._PydioClient.buildPresignedGetUrl(
          pydio._dataModel._selectedNodes[0]
        );
        const optionsModal = Curate.ui.modals.curatePopup({
          title: "Preview Web-Archive",
          content: html`<warc-options-modal
            .closeSelf=${optionsModal.close}
            .fileUrl=${url}
          ></warc-options-modal>`,
        });

        optionsModal.fire();

        return false;
      }
    }
  },
  { capture: true } // Use capture phase to prevent event bubbling
);
