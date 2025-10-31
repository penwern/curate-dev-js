import PostalMime from 'postal-mime';
import DOMPurify from 'dompurify';

/**
 * Data service abstraction layer that reads processed archive folders.
 * - Fetches manifest.json for metadata
 * - Retrieves and parses individual EML files on demand
 * - Streams attachment files as blob URLs
 */

const absoluteUrlPattern = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

const defaultArchiveConfig = {
  mode: 'http',
  basePath: '',
  workspace: null
};

let archiveConfig = { ...defaultArchiveConfig };
let manifestCache = null;
let manifestPromise = null;
const emailBodyCache = new Map();
const attachmentUrlCache = new Map();

const domPurifyInstance =
  typeof window !== 'undefined'
    ? (typeof DOMPurify?.sanitize === 'function'
        ? DOMPurify
        : typeof DOMPurify === 'function'
          ? DOMPurify(window)
          : null)
    : null;

/**
 * Configure the base path where archive resources live.
 * Accepts either a string path (HTTP/local mode) or a configuration object.
 * @param {string|Object} input
 */
export function setArchiveBasePath(input) {
  archiveConfig = normaliseArchiveConfig(input);
  manifestCache = null;
  manifestPromise = null;
  emailBodyCache.clear();
  for (const url of attachmentUrlCache.values()) {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
  attachmentUrlCache.clear();
}

/**
 * @returns {'http'|'curate'} Current archive data source mode
 */
function getArchiveMode() {
  return archiveConfig.mode;
}

/**
 * Derive the archive base path for HTTP mode if not explicitly configured.
 * Checks window.__CURATE_ARCHIVE_BASE and ?archive= query param.
 * @returns {string}
 */
function resolveHttpBasePath() {
  if (archiveConfig.basePath) {
    return archiveConfig.basePath;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const globalBase =
    window.__CURATE_ARCHIVE_BASE ??
    window.__CURATE_ARCHIVE_PATH ??
    '';
  const queryBase = new URLSearchParams(window.location.search).get('archive');

  archiveConfig = {
    ...archiveConfig,
    basePath: normaliseHttpBasePath(queryBase || globalBase || '')
  };

  return archiveConfig.basePath;
}

function detectCurateEnvironment() {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.Curate && window.pydio && window.pydio?.ApiClient);
}

function normaliseArchiveConfig(input) {
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    const mode = (input.mode || '').toString().toLowerCase() || (detectCurateEnvironment() ? 'curate' : 'http');
    const basePath = mode === 'curate'
      ? normaliseCurateBasePath(input.basePath ?? input.archivePath ?? '')
      : normaliseHttpBasePath(input.basePath ?? input.archivePath ?? input.path ?? '');
    return {
      mode: mode === 'curate' ? 'curate' : 'http',
      basePath,
      workspace: input.workspace ?? input.workspaceId ?? null
    };
  }

  const asString = (input ?? '').toString();
  return {
    ...defaultArchiveConfig,
    basePath: normaliseHttpBasePath(asString)
  };
}

function normaliseHttpBasePath(path) {
  if (!path) {
    return '';
  }
  if (absoluteUrlPattern.test(path)) {
    return path.endsWith('/') ? path : `${path}/`;
  }
  const trimmed = String(path).replace(/\\/g, '/').replace(/\/+$/, '');
  return trimmed;
}

function normaliseCurateBasePath(path) {
  if (!path) {
    return '';
  }
  const normalised = String(path).replace(/\\/g, '/').trim();
  if (!normalised.startsWith('/')) {
    return `/${normalised.replace(/^\/+/, '')}`.replace(/\/+$/, '');
  }
  return normalised.replace(/\/+$/, '');
}

function normaliseRelativePath(path) {
  if (!path) {
    return '';
  }
  return String(path).replace(/\\/g, '/').replace(/^\/+/, '');
}

function joinArchivePath(base, relative) {
  if (!base) {
    return relative || '';
  }
  if (!relative) {
    return base;
  }
  return `${base.replace(/\/+$/, '')}/${normaliseRelativePath(relative)}`.replace(/\/{2,}/g, '/');
}

function buildHttpResourceUrl(relativePath) {
  if (!relativePath) {
    return relativePath;
  }

  if (absoluteUrlPattern.test(relativePath)) {
    return relativePath;
  }

  const base = resolveHttpBasePath();
  const normalisedRelative = normaliseRelativePath(relativePath);

  if (!base) {
    return normalisedRelative || 'manifest.json';
  }

  if (absoluteUrlPattern.test(base)) {
    const baseUrl = base.endsWith('/') ? base : `${base}/`;
    return new URL(normalisedRelative, baseUrl).toString();
  }

  return `${base}/${normalisedRelative}`.replace(/\/{2,}/g, '/');
}

