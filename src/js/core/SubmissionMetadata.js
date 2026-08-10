// Change this value if the internal Cells usermeta namespace changes.
export const SUBMISSION_METADATA_NAMESPACE = "usermeta-submission";

const SUBMISSION_METADATA_POLICIES = [
  { Action: "READ", Effect: "allow", Subject: "*" },
  { Action: "WRITE", Effect: "allow", Subject: "*" },
];

function normalisePath(path = "") {
  return String(path || "").replace(/^\/+|\/+$/g, "");
}

function getBaseName(path) {
  const parts = normalisePath(path).split("/");
  return parts[parts.length - 1] || "";
}

function isLeafNode(node) {
  if (typeof node?.isLeaf === "function") return node.isLeaf();
  return Boolean(node?._isLeaf);
}

function getNodePath(node) {
  if (typeof node?.getPath === "function") return node.getPath();
  return node?._path || "";
}

function getNodeUuid(node) {
  return node?._metadata?.get("uuid") || node?._uuid || null;
}

function parseSubmissionValue(raw) {
  if (raw == null) return { valid: true, submission: false };

  let value = raw;
  try {
    // Cells normally returns JsonValue as a JSON string. Parsing twice also
    // tolerates values that have passed through an additional string layer.
    for (let i = 0; i < 2 && typeof value === "string"; i += 1) {
      value = JSON.parse(value);
    }
  } catch (_error) {
    return { valid: false, submission: null };
  }

  if (typeof value?.submission !== "boolean") {
    return { valid: false, submission: null };
  }

  return { valid: true, submission: value.submission };
}

function readSubmissionFlag(node) {
  return parseSubmissionValue(node?.MetaStore?.[SUBMISSION_METADATA_NAMESPACE]);
}

function describeTreeNode(node, selectedPath) {
  if (!node) return null;
  const path = normalisePath(node.Path);
  return {
    uuid: node.Uuid,
    path,
    name: getBaseName(path),
    isSelectedFolder: path === normalisePath(selectedPath),
  };
}

function createBaseContext(node, workspace) {
  const nodePath = normalisePath(getNodePath(node));
  const pathParts = nodePath ? nodePath.split("/") : [];
  const isFolder = !isLeafNode(node);
  const selectedPath = [workspace, ...pathParts].filter((part) => part !== "").join("/");

  return {
    node,
    nodeUuid: getNodeUuid(node),
    selectedPath,
    selectedType: isFolder ? "folder" : "file",
    isFolder,
    pathParts,
  };
}

/**
 * Resolve the selected node's submission context using one exact-path batch
 * request. Ancestors are requested shallowest-first so the first declaration
 * is the effective (outermost) submission boundary.
 */
