import {
  applyDeclarationToContext,
  resolveSubmissionContext,
  setSubmissionDeclaration,
} from "../core/SubmissionMetadata.js";
import { useCurateCollapse, useHeaderControls, usePinController } from "./CurateCardCollapse.js";

const React = new Proxy({}, { get: (_, key) => window.React[key] });

const COLORS = {
  active: "#43A047",
  inherited: "#FB8C00",
  neutral: "#78909C",
  error: "#E53935",
};

function ensureStyles() {
  let style = document.querySelector("style[data-curate-submission]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("data-curate-submission", "");
    document.head.appendChild(style);
  }

  style.textContent = `
    @keyframes curate-submission-spin {
      to { transform: rotate(360deg); }
    }

    .curate-submission-root,
    .curate-submission-root * {
      box-sizing: border-box;
    }

    .curate-submission-root {
      color: inherit;
      padding: 0;
    }

    .curate-submission-summary {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr);
      align-items: start;
      gap: 8px;
      margin: 6px 12px 0;
      padding: 9px 8px !important;
      border-left: 3px solid currentColor;
      border-radius: 5px;
    }

    .curate-submission-summary-icon {
      margin-top: 1px;
      font-size: 22px;
      line-height: 1;
    }

    .curate-submission-summary-body {
      min-width: 0;
    }

    .curate-submission-summary-title {
      font-size: 13px;
      font-weight: 650;
      line-height: 1.25;
    }

    .curate-submission-summary-copy {
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.4;
      color: inherit;
      opacity: 0.7;
    }

    .curate-submission-control {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 38px;
      align-items: center;
      gap: 10px;
      margin: 0 12px;
      padding: 11px 2px 10px !important;
    }

    .curate-submission-control-copy {
      min-width: 0;
    }

    .curate-submission-control-label {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.25;
    }

    .curate-submission-control-help {
      margin-top: 3px;
      font-size: 12px;
      line-height: 1.4;
      opacity: 0.68;
    }

    .curate-submission-switch {
      position: relative;
      width: 38px;
      height: 22px;
      padding: 0;
      border: 1px solid rgba(120, 144, 156, 0.55);
      border-radius: 11px;
      background: rgba(120, 144, 156, 0.2);
      cursor: pointer;
      transition: background-color 140ms ease, border-color 140ms ease;
    }

    .curate-submission-switch[aria-checked="true"] {
      border-color: #43A047;
      background: #43A047;
    }

    .curate-submission-switch:disabled {
      cursor: wait;
      opacity: 0.58;
    }

    .curate-submission-switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.24);
      transition: transform 140ms ease;
    }

    .curate-submission-switch[aria-checked="true"] .curate-submission-switch-thumb {
      transform: translateX(16px);
    }

    .curate-submission-switch:focus-visible,
    .curate-submission-button:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    .curate-submission-context,
    .curate-submission-confirm {
      margin: 0 12px 10px;
      padding: 8px 10px !important;
      border-radius: 5px;
    }

    .curate-submission-context {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      align-items: start;
      gap: 7px;
      border: 1px solid rgba(251, 140, 0, 0.24);
      background: rgba(251, 140, 0, 0.06);
    }

    .curate-submission-context > i {
      margin-top: 1px;
      color: #FB8C00;
      font-size: 16px;
      line-height: 1;
    }

    .curate-submission-context-title,
    .curate-submission-confirm-title {
      font-size: 12px;
      font-weight: 650;
      line-height: 1.35;
    }

    .curate-submission-context-copy,
    .curate-submission-confirm-copy {
      margin-top: 2px;
      font-size: 11.5px;
      line-height: 1.4;
      opacity: 0.7;
    }

    .curate-submission-confirm {
      border: 1px solid rgba(251, 140, 0, 0.28);
      background: rgba(251, 140, 0, 0.06);
    }

    .curate-submission-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      padding-top: 12px !important;
    }

    .curate-submission-button {
      min-height: 28px;
      padding: 4px 9px;
      border: 1px solid rgba(128, 128, 128, 0.35);
      border-radius: 5px;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
    }

    .curate-submission-button:hover:not(:disabled) {
      background: rgba(128, 128, 128, 0.09);
    }

    .curate-submission-button.danger {
      border-color: rgba(229, 57, 53, 0.48);
      color: #E53935;
    }

    .curate-submission-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0 12px;
      padding: 9px 2px 5px !important;
      border-top: 1px solid rgba(128, 128, 128, 0.14);
    }

    .curate-submission-summary + .curate-submission-details {
      margin-top: 10px;
    }

    .curate-submission-boundary,
    .curate-submission-help {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      align-items: start;
      gap: 7px;
    }

    .curate-submission-boundary > i,
    .curate-submission-help > i {
      margin-top: 1px;
      color: #78909C;
      font-size: 16px;
      line-height: 1;
    }

    .curate-submission-detail-label {
      font-size: 11px;
      font-weight: 600;
      line-height: 1.25;
      opacity: 0.62;
    }

    .curate-submission-path {
      margin-top: 1px;
      overflow-wrap: anywhere;
      font-size: 12px;
      line-height: 1.35;
    }

    .curate-submission-chain {
      margin-top: 2px;
      font-size: 11px;
      line-height: 1.35;
      opacity: 0.6;
    }

    .curate-submission-help {
      font-size: 11.5px;
      line-height: 1.45;
      opacity: 0.72;
    }

    .curate-submission-error {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr);
      gap: 7px;
      margin: 0 12px 8px;
      color: #E53935;
      font-size: 11.5px;
      line-height: 1.4;
    }

    .curate-submission-loading {
      display: flex;
      min-height: 54px;
      align-items: center;
      gap: 8px;
      padding: 0 14px !important;
      font-size: 12px;
      opacity: 0.65;
    }

    .curate-submission-loading i,
    .curate-submission-saving {
      animation: curate-submission-spin 800ms linear infinite;
    }

    .curate-submission-unresolved {
      margin: 6px 12px 0;
      padding: 9px 10px !important;
      border-left: 3px solid #E53935;
      border-radius: 5px;
      background: rgba(229, 57, 53, 0.06);
    }

    .curate-submission-unresolved-title {
      display: flex;
      align-items: center;
      gap: 7px;
      color: #E53935;
      font-size: 12px;
      font-weight: 650;
    }

    .curate-submission-unresolved-copy {
      margin-top: 3px;
      font-size: 11.5px;
      line-height: 1.4;
      opacity: 0.7;
    }
  `;
}

