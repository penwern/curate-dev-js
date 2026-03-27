const React = new Proxy({}, { get: (_, k) => window.React[k] });

function ensureHeaderStyles() {
    let s = document.querySelector('style[data-curate-card-toggle]');
    if (!s) {
        s = document.createElement('style');
        s.setAttribute('data-curate-card-toggle', '');
        document.head.appendChild(s);
    }
    s.textContent = `
        .curate-card-toggle {
            position: relative;
            overflow: hidden;
            transition: background 400ms;
            border-radius: 50%;
        }
        .curate-card-toggle-ripple {
            position: absolute;
            border-radius: 50%;
            background-color: currentColor;
            pointer-events: none;
            opacity: 0.1;
            transform: scale(0);
            transition: transform 800ms cubic-bezier(0.08, 1, 0.78, 1), opacity 800ms cubic-bezier(0.08, 1, 0.78, 1);
        }
        .curate-card-ripple-active {
            transform: scale(1);
            opacity: 0.4;
        }
        .curate-card-header,
        .curate-card-header * {
            cursor: default !important;
        }
        .curate-card-toggle,
        .curate-card-toggle * {
            cursor: pointer !important;
        }
    `;
}

function useCurateCollapse(storageKey, defaultOpen = true) {
    const [open, setOpen] = React.useState(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw === null) return defaultOpen;
            return raw !== 'false';
        } catch (e) {
            return defaultOpen;
        }
    });

    React.useEffect(() => {
        try {
            window.localStorage.setItem(storageKey, String(open));
        } catch (e) {}
    }, [open, storageKey]);

    return [open, setOpen];
}

function readPinState(marker) {
    try {
        const card = marker?.closest('.panelCard');
        if (!card) return { currentPin: null, setColumnPin: null, identifier: null };
        const fiberKey = Object.keys(card).find((key) => key.startsWith('__reactFiber'));
        if (!fiberKey) return { currentPin: null, setColumnPin: null, identifier: null };

        let cur = card[fiberKey];
        while (cur) {
            const name = cur.type ? (cur.type.displayName || cur.type.name || null) : null;
            if (name === 'zp') {
                const props = cur.memoizedProps || {};
                return {
                    currentPin: props.currentPin ?? null,
                    setColumnPin: typeof props.setColumnPin === 'function' ? props.setColumnPin : null,
                    identifier: props.namespace && props.componentName ? `${props.namespace}.${props.componentName}` : null,
                };
            }
            cur = cur.return;
        }
    } catch (e) {}
    return { currentPin: null, setColumnPin: null, identifier: null };
}

function usePinController(markerRef) {
    const [pinState, setPinState] = React.useState({
        currentPin: null,
        setColumnPin: null,
        identifier: null,
    });

    React.useLayoutEffect(() => {
        let disposed = false;
        const sync = () => {
            if (disposed) return;
            const next = readPinState(markerRef.current);
            setPinState((prev) => (
                prev.currentPin === next.currentPin &&
                prev.setColumnPin === next.setColumnPin &&
                prev.identifier === next.identifier
            ) ? prev : next);
        };

        sync();
        const interval = window.setInterval(sync, 120);
        return () => {
            disposed = true;
            window.clearInterval(interval);
        };
    }, [markerRef]);

    return pinState;
}

