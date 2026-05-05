(function() {
  const tool = window.EngineeringTool;

  function createBodyMaterial(render, options) {
    if (options.ghost) {
      return new THREE.MeshBasicMaterial({
        color: render.ghostColor || 0x22ff88,
        transparent: true,
        opacity: 0.18,
        depthTest: false,
        depthWrite: false
      });
    }

    return new THREE.MeshLambertMaterial({
      color: options.selected
        ? render.selectedColor
        : (options.highlighted ? (render.highlightColor || render.selectedColor || render.baseColor) : render.baseColor),
      emissive: options.selected || options.highlighted
        ? render.emissiveColor || 0
        : 0
    });
  }

  function createEdgeMaterial(render, options) {
    if (options.ghost) {
      return new THREE.LineBasicMaterial({
        color: render.ghostColor || 0x22ff88,
        transparent: true,
        opacity: 0.5,
        depthTest: false
      });
    }

    return new THREE.LineBasicMaterial({
      color: options.selected
        ? render.selectedEdgeColor
        : (options.highlighted ? (render.highlightEdgeColor || render.selectedEdgeColor || render.edgeColor) : render.edgeColor)
    });
  }

  function addSolidWithEdges(group, geometry, bodyMaterial, edgeMaterial, position) {
    const mesh = new THREE.Mesh(geometry, bodyMaterial);
    if (!bodyMaterial.isMeshBasicMaterial) {
      mesh.castShadow = true;
    }
    if (position) {
      mesh.position.copy(position);
    }

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      edgeMaterial
    );
    if (position) {
      edges.position.copy(position);
    }

    group.add(mesh, edges);
  }

  function tagGroup(group, partId) {
    group.userData.partId = partId;
    group.traverse(child => {
      child.userData.partId = partId;
    });
  }

  function createProfileVisual(typeDef, part, options) {
    const group = new THREE.Group();
    const bodyMaterial = createBodyMaterial(typeDef.render, options);
    const edgeMaterial = createEdgeMaterial(typeDef.render, options);
    const geometry = new THREE.BoxGeometry(part.params.length, typeDef.geometry.width, typeDef.geometry.height);
    addSolidWithEdges(group, geometry, bodyMaterial, edgeMaterial);
    return group;
  }

  function createStraightConnectorVisual(typeDef, part, options) {
    const group = new THREE.Group();
    const bodyMaterial = createBodyMaterial(typeDef.render, options);
    const edgeMaterial = createEdgeMaterial(typeDef.render, options);
    const geometry = new THREE.BoxGeometry(
      typeDef.geometry.bodyLength,
      typeDef.geometry.width,
      typeDef.geometry.height
    );
    addSolidWithEdges(group, geometry, bodyMaterial, edgeMaterial);
    return group;
  }

  function createAngleConnectorVisual(typeDef, part, options) {
    const group = new THREE.Group();
    const bodyMaterial = createBodyMaterial(typeDef.render, options);
    const edgeMaterial = createEdgeMaterial(typeDef.render, options);

    const armX = new THREE.BoxGeometry(typeDef.geometry.armLength, typeDef.geometry.thickness, typeDef.geometry.thickness);
    const armZ = new THREE.BoxGeometry(typeDef.geometry.thickness, typeDef.geometry.thickness, typeDef.geometry.armLength);
    addSolidWithEdges(
      group,
      armX,
      bodyMaterial,
      edgeMaterial,
      new THREE.Vector3(typeDef.geometry.bodyOffset, 0, 0)
    );
    addSolidWithEdges(
      group,
      armZ,
      bodyMaterial,
      edgeMaterial,
      new THREE.Vector3(0, 0, typeDef.geometry.bodyOffset)
    );

    return group;
  }

  function createPartVisualGroup(typeDef, part, options) {
    const config = Object.assign({ selected: false, highlighted: false, ghost: false }, options || {});
    let group;

    if (typeDef.geometry.kind === 'profile') {
      group = createProfileVisual(typeDef, part, config);
    } else if (typeDef.geometry.kind === 'straight-connector') {
      group = createStraightConnectorVisual(typeDef, part, config);
    } else if (typeDef.geometry.kind === 'angle-connector') {
      group = createAngleConnectorVisual(typeDef, part, config);
    } else {
      throw new Error(`Unsupported geometry kind: ${typeDef.geometry.kind}`);
    }

    tagGroup(group, part.id);
    return group;
  }

  function disposeMaterial(material) {
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
      return;
    }

    if (material) {
      for (const key of ['map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'metalnessMap', 'normalMap', 'roughnessMap']) {
        const texture = material[key];
        if (texture && typeof texture.dispose === 'function') {
          texture.dispose();
        }
      }
    }

    if (material && typeof material.dispose === 'function') {
      material.dispose();
    }
  }

  function disposeObject3D(object) {
    object.traverse(child => {
      if (child.geometry && typeof child.geometry.dispose === 'function') {
        child.geometry.dispose();
      }
      if (child.material) {
        disposeMaterial(child.material);
      }
    });
  }

  tool.scene.createPartVisualGroup = createPartVisualGroup;
  tool.scene.disposeObject3D = disposeObject3D;
})();