function getPresentation(context) {
  if (context.selectedType === "file") {
    if (context.effectiveSubmission) {
      return {
        color: COLORS.active,
        icon: "mdi-file-tree-outline",
        title: `Moves with “${context.effectiveSubmission.name}”`,
        copy: "This file belongs to the outermost declared submission on its path.",
      };
    }

    return {
      color: COLORS.neutral,
      icon: "mdi-file-arrow-left-right-outline",
      title: "Moves independently",
      copy: "No submission boundary applies to this file.",
    };
  }

  const declaration = context.declaration;
  if (declaration.declared && declaration.controllingAncestor) {
    return {
      color: COLORS.inherited,
      icon: "mdi-folder-arrow-up-down-outline",
      title: "Declared here, controlled above",
      copy: `“${declaration.controllingAncestor.name}” is the effective submission boundary.`,
    };
  }

  if (declaration.currentlyEffective) {
    return {
      color: COLORS.active,
      icon: "mdi-folder-check-outline",
      title: "Effective submission boundary",
      copy: "This folder and everything beneath it move together as one unit.",
    };
  }

  if (declaration.controllingAncestor) {
    return {
      color: COLORS.inherited,
      icon: "mdi-folder-arrow-up-down-outline",
      title: `Inside “${declaration.controllingAncestor.name}”`,
      copy: "An outer declaration currently controls movement.",
    };
  }

  return {
    color: COLORS.neutral,
    icon: "mdi-folder-outline",
    title: "Not declared as a submission",
    copy: "Without a boundary here, contents may move independently.",
  };
}

