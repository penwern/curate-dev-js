import { useCurateCollapse, useHeaderChevron, usePinnedMode } from './CurateCardCollapse.js';
const React = new Proxy({}, { get: (_, k) => window.React[k] });

const mimeColor = (mime) =>
    mime.startsWith('image/') ? '#7986CB'
    : mime.startsWith('video/') ? '#EF5350'
    : mime.startsWith('audio/') ? '#66BB6A'
    : mime.startsWith('text/')  ? '#FFA726'
    : '#78909C';

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 1 ? 2 : 0) + ' ' + units[i];
}

function formatAge(ts) {
    const diff = Math.floor((Date.now() / 1000) - ts);
    if (diff < 60)      return diff + 's ago';
    if (diff < 3600)    return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400)   return Math.floor(diff / 3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
    return new Date(ts * 1000).toLocaleDateString();
}

function Row({ label, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span style={{ fontSize: 11, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#546E7A', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        </div>
    );
}

function CopyRow({ label, value, copied, onCopy }) {
    return (
        <div onClick={onCopy} title="Click to copy" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', borderRadius: 3 }}>
            <span style={{ fontSize: 11, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#546E7A', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                <span style={{ fontSize: 10, color: copied ? '#4CAF50' : '#B0BEC5', transition: 'color 0.2s' }}>{copied ? '✓' : '⎘'}</span>
            </div>
        </div>
    );
}

function FileInfoCard(props) {
    const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
    const [copied, setCopied] = React.useState(null);
    const storageKey = `FSTemplate.MultiColumn.InfoPanel.cardStatus.${props.namespace}.${props.componentName}.open`;
    const [open, setOpen] = useCurateCollapse(storageKey, true);
    const markerRef = React.useRef(null);
    const currentPin = usePinnedMode(markerRef);
    const effectiveOpen = open && !currentPin;
    useHeaderChevron(markerRef, effectiveOpen, setOpen, 'File Snapshot', !!currentPin);

    const { node } = props;
    const meta      = node._metadata;
    const bytesize  = parseInt(meta.get('bytesize') || '0', 10);
    const modiftime = parseInt(meta.get('ajxp_modiftime') || '0', 10);
    const mime      = meta.get('mime') || '—';
    const uuid      = meta.get('uuid') || '';
    const etag      = meta.get('etag') || '—';
    const color     = mimeColor(mime);

    const MAX_BYTES = 10 * 1024 ** 3;
    const fillPct   = bytesize > 0 ? Math.min(100, (Math.log(bytesize) / Math.log(MAX_BYTES)) * 100) : 0;

    function copy(text, key) {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }

    if (!InfoPanelCard) return null;

    return (
        <InfoPanelCard {...props} identifier="curate-file-snapshot" title="File Snapshot" icon="mdi mdi-pulse" iconColor={color} alwaysOpen={true}>
            <div style={{ paddingBottom: effectiveOpen ? 12 : 0 }}>
                <span ref={markerRef} style={{ display: 'none' }} />
                {effectiveOpen && (
                    <div style={{ padding: '8px 16px 0' }}>
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 11, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#455A64' }}>{formatSize(bytesize)}</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.08)' }}>
                                <div style={{ height: '100%', width: fillPct + '%', borderRadius: 2, background: color, transition: 'width 0.4s ease' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Row label="Type" value={mime} />
                            <Row label="Modified" value={formatAge(modiftime)} />
                            <CopyRow label="Checksum" value={etag} copied={copied === 'etag'} onCopy={() => copy(etag, 'etag')} />
                            <CopyRow label="UUID" value={uuid} copied={copied === 'uuid'} onCopy={() => copy(uuid, 'uuid')} />
                        </div>
                    </div>
                )}
            </div>
        </InfoPanelCard>
    );
}

Curate.infoPanel.registerCard({
    namespace: 'CurateCustom',
    name: 'FileSnapshot',
    component: FileInfoCard,
    mime: ['generic_file'],
    weight: -100,
});
