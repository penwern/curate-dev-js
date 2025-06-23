import CurateApi from "./CurateApi.js";
import CurateWorkspaces from "./CurateWorkspaces.js";
import CurateUi from "./CurateUi.js";
import CurateMetadata from "./CurateMetadata.js";
import CurateContextualHelp from "./CurateContextualHelp.js";
import eventDelegator from "./CurateEvents.js";
export const Curate = (function () {
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
// Attach Curate to window so it's accessible globally in the browser for tinkering and debugging
window.Curate = Curate;
