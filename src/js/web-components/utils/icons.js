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
  mdiCheckCircle,
  mdiSitemap,
  mdiPencil,
  mdiLinkVariantOff,
  mdiCheckboxBlankCircleOutline,
  mdiLockOutline,
  mdiBlockHelper,
  mdiCached,
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
export const checkCircleFilledIcon = icon(mdiCheckCircle);
export const sitemapIcon = icon(mdiSitemap);
export const pencilIcon = icon(mdiPencil);
export const linkVariantOffIcon = icon(mdiLinkVariantOff);
export const checkboxBlankCircleIcon = icon(mdiCheckboxBlankCircleOutline);
export const lockIcon = icon(mdiLockOutline);
export const blockHelperIcon = icon(mdiBlockHelper);
export const cachedIcon = icon(mdiCached);