export async function resolveSubmissionContext(node) {
  if (!node) throw new Error("A node is required to resolve submission context.");

  const workspace = normalisePath(Curate.workspaces.getOpenWorkspace());
  const base = createBaseContext(node, workspace);
  const folderParts = base.isFolder ? base.pathParts : base.pathParts.slice(0, -1);
  const ancestorPaths = folderParts.map((_, index) =>
    [workspace, ...folderParts.slice(0, index + 1)].join("/"),
  );

  if (ancestorPaths.length === 0) {
    return {
      resolved: true,
      selectedPath: base.selectedPath,
      selectedType: base.selectedType,
      selectedUuid: base.nodeUuid,
      declaration: base.isFolder
        ? {
            declared: false,
            currentlyEffective: false,
            wouldBeEffectiveIfEnabled: true,
            controllingAncestor: null,
          }
        : null,
      insideSubmission: false,
      effectiveSubmission: null,
      declaredPaths: [],
    };
  }

  const response = await Curate.api.fetchCurate("/a/tree/stats", "POST", {
    NodePaths: ancestorPaths,
    AllMetaProviders: true,
    Limit: ancestorPaths.length,
  });

  const nodesByPath = new Map(
    (response.Nodes || []).map((treeNode) => [normalisePath(treeNode.Path), treeNode]),
  );
  const missingPaths = ancestorPaths.filter((path) => !nodesByPath.has(normalisePath(path)));

  if (missingPaths.length > 0) {
    return {
      resolved: false,
      reason: "missing-ancestors",
      missingPaths,
      selectedPath: base.selectedPath,
      selectedType: base.selectedType,
    };
  }

  const malformedPaths = [];
  const declaredNodes = [];

  for (const path of ancestorPaths) {
    const treeNode = nodesByPath.get(normalisePath(path));
    const flag = readSubmissionFlag(treeNode);

    if (!flag.valid) malformedPaths.push(path);
    else if (flag.submission) declaredNodes.push(treeNode);
  }

  if (malformedPaths.length > 0) {
    return {
      resolved: false,
      reason: "invalid-submission-metadata",
      malformedPaths,
      selectedPath: base.selectedPath,
      selectedType: base.selectedType,
    };
  }

  const effectiveNode = declaredNodes[0] || null;
  const effectiveSubmission = describeTreeNode(effectiveNode, base.selectedPath);
  const selectedFolderNode = base.isFolder
    ? nodesByPath.get(normalisePath(base.selectedPath))
    : null;
  const declaredHere = base.isFolder ? readSubmissionFlag(selectedFolderNode).submission : null;
  const controllingAncestor =
    base.isFolder && effectiveSubmission && !effectiveSubmission.isSelectedFolder
      ? effectiveSubmission
      : null;

  return {
    resolved: true,
    selectedPath: base.selectedPath,
    selectedType: base.selectedType,
    selectedUuid: base.nodeUuid,
    declaration: base.isFolder
      ? {
          declared: declaredHere,
          currentlyEffective: declaredHere === true && controllingAncestor === null,
          wouldBeEffectiveIfEnabled: controllingAncestor === null,
          controllingAncestor,
        }
      : null,
    insideSubmission: effectiveSubmission !== null,
    effectiveSubmission,
    declaredPaths: declaredNodes.map((treeNode) => normalisePath(treeNode.Path)),
  };
}

export async function setSubmissionDeclaration(node, enabled) {
  if (!node || isLeafNode(node)) {
    throw new Error("Only folders can be declared as submissions.");
  }

  const nodeUuid = getNodeUuid(node);
  if (!nodeUuid) throw new Error("The selected folder has no node UUID.");

  const value = { submission: Boolean(enabled) };
  await Curate.api.fetchCurate("/a/user-meta/update", "PUT", {
    MetaDatas: [
      {
        NodeUuid: nodeUuid,
        Namespace: SUBMISSION_METADATA_NAMESPACE,
        JsonValue: JSON.stringify(value),
        Policies: SUBMISSION_METADATA_POLICIES,
      },
    ],
    Operation: "PUT",
  });

  node._metadata?.set(SUBMISSION_METADATA_NAMESPACE, value);
  return value;
}

/**
 * Apply a successful declaration write to the resolved context immediately.
 * This avoids showing stale TreeService metadata while Cells propagates the
 * updated usermeta value.
 */
export function applyDeclarationToContext(context, enabled) {
  if (!context?.resolved || !context.declaration) return context;

  const declared = Boolean(enabled);
  const controllingAncestor = context.declaration.controllingAncestor;
  const selectedSubmission = {
    uuid: context.selectedUuid,
    path: context.selectedPath,
    name: getBaseName(context.selectedPath),
    isSelectedFolder: true,
  };
  const effectiveSubmission = controllingAncestor
    ? context.effectiveSubmission
    : declared
      ? selectedSubmission
      : null;
  const declaredPaths = declared
    ? Array.from(new Set([...context.declaredPaths, context.selectedPath]))
    : context.declaredPaths.filter((path) => path !== context.selectedPath);

  return {
    ...context,
    declaration: {
      declared,
      currentlyEffective: declared && controllingAncestor === null,
      wouldBeEffectiveIfEnabled: controllingAncestor === null,
      controllingAncestor,
    },
    insideSubmission: effectiveSubmission !== null,
    effectiveSubmission,
    declaredPaths,
  };
}
