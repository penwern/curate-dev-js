import { svg } from "lit";
import {
  mdiTune,
  mdiDatabaseImport,
  mdiHistory,
  mdiChartLine,
  mdiHelpCircleOutline,
  mdiDelete,
  mdiPlus,
  mdiPowerPlugOutline,
  mdiRestart,
  mdiContentSave,
  mdiFormTextbox,
  mdiMagnify,
  mdiPlay,
  mdiCheckCircleOutline,
  mdiAlertCircleOutline,
  mdiChevronRight,
  mdiChevronDown,
  mdiChevronLeft,
  mdiChevronUp,
  mdiCheckCircle,
  mdiSitemap,
  mdiPencil,
  mdiLinkVariantOff,
  mdiCheckboxBlankCircleOutline,
  mdiLockOutline,
  mdiBlockHelper,
  mdiCached,
  mdiEmail,
  mdiEmailOutline,
  mdiAttachment,
  mdiDownload,
  mdiSort,
  mdiFilterOutline,
  mdiClose,
  mdiArrowLeft,
  mdiDotsVertical,
  mdiImageOutline,
  mdiForum,
  mdiFolderOutline,
  mdiFileDocumentOutline,
  mdiFileTree,
  mdiMapMarker,
  mdiDatabase,
  mdiLayers,
  mdiUnfoldMoreHorizontal,
  mdiUnfoldLessHorizontal,
} from "@mdi/js";

// A helper to wrap the SVG path data in an <svg> tag
export const icon = (path, slot = "") => svg`
  <svg slot=${slot} viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor;">
    <path d="${path}"></path>
  </svg>
`;

// Export each icon so we can import them into the component
export const tuneIcon = icon(mdiTune, "icon");
export const dbImportIcon = icon(mdiDatabaseImport, "icon");
export const historyIcon = icon(mdiHistory, "icon");
export const chartLineIcon = icon(mdiChartLine, "icon");
export const helpCircleIcon = icon(mdiHelpCircleOutline);
export const deleteIcon = icon(mdiDelete);
export const plusIcon = icon(mdiPlus, "icon");
export const powerPlugIcon = icon(mdiPowerPlugOutline);
export const restartIcon = icon(mdiRestart, "icon");
export const saveIcon = icon(mdiContentSave, "icon");
export const textboxIcon = icon(mdiFormTextbox, "icon");
export const searchIcon = icon(mdiMagnify, "icon");
export const playIcon = icon(mdiPlay, "icon");
export const checkCircleIcon = icon(mdiCheckCircleOutline);
export const alertCircleIcon = icon(mdiAlertCircleOutline);
export const chevronRightIcon = icon(mdiChevronRight);
export const chevronDownIcon = icon(mdiChevronDown);
export const chevronLeftIcon = icon(mdiChevronLeft);
export const chevronUpIcon = icon(mdiChevronUp);
export const checkCircleFilledIcon = icon(mdiCheckCircle);
export const sitemapIcon = icon(mdiSitemap, "icon");
export const pencilIcon = icon(mdiPencil);
export const linkVariantOffIcon = icon(mdiLinkVariantOff);
export const linkOffIcon = icon(mdiLinkVariantOff); // Alias for new naming convention
export const checkboxBlankCircleIcon = icon(mdiCheckboxBlankCircleOutline);
export const unmappedStatusIcon = icon(mdiCheckboxBlankCircleOutline); // Alias for new naming convention
export const lockIcon = icon(mdiLockOutline);
export const blockHelperIcon = icon(mdiBlockHelper);
export const blockIcon = icon(mdiBlockHelper);
export const cachedIcon = icon(mdiCached);
export const cacheIcon = icon(mdiCached, "icon"); // Alias for new naming convention

// Email viewer icons
export const emailIcon = icon(mdiEmail);
export const emailOutlineIcon = icon(mdiEmailOutline);
export const attachmentIcon = icon(mdiAttachment);
export const downloadIcon = icon(mdiDownload);
export const sortIcon = icon(mdiSort, "icon");
export const filterIcon = icon(mdiFilterOutline, "icon");
export const closeIcon = icon(mdiClose);
export const arrowLeftIcon = icon(mdiArrowLeft);
export const dotsVerticalIcon = icon(mdiDotsVertical);
export const imageIcon = icon(mdiImageOutline);
export const forumIcon = icon(mdiForum);
export const folderIcon = icon(mdiFolderOutline);

// New icons from updated version
export const documentIcon = icon(mdiFileDocumentOutline);
export const hierarchyIcon = icon(mdiFileTree);
export const pinIcon = icon(mdiMapMarker);
export const databaseIcon = icon(mdiDatabase);
export const layersIcon = icon(mdiLayers);
export const expandAllIcon = icon(mdiUnfoldMoreHorizontal);
export const collapseAllIcon = icon(mdiUnfoldLessHorizontal);

//need to sort out icons, in future import icon handler 
// and then just import mdi icons directly in components 
// and wrap with icon. Then they can be named whatever.