(function() {
  const tool = window.EngineeringTool;
  const disposeObject3D = tool.scene.disposeObject3D;
  const quaternionFromAxes = tool.math.quaternionFromAxes;

  function clearGroup(group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeObject3D(child);
    }
  }

  function createCommonConnectDebug3D(scene) {
    const connectDebugGroup = new THREE.Group();
    scene.add(connectDebugGroup);

    function getDebugOptions(options) {
      return Object.assign({
        showRay: true,
        showHitPoint: true,
        showPortNormal: true,
        showExactPlane: true,
        showLiftedOverlay: true,
        showContactFootprint: true,
        activeTargetColor: 0x5ca8ff,
        validHitColor: 0x22ff88,
        invalidHitColor: 0xff5577
      }, options || {});
    }

    function addPortFootprint(port, color, fillOpacity, outlineOpacity, renderOrder) {
      const width = Math.max(8, port.contactWidth || 20);
      const height = Math.max(8, port.contactHeight || 20);
      const planeGeometry = new THREE.PlaneGeometry(width, height);
      const footprint = new THREE.Mesh(
        planeGeometry,
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

    function clear() {
      clearGroup(connectDebugGroup);
    }

    function update(diagnostics, options) {
      clear();
      if (!diagnostics || !diagnostics.pointer || !diagnostics.pointer.rayOrigin || !diagnostics.pointer.rayDirection) {
        return;
      }

      const debugOptions = getDebugOptions(options);
      const pointer = diagnostics.pointer;
      const activeTarget = diagnostics.activeTarget || null;
      const activeTargetColor = debugOptions.activeTargetColor;

      const rayEnd = activeTarget && activeTarget.hitPoint
        ? activeTarget.hitPoint.clone()
        : pointer.rayOrigin.clone().add(pointer.rayDirection.clone().multiplyScalar(pointer.rayLength || 1400));

      if (debugOptions.showRay) {
        const rayLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([pointer.rayOrigin.clone(), rayEnd]),
          new THREE.LineBasicMaterial({ color: 0xffd95c, transparent: true, opacity: 0.95, depthTest: false })
        );
        rayLine.renderOrder = 92;
        connectDebugGroup.add(rayLine);

        if (!activeTarget || !activeTarget.hitPoint) {
          const rayMarker = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffd95c, depthTest: false })
          );
          rayMarker.position.copy(rayEnd);
          rayMarker.renderOrder = 93;
          connectDebugGroup.add(rayMarker);
        }
      }

      if (!activeTarget || !activeTarget.port) {
        return;
      }

      const port = activeTarget.port;

      if (debugOptions.showExactPlane) {
        const exactPlaneWidth = Math.max(120, (port.contactWidth || 20) * 1.75);
        const exactPlaneHeight = Math.max(120, (port.contactHeight || 20) * 1.75);
        const exactPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(exactPlaneWidth, exactPlaneHeight),
          new THREE.MeshBasicMaterial({
            color: activeTargetColor,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
            depthTest: false
          })
        );
        exactPlane.position.copy(port.position);
        exactPlane.quaternion.copy(quaternionFromAxes(port.axisU, port.axisV, port.normal));
        exactPlane.renderOrder = 90;
        connectDebugGroup.add(exactPlane);

        const exactPlaneOutline = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(exactPlaneWidth, exactPlaneHeight)),
          new THREE.LineBasicMaterial({ color: activeTargetColor, transparent: true, opacity: 0.35, depthTest: false })
        );
        exactPlaneOutline.position.copy(exactPlane.position);
        exactPlaneOutline.quaternion.copy(exactPlane.quaternion);
        exactPlaneOutline.renderOrder = 91;
        connectDebugGroup.add(exactPlaneOutline);
      }

      if (debugOptions.showLiftedOverlay) {
        const liftedDebugOverlayWidth = Math.max(120, (port.contactWidth || 20) * 1.75);
        const liftedDebugOverlayHeight = Math.max(120, (port.contactHeight || 20) * 1.75);
        const liftedDebugOverlayCenter = (activeTarget.hitPoint || port.position).clone();
        const liftedDebugOverlay = new THREE.Mesh(
          new THREE.PlaneGeometry(liftedDebugOverlayWidth, liftedDebugOverlayHeight),
          new THREE.MeshBasicMaterial({
            color: activeTargetColor,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            depthTest: false
          })
        );
        liftedDebugOverlay.position.copy(liftedDebugOverlayCenter).addScaledVector(port.normal, 0.25);
        liftedDebugOverlay.quaternion.copy(quaternionFromAxes(port.axisU, port.axisV, port.normal));
        liftedDebugOverlay.renderOrder = 92;
        connectDebugGroup.add(liftedDebugOverlay);

        const liftedDebugOutline = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(liftedDebugOverlayWidth, liftedDebugOverlayHeight)),
          new THREE.LineBasicMaterial({ color: activeTargetColor, transparent: true, opacity: 0.45, depthTest: false })
        );
        liftedDebugOutline.position.copy(liftedDebugOverlay.position);
        liftedDebugOutline.quaternion.copy(liftedDebugOverlay.quaternion);
        liftedDebugOutline.renderOrder = 93;
        connectDebugGroup.add(liftedDebugOutline);
      }

      if (debugOptions.showContactFootprint) {
        addPortFootprint(port, activeTargetColor, 0.18, 0.95, 94);
      }

      if (debugOptions.showHitPoint && activeTarget.hitPoint) {
        const hitMarker = new THREE.Mesh(
          new THREE.SphereGeometry(4.5, 10, 10),
          new THREE.MeshBasicMaterial({ color: activeTarget.fitOk === false ? debugOptions.invalidHitColor : debugOptions.validHitColor, depthTest: false })
        );
        hitMarker.position.copy(activeTarget.hitPoint);
        hitMarker.renderOrder = 96;
        connectDebugGroup.add(hitMarker);

        const portToHit = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([port.position.clone(), activeTarget.hitPoint.clone()]),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthTest: false })
        );
        portToHit.renderOrder = 96;
        connectDebugGroup.add(portToHit);
      }

      if (debugOptions.showPortNormal) {
        const normalLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            port.position.clone(),
            port.position.clone().add(port.normal.clone().multiplyScalar(26))
          ]),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82, depthTest: false })
        );
        normalLine.renderOrder = 96;
        connectDebugGroup.add(normalLine);
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

  tool.connect.createCommonConnectDebug3D = createCommonConnectDebug3D;
})();