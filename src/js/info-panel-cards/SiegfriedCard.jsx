import { useCurateCollapse, useHeaderControls, usePinController } from './CurateCardCollapse.js';
const React = new Proxy({}, { get: (_, k) => window.React[k] });

const TEAL = '#00ACC1';

// ── Utilities ────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
    if (bytes == null) return null;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function formatScanDate(str) {
    if (!str) return null;
    return new Date(str).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

// Derive human-readable basis chips from the raw basis string
function parseBasisTags(basis) {
    if (!basis) return [];
    const tags = [];
    if (/container name/i.test(basis)) tags.push({ label: 'Container', icon: 'mdi-package-variant' });
    if (/byte match/i.test(basis))     tags.push({ label: 'Byte sig',  icon: 'mdi-hexadecimal' });
    if (/text match/i.test(basis))     tags.push({ label: 'Text sig',  icon: 'mdi-text-search' });
    if (/extension/i.test(basis))      tags.push({ label: 'Extension', icon: 'mdi-file-outline' });
    if (tags.length === 0) tags.push({ label: basis.slice(0, 36) + (basis.length > 36 ? '…' : ''), icon: 'mdi-check-circle-outline' });
    return tags;
}

// ── Styles ───────────────────────────────────────────────────────────────────

let sfStylesInjected = false;
function ensureStyles() {
    if (sfStylesInjected) return;
    sfStylesInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-curate-siegfried', '');
    s.textContent = `
        @keyframes sf-enter {
            from { opacity: 0; transform: translateY(5px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sf-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
        }
        .sf-match-block {
            animation: sf-enter 0.28s ease both;
        }
        .sf-pronom-pill {
            transition: transform 0.16s, box-shadow 0.16s, background 0.16s;
            text-decoration: none !important;
        }
        .sf-pronom-pill:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(0,172,193,0.28) !important;
        }
        .sf-meta-row {
            transition: background 0.12s;
            border-radius: 3px;
        }
        .sf-meta-row:hover {
            background: rgba(0,172,193,0.05) !important;
        }
        .sf-basis-tag {
            transition: opacity 0.14s, transform 0.14s;
        }
        .sf-basis-tag:hover {
            opacity: 0.78 !important;
            transform: translateY(-1px);
        }
        .sf-separator {
            height: 1px;
            margin: 0 12px;
            background: linear-gradient(to right, transparent, rgba(0,172,193,0.18), transparent);
        }
    `;
    document.head.appendChild(s);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ children, topBorder = true }) {
    return (
        <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            color: '#78909C',
            padding: '10px 16px 5px',
            borderTop: topBorder ? '1px solid rgba(128,128,128,0.1)' : 'none',
            marginTop: topBorder ? 6 : 0,
        }}>
            {children}
        </div>
    );
}

function MetaRow({ label, value, mono }) {
    return (
        <div className="sf-meta-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '3px 4px',
        }}>
            <span className="infoPanelLabel" style={{ fontSize: 12, flexShrink: 0 }}>{label}</span>
            <span
                className="infoPanelValue"
                title={String(value)}
                style={{
                    fontSize: mono ? 11 : 12,
                    fontFamily: mono ? 'monospace' : undefined,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                    opacity: mono ? 0.78 : 1,
                }}
            >
                {value}
            </span>
        </div>
    );
}

