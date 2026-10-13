// Index references once; retain source order within each list.
export function indexRegistry(registry) {
  if (registry?.schema_version !== 1) {
    const error = new Error("Unsupported FPR schema.");
    error.code = "fpr_schema_unsupported";
    throw error;
  }
  for (const key of [
    "groups",
    "formats",
    "versions",
    "tools",
    "commands",
    "rules",
    "diagnostics",
  ]) {
    if (!Array.isArray(registry[key])) throw new Error("Incomplete FPR response.");
  }
  const index = { registry };
  for (const key of ["groups", "formats", "versions", "tools", "commands", "rules"]) {
    index[key] = new Map(registry[key].map((record) => [record.uuid, record]));
  }
  index.rulesByVersion = new Map();
  index.replacedRules = new Map();
  index.defaults = [];
  for (const rule of registry.rules) {
    // Only loaded replacements participate in A3M's replacement lookup.
    if (rule.replaces && rule.loaded) {
      const replacements = index.replacedRules.get(rule.replaces) || [];
      replacements.push(rule);
      index.replacedRules.set(rule.replaces, replacements);
    }
    if (rule.purpose.startsWith("default_")) {
      index.defaults.push(rule);
    } else {
      const rules = index.rulesByVersion.get(rule.format) || [];
      rules.push(rule);
      index.rulesByVersion.set(rule.format, rules);
    }
  }
  index.entries = registry.versions.map((version) => {
    const format = index.formats.get(version.format);
    const group = index.groups.get(format?.group);
    const rules = index.rulesByVersion.get(version.uuid) || [];
    const name =
      format?.description && version.description === version.version
        ? `${format.description} — ${version.description}`
        : version.description || format?.description || version.uuid;
    const search = [
      name,
      version.version,
      version.pronom_id,
      format?.description,
      group?.description,
      ...rules.flatMap((rule) => {
        const command = index.commands.get(rule.command);
        return [rule.purpose, command?.description, index.tools.get(command?.tool)?.description];
      }),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return { version, format, group, rules, name, search };
  });
  return index;
}

export function filterEntries(index, query, purpose, status) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return index.entries.filter((entry) => {
    const rules = purpose ? entry.rules.filter((rule) => rule.purpose === purpose) : entry.rules;
    return (
      terms.every((term) => entry.search.includes(term)) &&
      (!purpose || rules.length > 0) &&
      (status !== "current" ||
        (entry.version.active && rules.some((rule) => rule.selected_by_registry))) &&
      (status !== "selected" || rules.some((rule) => rule.selected_by_registry)) &&
      (status !== "with-rules" || rules.length > 0) &&
      (status !== "inactive" || !entry.version.active)
    );
  });
}

export function ruleStatus(rule, index) {
  const reasons = [];
  if (!rule.loaded) reasons.push("Not loaded by registry");
  if (!rule.enabled) reasons.push("Disabled");
  const replacements = index.replacedRules.get(rule.uuid) || [];
  if (replacements.length)
    reasons.push(
      replacements.some((item) => !item.enabled)
        ? "Replaced (including a disabled replacement)"
        : "Replaced",
    );
  if (rule.selected_by_registry) reasons.push("Selected by registry");
  return reasons.length ? reasons.join(" · ") : "Not selected by registry";
}

export const purposeLabel = (purpose) =>
  ({
    preservation: "Preservation copy",
    access: "Access copy",
    thumbnail: "Thumbnail",
    extract: "Extract packaged files",
    characterization: "Technical metadata",
    transcription: "Extract text",
    validation: "Format validation",
    policy_check: "Policy check",
    default_access: "Default access copy",
    default_thumbnail: "Default thumbnail",
  })[purpose] || purpose.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());

export function visibleRules(rules, purpose, includeInactive = false) {
  return rules.filter(
    (rule) =>
      (!purpose || rule.purpose === purpose) && (includeInactive || rule.selected_by_registry),
  );
}

export function fprErrorMessage(error) {
  if (error.name === "TimeoutError")
    return "The format policy registry took too long to respond. Try again.";
  if (error.status === 404) return "This preservation API does not support FPR inspection yet.";
  if (error.status === 401 || error.status === 403)
    return "You do not have access to the format policy registry. Sign in again or contact your administrator.";
  return (
    {
      fpr_not_configured: "FPR inspection has not been configured for this deployment.",
      fpr_not_supported: "This preservation engine does not support FPR inspection yet.",
      fpr_unavailable: "The preservation engine's FPR is temporarily unavailable. Try again.",
      fpr_timeout: "The preservation engine took too long to respond. Try again.",
      fpr_schema_unsupported: "This FPR version is not supported by the viewer.",
      fpr_upstream_error:
        "The preservation engine could not provide its registry. Try again or contact your administrator.",
      fpr_encoding_error:
        "The preservation API could not encode the registry response. Contact your administrator.",
    }[error.code] ||
    "Could not load the format policy registry. Check your connection and try again."
  );
}
