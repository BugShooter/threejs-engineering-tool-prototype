(function() {
  const tool = window.EngineeringTool;

  function createSvgElement(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function normalizeRect(rect) {
    if (!rect) {
      return null;
    }

    return {
      left: Math.min(rect.left, rect.right),
      top: Math.min(rect.top, rect.bottom),
      right: Math.max(rect.left, rect.right),
      bottom: Math.max(rect.top, rect.bottom)
    };
  }

  function getOverlayOptions(options) {
    return Object.assign({
      showShortlist: false
    }, options || {});
  }

  function createCommonConnectDebug2D(options) {
    const config = Object.assign({ container: null }, options || {});

    const root = document.createElement('div');
    root.className = 'scene-overlay connect-debug-overlay';
    root.style.zIndex = config.container && config.container.dataset && config.container.dataset.overlayLayerHost === 'true'
      ? 'auto'
      : '19';
    root.style.pointerEvents = 'none';

    const svg = createSvgElement('svg');
    root.appendChild(svg);

    const labelLayer = document.createElement('div');
    labelLayer.className = 'connect-debug-labels';
    root.appendChild(labelLayer);

    config.container.appendChild(root);

    function clear() {
      clearNode(svg);
      clearNode(labelLayer);
    }

    function drawRect(rect, color, dashArray) {
      const normalized = normalizeRect(rect);
      if (!normalized) {
        return;
      }

      const element = createSvgElement('rect');
      element.setAttribute('x', `${normalized.left}`);
      element.setAttribute('y', `${normalized.top}`);
      element.setAttribute('width', `${Math.max(0, normalized.right - normalized.left)}`);
      element.setAttribute('height', `${Math.max(0, normalized.bottom - normalized.top)}`);
      element.setAttribute('fill', 'none');
      element.setAttribute('stroke', color);
      element.setAttribute('stroke-width', '1.5');
      if (dashArray) {
        element.setAttribute('stroke-dasharray', dashArray);
      }
      svg.appendChild(element);
    }

    function drawPolygon(points, color) {
      if (!Array.isArray(points) || points.length < 2) {
        return;
      }

      const polygon = createSvgElement('polygon');
      polygon.setAttribute('points', points.map(function(point) {
        return `${point.x},${point.y}`;
      }).join(' '));
      polygon.setAttribute('fill', 'none');
      polygon.setAttribute('stroke', color);
      polygon.setAttribute('stroke-width', '1.5');
      svg.appendChild(polygon);
    }

    function createLabel(x, y, text, color) {
      const label = document.createElement('div');
      label.className = 'connect-debug-label';
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.style.borderColor = color;
      label.style.color = color;
      label.textContent = text;
      labelLayer.appendChild(label);
    }

    function renderCommon(diagnostics, options) {
      if (!diagnostics) {
        return;
      }

      const overlayOptions = getOverlayOptions(options);
      if (!overlayOptions.showShortlist) {
        return;
      }

      for (const hoveredPart of diagnostics.hoveredParts || []) {
        if (hoveredPart.screenRect) {
          drawRect(hoveredPart.screenRect, hoveredPart.precise ? '#9cffc1' : '#6f7ea8', hoveredPart.precise ? null : '4 4');
        }
      }
    }

    function destroy() {
      root.remove();
    }

    return {
      clear,
      drawRect,
      drawPolygon,
      createLabel,
      renderCommon,
      destroy
    };
  }

  tool.connect.createCommonConnectDebug2D = createCommonConnectDebug2D;
})();