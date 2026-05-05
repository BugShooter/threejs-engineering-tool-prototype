(function() {
  const tool = window.EngineeringTool;
  const createCommonConnectDebug3D = tool.connect.createCommonConnectDebug3D;
  const createCommonConnectDebug2D = tool.connect.createCommonConnectDebug2D;
  const createVisibleHiddenDebug3D = tool.connect.createVisibleHiddenDebug3D;
  const createVisibleHiddenDebug2D = tool.connect.createVisibleHiddenDebug2D;
  const createVisibleHiddenDebugPanel = tool.connect.createVisibleHiddenDebugPanel;

  function resolveActiveTargetColor(diagnostics) {
    const strategyData = diagnostics && diagnostics.strategyData;
    const activeTarget = strategyData && strategyData.activeTarget;
    return activeTarget && activeTarget.visible ? 0x5ca8ff : 0xff8f5c;
  }

  function createVisibleHiddenDebugAdapter(options) {
    const config = Object.assign({
      scene: null,
      container: null,
      defaultSelectionConfig: null
    }, options || {});
    const common3D = createCommonConnectDebug3D(config.scene);
    const common2D = createCommonConnectDebug2D({ container: config.container });
    const strategy3D = createVisibleHiddenDebug3D(config.scene);
    const strategy2D = createVisibleHiddenDebug2D(common2D);
    const strategyDebugOptions = {
      showVisibleCandidates: false,
      showHiddenCandidates: false,
      showHiddenActivationZone: false,
      showScreenPolygons: false,
      showCandidateScores: false
    };
    const selectionConfig = Object.assign({}, config.defaultSelectionConfig || {});
    const panelsByContainer = new Map();

    function syncPanels() {
      for (const panel of panelsByContainer.values()) {
        if (typeof panel.render === 'function') {
          panel.render();
        }
      }
    }

    function ensurePanel(container) {
      if (!container) {
        return null;
      }

      let panel = panelsByContainer.get(container);
      if (!panel) {
        panel = createVisibleHiddenDebugPanel({
          strategyDebugOptions,
          selectionConfig,
          onChange: syncPanels
        });
        panelsByContainer.set(container, panel);
      }
      return panel;
    }

    return {
      strategyId: 'visible-hidden',
      update: function(diagnostics, commonDebugOptions) {
        const resolvedDebugOptions = Object.assign({}, commonDebugOptions || {}, strategyDebugOptions, {
          activeTargetColor: resolveActiveTargetColor(diagnostics)
        });
        common3D.update(diagnostics, resolvedDebugOptions);
        strategy3D.update(diagnostics, resolvedDebugOptions);
        common2D.clear();
        common2D.renderCommon(diagnostics, resolvedDebugOptions);
        strategy2D.update(diagnostics, resolvedDebugOptions);
      },
      clear: function() {
        common3D.clear();
        strategy3D.clear();
        common2D.clear();
      },
      getSelectionConfig: function() {
        return Object.assign({}, selectionConfig);
      },
      mountControls: function(container) {
        const panel = ensurePanel(container);
        if (panel) {
          panel.mount(container);
        }
      },
      unmountControls: function(container) {
        if (container) {
          const panel = panelsByContainer.get(container);
          if (panel) {
            panel.unmount();
            panelsByContainer.delete(container);
          }
          return;
        }

        for (const panel of panelsByContainer.values()) {
          panel.unmount();
        }
        panelsByContainer.clear();
      },
      destroy: function() {
        common3D.destroy();
        strategy3D.destroy();
        for (const panel of panelsByContainer.values()) {
          panel.destroy();
        }
        panelsByContainer.clear();
        common2D.destroy();
      }
    };
  }

  tool.connect.createVisibleHiddenDebugAdapter = createVisibleHiddenDebugAdapter;
})();