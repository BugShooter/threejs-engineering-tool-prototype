(function() {
  const tool = window.EngineeringTool;
  const disposeObject3D = tool.scene.disposeObject3D;
  const getPartPositionVector = tool.domain.getPartPositionVector;
  const getPartQuaternion = tool.domain.getPartQuaternion;

  function quatAlignY(direction) {
    const q = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const dir = direction.clone().normalize();
    const dot = yAxis.dot(dir);
    if (dot > 0.9999) {
      q.identity();
    } else if (dot < -0.9999) {
      const perpendicular = Math.abs(dir.x) < 0.9
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 0, 1);
      q.setFromAxisAngle(perpendicular, Math.PI);
    } else {
      q.setFromUnitVectors(yAxis, dir);
    }
    return q;
  }

  function mixColor(baseHex, targetHex, amount) {
    const color = new THREE.Color(baseHex);
    color.lerp(new THREE.Color(targetHex), amount);
    return color.getHex();
  }

  function createLabelSprite(text, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(10,12,16,0.78)';
    ctx.beginPath();
    ctx.roundRect(12, 12, 72, 72, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '700 36px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    return sprite;
  }

  function createGizmoManager(scene, catalog) {
    const group = new THREE.Group();
    group.userData.isGizmo = true;
    group.visible = false;
    scene.add(group);

    let handles = [];
    let hoverHandleId = null;
    let activeHandleId = null;

    function clear() {
      while (group.children.length) {
        const child = group.children[0];
        group.remove(child);
        disposeObject3D(child);
      }
      handles = [];
      group.visible = false;
    }

    function createBasicMaterial(color, opacity) {
      return new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        transparent: opacity < 1,
        opacity: opacity == null ? 1 : opacity
      });
    }

    function createCylinder(radius, height, color, opacity) {
      return new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 10),
        createBasicMaterial(color, opacity == null ? 1 : opacity)
      );
    }

    function createCone(radius, height, color, opacity) {
      return new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 10),
        createBasicMaterial(color, opacity == null ? 1 : opacity)
      );
    }

    function createRotationSector(radius, angle, color, opacity) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, radius, 0, angle, false);
      shape.lineTo(0, 0);

      const geometry = new THREE.ShapeGeometry(shape, Math.max(24, Math.round(48 * angle / (Math.PI * 2))));
      const material = createBasicMaterial(color, opacity == null ? 0.24 : opacity);
      material.side = THREE.DoubleSide;
      return new THREE.Mesh(geometry, material);
    }

    function getDisplayedRotationAngle(angle) {
      const fullTurn = Math.PI * 2;
      const magnitude = Math.abs(angle || 0) % fullTurn;
      if (magnitude < 1e-4 || fullTurn - magnitude < 1e-4) {
        return 0;
      }
      return angle < 0 ? -magnitude : magnitude;
    }

    function getGizmoSize(camera, worldPosition) {
      return Math.max(36, camera.position.distanceTo(worldPosition) * 0.15);
    }

    function getRingQuaternion(normal) {
      const zAxis = new THREE.Vector3(0, 0, 1);
      const quaternion = new THREE.Quaternion();
      const dot = zAxis.dot(normal);
      if (dot > 0.9999) {
        quaternion.identity();
      } else if (dot < -0.9999) {
        quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
      } else {
        quaternion.setFromUnitVectors(zAxis, normal);
      }
      return quaternion;
    }

    function decorateVisual(object) {
      object.userData.baseScale = object.scale.clone();
      if (object.material) {
        object.userData.baseOpacity = object.material.opacity;
        object.userData.baseColor = object.material.color ? object.material.color.getHex() : null;
      }
    }

    function registerHandle(id, hitMesh, scaleVisuals, styleVisuals) {
      hitMesh.userData.handleId = id;
      const scaleTargets = scaleVisuals.slice();
      const styleTargets = (styleVisuals || scaleVisuals).slice();
      handles.push({ id, mesh: hitMesh, scaleTargets, styleTargets });

      const decorated = new Set();
      for (const visual of scaleTargets.concat(styleTargets)) {
        if (decorated.has(visual)) {
          continue;
        }
        decorated.add(visual);
        decorateVisual(visual);
      }
      decorateVisual(hitMesh);
    }

    function applyVisualTint(visual, isActive, isHover) {
      if (!visual.material || visual.userData.baseColor == null) {
        return;
      }

      const activeColor = visual.userData.activeColor != null ? visual.userData.activeColor : 0x22ff88;
      const hoverColor = visual.userData.hoverColor != null ? visual.userData.hoverColor : 0xffffff;
      const activeMix = visual.userData.activeMix != null ? visual.userData.activeMix : 0.9;
      const hoverMix = visual.userData.hoverMix != null ? visual.userData.hoverMix : 0.55;
      const highlightColor = isActive
        ? activeColor
        : (isHover ? hoverColor : visual.userData.baseColor);
      const mixAmount = isActive ? activeMix : (isHover ? hoverMix : 0);
      visual.material.color.setHex(mixAmount ? mixColor(visual.userData.baseColor, highlightColor, mixAmount) : visual.userData.baseColor);
      visual.material.opacity = isActive
        ? Math.max(visual.userData.baseOpacity || 1, 1)
        : (isHover ? Math.max(visual.userData.baseOpacity || 1, 0.95) : visual.userData.baseOpacity || 1);
    }

    function applyHandleVisuals() {
      for (const handle of handles) {
        const isActive = handle.id === activeHandleId;
        const isHover = handle.id === hoverHandleId && !isActive;
        const scaleFactor = isActive ? 1.18 : (isHover ? 1.1 : 1);

        for (const visual of handle.scaleTargets) {
          const baseScale = visual.userData.baseScale || new THREE.Vector3(1, 1, 1);
          visual.scale.copy(baseScale.clone().multiplyScalar(scaleFactor));
        }

        for (const visual of handle.styleTargets) {
          applyVisualTint(visual, isActive, isHover);
        }
      }
    }

    function build(part, camera, options) {
      clear();
      if (!part) {
        return;
      }

      const config = Object.assign({ mode: 'move', canResize: false, resizeHandles: null }, options || {});

      group.visible = true;
      const position = getPartPositionVector(part);
      const quaternion = getPartQuaternion(part);
      const displayQuaternion = config.displayQuaternion || quaternion;
      const typeDef = catalog.getType(part.typeId);
      const size = getGizmoSize(camera, position);

      group.position.copy(position);
      group.quaternion.copy(displayQuaternion);

      const axes = [
        { axis: 'x', dir: new THREE.Vector3(1, 0, 0), color: 0xff4f57, label: 'X' },
        { axis: 'y', dir: new THREE.Vector3(0, 1, 0), color: 0x4df58a, label: 'Y' },
        { axis: 'z', dir: new THREE.Vector3(0, 0, 1), color: 0x5ca8ff, label: 'Z' }
      ];

      if (config.mode === 'move') {
        for (const axisDef of axes) {
          const handleId = `translate:${axisDef.axis}`;
          const shaftLength = size * 0.54;
          const shaftRadius = size * 0.017;
          const coneHeight = size * 0.18;
          const coneRadius = size * 0.058;
          const q = quatAlignY(axisDef.dir);

          const shaft = createCylinder(shaftRadius, shaftLength, axisDef.color, 0.98);
          shaft.renderOrder = 100;
          shaft.quaternion.copy(q);
          shaft.position.copy(axisDef.dir).multiplyScalar(shaftLength / 2);
          group.add(shaft);

          const cone = createCone(coneRadius, coneHeight, axisDef.color, 1);
          cone.renderOrder = 101;
          cone.quaternion.copy(q);
          cone.position.copy(axisDef.dir).multiplyScalar(shaftLength + coneHeight / 2);
          group.add(cone);

          const label = createLabelSprite(axisDef.label, '#ffffff');
          label.renderOrder = 102;
          label.scale.setScalar(size * 0.12);
          label.position.copy(axisDef.dir).multiplyScalar(shaftLength + coneHeight + size * 0.16);
          group.add(label);

          const hitLength = shaftLength + coneHeight;
          const hit = createCylinder(size * 0.095, hitLength + size * 0.08, 0xffffff, 0);
          hit.renderOrder = 99;
          hit.quaternion.copy(q);
          hit.position.copy(axisDef.dir).multiplyScalar((hitLength + size * 0.08) / 2);
          hit.userData = { gizmoRole: 'translate', gizmoAxis: axisDef.axis };
          group.add(hit);

          registerHandle(handleId, hit, [shaft, cone, label]);
        }
      }

      if (config.mode === 'rotate') {
        const ringRadius = size * 0.72;
        const ringTube = size * 0.022;
        const rotationState = config.rotateState || null;
        for (const axisDef of axes) {
          const handleId = `rotate:${axisDef.axis}`;
          const ringQuaternion = getRingQuaternion(axisDef.dir);
          const visualRoot = new THREE.Group();
          let sector = null;
          const rotateActiveColor = mixColor(axisDef.color, 0xffffff, 0.36);

          visualRoot.quaternion.copy(ringQuaternion);
          group.add(visualRoot);

          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(ringRadius, ringTube, 10, 72),
            createBasicMaterial(axisDef.color, 0.95)
          );
          ring.renderOrder = 98;
          ring.userData.activeColor = rotateActiveColor;
          ring.userData.activeMix = 0.42;
          visualRoot.add(ring);

          const displayedDeltaAngle = rotationState && rotationState.axis === axisDef.axis
            ? getDisplayedRotationAngle(rotationState.deltaAngle)
            : 0;

          if (Math.abs(displayedDeltaAngle) > 1e-4) {
            const sectorLength = Math.min(Math.abs(displayedDeltaAngle), Math.PI * 2 - 0.001);
            sector = createRotationSector(ringRadius - ringTube * 1.2, sectorLength, axisDef.color, 0.18);
            sector.renderOrder = 97;
            sector.position.z = -ringTube * 0.35;
            sector.rotation.z = displayedDeltaAngle < 0 ? displayedDeltaAngle : 0;
            visualRoot.add(sector);
          }

          const labelDir = new THREE.Vector3(0, 1, 0).multiplyScalar(ringRadius + size * 0.14);
          const label = createLabelSprite(axisDef.label, '#ffffff');
          label.renderOrder = 101;
          label.scale.setScalar(size * 0.11);
          label.position.copy(labelDir);
          visualRoot.add(label);

          const hitRing = new THREE.Mesh(
            new THREE.TorusGeometry(ringRadius, size * 0.1, 8, 48),
            createBasicMaterial(0xffffff, 0)
          );
          hitRing.renderOrder = 97;
          hitRing.quaternion.copy(ringQuaternion);
          hitRing.userData = { gizmoRole: 'rotate', gizmoAxis: axisDef.axis };
          group.add(hitRing);

          const styleVisuals = [ring, label];
          if (sector) {
            styleVisuals.push(sector);
          }

          registerHandle(handleId, hitRing, [visualRoot], styleVisuals);
        }
      }

      if (config.mode === 'length' && typeDef.category === 'profile') {
        const half = part.params.length / 2;
        for (const sign of [1, -1]) {
          const handleConfig = config.resizeHandles && config.resizeHandles[sign];
          if (handleConfig && handleConfig.enabled === false) {
            continue;
          }
          if (!config.canResize && !handleConfig) {
            continue;
          }

          const handleId = `length:${sign}`;
          const dir = new THREE.Vector3(sign, 0, 0);
          const q = quatAlignY(dir);
          const baseX = sign * half;
          const endWorldPosition = new THREE.Vector3(baseX, 0, 0).applyQuaternion(quaternion).add(position);
          const handleSize = getGizmoSize(camera, endWorldPosition);
          const arrowHeight = handleSize * 0.23;
          const arrowRadius = handleSize * 0.026;
          const coneHeight = handleSize * 0.2;
          const coneRadius = handleSize * 0.072;
          const tint = handleConfig && handleConfig.hasAnchor ? 0xfff3a1 : 0xffffff;

          const shaft = createCylinder(arrowRadius, arrowHeight, tint, 0.98);
          shaft.renderOrder = 100;
          shaft.quaternion.copy(q);
          shaft.position.set(baseX + sign * arrowHeight / 2, 0, 0);
          group.add(shaft);

          const cone = createCone(coneRadius, coneHeight, tint, 1);
          cone.renderOrder = 101;
          cone.quaternion.copy(q);
          cone.position.set(baseX + sign * (arrowHeight + coneHeight / 2), 0, 0);
          group.add(cone);

          const label = createLabelSprite(sign > 0 ? 'B' : 'A', sign > 0 ? '#ffd6d6' : '#d9ebff');
          label.renderOrder = 102;
          label.scale.setScalar(handleSize * 0.105);
          label.position.set(baseX + sign * (arrowHeight + coneHeight + handleSize * 0.15), 0, 0);
          group.add(label);

          const hit = createCylinder(handleSize * 0.092, arrowHeight + coneHeight + handleSize * 0.06, 0xffffff, 0);
          hit.renderOrder = 99;
          hit.quaternion.copy(q);
          hit.position.set(baseX + sign * (arrowHeight + coneHeight + handleSize * 0.06) / 2, 0, 0);
          hit.userData = { gizmoRole: 'length', lenSign: sign };
          group.add(hit);

          registerHandle(handleId, hit, [shaft, cone, label]);
        }
      }

      applyHandleVisuals();
    }

    function getHandleMeshes() {
      return handles.map(handle => handle.mesh);
    }

    return {
      build,
      clear,
      getHandleMeshes,
      setHoverHandleId: function(handleId) {
        hoverHandleId = handleId || null;
        applyHandleVisuals();
      },
      setActiveHandleId: function(handleId) {
        activeHandleId = handleId || null;
        applyHandleVisuals();
      },
      clearInteractionState: function() {
        hoverHandleId = null;
        activeHandleId = null;
        applyHandleVisuals();
      },
      isVisible: function() {
        return group.visible;
      }
    };
  }

  tool.editor.createGizmoManager = createGizmoManager;
})();
