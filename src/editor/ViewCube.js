(function() {
  const tool = window.EngineeringTool;

  function createFaceTexture(label, background, foreground) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    ctx.fillStyle = foreground;
    ctx.font = '700 34px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function createViewCube(options) {
    const config = Object.assign({
      container: null,
      onDirectionSelected: null,
      size: 112,
      embedded: false
    }, options || {});

    const root = document.createElement('div');
    root.className = 'view-cube';
    if (config.embedded) {
      root.classList.add('is-embedded');
      root.style.position = 'relative';
      root.style.top = 'auto';
      root.style.right = 'auto';
      root.style.zIndex = 'auto';
      root.style.width = `${config.size}px`;
      root.style.height = `${config.size}px`;
      root.style.margin = '0 0 0 auto';
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(config.size, config.size, false);
    root.appendChild(renderer.domElement);
    config.container.appendChild(root);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.8, 1.8, 1.8, -1.8, 0.1, 10);
    camera.position.set(0, 0, 4);

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const light = new THREE.DirectionalLight(0xffffff, 0.85);
    light.position.set(2, 3, 4);
    scene.add(light);

    const faceDefs = [
      { label: '+X', dir: new THREE.Vector3(1, 0, 0), color: '#7c2328', text: '#ffdbe0' },
      { label: '-X', dir: new THREE.Vector3(-1, 0, 0), color: '#4d1216', text: '#ffdbe0' },
      { label: '+Y', dir: new THREE.Vector3(0, 1, 0), color: '#1f5f37', text: '#dcffe8' },
      { label: '-Y', dir: new THREE.Vector3(0, -1, 0), color: '#143823', text: '#dcffe8' },
      { label: '+Z', dir: new THREE.Vector3(0, 0, 1), color: '#1d406d', text: '#d9ebff' },
      { label: '-Z', dir: new THREE.Vector3(0, 0, -1), color: '#132743', text: '#d9ebff' }
    ];

    const faceMaterials = faceDefs.map(faceDef => new THREE.MeshBasicMaterial({
      map: createFaceTexture(faceDef.label, faceDef.color, faceDef.text),
      transparent: false
    }));

    const cubeGroup = new THREE.Group();
    const outerSize = 1.36;
    const frameSize = outerSize * 0.20;
    const innerSize = outerSize - frameSize * 2;
    const halfOuter = outerSize / 2;
    const frameCenter = halfOuter - frameSize / 2;

    const cube = new THREE.Mesh(new THREE.BoxGeometry(innerSize, innerSize, innerSize), faceMaterials);
    cubeGroup.add(cube);

    const interactiveObjects = [cube];
    const frameMaterial = new THREE.MeshBasicMaterial({ color: 0xe6efff, transparent: true, opacity: 0.86 });

    function addFrameBox(sizeX, sizeY, sizeZ, position, direction) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
        frameMaterial.clone()
      );
      mesh.position.copy(position);
      mesh.userData.direction = direction.clone().normalize();
      cubeGroup.add(mesh);
      interactiveObjects.push(mesh);
      return mesh;
    }

    for (const signY of [-1, 1]) {
      for (const signZ of [-1, 1]) {
        addFrameBox(
          innerSize,
          frameSize,
          frameSize,
          new THREE.Vector3(0, signY * frameCenter, signZ * frameCenter),
          new THREE.Vector3(0, signY, signZ)
        );
      }
    }

    for (const signX of [-1, 1]) {
      for (const signZ of [-1, 1]) {
        addFrameBox(
          frameSize,
          innerSize,
          frameSize,
          new THREE.Vector3(signX * frameCenter, 0, signZ * frameCenter),
          new THREE.Vector3(signX, 0, signZ)
        );
      }
    }

    for (const signX of [-1, 1]) {
      for (const signY of [-1, 1]) {
        addFrameBox(
          frameSize,
          frameSize,
          innerSize,
          new THREE.Vector3(signX * frameCenter, signY * frameCenter, 0),
          new THREE.Vector3(signX, signY, 0)
        );
      }
    }

    for (const signX of [-1, 1]) {
      for (const signY of [-1, 1]) {
        for (const signZ of [-1, 1]) {
          addFrameBox(
            frameSize,
            frameSize,
            frameSize,
            new THREE.Vector3(signX * frameCenter, signY * frameCenter, signZ * frameCenter),
            new THREE.Vector3(signX, signY, signZ)
          );
        }
      }
    }

    const axisLines = new THREE.Group();
    const axisDefs = [
      { dir: new THREE.Vector3(1, 0, 0), color: 0xff4f57 },
      { dir: new THREE.Vector3(0, 1, 0), color: 0x4df58a },
      { dir: new THREE.Vector3(0, 0, 1), color: 0x5ca8ff }
    ];

    for (const axisDef of axisDefs) {
      const points = [new THREE.Vector3(), axisDef.dir.clone().multiplyScalar(1.28)];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: axisDef.color, transparent: true, opacity: 0.92 })
      );
      axisLines.add(line);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 10),
        new THREE.MeshBasicMaterial({ color: axisDef.color })
      );
      dot.position.copy(axisDef.dir).multiplyScalar(1.28);
      axisLines.add(dot);
    }

    cubeGroup.add(axisLines);
    scene.add(cubeGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function getInteractionHit(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveObjects, false);
      return hits.length ? hits[0] : null;
    }

    renderer.domElement.addEventListener('pointermove', function(event) {
      renderer.domElement.style.cursor = getInteractionHit(event) ? 'pointer' : 'default';
    });

    renderer.domElement.addEventListener('pointerdown', function(event) {
      const hit = getInteractionHit(event);
      if (!hit) {
        return;
      }

      let direction = hit.object.userData && hit.object.userData.direction
        ? hit.object.userData.direction.clone()
        : null;

      if (!direction) {
        const materialIndex = hit.face && typeof hit.face.materialIndex === 'number'
          ? hit.face.materialIndex
          : 0;
        const faceDef = faceDefs[materialIndex];
        direction = faceDef ? faceDef.dir.clone() : null;
      }

      if (direction && typeof config.onDirectionSelected === 'function') {
        config.onDirectionSelected(direction.normalize());
      }
      event.preventDefault();
      event.stopPropagation();
    });

    return {
      update: function(mainCamera) {
        cubeGroup.quaternion.copy(mainCamera.quaternion).invert();
        renderer.render(scene, camera);
      },
      destroy: function() {
        root.remove();
        cubeGroup.traverse(function(child) {
          if (child.geometry && typeof child.geometry.dispose === 'function') {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(function(material) {
                if (material.map && typeof material.map.dispose === 'function') {
                  material.map.dispose();
                }
                if (typeof material.dispose === 'function') {
                  material.dispose();
                }
              });
            } else {
              if (child.material.map && typeof child.material.map.dispose === 'function') {
                child.material.map.dispose();
              }
              if (typeof child.material.dispose === 'function') {
                child.material.dispose();
              }
            }
          }
        });
        renderer.dispose();
      }
    };
  }

  tool.editor.createViewCube = createViewCube;
})();
