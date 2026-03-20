import { useCurateCollapse, useHeaderControls, usePinController } from './CurateCardCollapse.js';
const React = new Proxy({}, { get: (_, k) => window.React[k] });

const STATUS_CFG = {
    ReleaseTag: { label: 'Cleared', sub: 'Released from quarantine', color: '#43A047', icon: 'mdi-shield-check' },
    Released: { label: 'Cleared', sub: 'Released from quarantine', color: '#43A047', icon: 'mdi-shield-check' },
    Quarantined: { label: 'Quarantined', sub: 'In active quarantine period', color: '#FB8C00', icon: 'mdi-shield-lock-outline' },
    Risk: { label: 'At Risk', sub: 'Quarantine period incomplete', color: '#E53935', icon: 'mdi-shield-alert' },
    'Scan Limit Exceeded': { label: 'Too Large', sub: 'File exceeds scan size limit', color: '#78909C', icon: 'mdi-shield-off-outline' },
};

function getStatus(scanTag, openWs, scan1, scan2) {
    if (!scanTag) {
        return openWs === 'quarantine'
            ? { label: 'Unscanned', sub: 'Awaiting virus scan', color: '#E53935', icon: 'mdi-shield-alert-outline' }
            : { label: 'Unscanned', sub: 'Reupload to Quarantine to be scanned', color: '#E53935', icon: 'mdi-shield-alert-outline' };
    }

    if ((scanTag === 'Passed' || scanTag === 'QuarantineTag') && scan1?.passed && !scan2) {
        return openWs === 'quarantine'
            ? { label: 'Quarantined', sub: 'First scan passed - awaiting second scan', color: '#42A5F5', icon: 'mdi-shield-lock-outline' }
            : { label: 'At Risk', sub: 'First scan passed - move to Quarantine for second scan', color: '#FB8C00', icon: 'mdi-shield-alert' };
    }

    const cfg = STATUS_CFG[scanTag];
    if (cfg) {
        if (scanTag === 'Passed' && (openWs === 'personal-files' || openWs === 'common files')) {
            return { ...cfg, sub: `Passed ${openWs.replace('-', ' ')} scan` };
        }
        return cfg;
    }

    return { label: scanTag, sub: '', color: '#78909C', icon: 'mdi-shield-outline' };
}

function parseScanResult(raw) {
    if (!raw) return null;
    const passed = raw.toLowerCase().startsWith('passed');
    const failed = raw.toLowerCase().startsWith('failed');
    const date = raw.replace(/^(passed|failed):\s*/i, '');
    return { passed, failed, date, raw };
}

function ensureStyles() {
    let s = document.querySelector('style[data-curate-ingestion]');
    if (!s) {
        s = document.createElement('style');
        s.setAttribute('data-curate-ingestion', '');
        document.head.appendChild(s);
    }
    s.textContent = `
        @keyframes curate-ing-pulse {
            0%,100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.65; transform: scale(0.96); }
        }
        .curate-ing-status-icon { animation: curate-ing-pulse 3s ease infinite; }
        .curate-ing-pronom:hover { opacity: 0.82 !important; }
        .curate-ing-scanrow { transition: background 0.15s; border-radius: 4px; }
        .curate-ing-scanrow:hover { background: rgba(128,128,128,0.07) !important; }
    `;
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

function ScanChip({ result }) {
    if (!result) {
        return <span style={{ fontSize: 13, color: '#78909C', fontStyle: 'italic' }}>Not scanned</span>;
    }

    const color = result.passed ? '#43A047' : result.failed ? '#E53935' : '#78909C';
    const bg = result.passed ? 'rgba(67,160,71,0.12)' : result.failed ? 'rgba(229,57,53,0.12)' : 'rgba(120,144,156,0.1)';

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: bg,
            color,
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 13,
            fontWeight: 600,
        }}>
            <i className={`mdi ${result.passed ? 'mdi-check' : result.failed ? 'mdi-close' : 'mdi-minus'}`} style={{ fontSize: 12 }} />
            {result.passed ? 'Passed' : result.failed ? 'Failed' : result.raw}
        </span>
    );
}