function MatchBlock({ match, idx }) {
    const hasPronom  = !!(match.id && match.ns === 'pronom');
    const hasVersion = !!match.version;
    const hasClass   = !!match.class;
    const hasMime    = !!match.mime;
    const hasWarning = !!match.warning;
    const basisTags  = parseBasisTags(match.basis);
    const pronId     = match.id;

    return (
        <div
            className="sf-match-block"
            style={{
                animationDelay: `${idx * 70}ms`,
                margin: idx === 0 ? '8px 12px 0' : '6px 12px 0',
                borderRadius: 8,
                overflow: 'hidden',
                border: `1px solid ${TEAL}28`,
                background: `${TEAL}08`,
            }}
        >
            {/* ── Format name + version ── */}
            <div style={{
                padding: '10px 12px 9px',
                borderBottom: `1px solid ${TEAL}18`,
                background: `linear-gradient(135deg, ${TEAL}0a 0%, transparent 60%)`,
            }}>
                <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    letterSpacing: '-0.01em',
                }}>
                    {match.format || 'Unknown Format'}
                </div>
                {hasVersion && (
                    <div style={{
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: TEAL,
                        marginTop: 3,
                        opacity: 0.85,
                        letterSpacing: '0.02em',
                    }}>
                        {match.version}
                    </div>
                )}
            </div>

            {/* ── PRONOM clickable pill ── */}
            {hasPronom && (
                <div style={{ padding: '9px 12px 0' }}>
                    <a
                        className="sf-pronom-pill"
                        href={`https://www.nationalarchives.gov.uk/pronom/${pronId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            background: `${TEAL}16`,
                            border: `1px solid ${TEAL}45`,
                            borderRadius: 5,
                            padding: '5px 9px 5px 8px',
                            boxShadow: `0 1px 4px ${TEAL}18, inset 0 1px 0 ${TEAL}12`,
                        }}
                    >
                        <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: TEAL,
                            opacity: 0.65,
                            lineHeight: 1,
                        }}>PRONOM</span>
                        <span style={{
                            fontSize: 14,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: TEAL,
                            letterSpacing: '0.03em',
                            lineHeight: 1,
                        }}>
                            {pronId}
                        </span>
                        <i className="mdi mdi-open-in-new" style={{
                            fontSize: 11,
                            color: TEAL,
                            opacity: 0.55,
                            marginLeft: 1,
                        }} />
                    </a>
                </div>
            )}

            {/* ── Class badge + basis identification tags ── */}
            {(hasClass || basisTags.length > 0) && (
                <div style={{
                    padding: '8px 12px 0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 5,
                    alignItems: 'center',
                }}>
                    {hasClass && (
                        <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            color: '#90A4AE',
                            background: 'rgba(120,144,156,0.12)',
                            borderRadius: 3,
                            padding: '2px 7px',
                            border: '1px solid rgba(120,144,156,0.2)',
                        }}>
                            {match.class}
                        </span>
                    )}
                    {basisTags.map((tag, i) => (
                        <span
                            key={i}
                            className="sf-basis-tag"
                            title={`Identified via: ${match.basis}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                color: `${TEAL}cc`,
                                background: `${TEAL}12`,
                                borderRadius: 3,
                                padding: '2px 7px 2px 5px',
                                border: `1px solid ${TEAL}2a`,
                            }}
                        >
                            <i className={`mdi ${tag.icon}`} style={{ fontSize: 10 }} />
                            {tag.label}
                        </span>
                    ))}
                </div>
            )}

            {/* ── MIME type ── */}
            {hasMime && (
                <div style={{
                    padding: '7px 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                }}>
                    <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#78909C',
                        flexShrink: 0,
                        opacity: 0.7,
                    }}>MIME</span>
                    <span
                        title={match.mime}
                        style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            opacity: 0.72,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                        }}
                    >
                        {match.mime}
                    </span>
                </div>
            )}

            {/* ── Warning ── */}
            {hasWarning ? (
                <div style={{
                    margin: '8px 10px 10px',
                    borderRadius: 5,
                    padding: '6px 9px',
                    background: 'rgba(255,143,0,0.07)',
                    border: '1px solid rgba(255,143,0,0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                }}>
                    <i className="mdi mdi-alert-outline" style={{
                        fontSize: 13,
                        color: '#FF8F00',
                        marginTop: 1,
                        flexShrink: 0,
                    }} />
                    <span style={{
                        fontSize: 11,
                        color: '#FF8F00',
                        lineHeight: 1.45,
                        letterSpacing: '0.01em',
                    }}>
                        {match.warning}
                    </span>
                </div>
            ) : (
                <div style={{ height: 10 }} />
            )}
        </div>
    );
}

