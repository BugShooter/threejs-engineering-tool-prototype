(function() {
  const tool = window.EngineeringTool;
  const disposeObject3D = tool.scene.disposeObject3D;
  const quaternionFromAxes = tool.math.quaternionFromAxes;

  function buildRoundedRectPoints(halfWidth, halfHeight, radius, segmentsPerCorner) {
    const points = [];
    const resolvedRadius = Math.max(0, Math.min(radius, halfWidth, halfHeight));
    if (resolvedRadius <= 1e-6) {
      return [
        new THREE.Vector3(-halfWidth, -halfHeight, 0),
        new THREE.Vector3(halfWidth, -halfHeight, 0),
        new THREE.Vector3(halfWidth, halfHeight, 0),
        new THREE.Vector3(-halfWidth, halfHeight, 0),
        new THREE.Vector3(-halfWidth, -halfHeight, 0)
      ];
    }

    const cornerSpecs = [
      { cx: halfWidth - resolvedRadius, cy: halfHeight - resolvedRadius, start: 0, end: Math.PI * 0.5 },
      { cx: -halfWidth + resolvedRadius, cy: halfHeight - resolvedRadius, start: Math.PI * 0.5, end: Math.PI },
      { cx: -halfWidth + resolvedRadius, cy: -halfHeight + resolvedRadius, start: Math.PI, end: Math.PI * 1.5 },
      { cx: halfWidth - resolvedRadius, cy: -halfHeight + resolvedRadius, start: Math.PI * 1.5, end: Math.PI * 2 }
    ];

    for (let cornerIndex = 0; cornerIndex < cornerSpecs.length; cornerIndex += 1) {
      const corner = cornerSpecs[cornerIndex];
      for (let step = 0; step <= segmentsPerCorner; step += 1) {
        if (cornerIndex > 0 && step === 0) {
          continue;
        }
        const t = step / Math.max(1, segmentsPerCorner);
        const angle = corner.start + (corner.end - corner.start) * t;
        points.push(new THREE.Vector3(
          corner.cx + Math.cos(angle) * resolvedRadius,
          corner.cy + Math.sin(angle) * resolvedRadius,
          0
        ));
      }
    }

    if (points.length) {
      points.push(points[0].clone());
    }
    return points;
  }

  function clearGroup(group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeObject3D(child);
    }
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

  function createVisibleHiddenDebug3D(scene) {
    const connectDebugGroup = new THREE.Group();
    scene.add(connectDebugGroup);

    function getDebugOptions(options) {
      return Object.assign({
        showVisibleCandidates: false,
        showHiddenCandidates: false,
        showHiddenActivationZone: false
      }, options || {});
    }

    function addPortFootprint(port, color, fillOpacity, outlineOpacity, renderOrder) {
      const width = Math.max(8, port.contactWidth || 20);
      const height = Math.max(8, port.contactHeight || 20);
      const footprint = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: fillOpacity,
          side: THREE.DoubleSide,
          depthTest: false
        })
      );
      footprint.position.copy(port.position);
      footprint.quaternion.copy(quaternionFromAxes(port.axisU, port.axisV, port.normal));
      footprint.renderOrder = renderOrder;
      connectDebugGroup.add(footprint);

      const footprintOutline = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height)),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: outlineOpacity, depthTest: false })
      );
      footprintOutline.position.copy(footprint.position);
      footprintOutline.quaternion.copy(footprint.quaternion);
      footprintOutline.renderOrder = renderOrder + 1;
      connectDebugGroup.add(footprintOutline);
    }

    function addHiddenActivationZone(port, threshold, color, renderOrder) {
      const halfWidth = Math.max(8, port.contactWidth || 20) * 0.5;
      const halfHeight = Math.max(8, port.contactHeight || 20) * 0.5;
      const localPoints = buildRoundedRectPoints(halfWidth + threshold, halfHeight + threshold, threshold, 8);
      const worldPoints = localPoints.map(function(point) {
        return port.position.clone()
          .add(port.axisU.clone().multiplyScalar(point.x))
          .add(port.axisV.clone().multiplyScalar(point.y))
          .add(port.normal.clone().multiplyScalar(0.08));
      });

      const outline = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(worldPoints),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false })
      );
      outline.renderOrder = renderOrder;
      connectDebugGroup.add(outline);
    }

    function clear() {
      clearGroup(connectDebugGroup);
    }

    function update(diagnostics, options) {
      clear();

      const strategyData = getVisibleHiddenStrategyData(diagnostics);
      if (!strategyData || !Array.isArray(diagnostics.candidates)) {
        return;
      }

      const debugOptions = getDebugOptions(options);

      if (debugOptions.showVisibleCandidates) {
        for (const candidate of diagnostics.candidates) {
          const candidateStrategyData = getVisibleHiddenCandidateData(candidate);
          if (!candidateStrategyData || !candidateStrategyData.visibleEligible) {
            continue;
          }
          addPortFootprint(candidate.port, 0x5ca8ff, 0.06, 0.45, 84);
        }
      }

      if (debugOptions.showHiddenCandidates) {
        for (const candidate of diagnostics.candidates) {
          const candidateStrategyData = getVisibleHiddenCandidateData(candidate);
          if (!candidateStrategyData || !candidateStrategyData.hiddenEligible) {
            continue;
          }
          addPortFootprint(candidate.port, 0xff8f5c, 0.06, 0.45, 86);
        }
      }

      if (debugOptions.showHiddenActivationZone) {
        for (const candidate of diagnostics.candidates) {
          const candidateStrategyData = getVisibleHiddenCandidateData(candidate);
          if (!candidateStrategyData || (candidateStrategyData.visibility && candidateStrategyData.visibility.visible)) {
            continue;
          }
          addHiddenActivationZone(
            candidate.port,
            candidateStrategyData.hiddenRayThreshold || 0,
            candidate.key === diagnostics.selection.winnerKey ? 0x22ff88 : 0xff8f5c,
            88
          );
        }
      }
    }

    function destroy() {
      clear();
      if (connectDebugGroup.parent) {
        connectDebugGroup.parent.remove(connectDebugGroup);
      }
      disposeObject3D(connectDebugGroup);
    }

    return {
      update,
      clear,
      destroy
    };
  }

  tool.connect.createVisibleHiddenDebug3D = createVisibleHiddenDebug3D;
})();