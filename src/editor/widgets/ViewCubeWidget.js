(function() {
  const tool = window.EngineeringTool;
  const createViewCube = tool.editor.createViewCube;

  function createViewCubeWidget(options) {
    const config = Object.assign({
      onDirectionSelected: null,
      size: 112
    }, options || {});
    let mountTarget = null;
    let viewCube = null;

    function ensureMounted() {
      if (!mountTarget || viewCube) {
        return;
      }

      mountTarget.classList.add('canvas-layout-view-widget');
      viewCube = createViewCube({
        container: mountTarget,
        onDirectionSelected: config.onDirectionSelected,
        size: config.size,
        embedded: true
      });
    }

    return {
      widgetType: '3d-view',
      mount: function(container) {
        if (mountTarget === container) {
          ensureMounted();
          return;
        }
        this.unmount();
        mountTarget = container;
        ensureMounted();
      },
      update: function(camera) {
        if (viewCube) {
          viewCube.update(camera);
        }
      },
      unmount: function() {
        if (viewCube) {
          viewCube.destroy();
          viewCube = null;
        }
        mountTarget = null;
      },
      destroy: function() {
        this.unmount();
      }
    };
  }

  tool.editor.createViewCubeWidget = createViewCubeWidget;
})();