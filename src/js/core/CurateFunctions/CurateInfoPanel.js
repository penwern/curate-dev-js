/**
 * CurateInfoPanel
 *
 * Manages custom card injection into the Pydio Cells file info sidebar.
 *
 * The sidebar ("Tp" component) holds a TEMPLATES array in React hook state.
 * Whenever Tp resets TEMPLATES (selection change, card collapse, etc.),
 * a MutationObserver on #info_panel fires as a microtask — before the browser
 * paints — and immediately re-injects our cards.
 *
 * The info panel uses a virtual scroll (.scrollarea-content positioned via
 * margin-top). A scroll sentinel adjusts margin-top when content height changes.
 * To prevent the sentinel from shifting the view on re-injection, we continuously
 * snapshot margin-top in the rAF loop and restore it after each inject.
 *
 * A rAF loop also re-attaches the MutationObserver whenever #info_panel is
 * replaced (workspace navigation).
 *
 * Usage via the Curate API:
 *
 *   const InfoPanelCard = Curate.infoPanel.getInfoPanelCard();
 *
 *   Curate.infoPanel.registerCard({
 *     namespace: 'CurateCustom',
 *     name: 'MyCard',
 *     component: function MyCard(props) {
 *       return React.createElement(InfoPanelCard, {
 *         ...props,
 *         identifier: 'my-card',
 *         title: 'My Card',
 *         icon: 'mdi mdi-star',
 *         iconColor: '#9C27B0',
 *       }, React.createElement('div', { style: { padding: '8px 16px' } }, 'Card content'));
 *     },
 *     mime: ['generic_file', 'generic_dir'],
 *     weight: 50,
 *   });
 */

const _registry = new Map();
let _rafHandle = null;
let _observer = null;
let _observedPanel = null;
let _savedMarginTop = null;

/**
 * Returns the DOM element to use as the starting point for fiber walks and
 * as the MutationObserver target.
 * - Normal mode: #info_panel (has the id)
 * - Pin mode: #info_panel loses its id; use the direct parent of the first .panelCard
 */
function _getPanelContainer() {
    const byId = document.getElementById('info_panel');
    if (byId) return byId;
    const card = document.querySelector('.panelCard');
    return card ? card.parentElement : null;
}

/**
 * Walk the React fiber tree upward from the panel container to find the "Tp"
 * component that owns the TEMPLATES/DATA hook (hook index 10).
 * Returns { state, queue } or null.
 */
function _getTpHook() {
    const panel = _getPanelContainer();
    if (!panel) return null;

    const fiberKey = Object.keys(panel).find(k => k.startsWith('__reactFiber'));
    if (!fiberKey) return null;

    let cur = panel[fiberKey].return;
    while (cur) {
        const name = cur.type ? (cur.type.displayName || cur.type.name || null) : null;
        if (name === 'Tp') {
            let hook = cur.memoizedState;
            for (let i = 0; i < 10; i++) {
                if (!hook) return null;
                hook = hook.next;
            }
            if (!hook || !hook.memoizedState || !hook.queue || !hook.queue.dispatch) return null;
            const state = hook.memoizedState;
            if (!state.TEMPLATES || !state.DATA) return null;
            return { state, queue: hook.queue };
        }
        cur = cur.return;
    }
    return null;
}

/**
 * Returns the mime category for the current selection:
 *   'generic_file'     — single file
 *   'generic_dir'      — single folder
 *   'generic_multiple' — multiple nodes
 *   'ajxp_root_node'   — root node
 */
function _getCurrentMimeCategory() {
    try {
        const nodes = window.pydio._dataModel._selectedNodes;
        if (!nodes || nodes.length === 0) return 'ajxp_root_node';
        if (nodes.length > 1) return 'generic_multiple';
        const node = nodes[0];
        if (node.isRoot && node.isRoot()) return 'ajxp_root_node';
        if (node.isLeaf && node.isLeaf()) return 'generic_file';
        return 'generic_dir';
    } catch (e) {
        return 'generic_file';
    }
}

