(function() {
  const tool = window.EngineeringTool;

  function createTargetSelectionStrategyRegistry(options) {
    const config = Object.assign({
      defaultStrategyId: null
    }, options || {});
    const explicitDefaultStrategyId = config.defaultStrategyId || null;
    const strategies = new Map();
    let activeStrategyId = explicitDefaultStrategyId || null;

    function registerStrategy(strategy) {
      if (!strategy || !strategy.id || typeof strategy.evaluate !== 'function') {
        throw new Error('Target selection strategy must define id and evaluate(context).');
      }

      strategies.set(strategy.id, strategy);
      if (explicitDefaultStrategyId) {
        if (strategy.id === explicitDefaultStrategyId) {
          activeStrategyId = strategy.id;
        }
      } else if (!activeStrategyId || strategy.isDefault) {
        activeStrategyId = strategy.id;
      }
      return strategy;
    }

    function getStrategy(strategyId) {
      return strategies.get(strategyId || activeStrategyId) || null;
    }

    function setActiveStrategy(strategyId) {
      if (!strategies.has(strategyId)) {
        throw new Error(`Unknown target selection strategy: ${strategyId}`);
      }
      activeStrategyId = strategyId;
      return getStrategy(strategyId);
    }

    function getActiveStrategy() {
      return getStrategy(activeStrategyId);
    }

    function getActiveStrategyId() {
      return activeStrategyId;
    }

    function listStrategies() {
      return Array.from(strategies.values()).map(function(strategy) {
        return {
          id: strategy.id,
          label: strategy.label || strategy.id,
          description: strategy.description || ''
        };
      });
    }

    function evaluate(context) {
      const strategy = getActiveStrategy();
      if (!strategy) {
        return null;
      }
      return strategy.evaluate(context);
    }

    function createDebugAdapter(strategyId) {
      const strategy = getStrategy(strategyId);
      if (!strategy || typeof strategy.createDebugAdapter !== 'function') {
        return null;
      }
      return strategy.createDebugAdapter();
    }

    function getDefaultSelectionConfig(strategyId) {
      const strategy = getStrategy(strategyId);
      if (!strategy || typeof strategy.getDefaultSelectionConfig !== 'function') {
        return {};
      }
      return Object.assign({}, strategy.getDefaultSelectionConfig());
    }

    return {
      registerStrategy,
      getStrategy,
      setActiveStrategy,
      getActiveStrategy,
      getActiveStrategyId,
      listStrategies,
      evaluate,
      createDebugAdapter,
      getDefaultSelectionConfig
    };
  }

  tool.connect.createTargetSelectionStrategyRegistry = createTargetSelectionStrategyRegistry;
})();