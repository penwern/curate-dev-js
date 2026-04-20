import { useCurateCollapse, useHeaderControls, usePinController } from './CurateCardCollapse.js';
const React = new Proxy({}, { get: (_, k) => window.React[k] });

// ── Siegfried helpers ─────────────────────────────────────────────────────────

const WARNING_EXPLANATIONS = {
    'extension mismatch':
        "The file's extension doesn't match the identified format. It may have been renamed or saved with an incorrect extension.",
    'match on text only; extension mismatch':
        "Format was identified from text content only (lower confidence) and the file extension doesn't match either.",
    'match on text only':
        "Format identified from text content only — byte-level signatures were not matched. Confidence is lower than a signature-based match.",
    'filename mismatch':
        "The filename doesn't match the expected naming pattern for this format.",
};

function getWarningExplanation(warning) {
    if (!warning) return null;
    return WARNING_EXPLANATIONS[warning.toLowerCase()] ?? null;
}

function humaniseBasis(basis) {
    if (!basis) return null;
    const hasContainer = /container name/i.test(basis);
    const hasByte = /byte match/i.test(basis);
    const hasText = /text match/i.test(basis);
    const hasExt = /extension match/i.test(basis);
    if (hasContainer && hasByte) return 'Container structure + byte signature';
    if (hasContainer) return 'Container structure';
    if (hasByte) return 'Byte signature';
    if (hasText) return 'Text content analysis';
    if (hasExt) return 'File extension only';
    return null;
}

function formatBytes(bytes) {
    if (bytes == null || bytes === '') return null;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} \u202f${sizes[i]}`;
}

// ─────────────────────────────────────────────────────────────────────────────

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

    // Parse Siegfried metadata if present
    let sf = null;
    let sfMatch = null;
    try {
        const sfRaw = meta.get('Siegfried');
        if (sfRaw) {
            sf = typeof sfRaw === 'string' ? JSON.parse(sfRaw) : sfRaw;
            sfMatch = sf?.files?.[0]?.matches?.[0] ?? null;
        }
    } catch (e) { /* ignore */ }

    const sfFile = sf?.files?.[0] ?? null;
    const pronId = sfMatch?.id ?? meta.get('files')?.[0]?.matches?.[0]?.id ?? null;
    const mime = sfMatch?.mime || meta.get('mime') || null;
    const basisLabel = humaniseBasis(sfMatch?.basis ?? null);
    const warningExplanation = getWarningExplanation(sfMatch?.warning ?? null);
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
                        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>

                            {sfMatch?.format && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Format</span>
                                    <span className="infoPanelValue" title={sfMatch.format} style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, textAlign: 'right' }}>{sfMatch.format}</span>
                                </div>
                            )}

                            {sfMatch?.version && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Version</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13 }}>{sfMatch.version}</span>
                                </div>
                            )}

                            {sfMatch?.class && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Class</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13 }}>{sfMatch.class}</span>
                                </div>
                            )}

                            {pronId ? (
                                <div
                                    className="curate-ing-scanrow curate-ing-pronom"
                                    onClick={() => window.open(`https://www.nationalarchives.gov.uk/pronom/${pronId}`)}
                                    title="Open in PRONOM registry"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px', cursor: 'pointer' }}
                                >
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>PRONOM</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#42A5F5' }}>{pronId}</span>
                                        <i className="mdi mdi-open-in-new" style={{ fontSize: 12, color: '#42A5F5', opacity: 0.65 }} />
                                    </span>
                                </div>
                            ) : (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13 }}>PRONOM</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13, fontStyle: 'italic' }}>Not characterised</span>
                                </div>
                            )}

                            {basisLabel && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Identified by</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13, textAlign: 'right' }}>{basisLabel}</span>
                                </div>
                            )}

                            {mime && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>MIME type</span>
                                    <span className="infoPanelValue" title={mime} style={{ fontSize: 13, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{mime}</span>
                                </div>
                            )}

                            {sfFile?.filesize != null && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>File size</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13 }}>{formatBytes(sfFile.filesize)}</span>
                                </div>
                            )}

                            {sf?.scandate && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Scan date</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13 }}>
                                        {new Date(sf.scandate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            )}

                            {accessioned && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Accessioned</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13 }}>{accessioned}</span>
                                </div>
                            )}

                            {sf?.siegfried && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Siegfried</span>
                                    <span className="infoPanelValue" style={{ fontSize: 13, fontFamily: 'monospace' }}>v{sf.siegfried}</span>
                                </div>
                            )}

                            {sf?.identifiers?.[0]?.details && (
                                <div className="curate-ing-scanrow" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '3px 4px' }}>
                                    <span className="infoPanelLabel" style={{ fontSize: 13, flexShrink: 0 }}>Signatures</span>
                                    <span className="infoPanelLabel" style={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', lineHeight: 1.55 }}>
                                        {sf.identifiers[0].details.split('; ').map((s, i) => <span key={i} style={{ display: 'block' }}>{s}</span>)}
                                    </span>
                                </div>
                            )}

                            {sfMatch?.warning && (
                                <>
                                    <div style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: '#FB8C00',
                                        padding: '8px 4px 3px',
                                        opacity: 0.8,
                                    }}>
                                        Warnings
                                    </div>
                                    <div style={{
                                        borderRadius: 6,
                                        padding: '9px 12px',
                                        background: 'rgba(251,140,0,0.08)',
                                        borderLeft: `3px solid #FB8C00`,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 9,
                                    }}>
                                        <i className="mdi mdi-alert-outline" style={{ fontSize: 16, color: '#FB8C00', lineHeight: 1, flexShrink: 0, marginTop: 1 }} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#FB8C00', lineHeight: 1.2 }}>{sfMatch.warning}</div>
                                            {warningExplanation && (
                                                <div className="infoPanelLabel" style={{ fontSize: 13, marginTop: 2, lineHeight: 1.3 }}>{warningExplanation}</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {sfFile?.errors && (
                                <div style={{
                                    margin: '4px 0 0',
                                    borderRadius: 6,
                                    padding: '9px 12px',
                                    background: 'rgba(229,57,53,0.08)',
                                    borderLeft: `3px solid #E53935`,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 9,
                                }}>
                                    <i className="mdi mdi-alert-circle-outline" style={{ fontSize: 16, color: '#E53935', lineHeight: 1, flexShrink: 0, marginTop: 1 }} />
                                    <div className="infoPanelLabel" style={{ fontSize: 13, lineHeight: 1.3 }}>{sfFile.errors}</div>
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