function getControlHelp(declaration) {
  if (declaration.declared && declaration.controllingAncestor) {
    return `Stored but inactive while “${declaration.controllingAncestor.name}” controls movement.`;
  }
  if (!declaration.declared && declaration.controllingAncestor) {
    return `Enabling this will not override “${declaration.controllingAncestor.name}”.`;
  }
  if (declaration.declared) return "This is currently the outermost declared boundary.";
  return "Enable to preserve this folder and its contents as one movement unit.";
}

function getPolicyHelp(context) {
  if (context.selectedType === "file") {
    return context.effectiveSubmission
      ? "The file keeps its own quarantine clock. The submission moves once every current member is eligible."
      : "After its second scan, this file moves on its own and its organisational ancestry is not preserved.";
  }

  return context.declaration.declared
    ? "Each file keeps its own quarantine clock. The submission moves when every current member is eligible."
    : "The outermost declared folder controls movement. Nested declarations remain stored but inactive.";
}

function SubmissionSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label="Move this folder as one submission"
      aria-checked={checked}
      className="curate-submission-switch"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="curate-submission-switch-thumb" />
    </button>
  );
}

function SubmissionInfoCard(props) {
  const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
  const { node } = props;
  const storageKey = `FSTemplate.MultiColumn.InfoPanel.cardStatus.${props.namespace}.${props.componentName}.open`;
  const [open, setOpen] = useCurateCollapse(storageKey, true);
  const markerRef = React.useRef(null);
  const loadTokenRef = React.useRef(0);
  const activeNodeRef = React.useRef(node);
  const pinState = usePinController(markerRef);
  const isPinnedSelf = !!pinState.identifier && pinState.currentPin === pinState.identifier;
  const effectiveOpen = isPinnedSelf || (open && !pinState.currentPin);
  const [context, setContext] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);
  const [saveError, setSaveError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmingDisable, setConfirmingDisable] = React.useState(false);

  React.useEffect(() => {
    ensureStyles();
  }, []);
  useHeaderControls(markerRef, effectiveOpen, setOpen, "Submission", pinState);

  const loadContext = React.useCallback(async () => {
    const token = ++loadTokenRef.current;
    setLoading(true);
    setLoadError(null);

    try {
      const nextContext = await resolveSubmissionContext(node);
      if (token === loadTokenRef.current) setContext(nextContext);
    } catch (error) {
      if (token === loadTokenRef.current) {
        setLoadError(error);
        setContext(null);
      }
    } finally {
      if (token === loadTokenRef.current) setLoading(false);
    }
  }, [node]);

  React.useEffect(() => {
    activeNodeRef.current = node;
    setSaving(false);
    setSaveError(null);
    setConfirmingDisable(false);
    loadContext();
    return () => {
      loadTokenRef.current += 1;
    };
  }, [node, loadContext]);

  const commitDeclaration = async (enabled) => {
    if (!context?.resolved || !context.declaration || saving) return;

    const targetNode = node;
    const previousContext = context;
    setConfirmingDisable(false);
    setSaveError(null);
    setSaving(true);
    setContext(applyDeclarationToContext(context, enabled));

    try {
      await setSubmissionDeclaration(targetNode, enabled);
    } catch (error) {
      if (activeNodeRef.current === targetNode) {
        setContext(previousContext);
        setSaveError(error);
      }
    } finally {
      if (activeNodeRef.current === targetNode) setSaving(false);
    }
  };

  const requestDeclarationChange = (enabled) => {
    if (!enabled && context?.declaration?.currentlyEffective) {
      setConfirmingDisable(true);
      return;
    }
    commitDeclaration(enabled);
  };

  if (!InfoPanelCard) return null;

  const resolved = context?.resolved;
  const presentation = resolved ? getPresentation(context) : null;
  const headerColor = loading ? COLORS.neutral : presentation?.color || COLORS.error;
  const boundary = resolved ? context.effectiveSubmission : null;
  const controllingAncestor = resolved ? context.declaration?.controllingAncestor : null;

  return (
    <InfoPanelCard
      {...props}
      identifier="curate-submission-info"
      title="Submission"
      icon="mdi mdi-folder-multiple-outline"
      iconColor={headerColor}
      alwaysOpen={true}
    >
      <div className="curate-submission-root" style={{ paddingBottom: effectiveOpen ? 4 : 0 }}>
        <span ref={markerRef} style={{ display: "none" }} />

        {effectiveOpen && (
          <div aria-live="polite">
            {loading ? (
              <div className="curate-submission-loading">
                <i className="mdi mdi-loading" />
                <span>Resolving submission context…</span>
              </div>
            ) : loadError || !resolved ? (
              <div className="curate-submission-unresolved">
                <div className="curate-submission-unresolved-title">
                  <i className="mdi mdi-alert-circle-outline" />
                  Submission context unavailable
                </div>
                <div className="curate-submission-unresolved-copy">
                  Parent folders could not be resolved completely, so no movement assumption was
                  made.
                </div>
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="curate-submission-button" onClick={loadContext}>
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="curate-submission-summary"
                  style={{
                    color: presentation.color,
                    background: `${presentation.color}0f`,
                  }}
                >
                  <i className={`mdi ${presentation.icon} curate-submission-summary-icon`} />
                  <div className="curate-submission-summary-body">
                    <div className="curate-submission-summary-title">{presentation.title}</div>
                    <div className="curate-submission-summary-copy">{presentation.copy}</div>
                  </div>
                </div>

                {context.selectedType === "folder" && (
                  <>
                    <div className="curate-submission-control">
                      <div className="curate-submission-control-copy">
                        <div className="curate-submission-control-label">
                          Move as one submission
                        </div>
                        <div className="curate-submission-control-help">
                          {getControlHelp(context.declaration)}
                        </div>
                      </div>
                      <SubmissionSwitch
                        checked={context.declaration.declared}
                        disabled={saving}
                        onChange={requestDeclarationChange}
                      />
                    </div>

                    {controllingAncestor && (
                      <div className="curate-submission-context">
                        <i className="mdi mdi-source-branch" />
                        <div>
                          <div className="curate-submission-context-title">
                            Controlled by {controllingAncestor.name}
                          </div>
                          <div className="curate-submission-context-copy">
                            {context.declaration.declared
                              ? "This declaration remains stored and becomes effective if the outer boundary is removed."
                              : "A declaration here would remain inactive while the outer boundary exists."}
                          </div>
                        </div>
                      </div>
                    )}

                    {confirmingDisable && (
                      <div className="curate-submission-confirm" role="alert">
                        <div className="curate-submission-confirm-title">
                          Remove this submission boundary?
                        </div>
                        <div className="curate-submission-confirm-copy">
                          Nested declarations will take over where present. Other eligible files may
                          begin moving independently.
                        </div>
                        <div className="curate-submission-actions">
                          <button
                            type="button"
                            className="curate-submission-button"
                            onClick={() => setConfirmingDisable(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="curate-submission-button danger"
                            onClick={() => commitDeclaration(false)}
                          >
                            Remove boundary
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="curate-submission-details">
                  {boundary && (
                    <div className="curate-submission-boundary">
                      <i className="mdi mdi-folder-marker-outline" />
                      <div>
                        <div className="curate-submission-detail-label">Effective boundary</div>
                        <div className="curate-submission-path" title={boundary.path}>
                          {boundary.path}
                        </div>
                        {context.declaredPaths.length > 1 && (
                          <div className="curate-submission-chain">
                            {context.declaredPaths.length} declarations on this path; the outermost
                            applies.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="curate-submission-help">
                    <i className="mdi mdi-information-outline" />
                    <div>{getPolicyHelp(context)}</div>
                  </div>
                </div>

                {saveError && (
                  <div className="curate-submission-error" role="alert">
                    <i className="mdi mdi-alert-circle-outline" />
                    <div>
                      The change could not be saved. The previous setting has been restored.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </InfoPanelCard>
  );
}

Curate.infoPanel.registerCard({
  namespace: "CurateCustom",
  name: "SubmissionInfo",
  identifier: "curate-submission-info",
  component: SubmissionInfoCard,
  mime: ["generic_file", "generic_dir"],
  condition: (_node, nodes) =>
    (!nodes || nodes.length === 1) &&
    String(Curate.workspaces.getOpenWorkspace() || "").replace(/^\/+|\/+$/g, "") === "quarantine",
  weight: 2,
});
