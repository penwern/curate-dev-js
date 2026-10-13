// This entry is only bundled by webpack.fpr-preview.config.js.
// Production never imports fixture data or this local fetch adapter.
import "../src/js/web-components/preservation-go-configs-menu/preservation-go-configs-menu.js";
import CurateUi from "../src/js/core/CurateFunctions/CurateUi.js";
const nativeFetch = window.fetch.bind(window);
window.PydioApi = { _PydioRestClient: { getOrUpdateJwt: async () => "local-preview" } };
window.Curate = { ui: CurateUi };
let registryPromise;
window.fetch = async (input, options = {}) => {
  const path = new URL(input, window.location.origin).pathname;
  if (path === "/api/v1/fpr") {
    const code = document.getElementById("response").value;
    if (code)
      return Response.json(
        { code },
        {
          status:
            code === "unauthorized"
              ? 401
              : code === "fpr_not_supported"
                ? 501
                : code === "fpr_timeout"
                  ? 504
                  : 503,
        },
      );
    registryPromise ??= nativeFetch("/fpr-registry.json").then((response) => {
      if (!response.ok)
        throw new Error("Run npm run fixture:fpr to generate the preview registry.");
      return response.text();
    });
    return new Response(await registryPromise, {
      headers: { "Content-Type": "application/json", "X-FPR-Command-Bodies": "omitted" },
    });
  }
  if (path === "/api/v1/preservation-configs" && (!options.method || options.method === "GET")) {
    return Response.json([
      {
        id: 1,
        name: "Default Configuration",
        description: "Used by Preserve and automatic curation.",
      },
    ]);
  }
  if (path.startsWith("/api/v1/"))
    return Response.json({ error: "Preview is read-only." }, { status: 405 });
  return nativeFetch(input, options);
};

const manager = document.createElement("preservation-go-config-manager");
manager.section = "fpr";
document.getElementById("preview").append(manager);
if (new URLSearchParams(window.location.search).has("modal")) {
  CurateUi.modals
    .curatePopup(
      { title: "Preservation Configs" },
      {
        afterLoaded: (popup) =>
          popup.querySelector(".config-main-options-container").append(manager),
        afterClosed: () => document.getElementById("preview").append(manager),
      },
    )
    .fire();
}
document
  .getElementById("response")
  .addEventListener("change", () => manager.shadowRoot.querySelector("curate-fpr-viewer").load());
