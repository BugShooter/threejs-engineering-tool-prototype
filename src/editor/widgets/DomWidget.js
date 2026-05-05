(function() {
  const tool = window.EngineeringTool;

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function createDomWidget(options) {
    const config = Object.assign({
      initialState: null,
      render: null,
      className: '',
      widgetType: 'dom'
    }, options || {});
    let state = config.initialState;
    let mountTarget = null;
    let cleanup = null;

    function rerender() {
      if (!mountTarget || typeof config.render !== 'function') {
        return;
      }

      if (typeof cleanup === 'function') {
        cleanup();
        cleanup = null;
      }
      clearNode(mountTarget);

      if (config.className) {
        for (const className of config.className.split(/\s+/)) {
          if (className) {
            mountTarget.classList.add(className);
          }
        }
      }

      const nextCleanup = config.render(mountTarget, state);
      if (typeof nextCleanup === 'function') {
        cleanup = nextCleanup;
      }
    }

    return {
      widgetType: config.widgetType,
      mount: function(container) {
        if (!container) {
          return;
        }
        if (mountTarget && mountTarget !== container) {
          if (typeof cleanup === 'function') {
            cleanup();
            cleanup = null;
          }
          clearNode(mountTarget);
        }
        mountTarget = container;
        rerender();
      },
      update: function(nextState) {
        state = nextState;
        rerender();
      },
      getState: function() {
        return state;
      },
      unmount: function() {
        if (typeof cleanup === 'function') {
          cleanup();
          cleanup = null;
        }
        if (mountTarget) {
          clearNode(mountTarget);
        }
        mountTarget = null;
      },
      destroy: function() {
        this.unmount();
      }
    };
  }

  tool.editor.createDomWidget = createDomWidget;
})();