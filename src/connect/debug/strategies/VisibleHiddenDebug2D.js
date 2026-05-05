(function() {
  const tool = window.EngineeringTool;

  function formatScore(value) {
    return typeof value === 'number' && Number.isFinite(value)
      ? value.toFixed(1)
      : '-';
  }

  function getVisibleHiddenStrategyData(diagnostics) {
    if (!diagnostics || !diagnostics.strategyData || diagnostics.strategyData.kind !== 'visible-hidden') {
      return null;
    }
    return diagnostics.strategyData;
  }

  function getVisibleHiddenCandidateData(candidate) {
    return candidate && candidate.strategyData ? candidate.strategyData : null;
  }

  function getOverlayOptions(options) {
    return Object.assign({
      showScreenPolygons: false,
      showCandidateScores: false
    }, options || {});
  }

  function createVisibleHiddenDebug2D(commonOverlay) {
    function update(diagnostics, options) {
      const strategyData = getVisibleHiddenStrategyData(diagnostics);
      if (!commonOverlay || !strategyData) {
        return;
      }

      const overlayOptions = getOverlayOptions(options);
      const thresholds = strategyData.thresholds || null;

      for (const candidate of diagnostics.candidates || []) {
        const candidateStrategyData = getVisibleHiddenCandidateData(candidate);

        if (overlayOptions.showScreenPolygons && candidate.screenMetrics && candidate.screenMetrics.polygon) {
          let color = '#6f7ea8';
          if (candidate.key === diagnostics.selection.winnerKey) {
            color = '#22ff88';
          } else if (candidateStrategyData && candidateStrategyData.visibleEligible) {
            color = '#5ca8ff';
          } else if (candidateStrategyData && candidateStrategyData.hiddenEligible) {
            color = '#ff8f5c';
          }
          commonOverlay.drawPolygon(candidate.screenMetrics.polygon, color);
        }

        if (overlayOptions.showCandidateScores && candidate.screenMetrics && candidate.screenMetrics.center) {
          const center = candidate.screenMetrics.center;
          const labelColor = candidate.key === diagnostics.selection.winnerKey
            ? '#22ff88'
            : (candidateStrategyData && candidateStrategyData.visibleEligible ? '#5ca8ff' : (candidateStrategyData && candidateStrategyData.hiddenEligible ? '#ff8f5c' : '#91a2cb'));
          commonOverlay.createLabel(
            center.x + 10,
            center.y - 10,
            `${candidate.portId} ${candidate.portKind} vm:${formatScore(thresholds && thresholds.visibleScreenMargin)} v:${formatScore(candidateStrategyData && candidateStrategyData.visibleScore)} h:${formatScore(candidateStrategyData && candidateStrategyData.hiddenScore)} hr:${formatScore(candidateStrategyData && candidateStrategyData.hiddenRayThreshold)}`,
            labelColor
          );
        }
      }
    }

    return {
      update
    };
  }

  tool.connect.createVisibleHiddenDebug2D = createVisibleHiddenDebug2D;
})();