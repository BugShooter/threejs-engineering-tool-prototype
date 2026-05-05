(function() {
  const tool = window.EngineeringTool;

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function tagsMatch(requiredTags, actualTags) {
    return requiredTags.every(tag => actualTags.includes(tag));
  }

  class PartCatalog {
    constructor(data) {
      this.catalogId = data.catalogId;
      this.partTypes = new Map();
      this.connectionRules = (data.connectionRules || []).map(cloneValue);

      for (const partType of data.partTypes || []) {
        this.partTypes.set(partType.typeId, cloneValue(partType));
      }
    }

    getType(typeId) {
      const typeDef = this.partTypes.get(typeId);
      if (!typeDef) {
        throw new Error(`Unknown part type: ${typeId}`);
      }
      return typeDef;
    }

    getRule(ruleId) {
      return this.connectionRules.find(rule => rule.ruleId === ruleId) || null;
    }

    getDefaultParams(typeId) {
      const typeDef = this.getType(typeId);
      const params = {};
      const paramDefs = typeDef.params || {};

      for (const [paramName, paramDef] of Object.entries(paramDefs)) {
        params[paramName] = paramDef.default;
      }

      return params;
    }

    normalizeParams(typeId, inputParams) {
      const typeDef = this.getType(typeId);
      const params = this.getDefaultParams(typeId);
      const paramDefs = typeDef.params || {};

      for (const [paramName, rawValue] of Object.entries(inputParams || {})) {
        const paramDef = paramDefs[paramName];
        if (!paramDef) {
          continue;
        }

        if (paramDef.type === 'number') {
          let value = Number(rawValue);
          if (!Number.isFinite(value)) {
            value = paramDef.default;
          }
          if (typeof paramDef.min === 'number') {
            value = Math.max(paramDef.min, value);
          }
          if (typeof paramDef.max === 'number') {
            value = Math.min(paramDef.max, value);
          }
          if (typeof paramDef.step === 'number' && paramDef.step > 0) {
            value = Math.round(value / paramDef.step) * paramDef.step;
          }
          params[paramName] = value;
          continue;
        }

        params[paramName] = rawValue;
      }

      return params;
    }

    getMatchingRules(sourcePort, targetPort) {
      return this.connectionRules.filter(rule => this.matchesRule(rule, sourcePort, targetPort));
    }

    matchesRule(rule, sourcePort, targetPort) {
      return this.matchesRuleOrder(rule, sourcePort, targetPort) ||
        (rule.bidirectional && this.matchesRuleOrder(rule, targetPort, sourcePort));
    }

    matchesRuleOrder(rule, firstPort, secondPort) {
      const firstTags = firstPort.tags || [];
      const secondTags = secondPort.tags || [];
      return tagsMatch(rule.aTags || [], firstTags) && tagsMatch(rule.bTags || [], secondTags);
    }
  }

  tool.domain.PartCatalog = PartCatalog;
})();