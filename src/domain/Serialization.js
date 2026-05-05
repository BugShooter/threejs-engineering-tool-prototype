(function() {
  const tool = window.EngineeringTool;

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function serializeAssembly(assembly, options) {
    const config = Object.assign({ editor: {} }, options || {});
    return {
      schemaVersion: 1,
      catalogId: assembly.catalog.catalogId,
      parts: cloneValue(assembly.getParts()),
      joints: cloneValue(assembly.getJoints()),
      editor: cloneValue(config.editor)
    };
  }

  tool.domain.serializeAssembly = serializeAssembly;
})();