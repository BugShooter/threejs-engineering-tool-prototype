(function() {
  const tool = window.EngineeringTool;

  function createConnectDebugController() {
    const adapters = new Map();
    let activeStrategyId = null;
    const controlsContainers = [];

    function registerAdapter(adapter) {
      if (!adapter || !adapter.strategyId || typeof adapter.update !== 'function' || typeof adapter.clear !== 'function') {
        throw new Error('Connect debug adapter must define strategyId, update(diagnostics, options), and clear().');
      }

      adapters.set(adapter.strategyId, adapter);
      if (!activeStrategyId) {
        activeStrategyId = adapter.strategyId;
      }
      return adapter;
    }

    function getActiveAdapter() {
      return adapters.get(activeStrategyId) || null;
    }

    function remountControls() {
      const adapter = getActiveAdapter();
      if (!controlsContainers.length) {
        return;
      }
      for (const container of controlsContainers) {
        container.innerHTML = '';
        if (adapter && typeof adapter.mountControls === 'function') {
          adapter.mountControls(container);
        }
      }
    }

    function setActiveStrategy(strategyId) {
      const currentAdapter = getActiveAdapter();
      if (currentAdapter && typeof currentAdapter.unmountControls === 'function') {
        currentAdapter.unmountControls();
      }
      activeStrategyId = strategyId;
      remountControls();
      return getActiveAdapter();
    }

    function attachControlsContainer(container) {
      if (!container || controlsContainers.indexOf(container) >= 0) {
        return;
      }
      controlsContainers.push(container);
      remountControls();
    }

    function detachControlsContainer(container) {
      if (!container) {
        return;
      }

      const containerIndex = controlsContainers.indexOf(container);
      if (containerIndex < 0) {
        return;
      }

      const adapter = getActiveAdapter();
      if (adapter && typeof adapter.unmountControls === 'function') {
        adapter.unmountControls(container);
      }
      container.innerHTML = '';
      controlsContainers.splice(containerIndex, 1);
    }

    function getSelectionConfig() {
      const adapter = getActiveAdapter();
      return adapter && typeof adapter.getSelectionConfig === 'function'
        ? adapter.getSelectionConfig()
        : {};
    }

    function update(diagnostics, options) {
      const adapter = getActiveAdapter();
      if (!adapter) {
        return;
      }
      adapter.update(diagnostics, options || {});
    }

    function clear() {
      const adapter = getActiveAdapter();
      if (!adapter) {
        return;
      }
      adapter.clear();
    }

    function destroy() {
      const adapter = getActiveAdapter();
      if (adapter && typeof adapter.unmountControls === 'function') {
        adapter.unmountControls();
      }
      controlsContainers.length = 0;
      for (const adapter of adapters.values()) {
        if (typeof adapter.destroy === 'function') {
          adapter.destroy();
        }
      }
      adapters.clear();
      activeStrategyId = null;
    }

    return {
      registerAdapter,
      attachControlsContainer,
      detachControlsContainer,
      setActiveStrategy,
      getSelectionConfig,
      update,
      clear,
      destroy
    };
  }

  tool.connect.createConnectDebugController = createConnectDebugController;
})();