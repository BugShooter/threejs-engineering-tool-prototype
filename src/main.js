(function() {
  const tool = window.EngineeringTool;

  function boot() {
    tool.app.instance = tool.app.createApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();