(function() {
  const tool = window.EngineeringTool;

  function createThreeViewport(options) {
    const wrap = options.wrap;
    const canvas = options.canvas;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0a0c10);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0c10, 1500, 3500);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 6000);
    const orb = { theta: 0.6, phi: 1.0, radius: 700, tx: 0, ty: 0, tz: 0 };

    function applyOrbit() {
      orb.phi = Math.max(0.05, Math.min(Math.PI - 0.05, orb.phi));
      orb.radius = Math.max(40, Math.min(4000, orb.radius));
      orb.tx = Math.max(-1000, Math.min(1000, orb.tx));
      orb.ty = Math.max(0, Math.min(400, orb.ty));
      orb.tz = Math.max(-1000, Math.min(1000, orb.tz));
      camera.position.set(
        orb.tx + orb.radius * Math.sin(orb.phi) * Math.sin(orb.theta),
        orb.ty + orb.radius * Math.cos(orb.phi),
        orb.tz + orb.radius * Math.sin(orb.phi) * Math.cos(orb.theta)
      );
      camera.lookAt(orb.tx, orb.ty, orb.tz);
    }

    function lookFromDirection(direction) {
      const dir = direction.clone().normalize();
      orb.theta = Math.atan2(dir.x, dir.z);
      orb.phi = Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1));
      applyOrbit();
    }

    function resetCamera() {
      Object.assign(orb, { theta: 0.6, phi: 1.0, radius: 700, tx: 0, ty: 0, tz: 0 });
      applyOrbit();
    }

    function getCameraState() {
      return {
        theta: orb.theta,
        phi: orb.phi,
        radius: orb.radius,
        tx: orb.tx,
        ty: orb.ty,
        tz: orb.tz
      };
    }

    function setCameraState(state) {
      Object.assign(orb, state || {});
      applyOrbit();
    }

    scene.add(new THREE.AmbientLight(0x223388, 0.8));

    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(400, 600, 300);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -800;
    sun.shadow.camera.right = sun.shadow.camera.top = 800;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 4000;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4466ff, 0.3);
    fill.position.set(-200, 100, -100);
    scene.add(fill);

    const grid = new THREE.GridHelper(2000, 40, 0x1a2040, 0x141820);
    grid.receiveShadow = true;
    scene.add(grid);

    function resize() {
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function start(onFrame) {
      function animate() {
        requestAnimationFrame(animate);
        if (typeof onFrame === 'function') {
          onFrame();
        }
        renderer.render(scene, camera);
      }
      animate();
    }

    resetCamera();

    return {
      scene,
      camera,
      orb,
      renderer,
      applyOrbit,
      resetCamera,
      getCameraState,
      setCameraState,
      lookFromDirection,
      resize,
      start
    };
  }

  tool.scene.createThreeViewport = createThreeViewport;
})();