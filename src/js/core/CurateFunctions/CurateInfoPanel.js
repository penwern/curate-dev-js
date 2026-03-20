/**
 * CurateInfoPanel
 *
 * Manages custom card injection into the Pydio Cells file info sidebar.
 *
 * The sidebar ("Tp" component) holds a TEMPLATES array in React hook state.
 * Whenever Tp resets TEMPLATES (selection change, card collapse, etc.),
 * a MutationObserver on #info_panel fires as a microtask and immediately
 * re-injects our cards.
 */

const _registry = new Map();
let _rafHandle = null;
let _observer = null;
let _observedPanel = null;
let _savedMarginTop = null;

function _getPanelContainer() {
    const byId = document.getElementById('info_panel');
    if (byId) return byId;
    const card = document.querySelector('.panelCard');
    return card ? card.parentElement : null;
}

function _getTpHook() {
    const panel = _getPanelContainer();
    if (!panel) return null;

    const fiberKey = Object.keys(panel).find((key) => key.startsWith('__reactFiber'));
    if (!fiberKey) return null;

    let cur = panel[fiberKey].return;
    while (cur) {
        const name = cur.type ? (cur.type.displayName || cur.type.name || null) : null;
        if (name === 'Tp') {
            let hook = cur.memoizedState;
            for (let i = 0; i < 10; i += 1) {
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

function _mergeCards(templates) {
    const currentMime = _getCurrentMimeCategory();
    const existingComponents = new Set(templates.map((template) => template.COMPONENT));
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

    const result = [...templates];
    for (const card of toAdd) {
        const idx = result.findIndex((template) => (template.WEIGHT ?? 0) > card.WEIGHT);
        if (idx === -1) result.push(card);
        else result.splice(idx, 0, card);
    }
    return result;
}

function _getScrollContent() {
    return document.querySelector('#info_panel .scrollarea-content');
}

function _injectCards() {
    const result = _getTpHook();
    if (!result) return;

    const { state, queue } = result;
    const merged = _mergeCards(state.TEMPLATES);
    if (merged === state.TEMPLATES) return;

    queue.dispatch({ TEMPLATES: merged, DATA: state.DATA });

    const content = _getScrollContent();
    if (content && _savedMarginTop !== null) {
        content.style.marginTop = _savedMarginTop;
        queueMicrotask(() => {
            content.style.marginTop = _savedMarginTop;
        });
        requestAnimationFrame(() => {
            content.style.marginTop = _savedMarginTop;
        });
    }
}

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

function _startLoop() {
    if (_rafHandle !== null) return;

    function loop() {
        const panel = _getPanelContainer();
        if (panel) {
            if (panel !== _observedPanel) {
                _initObserver();
                _injectCards();
            }

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
    registerCard(config) {
        const { namespace, name, component, mime, condition, weight, theme } = config;

        if (!namespace || !name || !component) {
            console.error('[CurateInfoPanel] registerCard requires: namespace, name, component');
            return;
        }

        if (!window[namespace]) {
            window[namespace] = {};
        }
        window[namespace][name] = component;

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

        _initObserver();
        _startLoop();
        setTimeout(_injectCards, 0);
    },

    getInfoPanelCard() {
        try {
            return window.PydioWorkspaces.default.InfoPanelCard;
        } catch (e) {
            return null;
        }
    },
};

export default CurateInfoPanel;
