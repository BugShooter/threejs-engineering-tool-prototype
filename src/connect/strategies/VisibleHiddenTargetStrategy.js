(function() {
  const tool = window.EngineeringTool;

  function cloneScreenPoint(point) {
    if (!point) {
      return null;
    }

    return {
      x: point.x,
      y: point.y,
      visible: point.visible
    };
  }

  function cloneScreenRect(rect) {
    if (!rect) {
      return null;
    }

    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };
  }

  function cloneScreenPolygon(polygon) {
    if (!polygon) {
      return null;
    }

    return polygon.map(function(point) {
      return { x: point.x, y: point.y };
    });
  }

  function clonePlaneMetrics(planeMetrics) {
    if (!planeMetrics) {
      return null;
    }

    return {
      hit: planeMetrics.hit ? planeMetrics.hit.clone() : null,
      inside: planeMetrics.inside,
      distance: planeMetrics.distance
    };
  }

  function cloneScreenMetrics(metrics) {
    if (!metrics) {
      return null;
    }

    return {
      polygon: cloneScreenPolygon(metrics.polygon),
      center: cloneScreenPoint(metrics.center),
      inside: metrics.inside,
      distance: metrics.distance,
      facing: metrics.facing
    };
  }

  function cloneVisibilityMetrics(visibility) {
    if (!visibility) {
      return null;
    }

    return {
      visible: visibility.visible,
      occluded: visibility.occluded
    };
  }

  function buildDiagnostics(context, evaluation) {
    const activeTarget = evaluation.activeTarget || null;
    const hitPoint = evaluation.activeTargetHitPoint ? evaluation.activeTargetHitPoint.clone() : null;
    const rayOrigin = context.pointerRay.origin.clone();

    return {
      strategyId: 'visible-hidden',
      mode: 'connectTarget',
      source: {
        key: context.activeSourceKey || null,
        port: context.sourcePort || null
      },
      pointer: {
        mousePoint: context.mousePoint ? { x: context.mousePoint.x, y: context.mousePoint.y } : null,
        rayOrigin,
        rayDirection: context.pointerRay.direction.clone(),
        rayLength: hitPoint ? hitPoint.distanceTo(rayOrigin) : 1400
      },
      hoveredParts: (context.hoveredPartInfos || []).map(function(info) {
        return {
          partId: info.part.id,
          precise: info.precise,
          partDistance: info.partDistance,
          screenRect: cloneScreenRect(info.screenRect)
        };
      }),
      candidates: (evaluation.candidateEvaluations || []).map(function(candidateEvaluation) {
        return {
          key: candidateEvaluation.candidate.key,
          port: candidateEvaluation.candidate.port,
          partId: candidateEvaluation.candidate.port.partId,
          portId: candidateEvaluation.candidate.port.portId,
          portKind: candidateEvaluation.candidate.port.kind,
          precisePart: candidateEvaluation.candidate.precisePart,
          partDistance: candidateEvaluation.candidate.partDistance,
          screenMetrics: cloneScreenMetrics(candidateEvaluation.metrics),
          strategyData: {
            planeMetrics: clonePlaneMetrics(candidateEvaluation.planeMetrics),
            hiddenRayThreshold: candidateEvaluation.hiddenRayThreshold,
            visibility: cloneVisibilityMetrics(candidateEvaluation.visibility),
            visibleEligible: candidateEvaluation.visibleEligible,
            visibleScore: candidateEvaluation.visibleScore,
            hiddenEligible: candidateEvaluation.hiddenEligible,
            hiddenScore: candidateEvaluation.hiddenScore
          }
        };
      }),
      selection: {
        winnerKey: activeTarget ? activeTarget.key : null
      },
      activeTarget: activeTarget ? {
        key: activeTarget.key,
        port: activeTarget.port,
        hitPoint,
        fitOk: evaluation.targetedSnap ? evaluation.targetedSnap.fitOk : null
      } : null,
      strategyData: {
        kind: 'visible-hidden',
        thresholds: Object.assign({}, context.thresholds),
        selection: {
          visibleLocked: evaluation.visibleLocked,
          nearestVisibleDistance: evaluation.nearestVisibleDistance,
          bestVisibleKey: evaluation.bestVisibleMatch ? evaluation.bestVisibleMatch.candidate.key : null,
          bestHiddenKey: evaluation.bestHiddenMatch ? evaluation.bestHiddenMatch.candidate.key : null,
          winnerMode: evaluation.winnerMode || null
        },
        variants: {
          count: evaluation.targetedSnapVariants ? evaluation.targetedSnapVariants.length : 0,
          activeIndex: 0
        },
        activeTarget: activeTarget ? {
          visible: evaluation.bestMatch && evaluation.bestMatch.visibility ? evaluation.bestMatch.visibility.visible : null
        } : null
      }
    };
  }

  function createVisibleHiddenTargetStrategy() {
    return {
      id: 'visible-hidden',
      labelKey: 'strategies.visibleHidden',
      label: 'Visible / Hidden',
      getDefaultThresholds: function() {
        return {
          visibleScreenMargin: 0,
          visibleLockDistance: 26,
          hiddenRayThresholdFixed: 52,
          hiddenRayThresholdTrack: 16,
          hiddenPartThreshold: 104
        };
      },
      evaluate: function(context) {
        if (!context || !context.sourcePort) {
          return null;
        }

        const candidateEvaluations = [];
        let bestVisibleMatch = null;
        let bestHiddenMatch = null;
        let nearestVisibleDistance = Infinity;

        for (const candidate of context.targetCandidates || []) {
          const metrics = context.getPortScreenMetrics(candidate.port, context.mousePoint);
          const planeMetrics = context.getPortPlaneMetrics(context.pointerRay, candidate.port);
          const visibility = context.getPortVisibilityMetrics(candidate.port, context.occlusionMeshes);
          const hasVisiblePolygon = !!metrics.polygon;
          const hiddenRayThreshold = candidate.port.kind === 'track'
            ? context.thresholds.hiddenRayThresholdTrack
            : context.thresholds.hiddenRayThresholdFixed;
          const visibleEligible = visibility.visible && hasVisiblePolygon && (metrics.inside || metrics.distance <= context.thresholds.visibleScreenMargin);
          const hiddenEligible = !!(!visibility.visible && planeMetrics && candidate.partDistance <= context.thresholds.hiddenPartThreshold && (planeMetrics.inside || planeMetrics.distance <= hiddenRayThreshold));
          const visibleScore = visibleEligible
            ? ((metrics.inside ? 0 : 200) + metrics.distance + candidate.partDistance * 3 + (metrics.facing ? 0 : 70))
            : null;
          const hiddenScore = hiddenEligible
            ? ((planeMetrics.inside ? 0 : 240) + planeMetrics.distance * 2.5 + metrics.distance * 0.5 + candidate.partDistance * 5 + (visibility.occluded ? 0 : 160) + (metrics.facing ? 25 : 0))
            : null;

          candidateEvaluations.push({
            candidate,
            metrics,
            planeMetrics,
            visibility,
            hasVisiblePolygon,
            hiddenRayThreshold,
            visibleEligible,
            visibleScore,
            hiddenEligible,
            hiddenScore
          });

          if (visibility.visible) {
            nearestVisibleDistance = Math.min(nearestVisibleDistance, hasVisiblePolygon ? metrics.distance : Infinity);
            if (visibleEligible && (!bestVisibleMatch || visibleScore < bestVisibleMatch.score)) {
              bestVisibleMatch = {
                candidate,
                metrics,
                planeMetrics,
                visibility,
                score: visibleScore
              };
            }
          }

          if (hiddenEligible && (!bestHiddenMatch || hiddenScore < bestHiddenMatch.score)) {
            bestHiddenMatch = {
              candidate,
              metrics,
              planeMetrics,
              visibility,
              score: hiddenScore
            };
          }
        }

        const visibleLocked = nearestVisibleDistance <= context.thresholds.visibleLockDistance;
        const bestMatch = visibleLocked
          ? (bestVisibleMatch || bestHiddenMatch)
          : (bestHiddenMatch || bestVisibleMatch);
        const winnerMode = bestMatch
          ? (bestMatch === bestVisibleMatch ? 'visible' : 'hidden')
          : null;
        const activeTarget = bestMatch ? bestMatch.candidate : null;
        const activeTargetKey = activeTarget ? activeTarget.key : null;
        const activeTargetHitPoint = activeTarget
          ? context.resolveActiveTargetHitPoint(activeTarget, bestMatch)
          : null;

        const targetedSnapVariants = activeTarget
          ? context.snapSolver.findTargetedComponentSnapVariants(
              context.snapshot,
              context.sourcePort,
              activeTarget.port,
              context.snapshot.rootStartQuaternion,
              context.snapAlign,
              activeTargetHitPoint
            )
          : [];
        const targetedSnap = targetedSnapVariants[0] || null;

        const evaluation = {
          candidateEvaluations,
          nearestVisibleDistance,
          visibleLocked,
          bestVisibleMatch,
          bestHiddenMatch,
          bestMatch,
          winnerMode,
          activeTarget,
          activeTargetKey,
          activeTargetHitPoint,
          targetedSnapVariants,
          targetedSnap
        };

        return {
          targetCandidates: context.targetCandidates,
          activeTarget,
          activeTargetKey,
          activeTargetHitPoint,
          targetedSnapVariants,
          targetedSnap,
          diagnostics: buildDiagnostics(context, evaluation)
        };
      }
    };
  }

  tool.connect.createVisibleHiddenTargetStrategy = createVisibleHiddenTargetStrategy;
})();