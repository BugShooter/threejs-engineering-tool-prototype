(function() {
  const tool = window.EngineeringTool;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeRect(rect) {
    if (!rect) {
      return null;
    }

    const left = Math.min(rect.left, rect.right);
    const right = Math.max(rect.left, rect.right);
    const top = Math.min(rect.top, rect.bottom);
    const bottom = Math.max(rect.top, rect.bottom);
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top
    };
  }

  function closestPointOnRect(rect, point) {
    if (!rect) {
      return point;
    }

    return {
      x: clamp(point.x, rect.left, rect.right),
      y: clamp(point.y, rect.top, rect.bottom)
    };
  }

  function createSvgElement(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  function createCalloutElement(extraClassName) {
    const element = document.createElement('div');
    element.className = `callout hidden${extraClassName ? ` ${extraClassName}` : ''}`;

    const title = document.createElement('div');
    title.className = 'callout-title';
    element.appendChild(title);

    const lines = document.createElement('div');
    lines.className = 'callout-lines';
    element.appendChild(lines);

    const actions = document.createElement('div');
    actions.className = 'callout-actions';
    element.appendChild(actions);

    return {
      element,
      title,
      lines,
      actions
    };
  }

  function createOverlayLayer(options) {
    const config = Object.assign({
      container: null,
      camera: null,
      worldToScreen: null
    }, options || {});

    const root = document.createElement('div');
    root.className = 'scene-overlay';
    if (config.container && config.container.dataset && config.container.dataset.overlayLayerHost === 'true') {
      root.style.zIndex = 'auto';
    }

    const svg = createSvgElement('svg');
    const partLine = createSvgElement('line');
    const jointLine = createSvgElement('line');
    const helperLine = createSvgElement('line');
    for (const line of [partLine, jointLine, helperLine]) {
      line.setAttribute('stroke', '#6a7fbf');
      line.setAttribute('stroke-width', '1.25');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('stroke-dasharray', '4 4');
      line.style.display = 'none';
      svg.appendChild(line);
    }
    root.appendChild(svg);

    const tooltip = document.createElement('div');
    tooltip.className = 'callout-tooltip hidden';
    root.appendChild(tooltip);

    const partCallout = createCalloutElement();
    const jointCallout = createCalloutElement();
  const helperCallout = createCalloutElement('callout-helper');
    root.appendChild(partCallout.element);
    root.appendChild(jointCallout.element);
    root.appendChild(helperCallout.element);
    config.container.appendChild(root);

    let partState = null;
    let jointState = null;
    let helperState = null;
    let suppressed = false;

    function clearNode(node) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }

    function setTooltip(target, text) {
      if (!text) {
        target.removeAttribute('data-tooltip');
        return;
      }
      target.setAttribute('data-tooltip', text);
    }

    function showTooltip(target) {
      const text = target.getAttribute('data-tooltip');
      if (!text) {
        return;
      }

      tooltip.textContent = text;
      tooltip.classList.remove('hidden');

      const rootRect = root.getBoundingClientRect();
      const buttonRect = target.getBoundingClientRect();
      const x = buttonRect.left - rootRect.left + buttonRect.width / 2;
      const y = buttonRect.top - rootRect.top - 6;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    }

    function hideTooltip() {
      tooltip.classList.add('hidden');
    }

    function attachActionButton(parent, action) {
      const button = document.createElement('button');
      const isDisabled = !!action.disabled;
      const wantsWideButton = !!(action.label || action.wide || action.kind === 'wide');
      button.className = `callout-btn${action.active ? ' active' : ''}${action.danger ? ' danger' : ''}${wantsWideButton ? ' wide' : ''}${isDisabled ? ' is-disabled' : ''}`;
      button.type = 'button';
      button.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      if (isDisabled) {
        button.tabIndex = -1;
      }

      if (action.icon) {
        const icon = document.createElement('span');
        icon.className = 'callout-btn-icon';
        icon.textContent = action.icon;
        button.appendChild(icon);
      }

      if (action.label) {
        const label = document.createElement('span');
        label.className = 'callout-btn-label';
        label.textContent = action.label;
        button.appendChild(label);
      }

      if (!action.icon && !action.label) {
        button.textContent = '';
      }

      setTooltip(button, action.tooltip);
      button.addEventListener('mouseenter', function() {
        if (typeof action.onHoverStart === 'function') {
          action.onHoverStart();
        }
        showTooltip(button);
      });
      button.addEventListener('mouseleave', function() {
        if (typeof action.onHoverEnd === 'function') {
          action.onHoverEnd();
        }
        hideTooltip();
      });
      button.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof action.onHoverEnd === 'function') {
          action.onHoverEnd();
        }
        hideTooltip();
        if (isDisabled || typeof action.onClick !== 'function') {
          return;
        }
        action.onClick();
      });
      parent.appendChild(button);
    }

    function renderCallout(target, state) {
      if (!state) {
        target.element.classList.add('hidden');
        clearNode(target.lines);
        clearNode(target.actions);
        return;
      }

      target.title.textContent = state.title || '';
      clearNode(target.lines);
      clearNode(target.actions);

      for (const lineText of state.lines || []) {
        const line = document.createElement('div');
        line.textContent = lineText;
        target.lines.appendChild(line);
      }

      for (const action of state.actions || []) {
        attachActionButton(target.actions, action);
      }

      target.element.classList.remove('hidden');
    }

    function setPartCallout(state) {
      partState = state;
      renderCallout(partCallout, state);
    }

    function setJointCallout(state) {
      jointState = state;
      renderCallout(jointCallout, state);
    }

    function setHelperCallout(state) {
      helperState = state;
      renderCallout(helperCallout, state);
    }

    function project(worldPoint) {
      if (!worldPoint || typeof config.worldToScreen !== 'function') {
        return null;
      }
      return config.worldToScreen(worldPoint);
    }

    function isVisibleProjection(projection) {
      return projection && projection.visible;
    }

    function resolveAnchor(state) {
      if (!state) {
        return null;
      }
      if (typeof state.getAnchorScreen === 'function') {
        return state.getAnchorScreen();
      }
      return project(state.anchorWorld);
    }

    function resolveRect(state, getterName) {
      if (!state || typeof state[getterName] !== 'function') {
        return null;
      }
      return normalizeRect(state[getterName]());
    }

    function getPlacementOrder(anchor, rootRect, preferredPlacement) {
      const order = [];
      if (preferredPlacement) {
        order.push(preferredPlacement);
      }

      const horizontal = anchor.x < rootRect.width * 0.5
        ? ['right', 'left']
        : ['left', 'right'];
      const vertical = anchor.y < rootRect.height * 0.5
        ? ['below', 'above']
        : ['above', 'below'];

      for (const placement of horizontal.concat(vertical)) {
        if (!order.includes(placement)) {
          order.push(placement);
        }
      }

      return order;
    }

    function buildPlacementCandidate(placement, anchor, avoidRect, cardRect, rootRect) {
      const gap = 18;
      const baseRect = avoidRect || {
        left: anchor.x,
        right: anchor.x,
        top: anchor.y,
        bottom: anchor.y
      };

      let left = anchor.x - cardRect.width * 0.5;
      let top = anchor.y - cardRect.height * 0.5;

      if (placement === 'right') {
        left = baseRect.right + gap;
        top = anchor.y - cardRect.height * 0.5;
      } else if (placement === 'left') {
        left = baseRect.left - gap - cardRect.width;
        top = anchor.y - cardRect.height * 0.5;
      } else if (placement === 'above') {
        left = anchor.x - cardRect.width * 0.5;
        top = baseRect.top - gap - cardRect.height;
      } else if (placement === 'below') {
        left = anchor.x - cardRect.width * 0.5;
        top = baseRect.bottom + gap;
      }

      const minLeft = 8;
      const minTop = 8;
      const maxLeft = Math.max(minLeft, rootRect.width - cardRect.width - 8);
      const maxTop = Math.max(minTop, rootRect.height - cardRect.height - 8);
      const overflowX = Math.max(0, minLeft - left) + Math.max(0, left - maxLeft);
      const overflowY = Math.max(0, minTop - top) + Math.max(0, top - maxTop);
      const clampedLeft = clamp(left, minLeft, maxLeft);
      const clampedTop = clamp(top, minTop, maxTop);
      const centerX = clampedLeft + cardRect.width * 0.5;
      const centerY = clampedTop + cardRect.height * 0.5;
      const distance = Math.hypot(centerX - anchor.x, centerY - anchor.y);

      return {
        placement,
        left: clampedLeft,
        top: clampedTop,
        score: overflowX * 12 + overflowY * 14 + distance * 0.02
      };
    }

    function layoutCallout(target, line, state, offsetX, offsetY) {
      if (!state) {
        target.element.classList.add('hidden');
        line.style.display = 'none';
        return;
      }

      const anchor = resolveAnchor(state);
      if (!isVisibleProjection(anchor)) {
        target.element.classList.add('hidden');
        line.style.display = 'none';
        return;
      }

      target.element.classList.remove('hidden');
      const cardRect = target.element.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const avoidRect = resolveRect(state, 'getAvoidRect');
      const lineRect = resolveRect(state, 'getLineRect') || avoidRect;
      const placements = getPlacementOrder(anchor, rootRect, state.preferredPlacement);
      let bestPlacement = buildPlacementCandidate(placements[0], anchor, avoidRect, cardRect, rootRect);

      for (let index = 1; index < placements.length; index += 1) {
        const candidate = buildPlacementCandidate(placements[index], anchor, avoidRect, cardRect, rootRect);
        if (candidate.score < bestPlacement.score) {
          bestPlacement = candidate;
        }
      }

      const left = bestPlacement.left;
      const top = bestPlacement.top;
      target.element.style.left = `${left}px`;
      target.element.style.top = `${top}px`;

      const cardBox = {
        left,
        top,
        right: left + cardRect.width,
        bottom: top + cardRect.height
      };
      const cardCenter = {
        x: (cardBox.left + cardBox.right) * 0.5,
        y: (cardBox.top + cardBox.bottom) * 0.5
      };
      const lineStart = lineRect ? closestPointOnRect(lineRect, cardCenter) : anchor;
      const lineEnd = closestPointOnRect(cardBox, lineStart);
      line.setAttribute('x1', `${lineStart.x}`);
      line.setAttribute('y1', `${lineStart.y}`);
      line.setAttribute('x2', `${lineEnd.x}`);
      line.setAttribute('y2', `${lineEnd.y}`);
      line.style.display = 'block';
    }

    function update() {
      if (suppressed) {
        hideTooltip();
        partLine.style.display = 'none';
        jointLine.style.display = 'none';
        helperLine.style.display = 'none';
        return;
      }

      layoutCallout(partCallout, partLine, partState, 26, -24);
      layoutCallout(jointCallout, jointLine, jointState, 24, -18);
      layoutCallout(helperCallout, helperLine, helperState, 28, -18);
    }

    return {
      setPartCallout,
      setJointCallout,
      setHelperCallout,
      setSuppressed: function(nextValue) {
        suppressed = !!nextValue;
        root.classList.toggle('suppressed', suppressed);
        if (suppressed) {
          hideTooltip();
        }
      },
      update,
      destroy: function() {
        root.remove();
      }
    };
  }

  tool.editor.createOverlayLayer = createOverlayLayer;
})();
