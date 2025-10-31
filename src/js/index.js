// IMPORTANT: RouteProtection must be imported FIRST to intercept Pydio redirects
import "../js/core/RouteProtection.js";
import "../js/core/CurateFunctions/CurateFunctions.js";

// IMPORTANT: Import web components BEFORE custom-pages to prevent race conditions
// Custom routes may use these components, so they must be defined first
import "../js/web-components/atom-search.js";
import "../js/web-components/atom-connector.js";
import "../js/web-components/dip-slug-resolver.js";
import "../js/web-components/contextual-help.js";
import "../js/web-components/oai-harvest-updates.js";
import "./web-components/calm-harvest-interface.js";
import "./web-components/preservation-configs-menu/preservation-configs-menu.js";
import "./web-components/preservation-go-configs-menu/preservation-go-configs-menu.js";
import "./web-components/atom-go-credentials-menu/atom-go-credentials-menu.js";
import "./web-components/warc-viewer/warc-viewer.js";
import "./web-components/warc-viewer/warc-options.js";
import "./web-components/pure-integration-ui/main.js";
import "./web-components/calm-integration-ui/main.js";
import "./web-components/email-renderer/components/email-viewer.js";

// Now safe to import custom pages which use the components above
import "./custom-pages/index.js";

import "../js/core/CustomPreservationConfigs.js";
import "../js/core/fileInfoModifier.js";
import "../js/core/MetadataHierarchies.js";
import "../js/core/OAIHarvestClient.js";
import "../js/core/publicAccessModifier.js";
import "../js/core/tourModifier.js";
import "../js/core/UploadInterceptor/index.js";
import "../js/core/PassOaiToChildren.js";
import "../js/core/consoleModifier.js";
import "../js/core/messageModifier.js";
import "../js/core/fixes/FixInfoPanelScroll.js";
import "./core/Events/index.js";
//import './deprecated/UploadChecksumGenerator.js';
import "../js/core/PermissionEnforcers.js";
import "../js/external/ExternalScripts.js";
//import 'chart.js';
//import Swal from 'sweetalert2';
//import Papa from 'papaparse';
//import he from 'he';