/**
 * Merge registered cards into a given TEMPLATES array for the current mime.
 * Returns the merged array (original reference if nothing to add — used for idempotency).
 */
function _mergeCards(templates) {
    const currentMime = _getCurrentMimeCategory();
    const existingComponents = new Set(templates.map(t => t.COMPONENT));
    const toAdd = [];

    for (const card of _registry.values()) {
        const key = `${card.namespace}.${card.name}`;
        if (existingComponents.has(key)) continue;

        const mimes = card.mime || ['generic_file', 'generic_dir'];
        if (!mimes.includes(currentMime)) continue;

        if (card.condition) {
            try {
                const nodes = window.pydio._dataModel._selectedNodes;
                const node = nodes && nodes[0];
                if (!card.condition(node, nodes)) continue;
            } catch (e) {
                continue;
            }
        }

        toAdd.push({
            COMPONENT: key,
            THEME: card.theme || null,
            ATTRIBUTES: null,
            WEIGHT: card.weight !== undefined ? card.weight : 50,
        });
    }

    if (!toAdd.length) return templates;

    // Insert each card at the correct position by weight (ascending = higher in panel)
    const result = [...templates];
    for (const card of toAdd) {
        const idx = result.findIndex(t => (t.WEIGHT ?? 0) > card.WEIGHT);
        if (idx === -1) result.push(card);
        else result.splice(idx, 0, card);
    }
    return result;
}

/**
 * Returns the virtual scroll content element inside #info_panel, or null.
 * Pydio's info panel uses margin-top on this element to simulate scrolling.
 */
function _getScrollContent() {
    return document.querySelector('#info_panel .scrollarea-content');
}

/**
 * Inject registered cards into Tp's current state if any are missing.
 * Restores the virtual scroll position afterward to prevent the sentinel
 * from jumping the view when content height changes during re-injection.
 */
function _injectCards() {
    const result = _getTpHook();
    if (!result) return;

    const { state, queue } = result;
    const merged = _mergeCards(state.TEMPLATES);
    if (merged === state.TEMPLATES) return;

    queue.dispatch({ TEMPLATES: merged, DATA: state.DATA });

    // Restore virtual scroll position after re-injection.
    // The scroll sentinel adjusts margin-top when content height changes;
    // we override it back to the pre-removal position (saved in the rAF loop).
    // Three-phase restore covers synchronous, microtask, and rAF-deferred sentinel adjustments.
    const content = _getScrollContent();
    if (content && _savedMarginTop !== null) {
        content.style.marginTop = _savedMarginTop;
        queueMicrotask(() => { content.style.marginTop = _savedMarginTop; });
        requestAnimationFrame(() => { content.style.marginTop = _savedMarginTop; });
    }
}

/**
 * Attach a MutationObserver to the current #info_panel element.
 * Fires as a microtask before browser paint, re-injecting cards immediately
 * whenever Tp resets TEMPLATES.
 */
function _initObserver() {
    if (_observer) {
        _observer.disconnect();
        _observer = null;
    }
    const panel = _getPanelContainer();
    if (!panel) return;

    _observedPanel = panel;
    _observer = new MutationObserver(() => _injectCards());
    _observer.observe(panel, { childList: true, subtree: true });
}

/**
 * Start the rAF loop that:
 *  - Snapshots the virtual scroll margin-top each frame (while our cards are present)
 *    so _injectCards can restore it on removal.
 *  - Re-attaches the MutationObserver if #info_panel is replaced (workspace navigation).
 * Safe to call multiple times — only one loop runs.
 */
