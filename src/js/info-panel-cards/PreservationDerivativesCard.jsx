import { useCurateCollapse, useHeaderControls, usePinController } from './CurateCardCollapse.js';
const React = new Proxy({}, { get: (_, k) => window.React[k] });

const DUMMY_DERIVATIVES = [
    {
        id: 'deriv-001',
        label: 'Normalised Master',
        derivationType: 'Normalisation',
        mime: 'image/jpeg',
        format: 'JPEG',
        size: 3145728,
        created: '2025-11-04T09:12:00Z',
        wsId: 'bdd75b0a-3972-4daa-9763-c0d84762b6d6',
        path: '/soho-cooking-c632416f-fac2-4bbb-8083-ea84228ac8c3/data/objects/data/soho-cooking.jpg',
        parentFolder: '/soho-cooking-c632416f-fac2-4bbb-8083-ea84228ac8c3/data/objects/data',
        previewable: true,
    },
    {
        id: 'deriv-002',
        label: 'Access Copy',
        derivationType: 'Migration',
        mime: 'application/pdf',
        format: 'PDF/A-1b',
        size: 1048576,
        created: '2025-11-04T09:18:00Z',
        wsId: 'bdd75b0a-3972-4daa-9763-c0d84762b6d6',
        path: '/soho-cooking-c632416f-fac2-4bbb-8083-ea84228ac8c3/data/objects/data/soho-cooking-access.pdf',
        parentFolder: '/soho-cooking-c632416f-fac2-4bbb-8083-ea84228ac8c3/data/objects/data',
        previewable: false,
    },
];

function mimeColor(mime) {
    if (mime.startsWith('image/')) return '#5C6BC0';
    if (mime.startsWith('video/')) return '#EF5350';
    if (mime.startsWith('audio/')) return '#26A69A';
    if (mime === 'application/pdf') return '#FFA726';
    return '#78909C';
}

function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 1 ? 2 : 0) + ' ' + u[i];
}

function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

let stylesInjected = false;
function ensureStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-curate-derivatives', '');
    s.textContent = `
        @keyframes curate-deriv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .curate-deriv-action { transition: opacity 0.15s; border-radius: 3px; }
        .curate-deriv-action:hover:not(:disabled) { opacity: 0.75 !important; }
        .curate-deriv-action:disabled { opacity: 0.35 !important; cursor: default !important; }
    `;
    document.head.appendChild(s);
}

function SectionHead({ children, noBorder }) {
    return (
        <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#78909C',
            padding: '10px 16px 5px',
            borderTop: noBorder ? 'none' : '1px solid rgba(128,128,128,0.1)',
            marginTop: noBorder ? 0 : 2,
        }}>
            {children}
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
            <span className="infoPanelLabel" style={{ fontSize: 13 }}>{label}</span>
            <span className="infoPanelValue" style={{ fontSize: 13 }}>{value}</span>
        </div>
    );
}

