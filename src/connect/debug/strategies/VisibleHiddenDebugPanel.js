(function() {
  const tool = window.EngineeringTool;

  function createCheckbox(config, state, onChange) {
    const label = document.createElement('label');
    label.className = 'debug-check';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!state[config.key];
    input.addEventListener('change', function() {
      state[config.key] = !!input.checked;
      onChange();
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${config.label}`));
    return label;
  }

  function createNumberRow(config, state, onChange) {
    const row = document.createElement('div');
    row.className = 'debug-number-row';

    const label = document.createElement('span');
    label.textContent = config.label;
    row.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(config.min);
    input.max = String(config.max);
    input.step = String(config.step || 1);
    input.value = String(state[config.key]);
    input.addEventListener('change', function() {
      const nextValue = Number(input.value);
      const resolvedValue = Number.isFinite(nextValue)
        ? Math.max(config.min, Math.min(config.max, nextValue))
        : state[config.key];
      state[config.key] = resolvedValue;
      input.value = String(resolvedValue);
      onChange();
    });
    row.appendChild(input);

    return row;
  }

  function createVisibleHiddenDebugPanel(options) {
    const config = Object.assign({
      strategyDebugOptions: null,
      selectionConfig: null,
      onChange: function() {}
    }, options || {});
    const root = document.createElement('div');
    root.className = 'debug-options';
    root.style.width = '100%';
    root.style.minWidth = '0';
    root.style.boxSizing = 'border-box';

    const checkboxConfigs = [
      { key: 'showVisibleCandidates', label: 'Visible candidates' },
      { key: 'showHiddenCandidates', label: 'Hidden candidates' },
      { key: 'showHiddenActivationZone', label: 'Hidden activation zone' },
      { key: 'showScreenPolygons', label: 'Screen polygons' },
      { key: 'showCandidateScores', label: 'Candidate scores' }
    ];
    const numberConfigs = [
      { key: 'visibleScreenMargin', label: 'Visible margin', min: 0, max: 100, step: 1 },
      { key: 'visibleLockDistance', label: 'Visible lock', min: 0, max: 200, step: 1 },
      { key: 'hiddenRayThresholdFixed', label: 'Hidden fixed', min: 0, max: 200, step: 1 },
      { key: 'hiddenRayThresholdTrack', label: 'Hidden track', min: 0, max: 200, step: 1 },
      { key: 'hiddenPartThreshold', label: 'Hidden part dist', min: 0, max: 400, step: 1 }
    ];

    function render() {
      root.innerHTML = '';
      for (const checkboxConfig of checkboxConfigs) {
        root.appendChild(createCheckbox(checkboxConfig, config.strategyDebugOptions, config.onChange));
      }
      for (const numberConfig of numberConfigs) {
        root.appendChild(createNumberRow(numberConfig, config.selectionConfig, config.onChange));
      }
    }

    function mount(container) {
      if (!container) {
        return;
      }
      render();
      container.innerHTML = '';
      container.appendChild(root);
    }

    function unmount() {
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
    }

    return {
      render,
      mount,
      unmount,
      destroy: unmount
    };
  }

  tool.connect.createVisibleHiddenDebugPanel = createVisibleHiddenDebugPanel;
})();