async function fetchJson(relativePath) {
  if (getArchiveMode() === 'curate') {
    const text = await loadCurateText(relativePath || 'manifest.json');
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse ${relativePath || 'manifest.json'} as JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const response = await fetch(buildHttpResourceUrl(relativePath));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativePath}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchText(relativePath) {
  if (getArchiveMode() === 'curate') {
    return loadCurateText(relativePath);
  }

  const response = await fetch(buildHttpResourceUrl(relativePath));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativePath}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function inferWorkspaceSlug(workspaceCandidate) {
  if (!workspaceCandidate || typeof workspaceCandidate !== 'object') {
    return typeof workspaceCandidate === 'string' ? workspaceCandidate : null;
  }
  const possibleKeys = ['slug', 'id', 'uuid', 'workspaceSlug', 'WorkspaceSlug', 'name'];
  for (const key of possibleKeys) {
    if (workspaceCandidate[key]) {
      return workspaceCandidate[key];
    }
  }
  if (typeof workspaceCandidate.getId === 'function') {
    return workspaceCandidate.getId();
  }
  if (typeof workspaceCandidate.getSlug === 'function') {
    return workspaceCandidate.getSlug();
  }
  return null;
}

function resolveCurateBasePath() {
  let basePath = archiveConfig.basePath;
  if (!basePath && typeof window !== 'undefined') {
    const globalPath =
      window.__CURATE_ARCHIVE_PATH ??
      window.__CURATE_ARCHIVE_BASE ??
      '';
    basePath = normaliseCurateBasePath(globalPath);
  }

  if (!basePath) {
    throw new Error('Curate archive path is not configured.');
  }

  const workspace =
    archiveConfig.workspace ??
    (typeof window !== 'undefined'
      ? inferWorkspaceSlug(window.Curate?.workspaces?.getOpenWorkspace?.())
      : null);

  if (!archiveConfig.basePath || archiveConfig.basePath !== basePath || (workspace && archiveConfig.workspace !== workspace)) {
    archiveConfig = {
      ...archiveConfig,
      basePath,
      workspace: workspace ?? archiveConfig.workspace ?? null
    };
  }

  return basePath;
}

function getCurateClients() {
  if (typeof window === 'undefined') {
    throw new Error('Curate SDK is unavailable in the current environment.');
  }
  const apiClient = window.pydio?.ApiClient;
  const dataModel = window.pydio?._dataModel;
  if (!apiClient || !dataModel) {
    throw new Error('Curate SDK is not fully initialised.');
  }
  return { apiClient, dataModel };
}

function callCurateApi(method, context, ...args) {
  return new Promise((resolve, reject) => {
    if (typeof method !== 'function') {
      reject(new Error('Curate SDK method is unavailable.'));
      return;
    }

    let settled = false;
    const succeed = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };
    const fail = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      const normalisedError = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown Curate SDK error');
      reject(normalisedError);
    };

    try {
      const maybe = method.call(context, ...args, succeed, fail);
      if (maybe && typeof maybe.then === 'function') {
        maybe.then(succeed).catch(fail);
      } else if (maybe !== undefined && maybe !== null && typeof maybe !== 'boolean' && !settled) {
        succeed(maybe);
      }
    } catch (error) {
      fail(error);
    }
  });
}