function IngestionInfoCard(props) {
    const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
    const storageKey = `FSTemplate.MultiColumn.InfoPanel.cardStatus.${props.namespace}.${props.componentName}.open`;
    const [open, setOpen] = useCurateCollapse(storageKey, true);
    const markerRef = React.useRef(null);
    const pinState = usePinController(markerRef);
    const isPinnedSelf = !!pinState.identifier && pinState.currentPin === pinState.identifier;
    const effectiveOpen = isPinnedSelf || (open && !pinState.currentPin);

    React.useEffect(() => { ensureStyles(); }, []);
    useHeaderControls(markerRef, effectiveOpen, setOpen, 'Ingestion Info', pinState);

    const { node } = props;
    const meta = node._metadata;
    const scanTag = meta.get('usermeta-virus-scan') || null;
    const scan1raw = meta.get('usermeta-virus-scan-first') || null;
    const scan2raw = meta.get('usermeta-virus-scan-second') || null;
    const scan1 = parseScanResult(scan1raw);
    const scan2 = parseScanResult(scan2raw);
    const openWs = Curate.workspaces.getOpenWorkspace();
    const status = getStatus(scanTag, openWs, scan1, scan2);

    const pronId = meta.get('files')?.[0]?.matches?.[0]?.id ?? null;
    const mime = meta.get('mime') || null;
    const premis = meta.get('Premis') || [];
    const accession = premis.find((event) => event.event_type === 'Accession');
    const accessioned = accession?.event_date_time
        ? new Date(accession.event_date_time).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

    if (!InfoPanelCard) return null;

    return (
        <InfoPanelCard
            {...props}
            identifier="curate-ingestion-info"
            title="Ingestion Info"
            icon="mdi mdi-shield-check-outline"
            iconColor={status.color}
            alwaysOpen={true}
        >
            <div className="curate-ing-root" style={{ paddingBottom: effectiveOpen ? 10 : 0 }}>
                <span ref={markerRef} style={{ display: 'none' }} />

                {effectiveOpen && (
                    <>
                        <div style={{
                            margin: '6px 12px 0',
                            borderRadius: 6,
                            padding: '10px 12px',
                            background: `${status.color}0f`,
                            borderLeft: `3px solid ${status.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <i
                                className={`mdi ${status.icon} curate-ing-status-icon`}
                                style={{ fontSize: 28, color: status.color, lineHeight: 1, flexShrink: 0 }}
                            />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: status.color, lineHeight: 1.2 }}>
                                    {status.label}
                                </div>
                                {status.sub && (
                                    <div className="infoPanelLabel" style={{ fontSize: 13, marginTop: 2, lineHeight: 1.3 }}>
                                        {status.sub}
                                    </div>
                                )}
                            </div>
                        </div>

                        <SectionHead noBorder>Scan Results</SectionHead>
                        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {[['First', scan1, scan1?.date], ['Second', scan2, scan2?.date]].map(([label, result, date]) => (
                                <div key={label} className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, minWidth: 44 }}>{label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {date && (
                                            <span className="infoPanelLabel" style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.7 }}>{date}</span>
                                        )}
                                        <ScanChip result={result} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <SectionHead>File Identification</SectionHead>
                        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {pronId ? (
                                <div
                                    className="curate-ing-pronom"
                                    onClick={() => window.open(`https://www.nationalarchives.gov.uk/pronom/${pronId}`)}
                                    title="Open in PRONOM registry"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: 'rgba(128,128,128,0.07)',
                                        borderRadius: 5,
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        transition: 'opacity 0.15s',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#78909C', marginBottom: 2 }}>PRONOM</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#42A5F5', letterSpacing: '0.04em' }}>{pronId}</div>
                                    </div>
                                    <i className="mdi mdi-open-in-new" style={{ fontSize: 14, color: '#42A5F5', opacity: 0.7 }} />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13 }}>PRONOM ID</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13, fontStyle: 'italic' }}>Not characterised</span>
                                </div>
                            )}

                            {mime && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '2px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>MIME</span>
                                    <span className="infoPanelValue" title={mime} style={{ fontSize: 13, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{mime}</span>
                                </div>
                            )}

                            {accessioned && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13 }}>Accessioned</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13 }}>{accessioned}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </InfoPanelCard>
    );
}

Curate.infoPanel.registerCard({
    namespace: 'CurateCustom',
    name: 'IngestionInfo',
    identifier: 'curate-ingestion-info',
    component: IngestionInfoCard,
    mime: ['generic_file'],
    weight: 1,
});
