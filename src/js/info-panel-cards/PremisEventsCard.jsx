import { useCurateCollapse, useHeaderControls, usePinController } from './CurateCardCollapse.js';
const React = new Proxy({}, { get: (_, k) => window.React[k] });

const INITIAL_VISIBLE_EVENTS = 12;
const LOAD_MORE_STEP = 12;

const EVENT_CFG = {
    'Accession':             { icon: 'mdi-archive-arrow-down',   color: '#66BB6A', short: 'Accessioned'  },
    'Quarantine':            { icon: 'mdi-shield-lock-outline',  color: '#FFA726', short: 'Quarantine'   },
    'Virus Check':           { icon: 'mdi-shield-search',        color: '#42A5F5', short: 'Virus Check'  },
    'Metadata Modification': { icon: 'mdi-pencil-outline',       color: '#78909C', short: 'Metadata'     },
    'Release':               { icon: 'mdi-check-decagram',       color: '#66BB6A', short: 'Released'     },
    'Ingest':                { icon: 'mdi-database-arrow-down',  color: '#AB47BC', short: 'Ingested'     },
    'Fixity Check':          { icon: 'mdi-fingerprint',          color: '#26C6DA', short: 'Fixity'       },
    'Migration':             { icon: 'mdi-swap-horizontal',      color: '#EF5350', short: 'Migrated'     },
};

function cfg(type) {
    return EVENT_CFG[type] || { icon: 'mdi-clock-outline', color: '#90A4AE', short: type };
}

