import * as XLSX from 'xlsx';

const MAX_EXPORT_ROWS = 10000;

/**
 * Triggers a file download from a Blob object.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Exports an array of row objects as a CSV file using PapaParse.
 * @param {string} filename
 * @param {object[]} rows  - Plain objects; keys become columns
 */
export function exportToCsv(filename, rows) {
  const csv = window.Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exports arbitrary data as a pretty-printed JSON file.
 * @param {string} filename
 * @param {*} data
 */
export function exportToJson(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Exports a multi-sheet Excel workbook (.xlsx) via SheetJS.
 * @param {string} filename
 * @param {{ name: string, rows: object[] }[]} sheets
 */
export function exportToXlsx(filename, sheets) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows.length > 0 ? sheet.rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)); // Excel sheet names max 31 chars
  }
  XLSX.writeFile(wb, filename);
}

/**
 * Builds a standardised filename for exports.
 * @param {string} panel       e.g. "ingestion", "overview"
 * @param {string} format      e.g. "csv", "json", "xlsx"
 * @param {object} [filters]   Optional { workspace: string }
 * @returns {string}
 */
export function buildFilename(panel, format, filters = {}) {
  const date = new Date().toISOString().slice(0, 10);
  const wsPart = filters.workspace ? `-${filters.workspace}` : '';
  const ext = { csv: 'csv', json: 'json', xlsx: 'xlsx' }[format] ?? format;
  return `curate-${panel}${wsPart}-${date}.${ext}`;
}

/**
 * Fetches all pages of audit logs for a given query, up to MAX_EXPORT_ROWS.
 * Used by paginated panels to retrieve complete datasets for export.
 * @param {Function} getAuditLogsFn  The getAuditLogs API function
 * @param {string} query
 * @returns {Promise<object[]>}  Array of raw log objects
 */
export async function fetchAllAuditLogs(getAuditLogsFn, query) {
  const pageSize = 200;
  let all = [];
  let page = 0;

  while (all.length < MAX_EXPORT_ROWS) {
    const res = await getAuditLogsFn(query, page, pageSize);
    const logs = res.Logs ?? [];
    all = all.concat(logs);
    const total = res.Total ?? 0;
    if (all.length >= total || logs.length < pageSize) break;
    page++;
  }

  if (all.length >= MAX_EXPORT_ROWS) {
    console.warn(`Export capped at ${MAX_EXPORT_ROWS} records.`);
  }

  return all;
}
