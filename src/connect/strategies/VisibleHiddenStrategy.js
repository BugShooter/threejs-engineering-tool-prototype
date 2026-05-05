(function() {
  const tool = window.EngineeringTool;
  const createVisibleHiddenTargetStrategy = tool.connect.createVisibleHiddenTargetStrategy;
  const createVisibleHiddenDebugAdapter = tool.connect.createVisibleHiddenDebugAdapter;

  function createVisibleHiddenStrategyDefinition(options) {
    const config = Object.assign({
      scene: null,
      container: null,
      isDefault: false
    }, options || {});
    const targetStrategy = createVisibleHiddenTargetStrategy();

    targetStrategy.description = 'Screen-space visible matching with hidden plane fallback.';
    targetStrategy.isDefault = !!config.isDefault;

    targetStrategy.getDefaultSelectionConfig = function() {
      return targetStrategy.getDefaultThresholds();
    };

    targetStrategy.createDebugAdapter = function() {
      return createVisibleHiddenDebugAdapter({
        scene: config.scene,
        container: config.container,
        defaultSelectionConfig: targetStrategy.getDefaultSelectionConfig()
      });
    };

    return targetStrategy;
  }

  tool.connect.createVisibleHiddenStrategyDefinition = createVisibleHiddenStrategyDefinition;
})();