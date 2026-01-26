// src/js/workers/replaywebpage.worker.js
// Load the bundled replaywebpage service worker script relative to this worker
importScripts(new URL("../replaywebpage-sw.js", self.location.href).toString());
