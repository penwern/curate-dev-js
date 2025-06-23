import CurateApi from "./CurateApi.js";
import CurateWorkspaces from "./CurateWorkspaces.js";
import CurateUi from "./CurateUi.js";
import CurateMetadata from "./CurateMetadata.js";
import CurateContextualHelp from "./CurateContextualHelp.js";
import eventDelegator from "./CurateEvents.js";
const Curate = (function () {
  const api = CurateApi;
  const workspaces = CurateWorkspaces;
  const ui = CurateUi;
  const metadata = CurateMetadata;
  const contextualHelp = CurateContextualHelp;
  return {
    api,
    workspaces,
    ui,
    metadata,
    contextualHelp,
    eventDelegator,
  };
})();
// Export Curate so it's accessible globally
window.Curate = Curate;