function formatDate(str) {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(str) {
    if (!str) return '';
    return new Date(str).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// Deduplicate consecutive Metadata Modification events, keep first + count
function processEvents(premis) {
    const result = [];
    let i = 0;
    while (i < premis.length) {
        const ev = premis[i];
        if (ev.event_type === 'Metadata Modification') {
            let count = 1;
            while (i + count < premis.length && premis[i + count].event_type === 'Metadata Modification') count++;
            result.push({ ...ev, _count: count });
            i += count;
        } else {
            result.push({ ...ev, _count: 1 });
            i++;
        }
    }
    return result;
}

function getScrollParent(el) {
    let current = el?.parentElement || null;
    while (current) {
        const { overflowY } = window.getComputedStyle(current);
        if (overflowY === 'auto' || overflowY === 'scroll') return current;
        current = current.parentElement;
    }
    return document.querySelector('#info_panel .scrollarea-content') || document.querySelector('#info_panel');
}

let stylesInjected = false;
function ensureStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const s = document.createElement('style');
    s.setAttribute('data-curate-premis', '');
    s.textContent = `
        @keyframes curate-premis-glow {
            0%,100% { opacity: 1; }
            50%      { opacity: 0.4; }
        }
        .curate-premis-event {}
        .curate-premis-detail {
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows 0.22s ease;
            overflow: hidden;
        }
        .curate-premis-event:hover .curate-premis-detail,
        .curate-premis-event.expanded .curate-premis-detail {
            grid-template-rows: 1fr;
        }
        .curate-premis-detail-inner {
            min-height: 0;
            overflow: hidden;
        }
        .curate-premis-dot-latest {
            animation: curate-premis-glow 2.4s ease infinite;
        }
        .curate-premis-event:hover .curate-premis-date {
            opacity: 1 !important;
        }
        .curate-premis-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 18px;
        }
        .curate-premis-controls.bottom {
            margin-top: 12px;
            margin-bottom: 0;
            justify-content: center;
        }
        .curate-premis-load-more {
            appearance: none;
            border: none;
            background: transparent;
            color: var(--md-sys-color-primary);
            border-radius: 999px;
            padding: 0 0 4px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 6px;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.01em;
            cursor: pointer;
            transition: background 0.18s ease, color 0.18s ease;
        }
        .curate-premis-load-more:hover {
            background: transparent;
            color: var(--md-sys-color-on-surface);
        }
        .curate-premis-load-more:focus {
            outline: none;
            background: transparent;
            box-shadow: none;
            color: var(--md-sys-color-on-surface);
        }
        .curate-premis-load-more-label {
            font-family: inherit;
            line-height: 1.2;
        }
        .curate-premis-hidden-count {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--md-sys-color-on-surface-variant);
        }
        .curate-premis-event-list {
            display: flex;
            flex-direction: column;
            gap: 0;
        }
        .curate-premis-event-list.with-top-gap {
            margin-top: 14px;
        }
    `;
    document.head.appendChild(s);
}

function PremisEvent({ event, isLast, isLatest, idx }) {
    const { icon, color, short } = cfg(event.event_type);
    const detail = event.event_detail_information?.event_detail || '';
    const outcome = event.event_outcome_information?.event_outcome || '';
    const outcomeNote = event.event_outcome_information?.event_outcome_detail?.event_outcome_detail_note || '';
    const hasDetail = detail && detail !== 'Object metadata modified.';
    const displayOutcome = outcomeNote || outcome;

    return (
        <div
            className="curate-premis-event"
            style={{
                display: 'flex',
                gap: 10,
                paddingBottom: isLast ? 0 : 2,
                cursor: hasDetail ? 'pointer' : 'default',
            }}
        >
            {/* Timeline column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                <div
                    className={isLatest ? 'curate-premis-dot-latest' : ''}
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: color,
                        marginTop: 4,
                        flexShrink: 0,
                        boxShadow: isLatest ? `0 0 6px ${color}99` : 'none',
                    }}
                />
                {!isLast && (
                    <div style={{
                        flex: 1,
                        width: 1,
                        marginTop: 3,
                        background: `linear-gradient(to bottom, ${color}40, rgba(128,128,128,0.12))`,
                        minHeight: 14,
                    }} />
                )}
            </div>

            {/* Content column */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 10 }}>
                {/* Event header */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`mdi ${icon}`} style={{ fontSize: 12, color, lineHeight: 1 }} />
                        <span style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color,
                        }}>
                            {event._count > 1 ? `${short} ×${event._count}` : short}
                        </span>
                    </div>
                    <span
                        className="curate-premis-date infoPanelLabel"
                        style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.6, transition: 'opacity 0.15s', flexShrink: 0 }}
                    >
                        {formatDate(event.event_date_time)}
                    </span>
                </div>

                {/* Expandable detail */}
                {hasDetail && (
                    <div className="curate-premis-detail">
                        <div className="curate-premis-detail-inner">
                            <div style={{ paddingTop: 4, paddingBottom: 2 }}>
                                {displayOutcome && displayOutcome !== detail && (
                                    <div className="infoPanelValue" style={{ fontSize: 11, lineHeight: 1.4 }}>
                                        {displayOutcome}
                                    </div>
                                )}
                                <div className="infoPanelLabel" style={{ fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>
                                    {formatTime(event.event_date_time)}
                                    {event.event_identifier?.event_identifier_value
                                        ? ` · ${event.event_identifier.event_identifier_value.slice(0, 8)}…`
                                        : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PremisEventsCard(props) {
    const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
    const { node } = props;
    const storageKey = `FSTemplate.MultiColumn.InfoPanel.cardStatus.${props.namespace}.${props.componentName}.open`;
    const [open, setOpen] = useCurateCollapse(storageKey, true);
    const markerRef = React.useRef(null);
    const listBottomRef = React.useRef(null);
    const pinState = usePinController(markerRef);
    const isPinnedSelf = !!pinState.identifier && pinState.currentPin === pinState.identifier;
    const effectiveOpen = isPinnedSelf || (open && !pinState.currentPin);

    React.useEffect(() => { ensureStyles(); }, []);
    useHeaderControls(markerRef, effectiveOpen, setOpen, 'Preservation Events', pinState);

    const raw = node._metadata.get('Premis') || [];
    const events = processEvents(raw);
    const count = raw.length;
    const [visibleCount, setVisibleCount] = React.useState(() => Math.min(events.length, INITIAL_VISIBLE_EVENTS));
    const [pendingCollapseScroll, setPendingCollapseScroll] = React.useState(false);
    const collapsedCount = Math.min(events.length, INITIAL_VISIBLE_EVENTS);

    React.useEffect(() => {
        setVisibleCount(collapsedCount);
        setPendingCollapseScroll(false);
    }, [node, events.length, collapsedCount]);

    React.useEffect(() => {
        if (!pendingCollapseScroll || visibleCount !== collapsedCount) return;
        if (!listBottomRef.current) return;

        const target = listBottomRef.current;
        const scrollParent = getScrollParent(target);
        if (!scrollParent) {
            setPendingCollapseScroll(false);
            return;
        }

        const parentRect = scrollParent.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const currentTop = scrollParent.scrollTop;
        const relativeTop = targetRect.top - parentRect.top + currentTop;
        const nextTop = Math.max(0, relativeTop - scrollParent.clientHeight + 20);

        scrollParent.scrollTo({ top: nextTop, behavior: 'smooth' });
        setPendingCollapseScroll(false);
    }, [pendingCollapseScroll, visibleCount, collapsedCount]);

    if (!InfoPanelCard || events.length === 0) return null;

    const hiddenCount = Math.max(0, events.length - visibleCount);
    const visibleEvents = hiddenCount > 0 ? events.slice(-visibleCount) : events;
    const showMore = () => setVisibleCount((current) => Math.min(events.length, current + LOAD_MORE_STEP));
    const showFewer = () => {
        setPendingCollapseScroll(true);
        setVisibleCount(collapsedCount);
    };
    const canCollapse = visibleCount > collapsedCount;

    return (
        <InfoPanelCard
            {...props}
            identifier="curate-premis-events"
            title={`Preservation Events${count > 0 ? ` (${count})` : ''}`}
            icon="mdi mdi-timeline-clock-outline"
            iconColor="#AB47BC"
            alwaysOpen={true}
        >
            <div style={{ paddingBottom: effectiveOpen ? 12 : 0 }}>
                <span ref={markerRef} style={{ display: 'none' }} />
                {effectiveOpen && (
                    <div style={{ padding: '10px 16px 0' }}>
                        {hiddenCount > 0 && (
                            <div className="curate-premis-controls">
                                <button
                                    type="button"
                                    className="curate-premis-load-more"
                                    onClick={showMore}
                                    aria-label={`Show ${Math.min(LOAD_MORE_STEP, hiddenCount)} earlier preservation events`}
                                >
                                    <i className="mdi mdi-chevron-up" style={{ fontSize: 16, lineHeight: 1 }} />
                                    <span className="curate-premis-load-more-label">
                                        Show {Math.min(LOAD_MORE_STEP, hiddenCount)} earlier event{Math.min(LOAD_MORE_STEP, hiddenCount) === 1 ? '' : 's'}
                                    </span>
                                </button>
                                <span className="curate-premis-hidden-count">
                                    {hiddenCount} hidden
                                </span>
                            </div>
                        )}
                        <div className={`curate-premis-event-list${hiddenCount > 0 ? ' with-top-gap' : ''}`}>
                            {visibleEvents.map((ev, i) => (
                                <PremisEvent
                                    key={ev.event_identifier?.event_identifier_value || i}
                                    event={ev}
                                    isLast={i === visibleEvents.length - 1}
                                    isLatest={i === visibleEvents.length - 1}
                                    idx={i}
                                />
                            ))}
                            <span ref={listBottomRef} style={{ display: 'block', height: 1 }} />
                        </div>
                        {canCollapse && (
                            <div className="curate-premis-controls bottom">
                                <button
                                    type="button"
                                    className="curate-premis-load-more"
                                    onClick={showFewer}
                                    aria-label={`Collapse preservation events to the latest ${Math.min(events.length, INITIAL_VISIBLE_EVENTS)} events`}
                                >
                                    <i className="mdi mdi-chevron-down" style={{ fontSize: 16, lineHeight: 1 }} />
                                    <span className="curate-premis-load-more-label">
                                        Show fewer
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </InfoPanelCard>
    );
}

Curate.infoPanel.registerCard({
    namespace: 'CurateCustom',
    name: 'PremisEvents',
    identifier: 'curate-premis-events',
    component: PremisEventsCard,
    mime: ['generic_file'],
    condition: (node) => {
        const premis = node?._metadata?.get('Premis');
        return Array.isArray(premis) && premis.length > 0;
    },
    weight: 11,
});