function useHeaderControls(markerRef, open, setOpen, label, pinState) {
    const toggleButtonRef = React.useRef(null);
    const pinButtonRef = React.useRef(null);
    const pinWrapperRef = React.useRef(null);
    const pinTooltipRef = React.useRef(null);
    const toggleTooltipRef = React.useRef(null);
    const [hovered, setHovered] = React.useState(false);
    const latestRef = React.useRef({ currentPin: null, setColumnPin: null, identifier: null });

    latestRef.current = {
        currentPin: pinState.currentPin,
        setColumnPin: pinState.setColumnPin,
        identifier: pinState.identifier,
    };

    React.useLayoutEffect(() => {
        ensureHeaderStyles();
        const marker = markerRef.current;
        if (!marker) return undefined;

        const card = marker.closest('.panelCard');
        const header = card?.firstElementChild;
        if (!header) return undefined;

        header.classList.add('curate-card-header');

        const onEnter = () => setHovered(true);
        const onLeave = () => setHovered(false);
        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mouseleave', onLeave);

        let actions = header.lastElementChild;
        if (!actions || actions === header.children[0]) {
            actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.alignItems = 'center';
            actions.style.color = 'inherit';
            header.appendChild(actions);
        }

        const createButton = (kind, iconAttr) => {
            let wrapper = actions.querySelector(`[data-curate-${kind}-wrap]`);
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.setAttribute(`data-curate-${kind}-wrap`, 'true');
                wrapper.style.color = 'inherit';
                wrapper.style.paddingRight = '0';
                wrapper.style.display = 'inline-flex';
                wrapper.style.alignItems = 'center';
                actions.appendChild(wrapper);
            }

            let button = wrapper.querySelector(`[data-curate-${kind}]`);
            if (!button) {
                button = document.createElement('button');
                button.type = 'button';
                button.setAttribute(`data-curate-${kind}`, 'true');
                button.className = 'curate-card-toggle';
                button.tabIndex = 0;
                button.style.width = '36px';
                button.style.height = '36px';
                button.style.padding = '8px';
                button.style.margin = '0 0 0 -3px';
                button.style.border = '10px';
                button.style.boxSizing = 'border-box';
                button.style.display = 'inline-block';
                button.style.fontFamily = 'Roboto, sans-serif';
                button.style.webkitTapHighlightColor = 'rgba(0, 0, 0, 0)';
                button.style.cursor = 'pointer';
                button.style.textDecoration = 'none';
                button.style.outline = 'none';
                button.style.fontSize = '0px';
                button.style.fontWeight = 'inherit';
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                button.style.transition = '450ms cubic-bezier(0.23, 1, 0.32, 1)';
                button.style.background = 'none';

                const iconWrap = document.createElement('div');
                const icon = document.createElement('span');
                icon.setAttribute(iconAttr, 'true');
                icon.style.cssText = 'color: inherit; cursor: inherit; position: relative; font-size: 18px; display: inline-block; user-select: none; transition: 450ms cubic-bezier(0.23, 1, 0.32, 1);';
                iconWrap.appendChild(icon);
                button.appendChild(iconWrap);
                wrapper.appendChild(button);
            }

            // Attach tooltip (pin button only)
            let tooltip = wrapper.querySelector('[data-curate-tooltip]');
            if (!tooltip && kind === 'pin') {
                tooltip = document.createElement('div');
                tooltip.setAttribute('data-curate-tooltip', 'true');
                tooltip.style.cssText = [
                    'position:absolute',
                    'bottom:-30px',
                    'right:0',
                    'background:rgba(97,97,97,0.92)',
                    'color:#fff',
                    'font-size:10px',
                    'font-family:Roboto,sans-serif',
                    'font-weight:500',
                    'letter-spacing:0.01em',
                    'line-height:1',
                    'white-space:nowrap',
                    'padding:6px 8px',
                    'border-radius:14px',
                    'pointer-events:none',
                    'opacity:0',
                    'transform:scale(0.85)',
                    'transform-origin:top center',
                    'transition:opacity 150ms ease,transform 150ms ease',
                    'z-index:9999',
                ].join(';');
                wrapper.style.position = 'relative';
                wrapper.appendChild(tooltip);
                let tooltipTimer = null;
                button.addEventListener('mouseenter', () => {
                    tooltipTimer = window.setTimeout(() => {
                        tooltip.style.opacity = '1';
                        tooltip.style.transform = 'scale(1)';
                    }, 500);
                });
                button.addEventListener('mouseleave', () => {
                    window.clearTimeout(tooltipTimer);
                    tooltip.style.opacity = '0';
                    tooltip.style.transform = 'scale(0.85)';
                });
            }

            return { wrapper, button, tooltip };
        };

        const pinParts = createButton('pin', 'data-curate-pin-icon');
        const toggleParts = createButton('toggle', 'data-curate-icon');
        if (toggleParts.wrapper !== actions.lastElementChild) {
            actions.appendChild(toggleParts.wrapper);
        }
        if (pinParts.wrapper.nextSibling !== toggleParts.wrapper) {
            actions.insertBefore(pinParts.wrapper, toggleParts.wrapper);
        }

        const pinButton = pinParts.button;
        const toggleButton = toggleParts.button;
        pinWrapperRef.current = pinParts.wrapper;
        pinButtonRef.current = pinButton;
        toggleButtonRef.current = toggleButton;
        pinTooltipRef.current = pinParts.tooltip;
        toggleTooltipRef.current = toggleParts.tooltip;

        const addRipple = (button) => {
            const size = Math.max(button.clientWidth, button.clientHeight);
            const ripple = document.createElement('span');
            ripple.className = 'curate-card-toggle-ripple';
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${(button.clientWidth - size) / 2}px`;
            ripple.style.top = `${(button.clientHeight - size) / 2}px`;
            button.appendChild(ripple);
            ripple.getBoundingClientRect();
            ripple.classList.add('curate-card-ripple-active');
            const exit = () => {
                ripple.remove();
                document.removeEventListener('mouseup', exit);
            };
            document.addEventListener('mouseup', exit);
        };

        const onPinMouseDown = () => addRipple(pinButton);
        const onToggleMouseDown = () => addRipple(toggleButton);
        const onPinClick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const { currentPin, identifier, setColumnPin } = latestRef.current;
            if (!identifier || !setColumnPin) return;
            setColumnPin(currentPin === identifier ? null : identifier);
        };
        const onToggleClick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            const { currentPin, identifier, setColumnPin } = latestRef.current;
            if (currentPin && currentPin !== identifier) {
                setOpen(true);
                if (setColumnPin && identifier) setColumnPin(identifier);
                return;
            }
            setOpen((prev) => !prev);
        };

        const onHeaderClick = (event) => {
            // Ignore clicks that landed on our injected button wrappers
            if (pinParts.wrapper.contains(event.target) || toggleParts.wrapper.contains(event.target)) return;
            const { currentPin, identifier, setColumnPin } = latestRef.current;
            if (currentPin && currentPin !== identifier) {
                setOpen(true);
                if (setColumnPin && identifier) setColumnPin(identifier);
                return;
            }
            setOpen((prev) => !prev);
        };

        pinButton.addEventListener('mousedown', onPinMouseDown);
        pinButton.addEventListener('click', onPinClick);
        toggleButton.addEventListener('mousedown', onToggleMouseDown);
        toggleButton.addEventListener('click', onToggleClick);
        header.addEventListener('click', onHeaderClick);
        return () => {
            header.classList.remove('curate-card-header');
            header.removeEventListener('click', onHeaderClick);
            pinWrapperRef.current = null;
            pinButtonRef.current = null;
            toggleButtonRef.current = null;
            card.removeEventListener('mouseenter', onEnter);
            card.removeEventListener('mouseleave', onLeave);
            pinButton.removeEventListener('mousedown', onPinMouseDown);
            pinButton.removeEventListener('click', onPinClick);
            toggleButton.removeEventListener('mousedown', onToggleMouseDown);
            toggleButton.removeEventListener('click', onToggleClick);
            [pinParts.wrapper, toggleParts.wrapper].forEach((w) => {
                if (w.parentNode) w.parentNode.removeChild(w);
            });
        };
    }, [markerRef, setOpen]);

    React.useLayoutEffect(() => {
        const pinWrapper = pinWrapperRef.current;
        const toggleButton = toggleButtonRef.current;
        const pinButton = pinButtonRef.current;
        const { currentPin, identifier, setColumnPin } = pinState;
        const isPinnedSelf = !!identifier && currentPin === identifier;
        const hasOtherPin = !!currentPin && !isPinnedSelf;
        const showPin = open && hovered;

        if (toggleButton) {
            const icon = toggleButton.querySelector('[data-curate-icon]');
            const toggleLabel = open ? `Collapse ${label}` : `Expand ${label}`;
            toggleButton.style.display = isPinnedSelf ? 'none' : 'inline-block';
            toggleButton.setAttribute('aria-label', toggleLabel);
            if (icon) {
                icon.className = `mdi ${hasOtherPin ? 'mdi-chevron-right' : open ? 'mdi-chevron-up' : 'mdi-chevron-down'}`;
            }
            const toggleTooltip = toggleTooltipRef.current;
            if (toggleTooltip) toggleTooltip.textContent = toggleLabel;
        }

        if (pinWrapper) {
            pinWrapper.style.display = showPin ? 'inline-flex' : 'none';
        }

        if (pinButton) {
            const icon = pinButton.querySelector('[data-curate-pin-icon]');
            const pinLabel = isPinnedSelf ? `Unpin ${label}` : hasOtherPin ? `Pin ${label} instead` : `Attach card (full height)`;
            pinButton.style.opacity = setColumnPin ? '1' : '0.45';
            pinButton.style.cursor = setColumnPin ? 'pointer' : 'default';
            pinButton.setAttribute('aria-label', pinLabel);
            if (icon) {
                icon.className = `mdi ${isPinnedSelf ? 'mdi-pin-off-outline' : hasOtherPin ? 'mdi-chevron-right' : 'mdi-pin-outline'}`;
            }
            const pinTooltip = pinTooltipRef.current;
            if (pinTooltip) pinTooltip.textContent = pinLabel;
        }
    }, [hovered, label, open, pinState]);
}

export { useCurateCollapse, useHeaderControls, usePinController };