function _startLoop() {
    if (_rafHandle !== null) return;
    function loop() {
        const panel = _getPanelContainer();
        if (panel) {
            if (panel !== _observedPanel) {
                _initObserver();
                _injectCards();
            }
            // Snapshot margin-top while our cards are present so we can restore on removal
            const result = _getTpHook();
            if (result && _mergeCards(result.state.TEMPLATES) === result.state.TEMPLATES) {
                const content = _getScrollContent();
                if (content) _savedMarginTop = content.style.marginTop;
            }
        }
        _rafHandle = requestAnimationFrame(loop);
    }
    _rafHandle = requestAnimationFrame(loop);
}

const CurateInfoPanel = {
    /**
     * Register a custom info panel card.
     *
     * @param {Object}   config
     * @param {string}   config.namespace  - Window namespace for the component (e.g. 'CurateCustom').
     *                                       The component is registered as window[namespace][name].
     * @param {string}   config.name       - Component name within the namespace.
     * @param {Function} config.component  - React component. Receives Pydio card props:
     *                                       { node, pydio, getMessage, dataModel, onRequestClose, ... }
     *                                       Use getInfoPanelCard() as the root element for correct styling.
     * @param {string[]} [config.mime]      - Mime categories to show for. Defaults to files + folders.
     *                                        Options: 'generic_file', 'generic_dir', 'generic_multiple',
     *                                                 'ajxp_root_node'
     * @param {Function} [config.condition] - Optional predicate (node, nodes) => boolean.
     *                                        Called with the selected node(s) after mime check passes.
     *                                        Return false to hide the card. Exceptions are treated as false.
     *                                        Examples:
     *                                          node => node._metadata.get('mime')?.startsWith('image/')
     *                                          node => !!node._metadata.get('usermeta-virus-scan')
     *                                          (node, nodes) => nodes.length > 1
     * @param {number}   [config.weight]    - Sort order. Lower = higher in the panel. Default 50.
     * @param {string}   [config.theme]     - Optional Pydio theme string (e.g. 'material').
     */
    registerCard(config) {
        const { namespace, name, component, mime, condition, weight, theme } = config;

        if (!namespace || !name || !component) {
            console.error('[CurateInfoPanel] registerCard requires: namespace, name, component');
            return;
        }

        // Expose component on window so Pydio can resolve 'namespace.name'
        if (!window[namespace]) {
            window[namespace] = {};
        }
        window[namespace][name] = component;

        // Pre-register in SystemJS to prevent a network fetch on LoadClass.
        // Delete first to ensure any previously-cached module is replaced.
        try {
            window.System.delete(namespace);
            const moduleExports = Object.assign({}, window[namespace]);
            moduleExports.default = window[namespace];
            window.System.set(namespace, window.System.newModule(moduleExports));
        } catch (e) {
            console.warn('[CurateInfoPanel] SystemJS registration failed (non-fatal):', e);
        }

        _registry.set(`${namespace}.${name}`, {
            namespace,
            name,
            component,
            mime: mime || ['generic_file', 'generic_dir'],
            condition: condition || null,
            weight: weight !== undefined ? weight : 50,
            theme: theme || null,
        });

        // Attach MutationObserver and start the rAF snapshot/remount-detection loop
        _initObserver();
        _startLoop();

        // Inject into current state immediately
        setTimeout(_injectCards, 0);
    },

    /**
     * Returns the InfoPanelCard component used by all native Pydio info cards.
     * Custom cards should render this as their root element to get correct panelCard
     * styling, collapse behaviour, drag/drop, and pin support.
     *
     * Required props:
     *   identifier {string}  - Unique card ID (persisted in localStorage for pin state)
     *   title      {string}  - Card header title
     *   icon       {string}  - MDI icon class, e.g. 'mdi mdi-star'
     *   iconColor  {string}  - Icon colour, e.g. '#9C27B0'
     *
     * All other Pydio props received by your component (node, pydio, getMessage, ...)
     * should be spread into InfoPanelCard so it can function correctly.
     *
     * @returns {Function|null}
     */
    getInfoPanelCard() {
        try {
            return window.PydioWorkspaces.default.InfoPanelCard;
        } catch (e) {
            return null;
        }
    },
};

export default CurateInfoPanel;
