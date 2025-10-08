(function () {
  if (typeof window === "undefined" || typeof console === "undefined") {
    return;
  }

  if (window.__curateConsolePatched) {
    return;
  }

  window.__curateConsolePatched = true;

  const LEVELS = ["error", "warn", "info", "log", "debug", "trace"];
  const LEVEL_INDEX = LEVELS.reduce((map, level, index) => {
    map[level] = index;
    return map;
  }, {});

  const PATCHED_METHODS = ["warn", "info", "log", "debug", "trace"];
  const original = {};

  PATCHED_METHODS.forEach((method) => {
    if (typeof console[method] === "function") {
      original[method] = console[method];
    }
  });

  function normalizeLevel(value) {
    if (typeof value === "boolean") {
      return value ? "debug" : "silent";
    }

    if (typeof value === "string") {
      const lowered = value.toLowerCase();
      if (LEVEL_INDEX.hasOwnProperty(lowered)) {
        return lowered;
      }
    }

    return "silent";
  }

  function shouldLog(method) {
    const currentLevel = normalizeLevel(window.curateDebug);
    if (currentLevel === "silent") {
      return false;
    }

    const methodIndex = LEVEL_INDEX[method];
    if (typeof methodIndex !== "number") {
      return true;
    }

    const currentIndex = LEVEL_INDEX[currentLevel];
    return currentIndex >= methodIndex;
  }

  PATCHED_METHODS.forEach((method) => {
    const capturedOriginal = original[method];
    if (!capturedOriginal) {
      return;
    }

    console[method] = function patchedConsoleMethod(...args) {
      if (shouldLog(method)) {
        return Reflect.apply(capturedOriginal, console, args);
      }
      return undefined;
    };
  });

  window.curateDebugSet = function curateDebugSet(value) {
    window.curateDebug = value;
  };
})();
