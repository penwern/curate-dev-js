// Single source of truth for the preservation config settings. The editor, the summary view and
// the "differs from default" chips are all generated from SETTINGS. Pure module: no Lit, no DOM.

const YES_NO = (trueChip, falseChip, summary = ["On", "Off"]) => [
  { value: true, label: "Yes", chip: trueChip, summary: summary[0] },
  { value: false, label: "No", chip: falseChip, summary: summary[1] },
];

const ON_OFF = (trueChip, falseChip) => [
  { value: true, label: "On", chip: trueChip, summary: "On" },
  { value: false, label: "Off", chip: falseChip, summary: "Off" },
];

/**
 * Each setting: key, group, label, description, hint (essentials), control ("segmented" |
 * "switch"), options [{value, label, chip, summary}] and needsNormalise where it only applies
 * while normalisation is on. `chip` describes a config that holds that value, and is shown when
 * the value differs from the default.
 */
export const SETTINGS = [
  {
    key: "normalize",
    group: "essential",
    label: "Normalise files",
    description:
      "Make preservation copies in formats more likely to stay readable, following the Format Policy Registry. Originals are always kept.",
    hint: "Turn off for born-digital content that is already in preservation formats.",
    control: "segmented",
    options: YES_NO("Normalises", "No normalisation"),
  },
  {
    key: "transcribe_files",
    group: "essential",
    label: "Extract text (OCR)",
    description:
      "Run text recognition on original images and scans, and keep the recognised text in the AIP.",
    hint: "Turn off when there is no scanned text, to save processing time.",
    control: "segmented",
    options: YES_NO("OCR", "No OCR"),
  },
  {
    key: "thumbnail_mode",
    group: "essential",
    label: "Thumbnails",
    description: "Small preview images made while the package is processed.",
    hint: 'Choose "Format-specific only" to skip generic placeholder thumbnails, or "None" for very large image batches.',
    control: "segmented",
    options: [
      { value: 1, label: "Generate", chip: "Thumbnails", summary: "Generate" },
      {
        value: 2,
        label: "Format-specific only",
        chip: "Format-specific thumbnails",
        summary: "Format-specific only",
      },
      { value: 3, label: "None", chip: "No thumbnails", summary: "None" },
    ],
  },
  {
    key: "packages",
    group: "essential",
    label: "Zip and other packages",
    description:
      "Packages such as .zip files inside the transfer can be unpacked so their contents are preserved as individual files.",
    hint: "Keep the original if the package itself is part of the record.",
    control: "segmented",
    options: [
      {
        value: "leave",
        label: "Leave as they are",
        chip: "Packages not extracted",
        summary: "Leave as they are",
      },
      {
        value: "extract_keep",
        label: "Extract, keep original",
        chip: "Keeps packages",
        summary: "Extract, keep original",
      },
      {
        value: "extract_delete",
        label: "Extract, delete original",
        chip: "Deletes packages",
        summary: "Extract, delete original",
      },
    ],
  },
  {
    key: "compress_aip",
    group: "essential",
    label: "Compress the AIP",
    description: "Store the AIP as one compressed file.",
    hint: "Only for distribution or deep storage.",
    warning:
      "Curate cannot index the contents of a compressed AIP, so you will not be able to search for files inside it.",
    control: "segmented",
    options: YES_NO("Compressed", "Not compressed", ["Compressed", "Not compressed"]),
  },
  {
    key: "examine_contents",
    group: "advanced",
    label: "Scan contents for sensitive information",
    description:
      "Run bulk_extractor over the transfer to report things like email addresses, card numbers and URLs. Slow on large transfers.",
    control: "switch",
    options: ON_OFF("Scans contents", "No content scan"),
  },
  {
    key: "assign_uuids_to_directories",
    group: "advanced",
    label: "Give folders their own identifiers",
    description: "Assign a UUID to every folder in the AIP METS, as well as to every file.",
    control: "switch",
    options: ON_OFF("Folder UUIDs", "No folder UUIDs"),
  },
  {
    key: "generate_transfer_structure_report",
    group: "advanced",
    label: "Transfer structure report",
    description:
      "Record the folder and file layout of the transfer as it arrived, before any processing.",
    control: "switch",
    options: ON_OFF("Structure report", "No structure report"),
  },
  {
    key: "document_empty_directories",
    group: "advanced",
    label: "Record empty folders",
    description: "List empty folders in the AIP METS so the original structure is documented.",
    control: "switch",
    options: ON_OFF("Records empty folders", "Empty folders not recorded"),
  },
  {
    key: "identify_transfer",
    group: "advanced",
    label: "Identify file formats on arrival",
    description:
      "Identify the format of every file when the transfer starts. Later format-based steps rely on it.",
    control: "switch",
    options: ON_OFF("Identifies formats", "No format identification"),
  },
  {
    key: "identify_submission_and_metadata",
    group: "advanced",
    label: "Identify formats of submission documentation and metadata",
    description: "Also identify files in the submission documentation and metadata folders.",
    control: "switch",
    options: ON_OFF("Identifies metadata formats", "Skips metadata identification"),
  },
  {
    key: "identify_before_normalization",
    group: "advanced",
    label: "Identify formats before normalisation",
    description:
      "Identify formats again just before normalisation, so the right normalisation rule is chosen.",
    control: "switch",
    needsNormalise: true,
    options: ON_OFF("Identifies before normalisation", "No identification before normalisation"),
  },
  {
    key: "perform_policy_checks_on_originals",
    group: "advanced",
    label: "Policy checks on originals",
    description:
      "Validate originals against format policies in the Format Policy Registry, such as MediaConch checks on video. Formats without a policy are skipped.",
    control: "switch",
    options: ON_OFF("Policy checks on originals", "No policy checks on originals"),
  },
  {
    key: "perform_policy_checks_on_preservation_derivatives",
    group: "advanced",
    label: "Policy checks on preservation copies",
    description: "Validate the preservation copies made by normalisation against format policies.",
    control: "switch",
    needsNormalise: true,
    options: ON_OFF(
      "Policy checks on preservation copies",
      "No policy checks on preservation copies",
    ),
  },
  {
    key: "perform_policy_checks_on_access_derivatives",
    group: "advanced",
    label: "Policy checks on access copies",
    description: "Validate the access copies made by normalisation against format policies.",
    control: "switch",
    needsNormalise: true,
    options: ON_OFF("Policy checks on access copies", "No policy checks on access copies"),
  },
];

