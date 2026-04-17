import { useCurateCollapse, useHeaderControls, usePinController } from './CurateCardCollapse.js';
const React = new Proxy({}, { get: (_, k) => window.React[k] });

const INDIGO = '#5C6BC0';

// ── Utilities ─────────────────────────────────────────────────────────────────

function fmtDate(str) {
    if (!str) return null;
    const d = new Date(str);
    if (isNaN(d)) return null;
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtNum(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString();
}

// ── Styles ────────────────────────────────────────────────────────────────────

let wdStylesInjected = false;
function ensureStyles() {
    if (wdStylesInjected) return;
    wdStylesInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-curate-wordmeta', '');
    s.textContent = `
        @keyframes wd-enter {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .wd-section {
            animation: wd-enter 0.24s ease both;
        }
        .wd-stat-cell {
            transition: background 0.14s;
        }
        .wd-stat-cell:hover {
            background: rgba(92,107,192,0.06);
        }
        .wd-flag-chip {
            transition: transform 0.14s;
        }
        .wd-flag-chip:hover {
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(s);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHead({ children, topBorder = true }) {
    return (
        <div style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            color: '#78909C',
            padding: topBorder ? '10px 16px 5px' : '0 16px 5px',
            borderTop: topBorder ? '1px solid rgba(128,128,128,0.1)' : 'none',
            marginTop: topBorder ? 6 : 0,
        }}>
            {children}
        </div>
    );
}

function StatCell({ label, value, accent }) {
    return (
        <div className="wd-stat-cell" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 4px',
            gap: 3,
        }}>
            <span style={{
                fontSize: 17,
                fontWeight: 700,
                lineHeight: 1,
                color: accent || INDIGO,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
            }}>
                {value}
            </span>
            <span style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: '#90A4AE',
                lineHeight: 1,
            }}>
                {label}
            </span>
        </div>
    );
}

function FlagChip({ icon, label, state }) {
    const COLOR_MAP = {
        ok:      { bg: 'rgba(76,175,80,0.1)',   border: 'rgba(76,175,80,0.3)',    text: '#4CAF50' },
        warn:    { bg: 'rgba(255,152,0,0.1)',   border: 'rgba(255,152,0,0.35)',   text: '#FF9800' },
        danger:  { bg: 'rgba(229,57,53,0.1)',   border: 'rgba(229,57,53,0.3)',    text: '#E53935' },
        info:    { bg: `${INDIGO}14`,           border: `${INDIGO}38`,            text: INDIGO    },
        neutral: { bg: 'rgba(120,144,156,0.1)', border: 'rgba(120,144,156,0.25)', text: '#78909C' },
    };
    const c = COLOR_MAP[state] || COLOR_MAP.neutral;
    return (
        <span className="wd-flag-chip" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.03em',
            color: c.text,
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 4,
            padding: '3px 7px 3px 5px',
            lineHeight: 1.2,
        }}>
            <i className={`mdi ${icon}`} style={{ fontSize: 11 }} />
            {label}
        </span>
    );
}

// ── Main card ─────────────────────────────────────────────────────────────────

function WordMetaCard(props) {
    const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
    const storageKey = `FSTemplate.MultiColumn.InfoPanel.cardStatus.${props.namespace}.${props.componentName}.open`;
    const [open, setOpen] = useCurateCollapse(storageKey, true);
    const markerRef = React.useRef(null);
    const pinState = usePinController(markerRef);
    const isPinnedSelf = !!pinState.identifier && pinState.currentPin === pinState.identifier;
    const effectiveOpen = isPinnedSelf || (open && !pinState.currentPin);

    React.useEffect(() => { ensureStyles(); }, []);
    useHeaderControls(markerRef, effectiveOpen, setOpen, 'Word Document', pinState);

    const { node } = props;
    const raw = node._metadata.get('usermeta-word-md');
    if (!InfoPanelCard || !raw) return null;

    let data;
    try {
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return null;
    }

    const meta = data?.metadata;
    if (!meta) return null;

    const props_data = meta.properties || {};
    const desc       = props_data.descriptive || {};
    const tech       = props_data.technical || {};
    const docstats   = props_data.document_statistics || {};
    const structure  = props_data.structure || {};
    const flags      = props_data.preservation_flags || {};

    // Authorship
    const author    = desc.author && desc.author !== 'Un-named' ? desc.author : null;
    const lastModBy = desc.last_modified_by || null;
    const revision  = desc.revision ?? null;
    const created   = fmtDate(desc.created || meta.created_at);
    const modified  = fmtDate(desc.modified || meta.modified_at);

    // Stats grid — pages, words, paragraphs, then comments (amber if >0) or tables
    const pages    = docstats.pages;
    const words    = docstats.words;
    const paras    = structure.paragraph_count;
    const comments = structure.comment_range_count;
    const tables   = structure.table_count;

    // Application provenance
    const appName    = docstats.application || null;
    const appVersion = docstats.app_version ? `v${docstats.app_version.replace(/\.0+$/, '')}` : null;
    const editMinutes = docstats.total_time ?? null;
    const template   = (docstats.template && docstats.template !== 'Normal') ? docstats.template : null;

    // Active preservation flags
    const activeFlags = [];
    if (flags.has_macros)                  activeFlags.push({ icon: 'mdi-code-braces',            label: 'Macros',         state: 'danger'  });
    if (flags.document_protection_enabled) activeFlags.push({ icon: 'mdi-lock-outline',            label: 'Protected',      state: 'warn'    });
    if (flags.track_revisions_enabled)     activeFlags.push({ icon: 'mdi-track-changes',           label: 'Track Changes',  state: 'warn'    });
    if (flags.is_template)                 activeFlags.push({ icon: 'mdi-file-outline',             label: 'Template',       state: 'info'    });
    if (flags.has_comments_part)           activeFlags.push({ icon: 'mdi-comment-multiple-outline', label: 'Has Comments',   state: 'info'    });
    if (flags.has_custom_properties)       activeFlags.push({ icon: 'mdi-tag-multiple-outline',     label: 'Custom Props',   state: 'info'    });
    if (flags.has_footnotes_part)          activeFlags.push({ icon: 'mdi-format-superscript',       label: 'Footnotes',      state: 'neutral' });
    if (flags.has_endnotes_part)           activeFlags.push({ icon: 'mdi-format-footnote',          label: 'Endnotes',       state: 'neutral' });

    const hasConcerns = flags.has_macros || flags.document_protection_enabled;
    const iconColor = hasConcerns ? '#FF8F00' : INDIGO;

    // 4th stat cell: comments if non-zero, else tables, else nothing
    const fourthStat = (comments != null && comments > 0)
        ? { label: 'Comments', value: fmtNum(comments), accent: '#FF8F00' }
        : (tables != null && tables > 0)
            ? { label: 'Tables', value: fmtNum(tables), accent: INDIGO }
            : null;

    const showAuthorship = author || lastModBy || created || modified || revision != null;

    return (
        <InfoPanelCard
            {...props}
            identifier="curate-word-meta"
            title="Word Document"
            icon="mdi mdi-file-word-outline"
            iconColor={iconColor}
            alwaysOpen={true}
        >
            <div style={{ paddingBottom: effectiveOpen ? 12 : 0 }}>
                <span ref={markerRef} style={{ display: 'none' }} />

                {effectiveOpen && (
                    <>
                        {/* ── Authorship block ── */}
                        {showAuthorship && (
                            <div className="wd-section" style={{
                                margin: '8px 12px 0',
                                borderRadius: 8,
                                border: `1px solid ${INDIGO}22`,
                                background: `linear-gradient(135deg, ${INDIGO}08 0%, transparent 70%)`,
                                overflow: 'hidden',
                                animationDelay: '0ms',
                            }}>
                                <div style={{ padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {author && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <i className="mdi mdi-account-outline" style={{ fontSize: 13, color: INDIGO, opacity: 0.7, flexShrink: 0 }} />
                                            <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{author}</span>
                                            <span style={{ fontSize: 10, color: '#90A4AE', flexShrink: 0, marginLeft: 'auto' }}>author</span>
                                        </div>
                                    )}
                                    {lastModBy && lastModBy !== author && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <i className="mdi mdi-account-edit-outline" style={{ fontSize: 13, color: INDIGO, opacity: 0.55, flexShrink: 0 }} />
                                            <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{lastModBy}</span>
                                            <span style={{ fontSize: 10, color: '#90A4AE', flexShrink: 0, marginLeft: 'auto' }}>last edit</span>
                                        </div>
                                    )}
                                    {(created || modified || revision != null) && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            flexWrap: 'wrap',
                                            marginTop: (author || lastModBy) ? 2 : 0,
                                            paddingTop: (author || lastModBy) ? 6 : 0,
                                            borderTop: (author || lastModBy) ? `1px solid ${INDIGO}14` : 'none',
                                        }}>
                                            {created && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <i className="mdi mdi-calendar-plus-outline" style={{ fontSize: 11, color: '#90A4AE' }} />
                                                    <span style={{ fontSize: 11, color: '#78909C' }}>{created}</span>
                                                </div>
                                            )}
                                            {modified && modified !== created && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <i className="mdi mdi-calendar-edit-outline" style={{ fontSize: 11, color: '#90A4AE' }} />
                                                    <span style={{ fontSize: 11, color: '#78909C' }}>{modified}</span>
                                                </div>
                                            )}
                                            {revision != null && (
                                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#90A4AE' }}>rev</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: INDIGO, fontVariantNumeric: 'tabular-nums' }}>{revision}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Document stats grid ── */}
                        {(pages != null || words != null || paras != null) && (
                            <div className="wd-section" style={{
                                margin: '8px 12px 0',
                                display: 'grid',
                                gridTemplateColumns: `repeat(${[pages, words, paras, fourthStat].filter(Boolean).length}, 1fr)`,
                                background: 'rgba(0,0,0,0.03)',
                                borderRadius: 8,
                                border: '1px solid rgba(128,128,128,0.1)',
                                overflow: 'hidden',
                                animationDelay: '55ms',
                            }}>
                                {pages != null   && <StatCell label="Pages" value={fmtNum(pages)} />}
                                {words != null   && <StatCell label="Words" value={fmtNum(words)} />}
                                {paras != null   && <StatCell label="Paras" value={fmtNum(paras)} />}
                                {fourthStat      && <StatCell label={fourthStat.label} value={fourthStat.value} accent={fourthStat.accent} />}
                            </div>
                        )}

                        {/* ── Preservation flags ── */}
                        <SectionHead>Preservation</SectionHead>
                        <div className="wd-section" style={{
                            padding: '0 12px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 5,
                            animationDelay: '100ms',
                        }}>
                            {activeFlags.length > 0
                                ? activeFlags.map((f, i) => (
                                    <FlagChip key={i} icon={f.icon} label={f.label} state={f.state} />
                                ))
                                : <FlagChip icon="mdi-check-circle-outline" label="No flags" state="ok" />
                            }
                        </div>

                        {/* ── Application provenance ── */}
                        {(appName || editMinutes != null || template) && (
                            <>
                                <SectionHead>Application</SectionHead>
                                <div className="wd-section" style={{
                                    margin: '0 12px',
                                    borderRadius: 7,
                                    border: '1px solid rgba(128,128,128,0.1)',
                                    background: 'rgba(0,0,0,0.02)',
                                    overflow: 'hidden',
                                    animationDelay: '140ms',
                                }}>
                                    {appName && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '7px 10px',
                                            borderBottom: (editMinutes != null || template) ? '1px solid rgba(128,128,128,0.08)' : 'none',
                                            gap: 8,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                                <i className="mdi mdi-application-outline" style={{ fontSize: 13, color: '#78909C', flexShrink: 0 }} />
                                                <span style={{
                                                    fontSize: 12,
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    minWidth: 0,
                                                }}>{appName}</span>
                                            </div>
                                            {appVersion && (
                                                <span style={{
                                                    fontSize: 10,
                                                    fontFamily: 'monospace',
                                                    color: '#90A4AE',
                                                    flexShrink: 0,
                                                }}>{appVersion}</span>
                                            )}
                                        </div>
                                    )}
                                    {(editMinutes != null || template) && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding: '7px 10px',
                                        }}>
                                            {editMinutes != null && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <i className="mdi mdi-timer-outline" style={{ fontSize: 12, color: '#78909C' }} />
                                                    <span style={{ fontSize: 11, color: '#78909C' }}>
                                                        {editMinutes < 60
                                                            ? `${editMinutes} min editing`
                                                            : `${Math.floor(editMinutes / 60)}h ${editMinutes % 60}m editing`}
                                                    </span>
                                                </div>
                                            )}
                                            {template && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: editMinutes != null ? 'auto' : 0 }}>
                                                    <i className="mdi mdi-file-outline" style={{ fontSize: 12, color: '#78909C' }} />
                                                    <span style={{ fontSize: 11, color: '#78909C', fontStyle: 'italic' }}>{template}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
    name: 'WordMeta',
    component: WordMetaCard,
    mime: ['generic_file'],
    condition: (node) => node?._metadata?.has('usermeta-word-md'),
    weight: 5,
});
