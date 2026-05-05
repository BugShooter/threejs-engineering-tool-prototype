(function() {
  const tool = window.EngineeringTool;
  const createVisibleHiddenStrategyDefinition = tool.connect.createVisibleHiddenStrategyDefinition;

  function createBuiltInTargetSelectionStrategies(options) {
    const config = Object.assign({
      scene: null,
      container: null
    }, options || {});

    return [
      createVisibleHiddenStrategyDefinition({
        scene: config.scene,
        container: config.container,
        isDefault: true
      })
    ];
  }

  tool.connect.createBuiltInTargetSelectionStrategies = createBuiltInTargetSelectionStrategies;
})();