export const ESSENTIALS = SETTINGS.filter((s) => s.group === "essential");
export const ADVANCED = SETTINGS.filter((s) => s.group === "advanced");

// Used only when the list has no config with the default id
export const FALLBACK_DEFAULTS = {
  normalize: true,
  transcribe_files: true,
  thumbnail_mode: 1,
  packages: "extract_keep",
  compress_aip: false,
  examine_contents: false,
  assign_uuids_to_directories: true,
  generate_transfer_structure_report: true,
  document_empty_directories: true,
  identify_transfer: true,
  identify_submission_and_metadata: true,
  identify_before_normalization: true,
  perform_policy_checks_on_originals: true,
  perform_policy_checks_on_preservation_derivatives: true,
  perform_policy_checks_on_access_derivatives: true,
};

const THUMBNAIL_MODES = [1, 2, 3];

// Boolean settings stored one-to-one in a3m_config (packages and compress_aip are special)
const A3M_BOOLEAN_KEYS = SETTINGS.filter(
  (s) => typeof s.options[0].value === "boolean" && s.key !== "compress_aip",
).map((s) => s.key);

export const MIN_NAME_LENGTH = 3;

const toCamel = (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// a3m_config keys come back snake_case on most hosts and camelCase on some
const readKey = (obj, key) => {
  if (obj[key] !== undefined) return obj[key];
  const camel = toCamel(key);
  return obj[camel];
};

const readBool = (obj, key, fallback) => {
  const raw = readKey(obj, key);
  return raw === undefined || raw === null ? fallback : !!raw;
};

export const getSetting = (key) => SETTINGS.find((s) => s.key === key);

/**
 * Flatten an API config into one value per setting.
 * @param {Object} config - Config as returned by the API
 * @returns {Object} Values keyed by setting key
 */
export const valuesFromConfig = (config) => {
  const a3m = config?.a3m_config || {};
  const root = config || {};
  const values = { ...FALLBACK_DEFAULTS };

  for (const key of A3M_BOOLEAN_KEYS) {
    values[key] = readBool(a3m, key, FALLBACK_DEFAULTS[key]);
  }

  const extract = readBool(a3m, "extract_packages", true);
  const remove = readBool(a3m, "delete_packages_after_extraction", false);
  values.packages = !extract ? "leave" : remove ? "extract_delete" : "extract_keep";

  const mode = Number(readKey(a3m, "thumbnail_mode"));
  values.thumbnail_mode = THUMBNAIL_MODES.includes(mode) ? mode : FALLBACK_DEFAULTS.thumbnail_mode;

  values.compress_aip = readBool(root, "compress_aip", FALLBACK_DEFAULTS.compress_aip);
  return values;
};

/**
 * Build the API body. All 14 booleans and thumbnail_mode are always sent, because the backend
 * treats an omitted boolean as false. compress_aip lives at the root of the config.
 * @param {Object} values - Values keyed by setting key
 * @param {{name: string, description: string}} details - Name and description
 * @returns {Object} Request body
 */
export const configPayload = (values, { name, description }) => {
  const a3m = {};
  for (const key of A3M_BOOLEAN_KEYS) {
    a3m[key] = !!values[key];
  }
  a3m.extract_packages = values.packages !== "leave";
  a3m.delete_packages_after_extraction = values.packages === "extract_delete";
  a3m.thumbnail_mode = values.thumbnail_mode;

  return {
    name: name.trim(),
    description: description.trim(),
    compress_aip: !!values.compress_aip,
    a3m_config: a3m,
  };
};

/**
 * Keys of the settings whose value differs from the defaults, essentials first.
 * @param {Object} values - Values to compare
 * @param {Object} defaults - Default values
 * @returns {string[]} Setting keys
 */
export const differences = (values, defaults) =>
  SETTINGS.filter((s) => values[s.key] !== defaults[s.key]).map((s) => s.key);

const optionFor = (key, value) => getSetting(key)?.options.find((o) => o.value === value);

/**
 * Short chips naming how a config differs from the defaults, in differences() order.
 * @returns {string[]} Chip texts
 */
export const diffChips = (values, defaults) =>
  differences(values, defaults).map((key) => optionFor(key, values[key])?.chip ?? key);

/**
 * Plain-words value for the read-only summary.
 * @returns {string} Value text
 */
export const summaryText = (key, values) => {
  const option = optionFor(key, values[key]);
  return option ? option.summary : String(values[key]);
};

/**
 * Check a config name against the length rule and the other configs' names.
 * @param {string} name - Proposed name
 * @param {Array} configs - All configs from the API
 * @param {number|string|null} ownId - Id of the config being edited, if any
 * @returns {string} Error text, or an empty string when the name is fine
 */
export const validateName = (name, configs, ownId) => {
  const trimmed = (name || "").trim();
  if (trimmed.length < MIN_NAME_LENGTH) {
    return `Enter at least ${MIN_NAME_LENGTH} characters`;
  }
  const clash = configs.some(
    (c) =>
      String(c.id) !== String(ownId) &&
      (c.name || "").trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return clash ? "Another config already uses this name" : "";
};
