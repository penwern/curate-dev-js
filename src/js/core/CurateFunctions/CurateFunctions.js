import CurateApi from "./CurateApi.js";
import CurateWorkspaces from "./CurateWorkspaces.js";
import CurateUi from "./CurateUi.js";
import CurateMetadata from "./CurateMetadata.js";
import CurateContextualHelp from "./CurateContextualHelp.js";
import CurateRouter from "./CurateRouter.js";
import eventDelegator from "./CurateEvents.js";
export const Curate = (function () {
  const api = CurateApi;
  const workspaces = CurateWorkspaces;
  const ui = CurateUi;
  const metadata = CurateMetadata;
  const contextualHelp = CurateContextualHelp;
  const router = CurateRouter;
  return {
    api,
    workspaces,
    ui,
    metadata,
    contextualHelp,
    router,
    eventDelegator,
  };
})();
// Attach Curate to window so it's accessible globally in the browser for tinkering and debugging
window.Curate = Curate;
