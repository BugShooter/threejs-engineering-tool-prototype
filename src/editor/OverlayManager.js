(function() {
  const tool = window.EngineeringTool;

  function ensureOverlayManagerStyles() {
    if (document.getElementById('overlay-manager-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'overlay-manager-styles';
    style.textContent = [
      '.overlay-manager-layer{position:absolute;inset:0;pointer-events:none;overflow:visible;}',
      '.overlay-manager-layer[data-overlay-layer-id="panels"]{overflow:visible;}',
      '.overlay-manager-layer[data-overlay-layer-id="modal"]{overflow:visible;}'
    ].join('');
    document.head.appendChild(style);
  }

  function sortLayersByZIndex(layers) {
    return Array.from(layers.values()).sort(function(left, right) {
      return left.zIndex - right.zIndex;
    });
  }

  function createOverlayManager(options) {
    const config = Object.assign({
      container: null,
      layers: null
    }, options || {});

    if (!config.container) {
      throw new Error('OverlayManager requires container.');
    }

    ensureOverlayManagerStyles();

    const layerDefinitions = Array.isArray(config.layers) && config.layers.length
      ? config.layers
      : [
          { id: 'panels', zIndex: 16 },
          { id: 'hud', zIndex: 18 },
          { id: 'debug', zIndex: 19 },
          { id: 'anchored', zIndex: 20 },
          { id: 'modal', zIndex: 26 }
        ];
    const layers = new Map();

    function ensureLayer(layerDefinition) {
      if (!layerDefinition || !layerDefinition.id) {
        throw new Error('OverlayManager layer definition requires id.');
      }

      if (layers.has(layerDefinition.id)) {
        return layers.get(layerDefinition.id).element;
      }

      const element = document.createElement('div');
      element.className = `overlay-manager-layer overlay-manager-layer-${layerDefinition.id}`;
      element.dataset.overlayLayerHost = 'true';
      element.dataset.overlayLayerId = layerDefinition.id;
      element.style.zIndex = `${layerDefinition.zIndex}`;
      if (layerDefinition.pointerEvents) {
        element.style.pointerEvents = layerDefinition.pointerEvents;
      }
      config.container.appendChild(element);

      layers.set(layerDefinition.id, {
        id: layerDefinition.id,
        zIndex: layerDefinition.zIndex,
        element: element
      });
      return element;
    }

    for (const layerDefinition of layerDefinitions) {
      ensureLayer(layerDefinition);
    }

    function bringToExpectedOrder() {
      const orderedLayers = sortLayersByZIndex(layers);
      for (const layer of orderedLayers) {
        config.container.appendChild(layer.element);
      }
    }

    bringToExpectedOrder();

    return {
      getLayerHost: function(layerId) {
        const layer = layers.get(layerId);
        return layer ? layer.element : null;
      },
      ensureLayerHost: function(layerDefinition) {
        const host = ensureLayer(layerDefinition);
        bringToExpectedOrder();
        return host;
      },
      destroy: function() {
        for (const layer of layers.values()) {
          layer.element.remove();
        }
        layers.clear();
      }
    };
  }

  tool.editor.createOverlayManager = createOverlayManager;
})();