function DerivativeBlock({ deriv, pydio, isFirst, isLast }) {
    const [previewUrl,     setPreviewUrl]     = React.useState(null);
    const [previewLoading, setPreviewLoading] = React.useState(false);
    const [previewOpen,    setPreviewOpen]    = React.useState(false);
    const [imgLoaded,      setImgLoaded]      = React.useState(false);

    const color = mimeColor(deriv.mime);
    const isImage = deriv.mime.startsWith('image/');

    async function handlePreview() {
        if (previewUrl) { setPreviewOpen(o => !o); return; }
        setPreviewLoading(true);
        try {
            const node = new PydioCore.AjxpNode(deriv.path);
            node.getMetadata().set('repository_id', deriv.wsId);
            const url = await pydio.ApiClient.buildPresignedGetUrl(node);
            setPreviewUrl(url);
            setPreviewOpen(true);
        } catch (e) {
            console.error('[PreservationDerivativesCard] presign error', e);
        } finally {
            setPreviewLoading(false);
        }
    }

    function handleLocate() {
        const node = new PydioCore.AjxpNode(deriv.parentFolder);
        node.getMetadata().set('repository_id', deriv.wsId);
        pydio.goTo(node);
    }

    return (
        <div style={{ borderBottom: isLast ? 'none' : '1px solid rgba(128,128,128,0.1)', paddingTop: isFirst ? 0 : 8 }}>
            {/* Derivative header banner */}
            <div style={{
                margin: '0 12px 6px',
                borderRadius: 6,
                padding: '8px 10px',
                background: `${color}0f`,
                borderLeft: `3px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
            }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color, lineHeight: 1.2 }}>
                        {deriv.label}
                    </div>
                    <div className="infoPanelLabel" style={{ fontSize: 12, marginTop: 1 }}>
                        {deriv.derivationType}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {isImage && (
                        <button
                            className="curate-deriv-action"
                            onClick={handlePreview}
                            disabled={previewLoading}
                            title={previewOpen ? 'Hide preview' : 'Preview'}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '3px 5px', display: 'flex', alignItems: 'center',
                                color: previewOpen ? color : '#78909C',
                            }}
                        >
                            <i
                                className={`mdi ${previewLoading ? 'mdi-loading' : previewOpen ? 'mdi-eye' : 'mdi-eye-outline'}`}
                                style={{
                                    fontSize: 16,
                                    ...(previewLoading ? { animation: 'curate-deriv-spin 0.8s linear infinite' } : {}),
                                }}
                            />
                        </button>
                    )}
                    <button
                        className="curate-deriv-action"
                        onClick={handleLocate}
                        title="Navigate to file location"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '3px 5px', display: 'flex', alignItems: 'center',
                            color: '#78909C',
                        }}
                    >
                        <i className="mdi mdi-folder-open-outline" style={{ fontSize: 16 }} />
                    </button>
                </div>
            </div>

            {/* Detail rows */}
            <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Row label="MIME type" value={deriv.mime} />
                <Row label="Format"    value={deriv.format} />
                <Row label="Size"      value={formatSize(deriv.size)} />
                <Row label="Created"   value={formatDate(deriv.created)} />
            </div>

            {/* Inline image preview */}
            {previewOpen && previewUrl && isImage && (
                <div style={{ margin: '0 12px 10px', borderRadius: 5, overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
                    {!imgLoaded && (
                        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#78909C' }}>
                            <i className="mdi mdi-loading" style={{ fontSize: 20, animation: 'curate-deriv-spin 0.8s linear infinite' }} />
                        </div>
                    )}
                    <img
                        src={previewUrl}
                        alt={deriv.label}
                        onLoad={() => setImgLoaded(true)}
                        style={{
                            display: imgLoaded ? 'block' : 'none',
                            width: '100%', maxHeight: 200,
                            objectFit: 'contain',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

function PreservationDerivativesCard(props) {
    const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
    const { pydio } = props;
    const storageKey = `FSTemplate.MultiColumn.InfoPanel.cardStatus.${props.namespace}.${props.componentName}.open`;
    const [open, setOpen] = useCurateCollapse(storageKey, true);
    const markerRef = React.useRef(null);
    const pinState = usePinController(markerRef);
    const isPinnedSelf = !!pinState.identifier && pinState.currentPin === pinState.identifier;
    const effectiveOpen = isPinnedSelf || (open && !pinState.currentPin);

    React.useEffect(() => { ensureStyles(); }, []);
    useHeaderControls(markerRef, effectiveOpen, setOpen, 'Preservation Derivatives', pinState);

    const derivatives = DUMMY_DERIVATIVES;

    if (!InfoPanelCard) return null;

    return (
        <InfoPanelCard
            {...props}
            identifier="curate-preservation-derivatives"
            title="Derivatives"
            icon="mdi mdi-content-copy"
            iconColor="#5C6BC0"
            alwaysOpen={true}
        >
            <div style={{ paddingBottom: effectiveOpen ? 4 : 0 }}>
                <span ref={markerRef} style={{ display: 'none' }} />
                {effectiveOpen && (
                    <>
                        {derivatives.length === 0 ? (
                            <div style={{ padding: '12px 16px' }}>
                                <span className="infoPanelLabel" style={{ fontSize: 13, fontStyle: 'italic' }}>
                                    No derivatives available
                                </span>
                            </div>
                        ) : (
                            <>
                                <SectionHead noBorder>
                                    {derivatives.length} derivative{derivatives.length !== 1 ? 's' : ''}
                                </SectionHead>
                                {derivatives.map((d, i) => (
                                    <DerivativeBlock
                                        key={d.id}
                                        deriv={d}
                                        pydio={pydio}
                                        isFirst={i === 0}
                                        isLast={i === derivatives.length - 1}
                                    />
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>
        </InfoPanelCard>
    );
}

Curate.infoPanel.registerCard({
    namespace: 'CurateCustom',
    name: 'PreservationDerivatives',
    identifier: 'curate-preservation-derivatives',
    component: PreservationDerivativesCard,
    mime: ['generic_file'],
    weight: 5,
});
