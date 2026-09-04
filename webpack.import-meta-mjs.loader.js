/**
 * Rewrites `import.meta.url` in third-party ESM modules that assume a native
 * module environment (pdfjs-dist) while we bundle into a classic script.
 *
 * pdfjs-dist only reaches its single `import.meta.url` on the Node.js canvas
 * path, which is dead code in the browser, but webpack still has to parse it.
 *
 * Mirrors the loader Cells uses for the same package in its editor.pdfjs plugin.
 */
module.exports = function replaceImportMeta(source) {
  return source.replace(
    /import\.meta\.url/g,
    '(typeof document!=="undefined"&&document.currentScript?document.currentScript.src:(typeof location!=="undefined"?location.href:""))',
  );
};
