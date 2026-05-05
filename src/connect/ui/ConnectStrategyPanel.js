(function() {
  const tool = window.EngineeringTool;

  function createConnectStrategyPanel(options) {
    const config = Object.assign({
      selectElement: null,
      registry: null,
      onStrategyChanged: null
    }, options || {});

    function sync() {
      if (!config.selectElement || !config.registry) {
        return;
      }

      config.selectElement.innerHTML = '';
      for (const strategy of config.registry.listStrategies()) {
        const option = document.createElement('option');
        option.value = strategy.id;
        option.textContent = strategy.label;
        config.selectElement.appendChild(option);
      }
      config.selectElement.value = config.registry.getActiveStrategyId();
    }

    function handleChange() {
      if (!config.selectElement || !config.registry) {
        return;
      }

      const activeStrategy = config.registry.setActiveStrategy(config.selectElement.value);
      if (typeof config.onStrategyChanged === 'function') {
        config.onStrategyChanged(activeStrategy);
      }
    }

    function bind() {
      if (!config.selectElement || !config.registry) {
        return;
      }

      sync();
      config.selectElement.addEventListener('change', handleChange);
    }

    function destroy() {
      if (config.selectElement) {
        config.selectElement.removeEventListener('change', handleChange);
      }
    }

    return {
      bind,
      sync,
      destroy
    };
  }

  tool.connect.createConnectStrategyPanel = createConnectStrategyPanel;
})();