// ── Main card ────────────────────────────────────────────────────────────────

function SiegfriedCard(props) {
    const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
    const storageKey = `FSTemplate.MultiColumn.InfoPanel.cardStatus.${props.namespace}.${props.componentName}.open`;
    const [open, setOpen] = useCurateCollapse(storageKey, true);
    const markerRef = React.useRef(null);
    const pinState = usePinController(markerRef);
    const isPinnedSelf = !!pinState.identifier && pinState.currentPin === pinState.identifier;
    const effectiveOpen = isPinnedSelf || (open && !pinState.currentPin);

    React.useEffect(() => { ensureStyles(); }, []);
    useHeaderControls(markerRef, effectiveOpen, setOpen, 'File Identification', pinState);

    const { node } = props;
    const raw = node._metadata.get('Siegfried');
    if (!InfoPanelCard || !raw) return null;

    let sf;
    try {
        sf = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return null;
    }

    const file = sf.files?.[0];
    if (!file) return null;

    const matches  = file.matches || [];
    const filesize = formatBytes(file.filesize);
    const scanDate = formatScanDate(sf.scandate);
    const sfVer    = sf.siegfried;
    const sig      = sf.signature;
    const hasErrors = !!(file.errors && file.errors.trim());

    const hasAnyWarning = matches.some((m) => m.warning);
    const iconColor = hasAnyWarning ? '#FF8F00' : matches.length > 0 ? TEAL : '#78909C';

    return (
        <InfoPanelCard
            {...props}
            identifier="curate-siegfried"
            title="File Identification"
            icon="mdi mdi-fingerprint"
            iconColor={iconColor}
            alwaysOpen={true}
        >
            <div style={{ paddingBottom: effectiveOpen ? 12 : 0 }}>
                <span ref={markerRef} style={{ display: 'none' }} />

                {effectiveOpen && (
                    <>
                        {matches.length === 0 ? (
                            <div style={{
                                margin: '8px 12px 0',
                                borderRadius: 7,
                                padding: '11px 13px',
                                background: 'rgba(120,144,156,0.07)',
                                border: '1px solid rgba(120,144,156,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 9,
                            }}>
                                <i className="mdi mdi-help-rhombus-outline" style={{ fontSize: 22, color: '#78909C', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: '#78909C', fontStyle: 'italic' }}>
                                    No format identified
                                </span>
                            </div>
                        ) : (
                            matches.map((match, idx) => (
                                <MatchBlock key={idx} match={match} idx={idx} />
                            ))
                        )}

                        <SectionHead>Scan Details</SectionHead>
                        <div style={{ padding: '0 12px' }}>
                            {scanDate  && <MetaRow label="Scanned"   value={scanDate} />}
                            {filesize  && <MetaRow label="File size" value={filesize} />}
                            {sfVer     && <MetaRow label="Siegfried" value={`v${sfVer}`} mono />}
                            {sig       && <MetaRow label="Signature" value={sig} mono />}
                        </div>

                        {hasErrors && (
                            <div style={{
                                margin: '8px 12px 0',
                                borderRadius: 5,
                                padding: '7px 10px',
                                background: 'rgba(229,57,53,0.07)',
                                border: '1px solid rgba(229,57,53,0.28)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 7,
                            }}>
                                <i className="mdi mdi-alert-circle-outline" style={{
                                    fontSize: 13,
                                    color: '#E53935',
                                    marginTop: 1,
                                    flexShrink: 0,
                                }} />
                                <span style={{ fontSize: 11, color: '#E53935', lineHeight: 1.45 }}>
                                    {file.errors}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </InfoPanelCard>
    );
}

Curate.infoPanel.registerCard({
    namespace: 'CurateCustom',
    name: 'Siegfried',
    identifier: 'curate-siegfried',
    component: SiegfriedCard,
    mime: ['generic_file'],
    condition: (node) => !!node?._metadata?.get('Siegfried'),
    weight: 2,
});
