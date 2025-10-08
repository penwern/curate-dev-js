# Console Logging Controls

This bundle patches the global `console` so that non-error methods respect a runtime `window.curateDebug` flag. Use the following helpers in the browser console or inline scripts:

- `window.curateDebug = false` silences everything except `console.error`.
- `window.curateDebugSet('info')` (or assigning `window.curateDebug = 'info'`) enables `console.info`, `console.warn`, and `console.error`.
- `window.curateDebugSet('debug')` enables every patched method (`log`, `debug`, `trace`) until you change the value or reload the page.
- Boolean values map to levels (`true` → `debug`, `false` → `silent`).

`console.error` always passes through so unexpected failures remain visible during development and production diagnostics.
