function buildApiUrl(apiHost, pathAndQuery) {
  const host = (apiHost || "").replace(/\/+$/, "");
  const base = host;
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${base}${path}`;
}

function buildCurateUrl(apiHost, curateBasePath, pathAndQuery) {
  const host = (apiHost || "").replace(/\/+$/, "");
  const basePath = (curateBasePath || "/curate").replace(/\/+$/, "");
  const base = host ? `${host}${basePath}` : basePath;
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  return `${base}${path}`;
}

export async function fetchResourceTreeRoot(apiHost, resourceId, repositoryId) {
  const params = new URLSearchParams();
  if (repositoryId) {
    params.set("repository_id", repositoryId);
  }
  const res = await fetch(
    buildApiUrl(
      apiHost,
      `/resources/${encodeURIComponent(resourceId)}/tree/root?${params.toString()}`
    )
  );
  if (!res.ok) {
    throw new Error(`Failed to load tree root: ${res.status}`);
  }
  return res.json();
}

export async function fetchRepositories(apiHost) {
  const res = await fetch(buildApiUrl(apiHost, "/repositories"));
  if (!res.ok) {
    throw new Error(`Failed to load repositories: ${res.status}`);
  }
  return res.json();
}

export async function createCurateFolders(apiHost, curateBasePath, parentPath, folders) {
  const res = await fetch(buildCurateUrl(apiHost, curateBasePath, "/folders"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      parent_path: parentPath,
      folders,
    }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to create folders: ${res.status}${detail ? ` - ${detail}` : ""}`
    );
  }
  return res.json();
}

export async function fetchRepositoryResources(apiHost, repositoryId, page, pageSize, q) {
  const params = new URLSearchParams();
  if (page) {
    params.set("page", String(page));
  }
  if (pageSize) {
    params.set("page_size", String(pageSize));
  }
  if (q) {
    params.set("q", q);
  }
  const res = await fetch(
    buildApiUrl(
      apiHost,
      `/repositories/${encodeURIComponent(repositoryId)}/resources?${params.toString()}`
    )
  );
  if (!res.ok) {
    throw new Error(`Failed to load resources: ${res.status}`);
  }
  return res.json();
}

export async function fetchResourceTreeChildren(
  apiHost,
  resourceId,
  repositoryId,
  parentUri,
  offset
) {
  const params = new URLSearchParams();
  if (repositoryId) {
    params.set("repository_id", repositoryId);
  }
  if (parentUri) {
    params.set("parent_uri", parentUri);
  }
  params.set("offset", String(offset ?? 0));
  const res = await fetch(
    buildApiUrl(
      apiHost,
      `/resources/${encodeURIComponent(resourceId)}/tree/children?${params.toString()}`
    )
  );
  if (!res.ok) {
    throw new Error(`Failed to load children: ${res.status}`);
  }
  return res.json();
}

export async function searchGlobal(
  apiHost,
  repositoryId,
  q,
  page,
  pageSize,
  options = {}
) {
  const params = new URLSearchParams();
  if (repositoryId) {
    params.set("repository_id", repositoryId);
  }
  if (q) {
    params.set("q", q);
  }
  if (page) {
    params.set("page", String(page));
  }
  if (pageSize) {
    params.set("page_size", String(pageSize));
  }

  const {
    types,
    levels,
    ancestorUris,
    filterTerms,
  } = options || {};

  if (Array.isArray(types)) {
    for (const t of types) {
      if (t != null && `${t}`.trim() !== "") {
        params.append("type[]", `${t}`.trim());
      }
    }
  }
  if (Array.isArray(levels)) {
    for (const level of levels) {
      if (level != null && `${level}`.trim() !== "") {
        params.append("level[]", `${level}`.trim());
      }
    }
  }
  if (Array.isArray(ancestorUris)) {
    for (const uri of ancestorUris) {
      if (uri != null && `${uri}`.trim() !== "") {
        params.append("ancestor_uri[]", `${uri}`.trim());
      }
    }
  }
  if (Array.isArray(filterTerms)) {
    for (const term of filterTerms) {
      if (term != null && `${term}`.trim() !== "") {
        params.append("filter_term[]", `${term}`.trim());
      }
    }
  }

  const res = await fetch(buildApiUrl(apiHost, `/search?${params.toString()}`));
  if (!res.ok) {
    throw new Error(`Failed to perform global search: ${res.status}`);
  }
  return res.json();
}

export async function searchResource(
  apiHost,
  resourceId,
  repositoryId,
  q,
  page,
  pageSize,
  options = {}
) {
  const params = new URLSearchParams();
  if (repositoryId) {
    params.set("repository_id", repositoryId);
  }
  if (q) {
    params.set("q", q);
  }
  if (page) {
    params.set("page", String(page));
  }
  if (pageSize) {
    params.set("page_size", String(pageSize));
  }

  const {
    types,
    levels,
    ancestorUris,
    filterTerms,
  } = options || {};

  if (Array.isArray(types)) {
    for (const t of types) {
      if (t != null && `${t}`.trim() !== "") {
        params.append("type[]", `${t}`.trim());
      }
    }
  }
  if (Array.isArray(levels)) {
    for (const level of levels) {
      if (level != null && `${level}`.trim() !== "") {
        params.append("level[]", `${level}`.trim());
      }
    }
  }
  if (Array.isArray(ancestorUris)) {
    for (const uri of ancestorUris) {
      if (uri != null && `${uri}`.trim() !== "") {
        params.append("ancestor_uri[]", `${uri}`.trim());
      }
    }
  }
  if (Array.isArray(filterTerms)) {
    for (const term of filterTerms) {
      if (term != null && `${term}`.trim() !== "") {
        params.append("filter_term[]", `${term}`.trim());
      }
    }
  }
  const res = await fetch(
    buildApiUrl(
      apiHost,
      `/resources/${encodeURIComponent(resourceId)}/search?${params.toString()}`
    )
  );
  if (!res.ok) {
    throw new Error(`Failed to search resource: ${res.status}`);
  }
  return res.json();
}

export async function fetchResourcePaths(apiHost, resourceId, repositoryId, nodeIds) {
  const params = new URLSearchParams();
  if (repositoryId) {
    params.set("repository_id", repositoryId);
  }
  for (const id of nodeIds || []) {
    params.append("node_id[]", id);
  }
  const res = await fetch(
    buildApiUrl(
      apiHost,
      `/resources/${encodeURIComponent(resourceId)}/path?${params.toString()}`
    )
  );
  if (!res.ok) {
    throw new Error(`Failed to resolve paths: ${res.status}`);
  }
  return res.json();
}