function loadCurateNode(path) {
  const { dataModel } = getCurateClients();
  return new Promise((resolve, reject) => {
    let settled = false;
    const handleResult = (node) => {
      if (settled) {
        return;
      }
      settled = true;
      if (!node) {
        reject(new Error(`Curate resource not found: ${path}`));
      } else {
        resolve(node);
      }
    };

    let result;
    try {
      result = dataModel.loadPathInfoSync(path, handleResult);
    } catch (error) {
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    if (!settled && result) {
      handleResult(result);
    } else if (!settled && result === false) {
      reject(new Error(`Curate resource not found: ${path}`));
    }
  });
}

async function loadCurateText(relativePath) {
  const basePath = resolveCurateBasePath();
  const targetPath = joinArchivePath(basePath, relativePath || 'manifest.json');
  const node = await loadCurateNode(targetPath);
  const { apiClient } = getCurateClients();
  const content = await callCurateApi(apiClient.getPlainContent, apiClient, node);

  if (typeof content === 'string') {
    return content;
  }
  if (content instanceof Blob) {
    return content.text();
  }
  if (content && typeof content === 'object' && 'text' in content && typeof content.text === 'function') {
    return content.text();
  }
  return content != null ? String(content) : '';
}

async function getCurateDownloadInfo(relativePath) {
  const basePath = resolveCurateBasePath();
  const targetPath = joinArchivePath(basePath, relativePath);
  const node = await loadCurateNode(targetPath);
  const { apiClient } = getCurateClients();
  const presignedUrl = await callCurateApi(apiClient.buildPresignedGetUrl, apiClient, node);
  const url = typeof presignedUrl === 'string'
    ? presignedUrl
    : presignedUrl?.url ?? presignedUrl?.signedUrl ?? presignedUrl?.link ?? null;

  if (!url) {
    throw new Error(`Unable to obtain presigned URL for ${relativePath}.`);
  }

  return { url, node };
}

async function loadCurateAttachmentUrl(relativePath) {
  const { url } = await getCurateDownloadInfo(relativePath);
  return url;
}

async function loadCurateBlob(relativePath) {
  const { url } = await getCurateDownloadInfo(relativePath);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativePath}: ${response.status} ${response.statusText}`);
  }
  return response.blob();
}

function sanitiseHtml(html) {
  if (!html) {
    return '';
  }
  if (typeof window === 'undefined') {
    return html;
  }
  if (domPurifyInstance?.sanitize) {
    return domPurifyInstance.sanitize(html, { USE_PROFILES: { html: true } });
  }
  return html;
}

async function parseEmlContent(emlText) {
  const parser = new PostalMime();
  const payload =
    typeof emlText === 'string'
      ? new TextEncoder().encode(emlText)
      : emlText;

  const parsed = await parser.parse(payload);
  const html = parsed.html || parsed.textAsHtml || '';
  const text = parsed.text || '';

  return {
    html: sanitiseHtml(html),
    text
  };
}

/**
 * Get the email archive manifest
 * @returns {Promise<Object>} Manifest with email metadata
 */
export async function getManifest() {
  if (manifestCache) {
    return manifestCache;
  }

  if (!manifestPromise) {
    manifestPromise = fetchJson('manifest.json')
      .then((data) => {
        manifestCache = data;
        return data;
      })
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  }

  return manifestPromise;
}

/**
 * Get email body content
 * @param {string} emailId - Email ID
 * @returns {Promise<Object>} Email body with html and text
 */
export async function getEmailBody(emailId) {
  if (!emailId) {
    return { html: '', text: '' };
  }

  if (emailBodyCache.has(emailId)) {
    return emailBodyCache.get(emailId);
  }

  const manifest = await getManifest();
  const emailMeta = manifest.emails?.find((email) => email.id === emailId);
  if (!emailMeta) {
    throw new Error(`Email ${emailId} not found in manifest`);
  }

  const emlContent = await fetchText(emailMeta.emlPath);
  const parsedBody = await parseEmlContent(emlContent);

  emailBodyCache.set(emailId, parsedBody);
  return parsedBody;
}

/**
 * Get attachment blob URL for download/display
 * @param {string} attachmentPath - Path to attachment
 * @returns {Promise<string>} Blob URL
 */
export async function getAttachment(attachmentPath, options = {}) {
  const normalisedPath = normaliseRelativePath(attachmentPath);
  if (!normalisedPath) {
    throw new Error('Attachment path is required');
  }

  const preferDirectUrl = Boolean(options?.preferDirectUrl);
  const useDirectUrl = preferDirectUrl && getArchiveMode() === 'curate';
  const cacheKey = useDirectUrl ? `direct:${normalisedPath}` : normalisedPath;

  if (attachmentUrlCache.has(cacheKey)) {
    return attachmentUrlCache.get(cacheKey);
  }

  if (useDirectUrl) {
    const directUrl = await loadCurateAttachmentUrl(normalisedPath);
    attachmentUrlCache.set(cacheKey, directUrl);
    return directUrl;
  }

  const blob = getArchiveMode() === 'curate'
    ? await loadCurateBlob(normalisedPath)
    : await fetchAttachmentBlobHttp(normalisedPath, attachmentPath);
  const blobUrl = URL.createObjectURL(blob);
  attachmentUrlCache.set(cacheKey, blobUrl);
  return blobUrl;
}

async function fetchAttachmentBlobHttp(normalisedPath, originalPathForError) {
  const response = await fetch(buildHttpResourceUrl(normalisedPath));
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment ${originalPathForError}: ${response.status} ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Resolve inline image Content-ID to blob URL
 * @param {string} contentId - Content-ID from HTML (e.g., "logo@company.com")
 * @param {Array} attachments - Email attachments array
 * @returns {Promise<string|null>} Blob URL for inline image
 */
export async function resolveInlineImage(contentId, attachments = []) {
  if (!contentId || !attachments?.length) {
    return null;
  }

  const strippedContentId = contentId.replace(/[<>]/g, '').trim();
  const attachment = attachments.find(
    (item) =>
      item.inline &&
      typeof item.contentId === 'string' &&
      item.contentId.replace(/[<>]/g, '').trim() === strippedContentId
  );

  if (!attachment) {
    return null;
  }

  try {
    return await getAttachment(attachment.path, { preferDirectUrl: true });
  } catch (error) {
    console.error(`Failed to resolve inline image for ${contentId}:`, error);
    return null;
  }
}
