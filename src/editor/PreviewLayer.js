(function() {
  const tool = window.EngineeringTool;
  const createPartVisualGroup = tool.scene.createPartVisualGroup;
  const disposeObject3D = tool.scene.disposeObject3D;
  const quaternionFromAxes = tool.math.quaternionFromAxes;

  function clearGroup(group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      disposeObject3D(child);
    }
  }

  function createPreviewLayer(scene) {
    const snapDotGroup = new THREE.Group();
    scene.add(snapDotGroup);
    const jointGroup = new THREE.Group();
    scene.add(jointGroup);
    const portGuideOverlayGroup = new THREE.Group();
    scene.add(portGuideOverlayGroup);

    let snapRing = null;
    let faceHighlight = null;
    let ghostGroup = null;
    let jointPickMeshes = [];
    let portPickPlanes = [];

    function updateSnapDots(ports) {
      clearGroup(snapDotGroup);
      for (const port of ports) {
        if (!port.snapVisible) {
          continue;
        }
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(3, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0x223366 })
        );
        mesh.position.copy(port.position);
        snapDotGroup.add(mesh);
      }
    }

    function updateJoints(jointVisuals, selectedJointId, hoveredJointId) {
      clearGroup(jointGroup);
      jointPickMeshes = [];

      for (const visual of jointVisuals) {
        const isSelected = visual.jointId === selectedJointId;
        const isHovered = !isSelected && visual.jointId === hoveredJointId;
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([visual.start, visual.end]),
          new THREE.LineBasicMaterial({
            color: isSelected ? 0x22ff88 : (isHovered ? 0x9fd8ff : 0x335588),
            transparent: true,
            opacity: isSelected ? 1 : (isHovered ? 1 : 0.8),
            depthTest: false
          })
        );
        line.renderOrder = 94;
        jointGroup.add(line);

        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(isSelected ? 5 : (isHovered ? 4.8 : 4), 10, 10),
          new THREE.MeshBasicMaterial({ color: isSelected ? 0x22ff88 : (isHovered ? 0xbfe8ff : 0x5577aa), depthTest: false })
        );
        marker.position.copy(visual.center);
        marker.renderOrder = 96;
        jointGroup.add(marker);

        const pickMesh = new THREE.Mesh(
          new THREE.SphereGeometry(10, 8, 8),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false })
        );
        pickMesh.position.copy(visual.center);
        pickMesh.userData.jointId = visual.jointId;
        jointGroup.add(pickMesh);
        jointPickMeshes.push(pickMesh);
      }
    }

    function getJointPickMeshes() {
      return jointPickMeshes;
    }

    function clearPortCandidates() {
      clearGroup(portGuideOverlayGroup);
      portPickPlanes = [];
    }

    function updatePortCandidates(candidates, activeCandidateKey) {
      clearPortCandidates();

      for (const candidate of candidates || []) {
        const port = candidate.port;
        const isActive = candidate.key === activeCandidateKey;
        const isSource = candidate.role === 'source';
        const fillColor = isActive
          ? 0x22ff88
          : (isSource ? 0xffc95c : 0x5ca8ff);
        const lineColor = isActive
          ? 0xe8fff1
          : (isSource ? 0xffe3a3 : 0xbdd7ff);
        const guideOverlay = new THREE.Mesh(
          new THREE.PlaneGeometry(Math.max(8, port.contactWidth || 20), Math.max(8, port.contactHeight || 20)),
          new THREE.MeshBasicMaterial({
            color: fillColor,
            transparent: true,
            opacity: isActive ? 0.38 : 0.18,
            side: THREE.DoubleSide,
            depthTest: false
          })
        );
        guideOverlay.renderOrder = 93;
        guideOverlay.position.copy(port.position).addScaledVector(port.normal, 0.75);
        guideOverlay.quaternion.copy(quaternionFromAxes(port.axisU, port.axisV, port.normal));
        portGuideOverlayGroup.add(guideOverlay);

        const guideOutline = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(Math.max(8, port.contactWidth || 20), Math.max(8, port.contactHeight || 20))),
          new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: isActive ? 1 : 0.85, depthTest: false })
        );
        guideOutline.renderOrder = 94;
        guideOutline.position.copy(guideOverlay.position);
        guideOutline.quaternion.copy(guideOverlay.quaternion);
        portGuideOverlayGroup.add(guideOutline);

        const pickPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(Math.max(10, port.contactWidth || 20), Math.max(10, port.contactHeight || 20)),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false })
        );
        pickPlane.position.copy(port.position).addScaledVector(port.normal, 1.5);
        pickPlane.quaternion.copy(guideOverlay.quaternion);
        pickPlane.userData = {
          candidateKey: candidate.key,
          partId: port.partId,
          portId: port.portId,
          role: candidate.role
        };
        portGuideOverlayGroup.add(pickPlane);
        portPickPlanes.push(pickPlane);
      }
    }

    function getPortPickPlanes() {
      return portPickPlanes;
    }

    function ensureSnapRing() {
      if (!snapRing) {
        snapRing = new THREE.Mesh(
          new THREE.TorusGeometry(9, 2, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0x22ff88 })
        );
        scene.add(snapRing);
      }
      return snapRing;
    }

    function showSnapRing(position) {
      const ring = ensureSnapRing();
      ring.position.copy(position);
      ring.visible = true;
    }

    function hideSnapRing() {
      if (snapRing) {
        snapRing.visible = false;
      }
    }

    function ensureFaceHighlight() {
      if (!faceHighlight) {
        faceHighlight = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({
            color: 0x22ff88,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthTest: false
          })
        );
        faceHighlight.renderOrder = 95;
        scene.add(faceHighlight);
      }
      return faceHighlight;
    }

    function showFaceHighlight(port) {
      const highlight = ensureFaceHighlight();
      if (highlight.geometry) {
        highlight.geometry.dispose();
      }
      highlight.geometry = new THREE.PlaneGeometry(port.contactWidth || 20, port.contactHeight || 20);
      highlight.position.copy(port.position);
      highlight.quaternion.copy(quaternionFromAxes(port.axisU, port.axisV, port.normal));
      highlight.visible = true;
    }

    function hideFaceHighlight() {
      if (faceHighlight) {
        faceHighlight.visible = false;
      }
    }

    function removeGhost() {
      if (!ghostGroup) {
        return;
      }
      scene.remove(ghostGroup);
      disposeObject3D(ghostGroup);
      ghostGroup = null;
    }

    function createGhost(items) {
      removeGhost();
      ghostGroup = new THREE.Group();
      for (const item of items) {
        const ghostPart = createPartVisualGroup(item.typeDef, item.part, { ghost: true });
        if (item.position) {
          ghostPart.position.copy(item.position);
        }
        if (item.quaternion) {
          ghostPart.quaternion.copy(item.quaternion);
        }
        ghostGroup.add(ghostPart);
      }
      ghostGroup.renderOrder = 99;
      scene.add(ghostGroup);
    }

    function updateGhost(position, quaternion) {
      if (!ghostGroup) {
        return;
      }

      if (Array.isArray(position)) {
        for (let index = 0; index < ghostGroup.children.length; index += 1) {
          const child = ghostGroup.children[index];
          const pose = position[index];
          if (!pose) {
            continue;
          }
          if (pose.position) {
            child.position.copy(pose.position);
          }
          if (pose.quaternion) {
            child.quaternion.copy(pose.quaternion);
          }
        }
        return;
      }

      ghostGroup.position.copy(position);
      if (quaternion) {
        ghostGroup.quaternion.copy(quaternion);
      }
    }

    function tick() {
      if (snapRing && snapRing.visible) {
        snapRing.rotation.y += 0.05;
      }
    }

    return {
      updateSnapDots,
      updateJoints,
      getJointPickMeshes,
      updatePortCandidates,
      getPortPickPlanes,
      clearPortCandidates,
      showSnapRing,
      hideSnapRing,
      showFaceHighlight,
      hideFaceHighlight,
      createGhost,
      updateGhost,
      removeGhost,
      tick
    };
  }

  tool.editor.createPreviewLayer = createPreviewLayer;
})();