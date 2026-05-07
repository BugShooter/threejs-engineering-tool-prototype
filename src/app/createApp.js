(function() {
  const tool = window.EngineeringTool;
  const PartCatalog = tool.domain.PartCatalog;
  const Assembly = tool.domain.Assembly;
  const serializeAssembly = tool.domain.serializeAssembly;
  const getPartPositionVector = tool.domain.getPartPositionVector;
  const getPartQuaternion = tool.domain.getPartQuaternion;
  const resolvePartPorts = tool.domain.resolvePartPorts;
  const resolveAssemblyPorts = tool.domain.resolveAssemblyPorts;
  const createPartVisualGroup = tool.scene.createPartVisualGroup;
  const disposeObject3D = tool.scene.disposeObject3D;
  const createThreeViewport = tool.scene.createThreeViewport;
  const createOverlayManager = tool.editor.createOverlayManager;
  const createOverlayLayer = tool.editor.createOverlayLayer;
  const createDomWidget = tool.editor.createDomWidget;
  const createViewCubeWidget = tool.editor.createViewCubeWidget;
  const createPreviewLayer = tool.editor.createPreviewLayer;
  const createCanvasLayoutPrototype = tool.editor.createCanvasLayoutPrototype;
  const createConnectDebugController = tool.connect.createConnectDebugController;
  const createConnectStrategyPanel = tool.connect.createConnectStrategyPanel;
  const createTargetSelectionContextBuilder = tool.connect.createTargetSelectionContextBuilder;
  const createTargetSelectionStrategyRegistry = tool.connect.createTargetSelectionStrategyRegistry;
  const createBuiltInTargetSelectionStrategies = tool.connect.createBuiltInTargetSelectionStrategies;
  const createGizmoManager = tool.editor.createGizmoManager;
  const SnapSolver = tool.engine.SnapSolver;
  const i18n = tool.i18n && tool.i18n.instance ? tool.i18n.instance : null;

  const PROFILE_SIZE = 20;
  const CLICK_DRAG_THRESHOLD = 6;
  const DEFAULT_UNDO_HISTORY_LIMIT = 20;
  const MAX_UNDO_HISTORY_LIMIT = 100;
  const ASSEMBLY_CATALOG_STORAGE_KEY = 'engineering-tool.assembly-catalog.v1';
  const MAX_ASSEMBLY_CATALOG_ENTRIES = 60;
  const EDGE_DRAWER_PRESETS = Object.freeze({
    subtleHandle: Object.freeze({
      visibleEdgeWidth: '10px',
      hoverPeekWidth: '18px'
    })
  });

  function createApp() {
    const elements = {
      topbarTitle: document.getElementById('app-topbar-title'),
      topbarSubtitle: document.getElementById('app-topbar-subtitle'),
      topbarLanguageLabel: document.getElementById('app-topbar-language-label'),
      topbarLanguageSelect: document.getElementById('app-topbar-language-select'),
      topbarProfileName: document.getElementById('app-topbar-profile-name'),
      topbarProfileMeta: document.getElementById('app-topbar-profile-meta'),
      legacyHeading: document.getElementById('legacy-heading'),
      legacySectionAdd: document.getElementById('legacy-section-add'),
      legacySectionSelected: document.getElementById('legacy-section-selected'),
      legacySectionJoint: document.getElementById('legacy-section-joint'),
      legacySectionStrategy: document.getElementById('legacy-section-strategy'),
      legacySectionAlignment: document.getElementById('legacy-section-alignment'),
      legacySectionDebug: document.getElementById('legacy-section-debug'),
      legacySectionFile: document.getElementById('legacy-section-file'),
      legacyLengthLabel: document.getElementById('legacy-length-label'),
      legacyLengthUnit: document.getElementById('legacy-length-unit'),
      alignLabelText: document.getElementById('align-label-text'),
      connectDebugLabelText: document.getElementById('connect-debug-label-text'),
      debugShowRayLabel: document.getElementById('debug-show-ray-label'),
      debugShowHitPointLabel: document.getElementById('debug-show-hit-point-label'),
      debugShowPortNormalLabel: document.getElementById('debug-show-port-normal-label'),
      debugShowExactPlaneLabel: document.getElementById('debug-show-exact-plane-label'),
      debugShowLiftedOverlayLabel: document.getElementById('debug-show-lifted-overlay-label'),
      debugShowContactFootprintLabel: document.getElementById('debug-show-contact-footprint-label'),
      debugShowShortlistLabel: document.getElementById('debug-show-shortlist-label'),
      wrap: document.getElementById('canvas-wrap'),
      canvas: document.getElementById('c'),
      snapBadge: document.getElementById('snap-badge'),
      dragHud: document.getElementById('drag-hud'),
      modeLabel: document.getElementById('mode-lbl'),
      lengthInput: document.getElementById('plen'),
      selectionInfo: document.getElementById('sel-info'),
      selectionPanel: document.getElementById('sel-panel'),
      jointInfo: document.getElementById('joint-info'),
      jointPanel: document.getElementById('joint-panel'),
      alignState: document.getElementById('align-state'),
      addProfileButton: document.getElementById('btn-add-profile'),
      addAngleButton: document.getElementById('btn-add-angle'),
      addStraightButton: document.getElementById('btn-add-straight'),
      connectButton: document.getElementById('btn-connect-selected'),
      disconnectButton: document.getElementById('btn-disconnect-selected'),
      splitJointButton: document.getElementById('btn-split-joint'),
      deleteButton: document.getElementById('btn-delete-selected'),
      connectStrategySelect: document.getElementById('connect-strategy-select'),
      toggleAlignButton: document.getElementById('btn-align'),
      resetCameraButton: document.getElementById('btn-reset-camera'),
      toggleConnectDebugButton: document.getElementById('btn-toggle-connect-debug'),
      connectDebugState: document.getElementById('connect-debug-state'),
      connectDebugOptionsPanel: document.getElementById('connect-debug-options'),
      connectDebugStrategyControls: document.getElementById('connect-debug-strategy-controls'),
      debugShowRay: document.getElementById('debug-show-ray'),
      debugShowHitPoint: document.getElementById('debug-show-hit-point'),
      debugShowPortNormal: document.getElementById('debug-show-port-normal'),
      debugShowExactPlane: document.getElementById('debug-show-exact-plane'),
      debugShowLiftedOverlay: document.getElementById('debug-show-lifted-overlay'),
      debugShowContactFootprint: document.getElementById('debug-show-contact-footprint'),
      debugShowShortlist: document.getElementById('debug-show-shortlist'),
      exportButton: document.getElementById('btn-export-json'),
      importButton: document.getElementById('btn-import-json'),
      importInput: document.getElementById('input-import-json'),
      hint: document.getElementById('hint')
    };

    const catalog = new PartCatalog(tool.catalog.defaultCatalogData);
    const assembly = new Assembly(catalog);
    const viewport = createThreeViewport({ wrap: elements.wrap, canvas: elements.canvas });
    const overlayManager = createOverlayManager({ container: elements.wrap });

    function worldToScreen(worldPoint) {
      const projected = worldPoint.clone().project(viewport.camera);
      return {
        x: (projected.x * 0.5 + 0.5) * elements.wrap.clientWidth,
        y: (-projected.y * 0.5 + 0.5) * elements.wrap.clientHeight,
        visible: projected.z >= -1 && projected.z <= 1
      };
    }

    const overlay = createOverlayLayer({
      container: overlayManager.getLayerHost('anchored'),
      camera: viewport.camera,
      worldToScreen: worldToScreen
    });
    const viewCube = createViewCubeWidget({
      onDirectionSelected: function(direction) {
        viewport.lookFromDirection(direction);
        refreshGizmo();
        refreshCallouts();
      },
      size: 112
    });
    const preview = createPreviewLayer(viewport.scene);
    const connectDebugController = createConnectDebugController();
    const builtInTargetSelectionStrategies = createBuiltInTargetSelectionStrategies({
      scene: viewport.scene,
      container: overlayManager.getLayerHost('debug')
    });
    const gizmo = createGizmoManager(viewport.scene, catalog);
    const snapSolver = new SnapSolver({ catalog, assembly, snapDistance: 50 });
    const targetSelectionStrategyRegistry = createTargetSelectionStrategyRegistry();
    for (const strategy of builtInTargetSelectionStrategies) {
      targetSelectionStrategyRegistry.registerStrategy(strategy);
      const debugAdapter = targetSelectionStrategyRegistry.createDebugAdapter(strategy.id);
      if (debugAdapter) {
        connectDebugController.registerAdapter(debugAdapter);
      }
    }
    const connectStrategyPanel = createConnectStrategyPanel({
      selectElement: elements.connectStrategySelect,
      registry: targetSelectionStrategyRegistry,
      onStrategyChanged: function() {
        applyActiveTargetSelectionStrategy();
      }
    });
    const targetSelectionContextBuilder = createTargetSelectionContextBuilder({
      assembly,
      catalog,
      camera: viewport.camera,
      canvas: elements.canvas,
      wrap: elements.wrap,
      worldToScreen,
      hitObjects,
      collectPartMeshes,
      partFromObject,
      getPartScreenRect
    });
    connectDebugController.attachControlsContainer(elements.connectDebugStrategyControls);
    connectDebugController.setActiveStrategy(targetSelectionStrategyRegistry.getActiveStrategyId());
    const partViews = new Map();
    const raycaster = new THREE.Raycaster();

    let selectedPartId = null;
    let selectedJointId = null;
    let selectedStructureActive = false;
    let hoveredJointId = null;
    let previewedPartId = null;
    let previewedPartIds = new Set();
    let snapAlign = true;
    let gizmoMode = 'move';
    let mode = 'idle';
    let activePartId = null;
    let activeSnap = null;
    let activeInteraction = null;
    let connectState = null;
    let postConnectAdjustState = null;
    let connectDebugEnabled = false;
    const connectDebugOptions = {
      showRay: true,
      showHitPoint: true,
      showPortNormal: true,
      showExactPlane: true,
      showLiftedOverlay: true,
      showContactFootprint: true,
      showShortlist: false,
    };
    const connectDebugUiBindings = [];
    const connectDebugOptionBindings = new Map();
    const settingsUiBindings = [];
    let interactionEdited = false;
    let isOrbiting = false;
    let isPanning = false;
    let pendingPick = null;
    const lastMouse = { x: 0, y: 0 };
    let activeTranslateAxis = null;
    let activeRotateAxis = null;
    let activeRotateDelta = 0;
    let activeRotateDisplayDelta = 0;
    const undoHistory = [];
    const redoHistory = [];
    let undoHistoryLimit = DEFAULT_UNDO_HISTORY_LIMIT;

    const tAxis = new THREE.Vector3();
    const tDragPlane = new THREE.Plane();
    const tStartPos = new THREE.Vector3();
    const tStartHit = new THREE.Vector3();

    const rAxis = new THREE.Vector3();
    const rCenter = new THREE.Vector3();
    let rStartAngle = 0;
    let rLastAngle = 0;
    const rStartQuat = new THREE.Quaternion();
    const rU = new THREE.Vector3();
    const rV = new THREE.Vector3();

    let lSign = 0;
    let lStartLen = 0;
    const lAxis = new THREE.Vector3();
    const lDragPlane = new THREE.Plane();
    const lStartHit = new THREE.Vector3();
    const lFixedEnd = new THREE.Vector3();
    const lStartCenter = new THREE.Vector3();
    const lStartQuat = new THREE.Quaternion();
    let lResizeSnap = null;
    let lDraggedPortId = null;
    let lFixedPortId = null;

    const dpDragPlane = new THREE.Plane();
    const dpOffset = new THREE.Vector3();
    const dragStartPos = new THREE.Vector3();

    let canvasLayoutPrototype = null;
    let profileLengthValue = Math.max(40, Math.min(800, Number(elements.lengthInput.value) || 200));
    let currentModeLabelText = '—';
    let snapBadgeActive = false;
    let interactionHudMarkup = '';
    let addPartWidget = null;
    let structureWidget = null;
    let propertiesWidget = null;
    let snapStatusWidget = null;
    let modeStatusWidget = null;
    let interactionStatusWidget = null;
    let assemblyCatalogWidget = null;
    let savedAssembliesWidget = null;
    let savedAssemblyEntries = loadAssemblyCatalogEntries();
    let assemblyCatalogDraft = null;
    let assemblyCatalogEditingEntry = null;
    let assemblyCatalogModalCleanup = null;

    function t(key, replacements) {
      if (!i18n || !key) {
        return key;
      }
      return i18n.t(key, replacements);
    }

    function getLocaleMessage(locale, path) {
      const messages = tool.i18n && tool.i18n.locales ? tool.i18n.locales[locale] : null;
      if (!messages || !path) {
        return null;
      }

      return path.split('.').reduce(function(current, segment) {
        return current && Object.prototype.hasOwnProperty.call(current, segment)
          ? current[segment]
          : null;
      }, messages);
    }

    function getSupportedLocales() {
      return ['en', 'de', 'uk', 'ru'].filter(function(locale) {
        return !!getLocaleMessage(locale, 'locale.name');
      });
    }

    function getLocaleFlag(locale) {
      const localeFlags = {
        en: '🇬🇧',
        de: '🇩🇪',
        uk: '🇺🇦',
        ru: '🇷🇺'
      };
      return localeFlags[locale] || '🏳️';
    }

    function setButtonLabel(button, icon, label) {
      if (!button) {
        return;
      }
      button.textContent = `${icon} ${label}`;
    }

    function getBooleanLabel(value) {
      return t(value ? 'common.on' : 'common.off');
    }

    function formatMillimeters(value) {
      return `${value} ${t('common.mm')}`;
    }

    function getAssemblyCatalogStorage() {
      try {
        return window.localStorage || null;
      } catch (error) {
        return null;
      }
    }

    function createAssemblyCatalogEntryId() {
      return `assembly-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function normalizeAssemblyCatalogSnapshot(snapshot) {
      const normalizedSnapshot = snapshot && typeof snapshot === 'object' ? snapshot : {};
      return {
        schemaVersion: Number.isFinite(normalizedSnapshot.schemaVersion) ? normalizedSnapshot.schemaVersion : 1,
        catalogId: normalizedSnapshot.catalogId || catalog.catalogId,
        parts: Array.isArray(normalizedSnapshot.parts) ? normalizedSnapshot.parts : [],
        joints: Array.isArray(normalizedSnapshot.joints) ? normalizedSnapshot.joints : [],
        editor: normalizedSnapshot.editor && typeof normalizedSnapshot.editor === 'object'
          ? normalizedSnapshot.editor
          : {}
      };
    }

    function normalizeAssemblyCatalogEntry(entry) {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const snapshot = normalizeAssemblyCatalogSnapshot(entry.snapshot);
      if (!snapshot.parts.length) {
        return null;
      }

      const savedAt = Number(entry.savedAt);
      const partCount = Number(entry.partCount);
      const jointCount = Number(entry.jointCount);
      return {
        id: typeof entry.id === 'string' && entry.id ? entry.id : createAssemblyCatalogEntryId(),
        name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : 'Unnamed assembly',
        scope: entry.scope === 'scene' ? 'scene' : 'selection',
        savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
        partCount: Number.isFinite(partCount) ? Math.max(0, Math.round(partCount)) : snapshot.parts.length,
        jointCount: Number.isFinite(jointCount) ? Math.max(0, Math.round(jointCount)) : snapshot.joints.length,
        thumbnailDataUrl: typeof entry.thumbnailDataUrl === 'string' ? entry.thumbnailDataUrl : '',
        snapshot: snapshot
      };
    }

    function sortAssemblyCatalogEntries(entries) {
      return entries
        .slice()
        .sort(function(a, b) {
          return b.savedAt - a.savedAt;
        })
        .slice(0, MAX_ASSEMBLY_CATALOG_ENTRIES);
    }

    function loadAssemblyCatalogEntries() {
      const storage = getAssemblyCatalogStorage();
      if (!storage) {
        return [];
      }

      try {
        const raw = storage.getItem(ASSEMBLY_CATALOG_STORAGE_KEY);
        if (!raw) {
          return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return [];
        }

        return sortAssemblyCatalogEntries(parsed.map(normalizeAssemblyCatalogEntry).filter(Boolean));
      } catch (error) {
        return [];
      }
    }

    function persistAssemblyCatalogEntries(entries) {
      const storage = getAssemblyCatalogStorage();
      if (!storage) {
        return false;
      }

      try {
        storage.setItem(ASSEMBLY_CATALOG_STORAGE_KEY, JSON.stringify(entries));
        return true;
      } catch (error) {
        return false;
      }
    }

    function escapeSvgText(value) {
      return String(value || '').replace(/[&<>"']/g, function(character) {
        const replacements = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&apos;'
        };
        return replacements[character] || character;
      });
    }

    function getAssemblyCatalogScopeLabel(scope) {
      return scope === 'scene' ? t('catalog.scopeScene') : t('catalog.scopeSelection');
    }

    function escapeRegExp(value) {
      return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function getNextAssemblyCatalogDefaultName() {
      const baseName = t('catalog.defaultNameBase');
      const pattern = new RegExp(`^${escapeRegExp(baseName)}(?:\\s*-\\s*(\\d+))?$`, 'i');
      let maxNumber = 0;

      for (const entry of savedAssemblyEntries) {
        const match = pattern.exec(String(entry && entry.name ? entry.name : '').trim());
        if (!match) {
          continue;
        }
        const number = match[1] ? Number(match[1]) : 1;
        maxNumber = Math.max(maxNumber, Number.isFinite(number) && number > 0 ? number : 1);
      }

      return `${baseName} - ${maxNumber + 1}`;
    }

    function buildAssemblyCatalogPreviewDataUrl(entry) {
      const accent = entry.scope === 'scene' ? '#5a8cdb' : '#2bcf88';
      const secondary = getAssemblyCatalogScopeLabel(entry.scope);
      const metrics = `${entry.partCount} ${t('catalog.parts')} · ${entry.jointCount} ${t('selection.connections')}`;
      const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">',
        '<defs>',
        '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
        '<stop offset="0%" stop-color="#111722"/>',
        '<stop offset="100%" stop-color="#1f2f4d"/>',
        '</linearGradient>',
        '</defs>',
        '<rect width="480" height="270" rx="20" fill="url(#bg)"/>',
        `<rect x="26" y="26" width="428" height="218" rx="16" fill="rgba(8,12,18,0.34)" stroke="${accent}" stroke-width="2"/>`,
        `<rect x="26" y="26" width="428" height="10" rx="5" fill="${accent}" opacity="0.92"/>`,
        `<text x="42" y="82" fill="#eef4ff" font-family="JetBrains Mono, monospace" font-size="28">${escapeSvgText(entry.name)}</text>`,
        `<text x="42" y="118" fill="#9cb1d8" font-family="JetBrains Mono, monospace" font-size="16">${escapeSvgText(secondary)}</text>`,
        `<text x="42" y="218" fill="#dbe6ff" font-family="JetBrains Mono, monospace" font-size="18">${escapeSvgText(metrics)}</text>`,
        '</svg>'
      ].join('');
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    function captureAssemblyCatalogThumbnailDataUrl(snapshot) {
      const normalizedSnapshot = normalizeAssemblyCatalogSnapshot(snapshot);
      const parts = Array.isArray(normalizedSnapshot.parts) ? normalizedSnapshot.parts : [];
      if (!parts.length) {
        return '';
      }

      const targetWidth = 320;
      const targetHeight = 180;
      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = targetWidth;
      previewCanvas.height = targetHeight;

      let renderer = null;
      let previewRoot = null;
      let grid = null;

      try {
        renderer = new THREE.WebGLRenderer({
          canvas: previewCanvas,
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(1);
        renderer.setSize(targetWidth, targetHeight, false);
        renderer.setClearColor(0x0a0c10, 1);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, targetWidth / targetHeight, 1, 10000);

        scene.add(new THREE.AmbientLight(0x334477, 1.1));

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
        keyLight.position.set(260, 340, 220);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x4466ff, 0.45);
        fillLight.position.set(-180, 120, -160);
        scene.add(fillLight);

        previewRoot = new THREE.Group();
        scene.add(previewRoot);

        for (const rawPart of parts) {
          const typeDef = getTypeDef(rawPart);
          if (!typeDef) {
            continue;
          }

          const group = createPartVisualGroup(typeDef, rawPart, {
            selected: false,
            highlighted: false
          });
          group.position.copy(getPartPositionVector(rawPart));
          group.quaternion.copy(getPartQuaternion(rawPart));
          previewRoot.add(group);
        }

        if (!previewRoot.children.length) {
          return '';
        }

        const bounds = new THREE.Box3().setFromObject(previewRoot);
        if (bounds.isEmpty()) {
          return '';
        }

        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        previewRoot.position.sub(center);

        const maxSpan = Math.max(size.x, size.y, size.z, PROFILE_SIZE * 2);
        const gridSize = Math.max(Math.ceil(maxSpan / 50) * 100, 200);
        grid = new THREE.GridHelper(gridSize, Math.max(10, Math.round(gridSize / 50)), 0x243252, 0x161d2b);
        grid.position.y = -size.y * 0.5 - PROFILE_SIZE * 0.2;
        scene.add(grid);

        const sphere = new THREE.Sphere();
        bounds.getBoundingSphere(sphere);
        const radius = Math.max(sphere.radius, PROFILE_SIZE * 2);
        const fovRadians = THREE.MathUtils.degToRad(camera.fov);
        const cameraDistance = Math.max(radius / Math.sin(fovRadians * 0.5), maxSpan * 1.6, 160);
        const viewDirection = new THREE.Vector3(1, 0.65, 1.15).normalize();
        camera.position.copy(viewDirection.multiplyScalar(cameraDistance));
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
        return previewCanvas.toDataURL('image/png');
      } catch (error) {
        return '';
      } finally {
        if (previewRoot) {
          disposeObject3D(previewRoot);
        }
        if (grid) {
          disposeObject3D(grid);
        }
        if (renderer) {
          if (typeof renderer.dispose === 'function') {
            renderer.dispose();
          }
          if (typeof renderer.forceContextLoss === 'function') {
            renderer.forceContextLoss();
          }
        }
      }
    }

    function commitAssemblyCatalogEntries(nextEntries) {
      const normalizedEntries = sortAssemblyCatalogEntries(nextEntries.map(normalizeAssemblyCatalogEntry).filter(Boolean));
      if (!persistAssemblyCatalogEntries(normalizedEntries)) {
        window.alert(t('catalog.storageUnavailable'));
        return false;
      }

      savedAssemblyEntries = normalizedEntries;
      refreshAssemblyCatalogWidget();
      return true;
    }

    function updateAssemblyCatalogEntry(entryId, updater) {
      return commitAssemblyCatalogEntries(savedAssemblyEntries.map(function(entry) {
        if (entry.id !== entryId) {
          return entry;
        }

        const nextEntry = typeof updater === 'function' ? updater(entry) : entry;
        return nextEntry || entry;
      }));
    }

    function getPartTypeLabel(typeDef) {
      if (!typeDef) {
        return t('common.dash');
      }
      return typeDef.labelKey ? t(typeDef.labelKey) : (typeDef.label || typeDef.typeId || t('common.dash'));
    }

    function formatModeLabelText(value) {
      if (!value || value === '—') {
        return t('common.dash');
      }

      if (value.indexOf('MOVE ') === 0) {
        return t('modes.moveAxis', { axis: value.slice(5) });
      }
      if (value.indexOf('ROTATE ') === 0) {
        return t('modes.rotateAxis', { axis: value.slice(7) });
      }
      if (value.indexOf('LENGTH ') === 0) {
        return t('modes.lengthEnd', { end: value.slice(7) });
      }

      const mapping = {
        CONNECTED: 'modes.connected',
        ADJUSTED: 'modes.adjusted',
        'ADJUST JOINT': 'modes.adjustJoint',
        'NO SOURCE PORT': 'modes.noSourcePort',
        CONNECT: 'modes.connect',
        'CONNECT TARGET': 'modes.connectTarget',
        'RESIZE LOCKED': 'modes.resizeLocked',
        DRAG: 'modes.drag',
        JOINT: 'modes.joint',
        SELECT: 'modes.select',
        ORBIT: 'modes.orbit'
      };

      return mapping[value] ? t(mapping[value]) : value;
    }

    function populateLanguageSelector() {
      if (!elements.topbarLanguageSelect) {
        return;
      }

      const activeLocale = i18n ? i18n.getLocale() : 'en';
      elements.topbarLanguageSelect.innerHTML = '';

      getSupportedLocales().forEach(function(locale) {
        const option = document.createElement('option');
        option.value = locale;
        option.textContent = `${getLocaleFlag(locale)} ${getLocaleMessage(locale, 'locale.name') || locale.toUpperCase()}`;
        elements.topbarLanguageSelect.appendChild(option);
      });

      elements.topbarLanguageSelect.value = activeLocale;
    }

    function syncStaticUiText() {
      document.title = t('document.title');
      if (elements.topbarTitle) {
        elements.topbarTitle.textContent = t('topbar.title');
      }
      if (elements.topbarSubtitle) {
        elements.topbarSubtitle.textContent = t('topbar.subtitle');
      }
      if (elements.topbarLanguageLabel) {
        elements.topbarLanguageLabel.textContent = t('topbar.language');
      }
      if (elements.topbarProfileName) {
        elements.topbarProfileName.textContent = t('topbar.profileName');
      }
      if (elements.topbarProfileMeta) {
        elements.topbarProfileMeta.textContent = t('topbar.profileMeta');
      }
      populateLanguageSelector();
      if (elements.topbarLanguageSelect) {
        elements.topbarLanguageSelect.setAttribute('aria-label', t('topbar.language'));
      }
      if (elements.legacyHeading) {
        elements.legacyHeading.textContent = t('legacy.heading');
      }
      if (elements.legacySectionAdd) {
        elements.legacySectionAdd.textContent = t('legacy.sections.add');
      }
      if (elements.legacySectionSelected) {
        elements.legacySectionSelected.textContent = t('legacy.sections.selected');
      }
      if (elements.legacySectionJoint) {
        elements.legacySectionJoint.textContent = t('legacy.sections.connection');
      }
      if (elements.legacySectionStrategy) {
        elements.legacySectionStrategy.textContent = t('legacy.sections.strategy');
      }
      if (elements.legacySectionAlignment) {
        elements.legacySectionAlignment.textContent = t('legacy.sections.alignment');
      }
      if (elements.legacySectionDebug) {
        elements.legacySectionDebug.textContent = t('legacy.sections.debug');
      }
      if (elements.legacySectionFile) {
        elements.legacySectionFile.textContent = t('legacy.sections.file');
      }
      if (elements.legacyLengthLabel) {
        elements.legacyLengthLabel.textContent = t('legacy.fields.length');
      }
      if (elements.legacyLengthUnit) {
        elements.legacyLengthUnit.textContent = t('common.mm');
      }
      if (elements.alignLabelText) {
        elements.alignLabelText.textContent = t('actions.alignment');
      }
      if (elements.connectDebugLabelText) {
        elements.connectDebugLabelText.textContent = t('actions.portDebug');
      }
      if (elements.debugShowRayLabel) {
        elements.debugShowRayLabel.textContent = t('debug.showRay');
      }
      if (elements.debugShowHitPointLabel) {
        elements.debugShowHitPointLabel.textContent = t('debug.showHitPoint');
      }
      if (elements.debugShowPortNormalLabel) {
        elements.debugShowPortNormalLabel.textContent = t('debug.showPortNormal');
      }
      if (elements.debugShowExactPlaneLabel) {
        elements.debugShowExactPlaneLabel.textContent = t('debug.showExactPlane');
      }
      if (elements.debugShowLiftedOverlayLabel) {
        elements.debugShowLiftedOverlayLabel.textContent = t('debug.showLiftedOverlay');
      }
      if (elements.debugShowContactFootprintLabel) {
        elements.debugShowContactFootprintLabel.textContent = t('debug.showContactFootprint');
      }
      if (elements.debugShowShortlistLabel) {
        elements.debugShowShortlistLabel.textContent = t('debug.showShortlist');
      }
      setButtonLabel(elements.addProfileButton, '▬', t('actions.profile'));
      setButtonLabel(elements.addAngleButton, '⌐', t('actions.angle'));
      setButtonLabel(elements.addStraightButton, '—', t('actions.straight'));
      setButtonLabel(elements.connectButton, '⊕', t('actions.connect'));
      setButtonLabel(elements.disconnectButton, '⇄', t('actions.disconnect'));
      setButtonLabel(elements.deleteButton, '✕', t('actions.delete'));
      setButtonLabel(elements.splitJointButton, '⟂', t('actions.split'));
      setButtonLabel(elements.resetCameraButton, '⌂', t('actions.resetView'));
      setButtonLabel(elements.exportButton, '⇩', t('actions.exportJson'));
      setButtonLabel(elements.importButton, '⇧', t('actions.importJson'));
      if (elements.hint) {
        elements.hint.innerHTML = t('legacy.hintHtml');
      }
      if (elements.snapBadge) {
        elements.snapBadge.textContent = t('status.snapBadge');
      }
      if (elements.alignState) {
        elements.alignState.textContent = getBooleanLabel(snapAlign);
      }
      if (elements.connectDebugState) {
        elements.connectDebugState.textContent = getBooleanLabel(connectDebugEnabled);
      }
    }

    function handleLocaleSelectChange() {
      if (!i18n || !elements.topbarLanguageSelect) {
        return;
      }
      i18n.setLocale(elements.topbarLanguageSelect.value);
    }

    function clampProfileLength(value) {
      return Math.max(40, Math.min(800, Number(value) || 200));
    }

    function syncProfileLength(value, options) {
      const config = Object.assign({ updateWidget: true }, options || {});
      profileLengthValue = clampProfileLength(value);
      elements.lengthInput.value = `${profileLengthValue}`;
      if (config.updateWidget && addPartWidget) {
        addPartWidget.update({ length: profileLengthValue });
      }
      return profileLengthValue;
    }

    function activatePanelTab(panelId, tabId, options) {
      if (!canvasLayoutPrototype || typeof canvasLayoutPrototype.activateTab !== 'function') {
        return false;
      }
      return canvasLayoutPrototype.activateTab(panelId, tabId, options);
    }

    function isPanelTabActive(panelId, tabId) {
      if (!canvasLayoutPrototype || typeof canvasLayoutPrototype.getActiveTabId !== 'function') {
        return false;
      }
      return canvasLayoutPrototype.getActiveTabId(panelId) === tabId;
    }

    function getPortKey(port) {
      return `${port.partId}:${port.portId}`;
    }

    function toNDC(clientX, clientY) {
      const rect = elements.canvas.getBoundingClientRect();
      return new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        ((clientY - rect.top) / rect.height) * -2 + 1
      );
    }

    function hitObjects(clientX, clientY, objects) {
      if (!objects.length) {
        return [];
      }
      raycaster.setFromCamera(toNDC(clientX, clientY), viewport.camera);
      return raycaster.intersectObjects(objects, false);
    }

    function rayOnPlane(clientX, clientY, normal, point) {
      raycaster.setFromCamera(toNDC(clientX, clientY), viewport.camera);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point);
      const hit = new THREE.Vector3();
      const result = raycaster.ray.intersectPlane(plane, hit);
      return result ? hit : null;
    }

    function getPointerTravel(clientX, clientY) {
      if (!pendingPick) {
        return 0;
      }
      return Math.hypot(clientX - pendingPick.startX, clientY - pendingPick.startY);
    }

    function expandScreenRect(rect, padding) {
      if (!rect) {
        return null;
      }

      return {
        left: rect.left - padding,
        top: rect.top - padding,
        right: rect.right + padding,
        bottom: rect.bottom + padding
      };
    }

    function screenRectFromPoints(points) {
      const visiblePoints = points.filter(point => point && point.visible);
      if (!visiblePoints.length) {
        return null;
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const point of visiblePoints) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }

      return {
        left: minX,
        top: minY,
        right: maxX,
        bottom: maxY
      };
    }

    function screenRectFromRects(rects) {
      const visibleRects = rects.filter(Boolean);
      if (!visibleRects.length) {
        return null;
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const rect of visibleRects) {
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      }

      return {
        left: minX,
        top: minY,
        right: maxX,
        bottom: maxY
      };
    }

    function projectBoxToScreenRect(box) {
      if (!box || box.isEmpty()) {
        return null;
      }

      const corners = [
        new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        new THREE.Vector3(box.min.x, box.min.y, box.max.z),
        new THREE.Vector3(box.min.x, box.max.y, box.min.z),
        new THREE.Vector3(box.min.x, box.max.y, box.max.z),
        new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        new THREE.Vector3(box.max.x, box.min.y, box.max.z),
        new THREE.Vector3(box.max.x, box.max.y, box.min.z),
        new THREE.Vector3(box.max.x, box.max.y, box.max.z)
      ];

      return screenRectFromPoints(corners.map(worldToScreen));
    }

    function getPartScreenRect(partId, padding) {
      const group = partViews.get(partId);
      if (!group) {
        return null;
      }

      const box = new THREE.Box3().setFromObject(group);
      return expandScreenRect(projectBoxToScreenRect(box), padding || 0);
    }

    function getPartsScreenRect(partIds, padding) {
      if (!Array.isArray(partIds) || !partIds.length) {
        return null;
      }

      const rect = screenRectFromRects(partIds.map(function(partId) {
        return getPartScreenRect(partId, 0);
      }));
      return expandScreenRect(rect, padding || 0);
    }

    function getJointPortPair(joint) {
      if (!joint) {
        return null;
      }

      const ports = resolveAssemblyPorts(assembly, catalog);
      const portMap = new Map(ports.map(port => [`${port.partId}:${port.portId}`, port]));
      const aPort = portMap.get(`${joint.a.partId}:${joint.a.portId}`);
      const bPort = portMap.get(`${joint.b.partId}:${joint.b.portId}`);
      if (!aPort || !bPort) {
        return null;
      }

      return { aPort, bPort };
    }

    function getJointScreenRect(jointId, padding) {
      const joint = getJoint(jointId);
      const portPair = getJointPortPair(joint);
      if (!portPair) {
        return null;
      }

      return expandScreenRect(screenRectFromPoints([
        worldToScreen(portPair.aPort.position),
        worldToScreen(portPair.bPort.position)
      ]), padding || 0);
    }

    function getJointAnchorScreen(jointId) {
      const jointRect = getJointScreenRect(jointId, 0);
      if (!jointRect) {
        return null;
      }

      return {
        x: (jointRect.left + jointRect.right) * 0.5,
        y: (jointRect.top + jointRect.bottom) * 0.5,
        visible: true
      };
    }

    function areCalloutsSuppressed() {
      return mode === 'translate' || mode === 'rotate' || mode === 'length' || mode === 'dragPart' || mode === 'connectSource' || mode === 'connectTarget';
    }

    function areInspectorPanelsSuppressed() {
      return mode === 'dragPart' || mode === 'connectSource' || mode === 'connectTarget' || mode === 'postConnectAdjust';
    }

    function isConnectMode() {
      return mode === 'connectSource' || mode === 'connectTarget';
    }

    function getResizeHandleInfo(part, sign) {
      if (!part || part.typeId !== 'profile-20x20') {
        return { enabled: false, reason: t('reasons.resizeOnlyProfile') };
      }

      const draggedPortId = sign > 0 ? 'endB' : 'endA';
      const fixedPortId = sign > 0 ? 'endA' : 'endB';
      const joints = assembly.getPartJoints(part.id);
      const blockingJoint = joints.find(function(joint) {
        const portId = joint.a.partId === part.id ? joint.a.portId : joint.b.portId;
        return portId !== fixedPortId;
      });

      if (blockingJoint) {
        return {
          enabled: false,
          draggedPortId,
          fixedPortId,
          reason: t('reasons.resizeFreeEndOnly')
        };
      }

      return {
        enabled: true,
        draggedPortId,
        fixedPortId,
        hasAnchor: joints.length > 0
      };
    }

    function getResizeHandlesConfig(part) {
      return {
        1: getResizeHandleInfo(part, 1),
        '-1': getResizeHandleInfo(part, -1)
      };
    }

    function canResizePart(part) {
      if (!part) {
        return false;
      }
      const resizeHandles = getResizeHandlesConfig(part);
      return resizeHandles[1].enabled || resizeHandles['-1'].enabled;
    }

    function canConnectPart(part) {
      if (!part) {
        return false;
      }

      const snapshot = buildRigidComponentSnapshot(part.id);
      return getConnectSourceCandidates(snapshot, part.id).length > 0;
    }

    function getConnectSourceCandidates(snapshot, rootPartId) {
      if (!snapshot) {
        return [];
      }

      return (snapshot.sourcePorts || [])
        .filter(function(port) {
          return port.partId === rootPartId && port.snapSource !== false;
        })
        .filter(function(port) {
          return assembly.getPortConnectionCount(port.partId, port.portId) < port.capacity;
        })
        .map(function(port) {
          return {
            key: getPortKey(port),
            role: 'source',
            port
          };
        });
    }

    function getEffectiveGizmoMode(part) {
      if (!part) {
        return 'move';
      }
      if (gizmoMode === 'length' && !canResizePart(part)) {
        return 'move';
      }
      return gizmoMode;
    }

    function setGizmoMode(nextMode) {
      gizmoMode = nextMode;
      refreshGizmo();
      refreshCallouts();
    }

    function getPart(partId) {
      return assembly.getPart(partId);
    }

    function getJoint(jointId) {
      return assembly.getJoint(jointId);
    }

    function getSelectedPart() {
      return selectedPartId ? getPart(selectedPartId) : null;
    }

    function getSelectedStructureComponent() {
      if (!selectedStructureActive || selectedJointId) {
        return null;
      }

      const part = getSelectedPart();
      if (!part) {
        return null;
      }

      const component = assembly.getConnectedComponent(part.id);
      return component && component.parts && component.parts.length > 1 ? component : null;
    }

    function isSelectedStructureActive() {
      return !!getSelectedStructureComponent();
    }

    function getSelectedStructurePartIds() {
      const component = getSelectedStructureComponent();
      return component ? component.partIds.slice() : [];
    }

    function getSelectedStructurePartIdSet() {
      return new Set(getSelectedStructurePartIds());
    }

    function refreshPartViews(partIds) {
      const uniquePartIds = Array.from(new Set((partIds || []).filter(Boolean)));
      for (const partId of uniquePartIds) {
        if (getPart(partId)) {
          syncPartView(partId);
        }
      }
    }

    function setSelectedStructureState(nextActive) {
      const previousPartIds = getSelectedStructurePartIds();
      selectedStructureActive = !!nextActive;
      const nextPartIds = getSelectedStructurePartIds();
      refreshPartViews(previousPartIds.concat(nextPartIds));
    }

    function clearSelectedStructureState() {
      setSelectedStructureState(false);
    }

    function selectConnectedStructure() {
      const part = getSelectedPart();
      if (!part || selectedJointId) {
        return false;
      }

      const component = assembly.getConnectedComponent(part.id);
      if (!component || !component.parts || component.parts.length < 2) {
        return false;
      }

      setSelectedStructureState(true);
      refreshCallouts();
      updateSelectionInfo();
      return true;
    }

    function getStructureAnchorWorld(component) {
      if (!component || !component.parts || !component.parts.length) {
        return null;
      }

      const bounds = new THREE.Box3();
      let hasBounds = false;

      for (const partId of component.partIds) {
        const group = partViews.get(partId);
        if (!group) {
          continue;
        }

        const partBounds = new THREE.Box3().setFromObject(group);
        if (partBounds.isEmpty()) {
          continue;
        }

        if (!hasBounds) {
          bounds.copy(partBounds);
          hasBounds = true;
        } else {
          bounds.union(partBounds);
        }
      }

      if (hasBounds) {
        return bounds.getCenter(new THREE.Vector3());
      }

      const center = new THREE.Vector3();
      for (const part of component.parts) {
        center.add(getPartPositionVector(part));
      }
      return center.multiplyScalar(1 / component.parts.length);
    }

    function getSelectedJoint() {
      return selectedJointId ? getJoint(selectedJointId) : null;
    }

    function arePartIdSetsEqual(first, second) {
      if (first === second) {
        return true;
      }
      if (!first || !second || first.size !== second.size) {
        return false;
      }
      for (const partId of first) {
        if (!second.has(partId)) {
          return false;
        }
      }
      return true;
    }

    function setPreviewedParts(partIds) {
      const nextPreviewedPartIds = new Set(
        (Array.isArray(partIds) ? partIds : []).filter(function(partId) {
          return !!getPart(partId);
        })
      );
      if (arePartIdSetsEqual(previewedPartIds, nextPreviewedPartIds)) {
        return;
      }

      const previousPreviewedPartIds = previewedPartIds;
      previewedPartIds = nextPreviewedPartIds;
      previewedPartId = previewedPartIds.size === 1
        ? Array.from(previewedPartIds)[0]
        : null;

      const dirtyPartIds = new Set(previousPreviewedPartIds);
      for (const partId of previewedPartIds) {
        dirtyPartIds.add(partId);
      }
      for (const partId of dirtyPartIds) {
        if (getPart(partId)) {
          syncPartView(partId);
        }
      }
    }

    function setPreviewedPart(partId) {
      setPreviewedParts(partId ? [partId] : []);
    }

    function setHoveredJoint(jointId) {
      const nextJointId = jointId && getJoint(jointId) ? jointId : null;
      if (nextJointId === hoveredJointId) {
        return;
      }

      hoveredJointId = nextJointId;
      refreshJointOverlay();
    }

    function clearTransientSelectionHighlights() {
      setPreviewedPart(null);
      setHoveredJoint(null);
      clearSelectedStructureState();
    }

    function getTypeDef(part) {
      const typeDef = catalog.getType(part.typeId);
      if (!typeDef) {
        return null;
      }
      if (!typeDef.labelKey) {
        return typeDef;
      }
      return Object.assign({}, typeDef, {
        label: getPartTypeLabel(typeDef)
      });
    }

    function removePartView(partId) {
      const group = partViews.get(partId);
      if (!group) {
        return;
      }
      viewport.scene.remove(group);
      disposeObject3D(group);
      partViews.delete(partId);
    }

    function syncPartView(partId) {
      removePartView(partId);
      const part = getPart(partId);
      if (!part) {
        return;
      }

      const selectedStructurePartIds = getSelectedStructurePartIdSet();

      const group = createPartVisualGroup(getTypeDef(part), part, {
        selected: selectedPartId === partId,
        highlighted: selectedPartId !== partId && (previewedPartIds.has(partId) || selectedStructurePartIds.has(partId))
      });
      group.position.copy(getPartPositionVector(part));
      group.quaternion.copy(getPartQuaternion(part));
      viewport.scene.add(group);
      partViews.set(partId, group);
    }

    function updatePartTransform(partId) {
      const part = getPart(partId);
      const group = partViews.get(partId);
      if (!part || !group) {
        return;
      }
      group.position.copy(getPartPositionVector(part));
      group.quaternion.copy(getPartQuaternion(part));
    }

    function refreshSnapDots() {
      preview.updateSnapDots(resolveAssemblyPorts(assembly, catalog));
    }

    function buildJointVisuals() {
      const ports = resolveAssemblyPorts(assembly, catalog);
      const portMap = new Map(ports.map(port => [`${port.partId}:${port.portId}`, port]));

      return assembly.getJoints().map(joint => {
        const aPort = portMap.get(`${joint.a.partId}:${joint.a.portId}`);
        const bPort = portMap.get(`${joint.b.partId}:${joint.b.portId}`);
        if (!aPort || !bPort) {
          return null;
        }

        return {
          jointId: joint.id,
          start: aPort.position.clone(),
          end: bPort.position.clone(),
          center: aPort.position.clone().lerp(bPort.position, 0.5)
        };
      }).filter(Boolean);
    }

    function refreshJointOverlay() {
      preview.updateJoints(buildJointVisuals(), selectedJointId, hoveredJointId);
    }

    function refreshSceneOverlays() {
      refreshSnapDots();
      refreshJointOverlay();
    }

    function normalizeSignedAngleDelta(angle) {
      const fullTurn = Math.PI * 2;
      return ((angle + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
    }

    function wrapRotateDisplayDelta(angle) {
      const fullTurn = Math.PI * 2;
      const wrapped = (angle || 0) % fullTurn;
      return Math.abs(wrapped) < 1e-4 || Math.abs(fullTurn - Math.abs(wrapped)) < 1e-4 ? 0 : wrapped;
    }

    function createEditorSnapshot() {
      return serializeAssembly(assembly, {
        editor: {
          selectedPartId,
          selectedJointId,
          camera: viewport.getCameraState()
        }
      });
    }

    function createEmptyEditorSnapshot(options) {
      const config = Object.assign({ camera: null }, options || {});
      return {
        parts: [],
        joints: [],
        editor: {
          selectedPartId: null,
          selectedJointId: null,
          camera: config.camera
        }
      };
    }

    function createEditorSnapshotKey(snapshot) {
      return JSON.stringify(snapshot);
    }

    function buildAssemblyCatalogSnapshot(scope) {
      const baseSnapshot = serializeAssembly(assembly, { editor: {} });
      const defaultName = getNextAssemblyCatalogDefaultName();
      if (scope === 'scene') {
        return {
          scope: 'scene',
          snapshot: Object.assign({}, baseSnapshot, { editor: {} }),
          partCount: baseSnapshot.parts.length,
          jointCount: baseSnapshot.joints.length,
          defaultName: defaultName
        };
      }

      const selectedPart = getSelectedPart();
      if (!selectedPart) {
        return null;
      }

      const component = assembly.getConnectedComponent(selectedPart.id);
      if (!component.parts.length) {
        return null;
      }

      const allowedPartIds = new Set(component.partIds);
      return {
        scope: 'selection',
        snapshot: Object.assign({}, baseSnapshot, {
          parts: baseSnapshot.parts.filter(function(part) {
            return allowedPartIds.has(part.id);
          }),
          joints: baseSnapshot.joints.filter(function(joint) {
            return allowedPartIds.has(joint.a.partId) && allowedPartIds.has(joint.b.partId);
          }),
          editor: {
            rootPartId: selectedPart.id
          }
        }),
        partCount: component.parts.length,
        jointCount: component.joints.length,
        defaultName: defaultName
      };
    }

    function beginAssemblyCatalogEntryDraft(scope) {
      const snapshotConfig = buildAssemblyCatalogSnapshot(scope);
      if (!snapshotConfig || !snapshotConfig.snapshot.parts.length) {
        return false;
      }

      assemblyCatalogEditingEntry = null;
      assemblyCatalogDraft = {
        scope: snapshotConfig.scope,
        snapshot: snapshotConfig.snapshot,
        partCount: snapshotConfig.partCount,
        jointCount: snapshotConfig.jointCount,
        defaultName: snapshotConfig.defaultName || t('catalog.unnamed'),
        name: snapshotConfig.defaultName || t('catalog.unnamed'),
        thumbnailDataUrl: captureAssemblyCatalogThumbnailDataUrl(snapshotConfig.snapshot)
      };
      refreshAssemblyCatalogWidget();
      return true;
    }

    function cancelAssemblyCatalogEntryDraft() {
      assemblyCatalogDraft = null;
      refreshAssemblyCatalogWidget();
    }

    function openAssemblyCatalogEntryEditor(entryId) {
      const entry = savedAssemblyEntries.find(function(candidate) {
        return candidate.id === entryId;
      });
      if (!entry) {
        return false;
      }

      assemblyCatalogDraft = null;
      assemblyCatalogEditingEntry = {
        id: entry.id,
        name: entry.name
      };
      refreshAssemblyCatalogWidget();
      return true;
    }

    function cancelAssemblyCatalogEntryEditor() {
      assemblyCatalogEditingEntry = null;
      refreshAssemblyCatalogWidget();
    }

    function saveAssemblyCatalogEntryEditor() {
      if (!assemblyCatalogEditingEntry) {
        return false;
      }

      const trimmedName = String(assemblyCatalogEditingEntry.name || '').trim();
      if (!trimmedName) {
        return false;
      }

      const previousEditor = assemblyCatalogEditingEntry;
      assemblyCatalogEditingEntry = null;
      const didRename = renameAssemblyCatalogEntry(previousEditor.id, trimmedName);
      if (!didRename) {
        assemblyCatalogEditingEntry = previousEditor;
        refreshAssemblyCatalogWidget();
      }
      return didRename;
    }

    function removeAssemblyCatalogEntryFromEditor() {
      if (!assemblyCatalogEditingEntry) {
        return false;
      }

      const previousEditor = assemblyCatalogEditingEntry;
      assemblyCatalogEditingEntry = null;
      const didRemove = removeAssemblyCatalogEntry(previousEditor.id);
      if (!didRemove) {
        assemblyCatalogEditingEntry = previousEditor;
        refreshAssemblyCatalogWidget();
      }
      return didRemove;
    }

    function saveAssemblyCatalogDraft() {
      if (!assemblyCatalogDraft || !assemblyCatalogDraft.snapshot || !assemblyCatalogDraft.snapshot.parts.length) {
        return false;
      }

      const trimmedName = (assemblyCatalogDraft.name || '').trim();
      const entryName = trimmedName || assemblyCatalogDraft.defaultName || t('catalog.unnamed');
      const didSave = commitAssemblyCatalogEntries([
        {
          id: createAssemblyCatalogEntryId(),
          name: entryName,
          scope: assemblyCatalogDraft.scope,
          savedAt: Date.now(),
          partCount: assemblyCatalogDraft.partCount,
          jointCount: assemblyCatalogDraft.jointCount,
          thumbnailDataUrl: assemblyCatalogDraft.thumbnailDataUrl || captureAssemblyCatalogThumbnailDataUrl(assemblyCatalogDraft.snapshot),
          snapshot: assemblyCatalogDraft.snapshot
        }
      ].concat(savedAssemblyEntries));
      if (didSave) {
        assemblyCatalogDraft = null;
        refreshAssemblyCatalogWidget();
      }
      return didSave;
    }

    function removeAssemblyCatalogEntry(entryId) {
      return commitAssemblyCatalogEntries(savedAssemblyEntries.filter(function(candidate) {
        return candidate.id !== entryId;
      }));
    }

    function renameAssemblyCatalogEntry(entryId, nextName) {
      const trimmedName = String(nextName || '').trim();
      if (!trimmedName) {
        return false;
      }

      return updateAssemblyCatalogEntry(entryId, function(entry) {
        return Object.assign({}, entry, {
          name: trimmedName
        });
      });
    }

    function createInsertedAssemblyGroupId() {
      return `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function resolveAssemblyCatalogInsertAnchor(snapshot) {
      const parts = Array.isArray(snapshot && snapshot.parts) ? snapshot.parts : [];
      if (!parts.length) {
        return null;
      }

      const preferredRootPartId = snapshot.editor && snapshot.editor.rootPartId ? snapshot.editor.rootPartId : null;
      const rootPart = parts.find(function(part) {
        return part.id === preferredRootPartId;
      }) || parts[0];
      const rootTransform = rootPart && rootPart.transform ? rootPart.transform : null;
      const rootPosition = rootTransform && Array.isArray(rootTransform.position)
        ? rootTransform.position
        : [0, 0, 0];

      return {
        rootPartId: rootPart.id,
        offset: [
          viewport.orb.tx - (rootPosition[0] || 0),
          0,
          viewport.orb.tz - (rootPosition[2] || 0)
        ]
      };
    }

    function addAssemblyCatalogEntryToScene(entryId) {
      const entry = savedAssemblyEntries.find(function(candidate) {
        return candidate.id === entryId;
      });
      if (!entry) {
        return false;
      }

      const snapshot = normalizeAssemblyCatalogSnapshot(entry.snapshot);
      const parts = Array.isArray(snapshot.parts) ? snapshot.parts : [];
      const joints = Array.isArray(snapshot.joints) ? snapshot.joints : [];
      if (!parts.length) {
        return false;
      }

      const anchor = resolveAssemblyCatalogInsertAnchor(snapshot);
      if (!anchor) {
        return false;
      }

      const previousState = createEditorSnapshot();
      const partIdMap = new Map();
      const insertedGroupId = createInsertedAssemblyGroupId();
      beginCommittedHistoryChange(previousState);

      for (const rawPart of parts) {
        const rawTransform = rawPart && rawPart.transform ? rawPart.transform : {};
        const rawPosition = Array.isArray(rawTransform.position) ? rawTransform.position : [0, 0, 0];
        const rawQuaternion = Array.isArray(rawTransform.quaternion) ? rawTransform.quaternion : [0, 0, 0, 1];
        const part = assembly.createPart(rawPart.typeId, rawPart.params || {}, {
          position: [
            (rawPosition[0] || 0) + anchor.offset[0],
            rawPosition[1] || 0,
            (rawPosition[2] || 0) + anchor.offset[2]
          ],
          quaternion: rawQuaternion.slice(0, 4)
        });
        part.meta = Object.assign({}, rawPart.meta || {}, {
          groupId: insertedGroupId,
          groupName: entry.name,
          sourceAssemblyId: entry.id,
          sourceAssemblyName: entry.name
        });
        partIdMap.set(rawPart.id, part.id);
        syncPartView(part.id);
      }

      for (const rawJoint of joints) {
        const partAId = partIdMap.get(rawJoint.a && rawJoint.a.partId);
        const partBId = partIdMap.get(rawJoint.b && rawJoint.b.partId);
        if (!partAId || !partBId) {
          continue;
        }

        assembly.connectPorts(
          { partId: partAId, portId: rawJoint.a.portId },
          { partId: partBId, portId: rawJoint.b.portId },
          rawJoint.ruleId,
          {
            replaceSource: false,
            replaceTarget: false,
            meta: rawJoint.meta || {}
          }
        );
      }

      refreshSceneOverlays();
      selectPart(partIdMap.get(anchor.rootPartId) || Array.from(partIdMap.values())[0] || null);
      setModeLabel('SELECT');
      return true;
    }

    function pushHistoryEntry(historyStack, snapshot) {
      const nextKey = createEditorSnapshotKey(snapshot);
      const lastEntry = historyStack[historyStack.length - 1] || null;
      if (!lastEntry || lastEntry.key !== nextKey) {
        historyStack.push({ snapshot: snapshot, key: nextKey });
        return true;
      }
      return false;
    }

    function getUndoDepth() {
      return undoHistory.length;
    }

    function getRedoDepth() {
      return redoHistory.length;
    }

    function canUndo() {
      return getUndoDepth() > 0;
    }

    function canRedo() {
      return getRedoDepth() > 0;
    }

    function canClearHistory() {
      return canUndo() || canRedo();
    }

    function trimUndoHistory() {
      if (undoHistory.length > undoHistoryLimit) {
        undoHistory.splice(0, undoHistory.length - undoHistoryLimit);
      }
    }

    function trimRedoHistory() {
      if (redoHistory.length > undoHistoryLimit) {
        redoHistory.splice(0, redoHistory.length - undoHistoryLimit);
      }
    }

    function clearRedoHistory(options) {
      const config = Object.assign({ refresh: false }, options || {});
      const hadEntries = redoHistory.length > 0;
      redoHistory.length = 0;
      if (config.refresh && hadEntries) {
        refreshLayoutControls();
      }
    }

    function setUndoHistoryLimit(value) {
      const numericValue = Number(value);
      const nextLimit = Math.max(1, Math.min(MAX_UNDO_HISTORY_LIMIT, Math.round(Number.isFinite(numericValue) ? numericValue : undoHistoryLimit)));
      undoHistoryLimit = nextLimit;
      trimUndoHistory();
      trimRedoHistory();
      refreshLayoutControls();
      return undoHistoryLimit;
    }

    function clearUndoHistory() {
      undoHistory.length = 0;
      redoHistory.length = 0;
      refreshLayoutControls();
    }

    function rememberUndoSnapshot(snapshot) {
      const nextSnapshot = snapshot || createEditorSnapshot();
      if (pushHistoryEntry(undoHistory, nextSnapshot)) {
        trimUndoHistory();
      }
      refreshLayoutControls();
    }

    function beginCommittedHistoryChange(snapshot) {
      rememberUndoSnapshot(snapshot);
      clearRedoHistory({ refresh: true });
    }

    function applyEditorSnapshot(snapshot) {
      if (!snapshot) {
        return false;
      }

      clearPendingPick();
      clearTransientSelectionHighlights();
      clearRotateGizmoState();
      activePartId = null;
      activeSnap = null;
      activeInteraction = null;
      interactionEdited = false;
      isOrbiting = false;
      isPanning = false;
      lResizeSnap = null;
      lDraggedPortId = null;
      lFixedPortId = null;
      connectState = null;
      postConnectAdjustState = null;
      previewedPartId = null;
      previewedPartIds = new Set();
      hoveredJointId = null;
      mode = 'idle';
      clearConnectPreview();
      gizmo.clearInteractionState();

      const result = assembly.load(snapshot);
      selectedStructureActive = false;
      selectedPartId = result.editor.selectedPartId && getPart(result.editor.selectedPartId)
        ? result.editor.selectedPartId
        : null;
      selectedJointId = result.editor.selectedJointId && getJoint(result.editor.selectedJointId)
        ? result.editor.selectedJointId
        : null;
      if (result.editor.camera) {
        viewport.setCameraState(result.editor.camera);
      }
      if (selectedJointId) {
        selectedPartId = null;
      }

      syncAllPartViews();
      hideInteractionHud();
      setModeLabel('—');
      return true;
    }

    function undoLastAction() {
      if (!canUndo()) {
        return false;
      }

      const currentSnapshot = createEditorSnapshot();
      const entry = undoHistory.pop();
      const applied = applyEditorSnapshot(entry.snapshot);
      if (!applied) {
        undoHistory.push(entry);
      } else if (pushHistoryEntry(redoHistory, currentSnapshot)) {
        trimRedoHistory();
      }
      refreshLayoutControls();
      return applied;
    }

    function redoLastAction() {
      if (!canRedo()) {
        return false;
      }

      const currentSnapshot = createEditorSnapshot();
      const entry = redoHistory.pop();
      const applied = applyEditorSnapshot(entry.snapshot);
      if (!applied) {
        redoHistory.push(entry);
      } else if (pushHistoryEntry(undoHistory, currentSnapshot)) {
        trimUndoHistory();
      }
      refreshLayoutControls();
      return applied;
    }

    function isHistoryNavigationBlocked() {
      return !!(pendingPick || activeInteraction || isOrbiting || isPanning || isConnectMode() || mode === 'postConnectAdjust');
    }

    function isEditableEventTarget(target) {
      return !!(target && target.nodeType === 1 && (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ));
    }

    function refreshLayoutControls() {
      if (canvasLayoutPrototype && typeof canvasLayoutPrototype.refresh === 'function') {
        canvasLayoutPrototype.refresh();
      }
      updateSettingsUi();
    }

    function clearRotateGizmoState() {
      activeRotateAxis = null;
      activeRotateDelta = 0;
      activeRotateDisplayDelta = 0;
      rLastAngle = rStartAngle;
    }

    function refreshGizmo() {
      const part = getSelectedPart();
      if (!part || selectedJointId || mode === 'dragPart' || mode === 'postConnectAdjust' || isConnectMode()) {
        gizmo.clear();
        return;
      }

      const resizeHandles = getResizeHandlesConfig(part);
      const gizmoBuildOptions = {
        mode: getEffectiveGizmoMode(part),
        canResize: canResizePart(part),
        resizeHandles
      };

      if (mode === 'rotate' && activeInteraction && activeRotateAxis) {
        gizmoBuildOptions.rotateState = {
          axis: activeRotateAxis,
          deltaAngle: activeRotateDisplayDelta
        };
        gizmoBuildOptions.displayQuaternion = activeInteraction.rootStartQuaternion;
      }

      gizmo.build(part, viewport.camera, gizmoBuildOptions);
    }

    function hideInteractionHud() {
      interactionHudMarkup = '';
      elements.dragHud.classList.remove('visible');
      elements.dragHud.innerHTML = '';
      if (interactionStatusWidget) {
        interactionStatusWidget.update({ html: interactionHudMarkup });
      }
    }

    function showInteractionHud(markup) {
      interactionHudMarkup = markup || '';
      elements.dragHud.innerHTML = interactionHudMarkup;
      elements.dragHud.classList.toggle('visible', !!interactionHudMarkup);
      if (interactionStatusWidget) {
        interactionStatusWidget.update({ html: interactionHudMarkup });
      }
    }

    function createHudField(label, value) {
      return `<div><span class="kv">${label}:</span> <span class="v">${value}</span></div>`;
    }

    function createHudCoordinates(position) {
      return `<div><span class="kv">X:</span> <span class="v">${position.x.toFixed(0)}</span> ` +
        `<span class="kv">Y:</span> <span class="v">${position.y.toFixed(0)}</span> ` +
        `<span class="kv">Z:</span> <span class="v">${position.z.toFixed(0)}</span></div>`;
    }

    function formatSignedMillimeters(value) {
      return `${value >= 0 ? '+' : ''}${value.toFixed(0)} ${t('common.mm')}`;
    }

    function updateInteractionHud() {
      if (mode === 'dragPart' && activeInteraction) {
        const part = getPart(activeInteraction.rootPartId);
        if (!part) {
          hideInteractionHud();
          return;
        }

        const typeDef = getTypeDef(part);
        const position = activeInteraction.currentRootPosition || getPartPositionVector(part);
        const snapLine = activeSnap && activeSnap.targetPort
          ? createHudField(t('hud.target'), `${activeSnap.targetPort.partId} · ${activeSnap.targetPort.portId}`)
          : '';
        showInteractionHud(
          `<div class="ttl">${typeDef.label} #${part.id}</div>` +
          createHudCoordinates(position) +
          createHudField(t('selection.subassembly'), activeInteraction.partIds.length) +
          snapLine
        );
        return;
      }

      if (mode === 'length' && selectedPartId) {
        const part = getSelectedPart();
        if (!part) {
          hideInteractionHud();
          return;
        }

        const typeDef = getTypeDef(part);
        const lengthDelta = part.params.length - lStartLen;
        const snapLine = lResizeSnap && lResizeSnap.targetPort
          ? createHudField(t('hud.snap'), `${lResizeSnap.targetPort.partId} · ${lResizeSnap.targetPort.portId}`)
          : '';
        showInteractionHud(
          `<div class="ttl">${typeDef.label} #${part.id}</div>` +
          createHudField(t('hud.end'), lSign > 0 ? 'B' : 'A') +
          createHudField(t('selection.length'), formatMillimeters(part.params.length)) +
          createHudField(t('hud.delta'), formatSignedMillimeters(lengthDelta)) +
          snapLine
        );
        return;
      }

      if (mode === 'translate' && activeInteraction) {
        const part = getPart(activeInteraction.rootPartId);
        if (!part) {
          hideInteractionHud();
          return;
        }

        const typeDef = getTypeDef(part);
        const position = activeInteraction.currentRootPosition || getPartPositionVector(part);
        const travel = position.clone().sub(tStartPos).dot(tAxis);
        showInteractionHud(
          `<div class="ttl">${typeDef.label} #${part.id}</div>` +
          createHudField(t('hud.axis'), activeTranslateAxis ? activeTranslateAxis.toUpperCase() : t('common.dash')) +
          createHudField(t('hud.delta'), formatSignedMillimeters(travel)) +
          createHudCoordinates(position)
        );
        return;
      }

      if (mode === 'rotate' && activeInteraction && activeRotateAxis) {
        const part = getPart(activeInteraction.rootPartId);
        if (!part) {
          hideInteractionHud();
          return;
        }

        const typeDef = getTypeDef(part);
        const angleDegrees = THREE.MathUtils.radToDeg(activeRotateDelta);
        showInteractionHud(
          `<div class="ttl">${typeDef.label} #${part.id}</div>` +
          createHudField(t('hud.axis'), activeRotateAxis.toUpperCase()) +
          createHudField(t('hud.angle'), `${angleDegrees >= 0 ? '+' : ''}${angleDegrees.toFixed(1)}°`)
        );
        return;
      }

      if (mode === 'connectSource' && connectState) {
        const part = getPart(connectState.rootPartId);
        if (!part) {
          hideInteractionHud();
          return;
        }

        const typeDef = getTypeDef(part);
        showInteractionHud(
          `<div class="ttl">${typeDef.label} #${part.id}</div>` +
          createHudField(t('hud.mode'), t('modes.connect')) +
          createHudField(t('hud.step'), t('hud.chooseSourcePort')) +
          createHudField(t('hud.available'), connectState.sourceCandidates.length)
        );
        return;
      }

      if (mode === 'connectTarget' && connectState) {
        const part = getPart(connectState.rootPartId);
        if (!part || !connectState.sourcePort) {
          hideInteractionHud();
          return;
        }

        const typeDef = getTypeDef(part);
        const variantCount = connectState.activeTargetSnapVariants ? connectState.activeTargetSnapVariants.length : 0;
        const variantLine = variantCount > 1
          ? createHudField(t('hud.orientation'), `${connectState.activeTargetVariantIndex + 1}/${variantCount}`)
          : '';
        const variantHintLine = variantCount > 1
          ? createHudField(t('hud.switch'), `← → / 1-${Math.min(variantCount, 9)}`)
          : '';
        const targetLine = connectState.activeTarget
          ? createHudField(t('hud.target'), `${connectState.activeTarget.port.partId} · ${connectState.activeTarget.port.portId}`)
          : createHudField(t('hud.target'), t('hud.hoverPort'));
        showInteractionHud(
          `<div class="ttl">${typeDef.label} #${part.id}</div>` +
          createHudField(t('hud.source'), connectState.sourcePort.portId) +
          `${targetLine}` +
          `${variantLine}` +
          `${variantHintLine}` +
          createHudField(t('hud.confirm'), t('common.lmb'))
        );
        return;
      }

      if (mode === 'postConnectAdjust') {
        hideInteractionHud();
        return;
      }

      hideInteractionHud();
    }

    function syncConnectDebugUiBinding(binding) {
      if (!binding) {
        return;
      }

      if (binding.stateElement) {
        binding.stateElement.textContent = getBooleanLabel(connectDebugEnabled);
        binding.stateElement.style.color = connectDebugEnabled ? '#66c2ff' : '#6070a0';
      }
      if (binding.optionsPanel) {
        binding.optionsPanel.classList.toggle('is-muted', !connectDebugEnabled);
      }
    }

    function registerConnectDebugUiBinding(binding) {
      if (!binding) {
        return function() {};
      }

      connectDebugUiBindings.push(binding);
      if (binding.button) {
        binding.button.addEventListener('click', toggleConnectDebug);
      }
      syncConnectDebugUiBinding(binding);

      return function() {
        const bindingIndex = connectDebugUiBindings.indexOf(binding);
        if (binding.button) {
          binding.button.removeEventListener('click', toggleConnectDebug);
        }
        if (bindingIndex >= 0) {
          connectDebugUiBindings.splice(bindingIndex, 1);
        }
      };
    }

    function updateConnectDebugUi() {
      for (const binding of connectDebugUiBindings) {
        syncConnectDebugUiBinding(binding);
      }
    }

    function syncSettingsUiBinding(binding) {
      if (!binding) {
        return;
      }

      if (binding.alignStateElement) {
        binding.alignStateElement.textContent = getBooleanLabel(snapAlign);
        binding.alignStateElement.style.color = snapAlign ? '#66c2ff' : '#6070a0';
      }

      if (binding.alignButton) {
        binding.alignButton.setAttribute('aria-pressed', snapAlign ? 'true' : 'false');
      }

      if (binding.undoInfoElement) {
        binding.undoInfoElement.textContent = t('settings.undoDepth', {
          count: getUndoDepth(),
          undoCount: getUndoDepth(),
          redoCount: getRedoDepth(),
          limit: undoHistoryLimit
        });
      }

      if (binding.undoButton) {
        binding.undoButton.disabled = !canUndo();
        binding.undoButton.setAttribute('aria-disabled', binding.undoButton.disabled ? 'true' : 'false');
      }

      if (binding.redoButton) {
        binding.redoButton.disabled = !canRedo();
        binding.redoButton.setAttribute('aria-disabled', binding.redoButton.disabled ? 'true' : 'false');
      }

      if (binding.clearUndoButton) {
        binding.clearUndoButton.disabled = !canClearHistory();
        binding.clearUndoButton.setAttribute('aria-disabled', binding.clearUndoButton.disabled ? 'true' : 'false');
      }

      if (binding.undoLimitInput && document.activeElement !== binding.undoLimitInput) {
        binding.undoLimitInput.value = `${undoHistoryLimit}`;
      }
    }

    function registerSettingsUiBinding(binding) {
      if (!binding) {
        return function() {};
      }

      settingsUiBindings.push(binding);
      syncSettingsUiBinding(binding);

      return function() {
        const bindingIndex = settingsUiBindings.indexOf(binding);
        if (bindingIndex >= 0) {
          settingsUiBindings.splice(bindingIndex, 1);
        }
      };
    }

    function updateSettingsUi() {
      for (const binding of settingsUiBindings) {
        syncSettingsUiBinding(binding);
      }
    }

    function refreshConnectDebugPreview() {
      if (!connectDebugEnabled || !connectState || !connectState.targetSelectionDiagnostics) {
        connectDebugController.clear();
        return;
      }

      connectDebugController.update(connectState.targetSelectionDiagnostics, connectDebugOptions);
    }

    function refreshConnectTargetSelection() {
      if (mode === 'connectTarget' && connectState && connectState.sourcePort) {
        updateConnectTargetPreview(lastMouse.x, lastMouse.y);
        return;
      }

      refreshConnectDebugPreview();
    }

    function applyActiveTargetSelectionStrategy() {
      const activeStrategy = targetSelectionStrategyRegistry.getActiveStrategy();
      if (!activeStrategy) {
        return;
      }

      connectDebugController.setActiveStrategy(activeStrategy.id);
      refreshConnectTargetSelection();
    }

    function updateConnectDebugPreview(diagnostics) {
      if (connectState) {
        connectState.targetSelectionDiagnostics = diagnostics || null;
      }

      if (!connectDebugEnabled) {
        connectDebugController.clear();
        return;
      }

      refreshConnectDebugPreview();
    }

    function clearConnectPreview() {
      preview.clearPortCandidates();
      if (connectState) {
        connectState.targetSelectionDiagnostics = null;
      }
      connectDebugController.clear();
      preview.removeGhost();
      preview.hideSnapRing();
      preview.hideFaceHighlight();
      setSnapBadge(false);
    }

    function syncConnectTargetDiagnosticsVariant() {
      if (!connectState || !connectState.targetSelectionDiagnostics) {
        return;
      }

      if (connectState.targetSelectionDiagnostics.activeTarget) {
        connectState.targetSelectionDiagnostics.activeTarget.fitOk = connectState.activeTargetSnap
          ? connectState.activeTargetSnap.fitOk
          : null;
      }

      if (connectState.targetSelectionDiagnostics.strategyData && connectState.targetSelectionDiagnostics.strategyData.variants) {
        connectState.targetSelectionDiagnostics.strategyData.variants.activeIndex = connectState.activeTargetSnap
          ? connectState.activeTargetVariantIndex
          : null;
      }
    }

    function renderConnectTargetPreview() {
      const activeTarget = connectState ? connectState.activeTarget : null;
      const targetedSnap = connectState ? connectState.activeTargetSnap : null;

      if (!activeTarget || !targetedSnap) {
        preview.removeGhost();
        if (connectState) {
          connectState.ghostVisible = false;
        }
        preview.hideSnapRing();
        preview.hideFaceHighlight();
        setSnapBadge(false);
        updateInteractionHud();
        refreshConnectDebugPreview();
        return;
      }

      if (!connectState.ghostVisible) {
        preview.createGhost(buildGhostItems(connectState.snapshot));
        connectState.ghostVisible = true;
      }
      preview.updateGhost(getComponentPoses(connectState.snapshot, targetedSnap.snapPos, targetedSnap.snapQuat));
      preview.showSnapRing(targetedSnap.targetPt.world);
      preview.showFaceHighlight(activeTarget.port);
      setSnapBadge(true);
      syncConnectTargetDiagnosticsVariant();
      updateInteractionHud();
      refreshConnectDebugPreview();
    }

    function setActiveConnectTargetVariant(nextIndex) {
      if (!connectState || !Array.isArray(connectState.activeTargetSnapVariants) || !connectState.activeTargetSnapVariants.length) {
        return false;
      }

      const clampedIndex = Math.max(0, Math.min(connectState.activeTargetSnapVariants.length - 1, nextIndex));
      if (clampedIndex === connectState.activeTargetVariantIndex && connectState.activeTargetSnap) {
        return false;
      }

      connectState.activeTargetVariantIndex = clampedIndex;
      connectState.activeTargetSnap = connectState.activeTargetSnapVariants[clampedIndex] || null;
      renderConnectTargetPreview();
      return true;
    }

    function cycleConnectTargetVariant(delta) {
      if (!connectState || !Array.isArray(connectState.activeTargetSnapVariants) || connectState.activeTargetSnapVariants.length <= 1) {
        return false;
      }

      const variantCount = connectState.activeTargetSnapVariants.length;
      const nextIndex = (connectState.activeTargetVariantIndex + delta + variantCount) % variantCount;
      return setActiveConnectTargetVariant(nextIndex);
    }

    function cancelConnectMode(options) {
      const config = Object.assign({ keepSelection: true }, options || {});
      clearTransientSelectionHighlights();
      const hadConnectMode = mode === 'connectSource' || mode === 'connectTarget';
      if (hadConnectMode) {
        mode = 'idle';
      }
      connectState = null;
      clearConnectPreview();
      hideInteractionHud();

      if (!config.keepSelection) {
        deselectAll();
      } else {
        updateSelectionInfo();
        updateJointInfo();
        refreshGizmo();
        refreshCallouts();
      }
      setModeLabel('—');
    }

    function getJointAdjustSideEntries(joint) {
      if (!joint) {
        return [];
      }

      return [
        {
          key: 'a',
          tag: 'part-1',
          rootPartId: joint.a.partId,
          rootPortId: joint.a.portId,
          oppositePartId: joint.b.partId,
          oppositePortId: joint.b.portId
        },
        {
          key: 'b',
          tag: 'part-2',
          rootPartId: joint.b.partId,
          rootPortId: joint.b.portId,
          oppositePartId: joint.a.partId,
          oppositePortId: joint.a.portId
        }
      ];
    }

    function getJointPreferredWorldPoint(joint, fallbackPoint) {
      const contactPoint = joint && joint.meta && Array.isArray(joint.meta.contactPoint)
        ? joint.meta.contactPoint
        : null;
      if (contactPoint && contactPoint.length >= 3) {
        return new THREE.Vector3(contactPoint[0], contactPoint[1], contactPoint[2]);
      }

      return fallbackPoint ? fallbackPoint.clone() : null;
    }

    function findMatchingSnapVariantIndex(snapshot, snapVariants, options) {
      const config = Object.assign({ fallbackIndex: 0 }, options || {});
      if (!snapshot || !Array.isArray(snapVariants) || !snapVariants.length) {
        return 0;
      }

      const fallbackIndex = Math.max(0, Math.min(snapVariants.length - 1, config.fallbackIndex));
      const rootPart = getPart(snapshot.rootPartId);
      if (!rootPart) {
        return fallbackIndex;
      }

      const currentRootPosition = snapshot.currentRootPosition || getPartPositionVector(rootPart);
      const currentRootQuaternion = snapshot.currentRootQuaternion || getPartQuaternion(rootPart);
      let bestIndex = fallbackIndex;
      let bestScore = Infinity;

      for (let index = 0; index < snapVariants.length; index += 1) {
        const variant = snapVariants[index];
        const positionDistance = variant.snapPos.distanceTo(currentRootPosition);
        const rotationDistance = 1 - Math.abs(variant.snapQuat.dot(currentRootQuaternion));
        const score = positionDistance + rotationDistance * 180;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      }

      return bestIndex;
    }

    function analyzeJointAdjustSide(jointId, rootPartId, options) {
      const config = Object.assign({ fallbackVariantIndex: 0 }, options || {});
      const joint = typeof jointId === 'string' ? getJoint(jointId) : jointId;
      if (!joint) {
        return {
          jointId: null,
          rootPartId,
          sideLabel: null,
          rootPartLabel: rootPartId,
          canAdjust: false,
          reason: t('reasons.jointNotFound'),
          snapshot: null,
          snapVariants: [],
          initialVariantIndex: 0
        };
      }

      const side = getJointAdjustSideEntries(joint).find(function(entry) {
        return entry.rootPartId === rootPartId;
      });
      if (!side) {
        return {
          jointId: joint.id,
          rootPartId,
          sideLabel: null,
          rootPartLabel: rootPartId,
          canAdjust: false,
          reason: t('reasons.adjustSideNotInJoint'),
          snapshot: null,
          snapVariants: [],
          initialVariantIndex: 0
        };
      }

      const rootPart = getPart(side.rootPartId);
      const oppositePart = getPart(side.oppositePartId);
      const result = {
        jointId: joint.id,
        joint,
        sideKey: side.key,
        sideLabel: side.tag,
        rootPartId: side.rootPartId,
        rootPortId: side.rootPortId,
        oppositePartId: side.oppositePartId,
        oppositePortId: side.oppositePortId,
        rootPartLabel: rootPart ? `${getTypeDef(rootPart).label} #${rootPart.id}` : side.rootPartId,
        oppositePartLabel: oppositePart ? `${getTypeDef(oppositePart).label} #${oppositePart.id}` : side.oppositePartId,
        canAdjust: false,
        reason: null,
        snapshot: null,
        snapVariants: [],
        initialVariantIndex: 0
      };

      const detachedComponent = assembly.getConnectedComponent(side.rootPartId, {
        excludedJointIds: [joint.id]
      });
      if (detachedComponent.partIds.includes(side.oppositePartId)) {
        result.reason = t('reasons.adjustLockedLoop');
        return result;
      }

      const snapshot = buildRigidComponentSnapshot(side.rootPartId, {
        excludedJointIds: [joint.id]
      });
      if (!snapshot) {
        result.reason = t('reasons.adjustMissingSubassembly');
        return result;
      }

      const sourcePort = (snapshot.sourcePorts || []).find(function(port) {
        return port.partId === side.rootPartId && port.portId === side.rootPortId;
      });
      if (!sourcePort) {
        result.reason = t('reasons.adjustSourcePortUnavailable');
        return result;
      }

      const portPair = getJointPortPair(joint);
      const targetPort = portPair
        ? (side.key === 'a' ? portPair.bPort : portPair.aPort)
        : null;
      if (!targetPort) {
        result.reason = t('reasons.adjustMissingOtherSide');
        return result;
      }

      const preferredWorldPoint = getJointPreferredWorldPoint(joint, targetPort.position);
      const snapVariants = snapSolver.findTargetedComponentSnapVariants(
        snapshot,
        sourcePort,
        targetPort,
        snapshot.currentRootQuaternion,
        snapAlign,
        preferredWorldPoint
      );

      result.snapshot = snapshot;
      result.snapVariants = snapVariants;
      result.initialVariantIndex = findMatchingSnapVariantIndex(snapshot, snapVariants, {
        fallbackIndex: config.fallbackVariantIndex
      });

      if (snapVariants.length <= 1) {
        result.reason = snapVariants.length === 1
          ? t('reasons.adjustOnlyOneOrientation')
          : t('reasons.adjustMissingVariants');
        return result;
      }

      result.canAdjust = true;
      return result;
    }

    function beginPostConnectAdjustFromAnalysis(analysis) {
      if (!analysis || !analysis.canAdjust) {
        return false;
      }

      return beginPostConnectAdjust({
        jointId: analysis.jointId,
        rootPartId: analysis.rootPartId,
        snapshot: analysis.snapshot,
        snapVariants: analysis.snapVariants,
        initialVariantIndex: analysis.initialVariantIndex,
        sideLabel: analysis.sideLabel,
        rootPartLabel: analysis.rootPartLabel
      });
    }

    function renderPostConnectAdjustPreview() {
      if (!postConnectAdjustState) {
        preview.removeGhost();
        preview.hideSnapRing();
        preview.hideFaceHighlight();
        setSnapBadge(false);
        updateInteractionHud();
        return;
      }

      const previewSnap = postConnectAdjustState.snapVariants[postConnectAdjustState.previewVariantIndex] || null;
      const committedSnap = postConnectAdjustState.snapVariants[postConnectAdjustState.committedVariantIndex] || null;
      if (!previewSnap || !committedSnap) {
        preview.removeGhost();
        postConnectAdjustState.ghostVisible = false;
        preview.hideSnapRing();
        preview.hideFaceHighlight();
        setSnapBadge(false);
        updateInteractionHud();
        return;
      }

      const isPreviewing = postConnectAdjustState.previewVariantIndex !== postConnectAdjustState.committedVariantIndex;
      if (!isPreviewing) {
        preview.removeGhost();
        postConnectAdjustState.ghostVisible = false;
        preview.hideSnapRing();
        preview.hideFaceHighlight();
        setSnapBadge(false);
        updateInteractionHud();
        return;
      }

      if (!postConnectAdjustState.ghostVisible) {
        preview.createGhost(buildGhostItems(postConnectAdjustState.snapshot));
        postConnectAdjustState.ghostVisible = true;
      }
      preview.updateGhost(getComponentPoses(postConnectAdjustState.snapshot, previewSnap.snapPos, previewSnap.snapQuat));
      preview.showSnapRing(previewSnap.targetPt.world);
      preview.showFaceHighlight(previewSnap.targetPort);
      setSnapBadge(true);
      updateInteractionHud();
    }

    function setPostConnectAdjustVariant(nextIndex) {
      if (!postConnectAdjustState || !postConnectAdjustState.snapVariants.length) {
        return false;
      }

      const clampedIndex = Math.max(0, Math.min(postConnectAdjustState.snapVariants.length - 1, nextIndex));
      if (clampedIndex === postConnectAdjustState.previewVariantIndex) {
        return false;
      }

      postConnectAdjustState.previewVariantIndex = clampedIndex;
      renderPostConnectAdjustPreview();
      refreshCallouts();
      return true;
    }

    function cyclePostConnectAdjustVariant(delta) {
      if (!postConnectAdjustState || postConnectAdjustState.snapVariants.length <= 1) {
        return false;
      }

      const variantCount = postConnectAdjustState.snapVariants.length;
      const nextIndex = (postConnectAdjustState.previewVariantIndex + delta + variantCount) % variantCount;
      return setPostConnectAdjustVariant(nextIndex);
    }

    function finishPostConnectAdjust(options) {
      const config = Object.assign({ commit: false }, options || {});
      if (!postConnectAdjustState) {
        return false;
      }

      const nextSnap = postConnectAdjustState.snapVariants[postConnectAdjustState.previewVariantIndex] || null;
      if (config.commit && nextSnap) {
        if (postConnectAdjustState.previewVariantIndex !== postConnectAdjustState.committedVariantIndex) {
          beginCommittedHistoryChange();
        }
        applyComponentTransform(postConnectAdjustState.snapshot, nextSnap.snapPos, nextSnap.snapQuat);
        postConnectAdjustState.committedVariantIndex = postConnectAdjustState.previewVariantIndex;
      }

      preview.removeGhost();
      preview.hideSnapRing();
      preview.hideFaceHighlight();
      setSnapBadge(false);

      const jointId = postConnectAdjustState.jointId;
      postConnectAdjustState = null;
      mode = 'idle';
      refreshSceneOverlays();
      selectPart(null, { clearJoint: false });
      setSelectedJoint(jointId);
      setModeLabel(config.commit ? 'ADJUSTED' : 'CONNECTED');
      updateInteractionHud();
      return true;
    }

    function beginPostConnectAdjust(options) {
      const config = Object.assign({
        jointId: null,
        rootPartId: null,
        snapshot: null,
        snapVariants: [],
        initialVariantIndex: 0,
        sideLabel: null,
        rootPartLabel: null
      }, options || {});
      if (!config.jointId || !config.rootPartId || !config.snapshot || !Array.isArray(config.snapVariants) || config.snapVariants.length <= 1) {
        return false;
      }

      postConnectAdjustState = {
        jointId: config.jointId,
        rootPartId: config.rootPartId,
        snapshot: config.snapshot,
        snapVariants: config.snapVariants.slice(),
        committedVariantIndex: Math.max(0, Math.min(config.snapVariants.length - 1, config.initialVariantIndex || 0)),
        previewVariantIndex: Math.max(0, Math.min(config.snapVariants.length - 1, config.initialVariantIndex || 0)),
        sideLabel: config.sideLabel || null,
        rootPartLabel: config.rootPartLabel || config.rootPartId,
        ghostVisible: false
      };

      mode = 'postConnectAdjust';
      selectPart(config.rootPartId, { clearJoint: false });
      setSelectedJoint(config.jointId);
      refreshSceneOverlays();
      refreshGizmo();
      refreshCallouts();
      renderPostConnectAdjustPreview();
      setModeLabel('ADJUST JOINT');
      return true;
    }

    function beginConnectMode() {
      const part = getSelectedPart();
      if (!part) {
        return;
      }

      const snapshot = buildRigidComponentSnapshot(part.id);
      const sourceCandidates = getConnectSourceCandidates(snapshot, part.id);
      if (!sourceCandidates.length) {
        setModeLabel('NO SOURCE PORT');
        return;
      }

      connectState = {
        rootPartId: part.id,
        snapshot,
        sourceCandidates,
        activeSourceKey: null,
        sourcePort: null,
        targetCandidates: [],
        targetSelectionDiagnostics: null,
        activeTarget: null,
        activeTargetSnapVariants: [],
        activeTargetVariantIndex: 0,
        activeTargetSnap: null,
        activeTargetKey: null,
        activeTargetHitPoint: null,
        ghostVisible: false
      };
      mode = 'connectSource';
      clearConnectPreview();
      preview.updatePortCandidates(sourceCandidates, null);
      updateInteractionHud();
      refreshGizmo();
      refreshCallouts();
      setModeLabel('CONNECT');
    }

    function beginConnectTargetPhase(sourceKey) {
      if (!connectState) {
        return;
      }

      const sourcePort = (connectState.snapshot.sourcePorts || []).find(function(port) {
        return getPortKey(port) === sourceKey;
      });
      if (!sourcePort) {
        return;
      }

      connectState.sourcePort = sourcePort;
      connectState.activeSourceKey = sourceKey;
      connectState.targetCandidates = [];
      connectState.targetSelectionDiagnostics = null;
      connectState.activeTarget = null;
      connectState.activeTargetSnap = null;
      connectState.activeTargetKey = null;
      connectState.activeTargetHitPoint = null;
      connectState.ghostVisible = false;
      mode = 'connectTarget';

      preview.updatePortCandidates([
        {
          key: sourceKey,
          role: 'source',
          port: sourcePort
        }
      ], null);
      updateInteractionHud();
      setModeLabel('CONNECT TARGET');
    }

    function updateConnectSourceHover(clientX, clientY) {
      if (!connectState) {
        return;
      }

      const hits = hitObjects(clientX, clientY, preview.getPortPickPlanes());
      const sourceHit = hits.find(function(hit) {
        return hit.object.userData.role === 'source';
      });
      const activeSourceKey = sourceHit ? sourceHit.object.userData.candidateKey : null;

      if (activeSourceKey !== connectState.activeSourceKey) {
        connectState.activeSourceKey = activeSourceKey;
        preview.updatePortCandidates(connectState.sourceCandidates, activeSourceKey);
        if (sourceHit) {
          const candidate = connectState.sourceCandidates.find(function(item) {
            return item.key === activeSourceKey;
          });
          if (candidate) {
            preview.showFaceHighlight(candidate.port);
          }
        } else {
          preview.hideFaceHighlight();
        }
      }
    }

    function updateConnectTargetPreview(clientX, clientY) {
      if (!connectState || !connectState.sourcePort) {
        return;
      }

      const previousTargetKey = connectState.activeTargetKey;
      const previousVariantIndex = connectState.activeTargetVariantIndex || 0;

      const targetSelectionContext = targetSelectionContextBuilder.buildContext({
        activeSourceKey: connectState.activeSourceKey,
        clientX,
        clientY,
        sourcePort: connectState.sourcePort,
        snapshot: connectState.snapshot,
        thresholds: connectDebugController.getSelectionConfig(),
        snapAlign,
        snapSolver,
        resolveActiveTargetHitPoint: function(activeTarget, bestMatch) {
          return ((bestMatch.planeMetrics && bestMatch.planeMetrics.hit) ||
            rayOnPlane(clientX, clientY, activeTarget.port.normal, activeTarget.port.position) ||
            activeTarget.port.position.clone());
        }
      });
      const targetCandidates = targetSelectionContext.targetCandidates;

      const previewCandidates = [
        {
          key: connectState.activeSourceKey,
          role: 'source',
          port: connectState.sourcePort
        }
      ].concat(targetCandidates);
      preview.updatePortCandidates(previewCandidates, null);

      const strategyResult = targetSelectionStrategyRegistry.evaluate(targetSelectionContext);
      const activeTarget = strategyResult ? strategyResult.activeTarget : null;
      const activeTargetKey = strategyResult ? strategyResult.activeTargetKey : null;
      const activeTargetHitPoint = strategyResult ? strategyResult.activeTargetHitPoint : null;
      const targetedSnapVariants = strategyResult && Array.isArray(strategyResult.targetedSnapVariants)
        ? strategyResult.targetedSnapVariants
        : [];
      const nextVariantIndex = activeTargetKey && activeTargetKey === previousTargetKey
        ? Math.min(previousVariantIndex, Math.max(0, targetedSnapVariants.length - 1))
        : 0;

      connectState.targetCandidates = targetCandidates;
      connectState.activeTarget = activeTarget;
      connectState.activeTargetKey = activeTargetKey;
      connectState.activeTargetHitPoint = activeTargetHitPoint;
      connectState.activeTargetSnapVariants = targetedSnapVariants;
      connectState.activeTargetVariantIndex = nextVariantIndex;
      connectState.activeTargetSnap = targetedSnapVariants[nextVariantIndex] || (strategyResult ? strategyResult.targetedSnap : null);

      preview.updatePortCandidates(previewCandidates, activeTargetKey);
      updateConnectDebugPreview(strategyResult ? strategyResult.diagnostics : null);
      renderConnectTargetPreview();
    }

    function confirmConnectTarget() {
      if (!connectState || !connectState.activeTargetSnap) {
        return false;
      }

      beginCommittedHistoryChange();

      const rootPartId = connectState.rootPartId;
      const connectSnapshot = connectState.snapshot;
      const activeTargetVariantIndex = connectState.activeTargetVariantIndex || 0;

      applyComponentTransform(
        connectSnapshot,
        connectState.activeTargetSnap.snapPos,
        connectState.activeTargetSnap.snapQuat
      );
      const joint = assembly.connectPorts(
        {
          partId: connectState.activeTargetSnap.sourcePort.partId,
          portId: connectState.activeTargetSnap.sourcePort.portId
        },
        {
          partId: connectState.activeTargetSnap.targetPort.partId,
          portId: connectState.activeTargetSnap.targetPort.portId
        },
        connectState.activeTargetSnap.ruleId,
        {
          replaceSource: connectState.activeTargetSnap.sourcePort.capacity === 1,
          replaceTarget: connectState.activeTargetSnap.targetPort.capacity === 1,
          meta: {
            contactPoint: [
              connectState.activeTargetSnap.targetPt.world.x,
              connectState.activeTargetSnap.targetPt.world.y,
              connectState.activeTargetSnap.targetPt.world.z
            ]
          }
        }
      );

      const autoAdjustAnalysis = joint
        ? analyzeJointAdjustSide(joint.id, rootPartId, { fallbackVariantIndex: activeTargetVariantIndex })
        : null;

      clearConnectPreview();
      connectState = null;

      if (autoAdjustAnalysis && autoAdjustAnalysis.canAdjust && beginPostConnectAdjustFromAnalysis(autoAdjustAnalysis)) {
        return true;
      }

      mode = 'idle';
      refreshSceneOverlays();
      selectPart(null, { clearJoint: false });
      if (joint) {
        setSelectedJoint(joint.id);
      }
      setModeLabel('CONNECTED');
      return true;
    }

    function buildPartCalloutState() {
      const structureComponent = getSelectedStructureComponent();
      if (structureComponent) {
        const rootPart = getSelectedPart();
        const typeDef = rootPart ? getTypeDef(rootPart) : null;

        return {
          getAnchorScreen: function() {
            const rect = getPartsScreenRect(structureComponent.partIds, 0);
            if (rect) {
              return {
                x: (rect.left + rect.right) * 0.5,
                y: rect.top + Math.min(22, Math.max(8, (rect.bottom - rect.top) * 0.2)),
                visible: true
              };
            }

            const anchorWorld = getStructureAnchorWorld(structureComponent);
            return anchorWorld ? worldToScreen(anchorWorld) : null;
          },
          getLineRect: function() {
            return getPartsScreenRect(structureComponent.partIds, 0);
          },
          getAvoidRect: function() {
            return getPartsScreenRect(structureComponent.partIds, 52);
          },
          title: `${t('selection.subassembly')} · ${structureComponent.partIds.length}`,
          onClose: closeSelectionCallout,
          closeTooltip: t('callout.closeCallout'),
          lines: [
            rootPart && typeDef ? `${t('common.selected')}: ${typeDef.label} #${rootPart.id}` : `${t('common.selected')}: ${t('common.dash')}`,
            `${t('catalog.parts')}: ${structureComponent.partIds.length}`,
            `${t('selection.connections')}: ${structureComponent.joints.length}`
          ],
          actions: [
            {
              icon: '◌',
              tooltip: t('callout.selectSinglePart'),
              onClick: function() {
                if (rootPart) {
                  selectPart(rootPart.id);
                  setModeLabel('SELECT');
                }
              }
            },
            {
              icon: '🗑',
              tooltip: t('callout.deleteSelectedStructure'),
              danger: true,
              onClick: deleteSelectedStructure
            }
          ]
        };
      }

      const part = getSelectedPart();
      if (!part || selectedJointId) {
        return null;
      }

      const canResize = canResizePart(part);
      const canConnect = canConnectPart(part);
      const effectiveMode = getEffectiveGizmoMode(part);
      const partId = part.id;
      const typeDef = getTypeDef(part);
      const component = assembly.getConnectedComponent(part.id);
      const isProfile = part.typeId === 'profile-20x20';
      const lines = [
        `${t('callout.position')}: ${part.transform.position[0].toFixed(0)}, ${part.transform.position[1].toFixed(0)}, ${part.transform.position[2].toFixed(0)}`,
        `${t('selection.connections')}: ${assembly.getJointCountForPart(part.id)}`
      ];
      if (isProfile) {
        lines.unshift(`${t('selection.length')}: ${formatMillimeters(part.params.length)}`);
      }

      return {
        getAnchorScreen: function() {
          const rect = getPartScreenRect(partId, 0);
          if (rect) {
            return {
              x: (rect.left + rect.right) * 0.5,
              y: rect.top + Math.min(22, Math.max(8, (rect.bottom - rect.top) * 0.35)),
              visible: true
            };
          }

          const livePart = getPart(partId);
          return livePart ? worldToScreen(getPartPositionVector(livePart)) : null;
        },
        getLineRect: function() {
          return getPartScreenRect(partId, 0);
        },
        getAvoidRect: function() {
          return getPartScreenRect(partId, 52);
        },
        title: `${typeDef.label} #${part.id}`,
        onClose: closeSelectionCallout,
        closeTooltip: t('callout.closeCallout'),
        lines,
        actions: [
          {
            icon: '⊕',
            tooltip: canConnect ? t('callout.explicitConnectMode') : t('callout.noFreeSourcePort'),
            disabled: !canConnect,
            onClick: beginConnectMode
          },
          {
            icon: '✥',
            tooltip: t('callout.moveMode'),
            active: effectiveMode === 'move',
            onClick: function() { setGizmoMode('move'); }
          },
          {
            icon: '⟳',
            tooltip: t('callout.rotateMode'),
            active: effectiveMode === 'rotate',
            onClick: function() { setGizmoMode('rotate'); }
          },
          {
            icon: '↔',
            tooltip: canResize ? t('callout.lengthMode') : t('callout.lengthModeBlocked'),
            active: effectiveMode === 'length',
            disabled: !canResize,
            onClick: function() { setGizmoMode('length'); }
          },
          {
            icon: '▣',
            tooltip: t('callout.openProperties'),
            active: isPanelTabActive('left-sandbox-tabs', 'properties'),
            onClick: function() {
              openSelectedPartProperties(part.id, { focusLength: isProfile });
            }
          },
          {
            icon: '◫',
            tooltip: t('callout.selectConnectedStructure'),
            disabled: component.partIds.length < 2,
            onClick: function() {
              if (selectConnectedStructure()) {
                setModeLabel('SELECT');
              }
            }
          },
          {
            icon: '⇄',
            tooltip: t('callout.disconnectSelectedPart'),
            disabled: assembly.getJointCountForPart(part.id) === 0,
            onClick: disconnectSelectedPart
          },
          {
            icon: '🗑',
            tooltip: t('callout.deleteSelectedPart'),
            danger: true,
            onClick: deleteSelected
          }
        ]
      };
    }

    function getJointAnchorWorld(joint) {
      const portPair = getJointPortPair(joint);
      if (!portPair) {
        return null;
      }

      return portPair.aPort.position.clone().lerp(portPair.bPort.position, 0.5);
    }

    function buildPostConnectHelperCalloutState() {
      if (mode !== 'postConnectAdjust' || !postConnectAdjustState) {
        return null;
      }

      const joint = getSelectedJoint() || getJoint(postConnectAdjustState.jointId);
      if (!joint) {
        return null;
      }

      const anchorWorld = getJointAnchorWorld(joint);
      if (!anchorWorld) {
        return null;
      }

      const rootPart = getPart(postConnectAdjustState.rootPartId);
      const variantCount = postConnectAdjustState.snapVariants.length;
      const isPreviewing = postConnectAdjustState.previewVariantIndex !== postConnectAdjustState.committedVariantIndex;

      return {
        anchorWorld,
        preferredPlacement: 'below',
        getAnchorScreen: function() {
          return getJointAnchorScreen(joint.id);
        },
        getLineRect: function() {
          return getJointScreenRect(joint.id, 0);
        },
        getAvoidRect: function() {
          return getJointScreenRect(joint.id, 34);
        },
        title: t('callout.adjustConnectionTitle'),
        onClose: function() {
          finishPostConnectAdjust({ commit: false });
        },
        closeTooltip: t('callout.closeCallout'),
        lines: [
          `${t('callout.side')}: ${postConnectAdjustState.sideLabel || t('common.dash')}`,
          rootPart ? `${getTypeDef(rootPart).label} #${rootPart.id}` : postConnectAdjustState.rootPartLabel,
          `${t('hud.orientation')}: ${postConnectAdjustState.previewVariantIndex + 1}/${variantCount}`,
          isPreviewing ? t('callout.previewNewOrientation') : t('callout.previewCurrentPosition')
        ],
        actions: [
          {
            icon: '←',
            label: t('actions.previous'),
            wide: true,
            tooltip: t('callout.previousOrientation'),
            onClick: function() {
              cyclePostConnectAdjustVariant(-1);
            }
          },
          {
            icon: '→',
            label: t('actions.next'),
            wide: true,
            tooltip: t('callout.nextOrientation'),
            onClick: function() {
              cyclePostConnectAdjustVariant(1);
            }
          },
          {
            icon: '✓',
            label: t('actions.done'),
            wide: true,
            tooltip: t('callout.applyOrientation'),
            onClick: function() {
              finishPostConnectAdjust({ commit: true });
            }
          },
          {
            icon: '✕',
            label: t('actions.cancel'),
            wide: true,
            danger: true,
            tooltip: t('callout.cancelAdjustment'),
            onClick: function() {
              finishPostConnectAdjust({ commit: false });
            }
          }
        ]
      };
    }

    function buildJointCalloutState() {
      const joint = getSelectedJoint();
      if (!joint) {
        return null;
      }

      const partA = getPart(joint.a.partId);
      const partB = getPart(joint.b.partId);
      const anchorWorld = getJointAnchorWorld(joint);
      if (!anchorWorld) {
        return null;
      }

      const sideAnalyses = getJointAdjustSideEntries(joint).map(function(side) {
        return analyzeJointAdjustSide(joint.id, side.rootPartId);
      });

      return {
        anchorWorld,
        getAnchorScreen: function() {
          return getJointAnchorScreen(joint.id);
        },
        getLineRect: function() {
          return getJointScreenRect(joint.id, 0);
        },
        getAvoidRect: function() {
          return getJointScreenRect(joint.id, 28);
        },
        title: t('callout.connectionTitle', { id: joint.id }),
        onClose: function() {
          closeSelectionCallout();
        },
        closeTooltip: t('callout.closeCallout'),
        lines: [
          `${partA ? getTypeDef(partA).label : joint.a.partId} · ${joint.a.portId}`,
          `${partB ? getTypeDef(partB).label : joint.b.partId} · ${joint.b.portId}`,
          `${t('joint.rule')}: ${joint.ruleId}`
        ],
        actions: sideAnalyses.map(function(analysis) {
          return {
            icon: '↻',
            label: analysis.sideLabel,
            wide: true,
            tooltip: analysis.canAdjust
              ? t('callout.rotateSide', { side: analysis.sideLabel, part: analysis.rootPartLabel })
              : `${analysis.sideLabel}: ${analysis.reason}`,
            disabled: !analysis.canAdjust,
            onHoverStart: function() {
              setPreviewedPart(analysis.rootPartId);
            },
            onHoverEnd: function() {
              setPreviewedPart(null);
            },
            onClick: function() {
              beginPostConnectAdjustFromAnalysis(analysis);
            }
          };
        }).concat([
          {
            icon: '▣',
            tooltip: t('callout.openProperties'),
            active: isPanelTabActive('left-sandbox-tabs', 'properties'),
            onClick: function() {
              activatePanelTab('left-sandbox-tabs', 'properties');
            }
          },
          {
            icon: '⟂',
            label: t('callout.split'),
            wide: true,
            tooltip: t('callout.splitSelectedJoint'),
            danger: true,
            onClick: splitSelectedJoint
          }
        ])
      };
    }

    function refreshCallouts() {
      setPreviewedPart(null);
      overlay.setSuppressed(areCalloutsSuppressed());
      if (mode === 'postConnectAdjust') {
        overlay.setPartCallout(null);
        overlay.setJointCallout(null);
        overlay.setHelperCallout(buildPostConnectHelperCalloutState());
      } else {
        overlay.setPartCallout(buildPartCalloutState());
        overlay.setJointCallout(buildJointCalloutState());
        overlay.setHelperCallout(null);
      }
      overlay.update();
    }

    function updateSelectionInfo() {
      const part = getSelectedPart();
      if (!part || selectedJointId || areInspectorPanelsSuppressed()) {
        elements.selectionPanel.style.display = 'none';
        elements.connectButton.disabled = true;
        elements.selectionInfo.innerHTML = '—';
        refreshAssemblyCatalogWidget();
        if (structureWidget) {
          structureWidget.update(buildStructureWidgetState());
        }
        refreshPropertiesWidget();
        refreshCallouts();
        return;
      }

      const component = assembly.getConnectedComponent(part.id);
      const label = getTypeDef(part).label;
      const position = part.transform.position;
      const jointCount = assembly.getJointCountForPart(part.id);
      const extra = part.typeId === 'profile-20x20'
        ? `<br>${t('selection.length')}: <span class="hi">${formatMillimeters(part.params.length)}</span>`
        : '';

      elements.selectionPanel.style.display = 'flex';
      elements.connectButton.disabled = !canConnectPart(part);
      elements.selectionInfo.innerHTML =
        `<span class="hi">${label} #${part.id}</span>${extra}<br>` +
        `X:${position[0].toFixed(0)} Y:${position[1].toFixed(0)} Z:${position[2].toFixed(0)}<br>` +
        `${t('selection.connections')}: <span class="hi">${jointCount}</span><br>` +
        `${t('selection.subassembly')}: <span class="hi">${component.partIds.length}</span>`;
      refreshAssemblyCatalogWidget();
      if (structureWidget) {
        structureWidget.update(buildStructureWidgetState());
      }
      refreshPropertiesWidget();
      refreshCallouts();
    }

    function updateJointInfo() {
      const joint = getSelectedJoint();
      if (!joint || areInspectorPanelsSuppressed()) {
        elements.jointPanel.style.display = 'none';
        elements.jointInfo.innerHTML = '—';
        if (structureWidget) {
          structureWidget.update(buildStructureWidgetState());
        }
        refreshPropertiesWidget();
        refreshCallouts();
        return;
      }

      const partA = getPart(joint.a.partId);
      const partB = getPart(joint.b.partId);
      const labelA = partA ? `${getTypeDef(partA).label} #${partA.id}` : joint.a.partId;
      const labelB = partB ? `${getTypeDef(partB).label} #${partB.id}` : joint.b.partId;

      elements.jointPanel.style.display = 'flex';
      elements.jointInfo.innerHTML =
        `<span class="hi">${joint.id}</span><br>` +
        `${labelA} · ${joint.a.portId}<br>` +
        `${labelB} · ${joint.b.portId}<br>` +
        `${t('joint.rule')}: <span class="hi">${joint.ruleId}</span>`;
      if (structureWidget) {
        structureWidget.update(buildStructureWidgetState());
      }
      refreshPropertiesWidget();
      refreshCallouts();
    }

    function setSelectedJoint(jointId, options) {
      const config = Object.assign({ preservePartSelection: false }, options || {});
      clearTransientSelectionHighlights();

      if (jointId && !config.preservePartSelection && selectedPartId && getPart(selectedPartId)) {
        const previousSelectedPartId = selectedPartId;
        selectedPartId = null;
        syncPartView(previousSelectedPartId);
      }

      selectedJointId = jointId && getJoint(jointId) ? jointId : null;
      updateJointInfo();
      updateSelectionInfo();
      refreshJointOverlay();
      refreshGizmo();
      refreshCallouts();
    }

    function selectPart(partId, options) {
      const config = Object.assign({ clearJoint: true }, options || {});
      clearTransientSelectionHighlights();
      const previousId = selectedPartId;
      selectedPartId = partId || null;

      if (config.clearJoint) {
        selectedJointId = null;
      }

      if (previousId && previousId !== selectedPartId && getPart(previousId)) {
        syncPartView(previousId);
      }
      if (selectedPartId && getPart(selectedPartId)) {
        syncPartView(selectedPartId);
      }

      updateSelectionInfo();
      updateJointInfo();
      refreshJointOverlay();
      refreshGizmo();
      refreshCallouts();
    }

    function deselectAll() {
      clearSelectedStructureState();
      selectPart(null);
    }

    function closeSelectionCallout() {
      deselectAll();
      setModeLabel('—');
    }

    function syncAllPartViews() {
      if (selectedPartId && !getPart(selectedPartId)) {
        selectedPartId = null;
      }
      if (selectedJointId && !getJoint(selectedJointId)) {
        selectedJointId = null;
      }
      if (selectedJointId) {
        selectedPartId = null;
      }
      if (previewedPartIds.size) {
        previewedPartIds = new Set(Array.from(previewedPartIds).filter(function(partId) {
          return !!getPart(partId);
        }));
        previewedPartId = previewedPartIds.size === 1
          ? Array.from(previewedPartIds)[0]
          : null;
      }
      if (hoveredJointId && !getJoint(hoveredJointId)) {
        hoveredJointId = null;
      }

      for (const partId of Array.from(partViews.keys())) {
        removePartView(partId);
      }
      for (const part of assembly.getParts()) {
        syncPartView(part.id);
      }

      refreshSceneOverlays();
      updateSelectionInfo();
      updateJointInfo();
      refreshGizmo();
      refreshCallouts();
    }

    function setModeLabel(text) {
      currentModeLabelText = formatModeLabelText(text || t('common.dash'));
      elements.modeLabel.textContent = currentModeLabelText;
      if (modeStatusWidget) {
        modeStatusWidget.update({ text: currentModeLabelText });
      }
      refreshAssemblyCatalogWidget();
      refreshLayoutControls();
    }

    function setSnapBadge(on) {
      snapBadgeActive = !!on;
      elements.snapBadge.classList.toggle('on', snapBadgeActive);
      if (snapStatusWidget) {
        snapStatusWidget.update({ active: snapBadgeActive });
      }
    }

    function partFromObject(object) {
      let current = object;
      while (current) {
        if (current.userData && current.userData.partId) {
          return getPart(current.userData.partId);
        }
        current = current.parent;
      }
      return null;
    }

    function collectPartMeshes(exceptPartIds) {
      const excluded = new Set(Array.isArray(exceptPartIds) ? exceptPartIds : exceptPartIds ? [exceptPartIds] : []);
      const meshes = [];
      for (const [partId, group] of partViews.entries()) {
        if (excluded.has(partId)) {
          continue;
        }
        group.traverse(child => {
          if (child.isMesh) {
            meshes.push(child);
          }
        });
      }
      return meshes;
    }

    function buildRigidComponentSnapshot(rootPartId, options) {
      const config = Object.assign({ excludedJointIds: [] }, options || {});
      const rootPart = getPart(rootPartId);
      if (!rootPart) {
        return null;
      }

      const component = assembly.getConnectedComponent(rootPartId, {
        excludedJointIds: config.excludedJointIds
      });
      const rootPosition = getPartPositionVector(rootPart);
      const rootQuaternion = getPartQuaternion(rootPart);
      const inverseRootQuaternion = rootQuaternion.clone().invert();

      const items = component.parts.map(part => {
        const position = getPartPositionVector(part);
        const quaternion = getPartQuaternion(part);
        return {
          partId: part.id,
          part,
          typeDef: getTypeDef(part),
          position: position.clone(),
          quaternion: quaternion.clone(),
          relativePosition: position.clone().sub(rootPosition).applyQuaternion(inverseRootQuaternion),
          relativeQuaternion: inverseRootQuaternion.clone().multiply(quaternion)
        };
      });

      const sourcePorts = [];
      for (const part of component.parts) {
        const ports = resolvePartPorts(part, getTypeDef(part))
          .filter(port => port.snapSource !== false && port.kind === 'fixed');

        for (const port of ports) {
          const connectionCount = assembly.getPortConnectionCount(part.id, port.portId, {
            excludedJointIds: config.excludedJointIds
          });
          if (connectionCount >= port.capacity) {
            continue;
          }

          sourcePorts.push(Object.assign({}, port, {
            localPosition: port.position.clone().sub(rootPosition).applyQuaternion(inverseRootQuaternion),
            localNormal: port.normal.clone().applyQuaternion(inverseRootQuaternion).normalize(),
            localUp: port.up.clone().applyQuaternion(inverseRootQuaternion).normalize(),
            priorityBias: 0
          }));
        }
      }

      const hasRootPartPorts = sourcePorts.some(port => port.partId === rootPartId);
      if (hasRootPartPorts) {
        for (const port of sourcePorts) {
          if (port.partId !== rootPartId) {
            port.priorityBias = 8;
          }
        }
      }

      return {
        rootPartId,
        excludedJointIds: (config.excludedJointIds || []).slice(),
        partIds: component.partIds.slice(),
        joints: component.joints.slice(),
        items,
        sourcePorts,
        rootStartPosition: rootPosition.clone(),
        rootStartQuaternion: rootQuaternion.clone(),
        currentRootPosition: rootPosition.clone(),
        currentRootQuaternion: rootQuaternion.clone()
      };
    }

    function buildGhostItems(snapshot) {
      return snapshot.items.map(item => ({
        typeDef: item.typeDef,
        part: item.part,
        position: item.position.clone(),
        quaternion: item.quaternion.clone()
      }));
    }

    function getComponentPoses(snapshot, rootPosition, rootQuaternion) {
      return snapshot.items.map(item => ({
        partId: item.partId,
        position: item.relativePosition.clone().applyQuaternion(rootQuaternion).add(rootPosition),
        quaternion: rootQuaternion.clone().multiply(item.relativeQuaternion)
      }));
    }

    function applyComponentTransform(snapshot, rootPosition, rootQuaternion) {
      const poses = getComponentPoses(snapshot, rootPosition, rootQuaternion);
      for (const pose of poses) {
        assembly.setPartTransform(pose.partId, pose.position, pose.quaternion);
        updatePartTransform(pose.partId);
      }

      snapshot.currentRootPosition = rootPosition.clone();
      snapshot.currentRootQuaternion = rootQuaternion.clone();
      return poses;
    }

    function beginRigidInteraction(rootPartId, options) {
      const config = Object.assign({ showGhost: false }, options || {});
      rememberUndoSnapshot();
      activeInteraction = buildRigidComponentSnapshot(rootPartId);
      activePartId = rootPartId;
      activeSnap = null;
      interactionEdited = false;

      if (activeInteraction && config.showGhost) {
        preview.createGhost(buildGhostItems(activeInteraction));
      }

      return activeInteraction;
    }

    function applyLengthTransform(partId, nextLength, sign, fixedEnd, quaternion) {
      const center = fixedEnd.clone().addScaledVector(lAxis, sign * nextLength / 2);
      assembly.updatePartParam(partId, 'length', nextLength);
      assembly.setPartTransform(partId, center, quaternion);
      syncPartView(partId);
      return center;
    }

    function clearGizmoHover() {
      gizmo.setHoverHandleId(null);
    }

    function resolveHoveredJointId(clientX, clientY) {
      if (selectedPartId && gizmo.isVisible()) {
        const gizmoHits = hitObjects(clientX, clientY, gizmo.getHandleMeshes());
        if (gizmoHits.length) {
          return null;
        }
      }

      const jointHits = hitObjects(clientX, clientY, preview.getJointPickMeshes());
      return jointHits.length ? jointHits[0].object.userData.jointId : null;
    }

    function updateJointHover(clientX, clientY) {
      if (mode !== 'idle' || pendingPick || activeInteraction || isOrbiting || isPanning || isConnectMode()) {
        setHoveredJoint(null);
        return;
      }

      setHoveredJoint(resolveHoveredJointId(clientX, clientY));
    }

    function updateGizmoHover(clientX, clientY) {
      if (!selectedPartId || !gizmo.isVisible() || mode !== 'idle' || pendingPick || isOrbiting || isPanning) {
        clearGizmoHover();
        return;
      }

      const hits = hitObjects(clientX, clientY, gizmo.getHandleMeshes());
      gizmo.setHoverHandleId(hits.length ? hits[0].object.userData.handleId : null);
    }

    function beginLengthInteraction(part, sign, handleId, clientX, clientY, selectedPosition, selectedQuaternion) {
      const resizeInfo = getResizeHandleInfo(part, sign);
      if (!resizeInfo.enabled) {
        setModeLabel('RESIZE LOCKED');
        return false;
      }

      rememberUndoSnapshot();
      mode = 'length';
      interactionEdited = false;
      lResizeSnap = null;
      lSign = sign;
      lDraggedPortId = resizeInfo.draggedPortId;
      lFixedPortId = resizeInfo.fixedPortId;
      lStartLen = part.params.length;
      lStartCenter.copy(selectedPosition);
      lStartQuat.copy(selectedQuaternion);
      lAxis.set(1, 0, 0).applyQuaternion(selectedQuaternion).normalize();
      lFixedEnd.copy(selectedPosition).addScaledVector(lAxis, -lSign * lStartLen / 2);

      const camForward = viewport.camera.getWorldDirection(new THREE.Vector3());
      const planeNormal = new THREE.Vector3().crossVectors(lAxis, camForward).cross(lAxis).normalize();
      if (planeNormal.lengthSq() < 0.001) {
        planeNormal.copy(camForward);
      }

      const draggedEnd = lFixedEnd.clone().addScaledVector(lAxis, lSign * lStartLen);
      lDragPlane.setFromNormalAndCoplanarPoint(planeNormal, draggedEnd);
      const hit = rayOnPlane(clientX, clientY, planeNormal, draggedEnd);
      if (hit) {
        lStartHit.copy(hit);
      } else {
        lStartHit.copy(draggedEnd);
      }

      gizmo.setActiveHandleId(handleId);
      updateInteractionHud();
      setModeLabel(`LENGTH ${sign > 0 ? 'B' : 'A'}`);
      refreshCallouts();
      return true;
    }

    function clearPendingPick() {
      pendingPick = null;
    }

    function beginPartDrag(partId, clientX, clientY, seed) {
      setHoveredJoint(null);
      mode = 'dragPart';
      selectPart(partId);

      const snapshot = beginRigidInteraction(partId, { showGhost: true });
      if (!snapshot) {
        endInteraction();
        return false;
      }

      dragStartPos.copy(snapshot.rootStartPosition);
      const camForward = viewport.camera.getWorldDirection(new THREE.Vector3()).negate();
      dpDragPlane.setFromNormalAndCoplanarPoint(camForward, dragStartPos);
      const hit = seed && seed.dragPlaneHit
        ? seed.dragPlaneHit.clone()
        : rayOnPlane(clientX, clientY, dpDragPlane.normal, dragStartPos);

      if (hit) {
        dpOffset.copy(dragStartPos).sub(hit);
      } else {
        dpOffset.set(0, 0, 0);
      }

      setModeLabel('DRAG');
      updateInteractionHud();
      refreshCallouts();
      return true;
    }

    function cancelActiveInteraction() {
      clearTransientSelectionHighlights();
      clearPendingPick();
      clearRotateGizmoState();

      if (mode === 'postConnectAdjust') {
        finishPostConnectAdjust({ commit: false });
        return;
      }

      if ((mode === 'dragPart' || mode === 'translate' || mode === 'rotate') && activeInteraction) {
        applyComponentTransform(
          activeInteraction,
          activeInteraction.rootStartPosition,
          activeInteraction.rootStartQuaternion
        );
      }

      if (mode === 'length' && selectedPartId) {
        const part = getSelectedPart();
        if (part && part.typeId === 'profile-20x20') {
          assembly.setPartTransform(selectedPartId, lStartCenter, lStartQuat);
          assembly.updatePartParam(selectedPartId, 'length', lStartLen);
          syncPartView(selectedPartId);
        }
        lResizeSnap = null;
      }

      refreshSceneOverlays();
      refreshGizmo();
      hideInteractionHud();
      endInteraction();
      deselectAll();
      setModeLabel('—');
    }

    function disconnectSelectedPart() {
      const part = getSelectedPart();
      if (!part) {
        return;
      }

      beginCommittedHistoryChange();
      clearSelectedStructureState();

      const joint = getSelectedJoint();
      if (joint && (joint.a.partId === part.id || joint.b.partId === part.id)) {
        selectedJointId = null;
      }

      assembly.disconnectPart(part.id);
      syncAllPartViews();
    }

    function splitSelectedJoint() {
      const joint = getSelectedJoint();
      if (!joint) {
        return;
      }

      beginCommittedHistoryChange();
      clearTransientSelectionHighlights();
      assembly.disconnectJoint(joint.id);
      selectedJointId = null;
      syncAllPartViews();
    }

    function endInteraction() {
      clearPendingPick();
      clearTransientSelectionHighlights();
      activeTranslateAxis = null;
      clearRotateGizmoState();
      interactionEdited = false;
      activePartId = null;
      activeSnap = null;
      activeInteraction = null;
      preview.removeGhost();
      preview.hideSnapRing();
      preview.hideFaceHighlight();
      setSnapBadge(false);
      mode = 'idle';
      isOrbiting = false;
      isPanning = false;
      lResizeSnap = null;
      lDraggedPortId = null;
      lFixedPortId = null;
      gizmo.clearInteractionState();
      hideInteractionHud();
      setModeLabel('—');
      refreshCallouts();
    }

    function addProfile() {
      beginCommittedHistoryChange();
      const length = clampProfileLength(profileLengthValue);
      const part = assembly.createPart('profile-20x20', { length }, {
        position: [viewport.orb.tx, PROFILE_SIZE / 2, viewport.orb.tz],
        quaternion: [0, 0, 0, 1]
      });
      syncPartView(part.id);
      refreshSceneOverlays();
      selectPart(part.id);
      return part;
    }

    function addConnector(typeId) {
      beginCommittedHistoryChange();
      const part = assembly.createPart(typeId, {}, {
        position: [viewport.orb.tx, PROFILE_SIZE / 2, viewport.orb.tz],
        quaternion: [0, 0, 0, 1]
      });
      syncPartView(part.id);
      refreshSceneOverlays();
      selectPart(part.id);
      return part;
    }

    function deleteSelected() {
      const part = getSelectedPart();
      if (!part) {
        return;
      }
      beginCommittedHistoryChange();
      clearSelectedStructureState();
      removePartView(part.id);
      assembly.removePart(part.id);
      selectedPartId = null;
      selectedJointId = null;
      refreshSceneOverlays();
      updateSelectionInfo();
      updateJointInfo();
      refreshGizmo();
      refreshCallouts();
    }

    function deleteCurrentSelection() {
      if (selectedJointId) {
        return false;
      }
      if (isSelectedStructureActive()) {
        return deleteSelectedStructure();
      }
      deleteSelected();
      return true;
    }

    function deleteSelectedStructure() {
      const component = getSelectedStructureComponent();
      if (!component) {
        return false;
      }

      beginCommittedHistoryChange();
      for (const partId of component.partIds) {
        removePartView(partId);
        assembly.removePart(partId);
      }

      selectedPartId = null;
      selectedJointId = null;
      clearSelectedStructureState();
      refreshSceneOverlays();
      updateSelectionInfo();
      updateJointInfo();
      refreshGizmo();
      refreshCallouts();
      return true;
    }

    function clearSceneWithConfirmation() {
      if (!canClearScene()) {
        return false;
      }

      if (!window.confirm(t('dialogs.clearSceneConfirm'))) {
        return false;
      }

      beginCommittedHistoryChange();
      applyEditorSnapshot(createEmptyEditorSnapshot({ camera: viewport.getCameraState() }));
      setModeLabel('—');
      return true;
    }

    function toggleAlign() {
      snapAlign = !snapAlign;
      elements.alignState.textContent = getBooleanLabel(snapAlign);
      elements.alignState.style.color = snapAlign ? '#22ff88' : '#ff4455';
      refreshLayoutControls();
    }

    function toggleConnectDebug() {
      connectDebugEnabled = !connectDebugEnabled;
      updateConnectDebugUi();
      if (!connectDebugEnabled) {
        connectDebugController.clear();
      } else if (connectState && connectState.targetSelectionDiagnostics) {
        refreshConnectDebugPreview();
      }
    }

    function bindConnectDebugOption(input, optionKey) {
      if (!input) {
        return function() {};
      }

      const bindings = connectDebugOptionBindings.get(optionKey) || [];
      const binding = { input: input };
      bindings.push(binding);
      connectDebugOptionBindings.set(optionKey, bindings);

      input.checked = !!connectDebugOptions[optionKey];
      function handleChange() {
        connectDebugOptions[optionKey] = !!input.checked;
        const optionBindings = connectDebugOptionBindings.get(optionKey) || [];
        for (const optionBinding of optionBindings) {
          if (optionBinding.input !== input) {
            optionBinding.input.checked = !!connectDebugOptions[optionKey];
          }
        }
        refreshConnectDebugPreview();
      }

      input.addEventListener('change', handleChange);

      return function() {
        input.removeEventListener('change', handleChange);
        const optionBindings = connectDebugOptionBindings.get(optionKey) || [];
        const bindingIndex = optionBindings.indexOf(binding);
        if (bindingIndex >= 0) {
          optionBindings.splice(bindingIndex, 1);
        }
        if (!optionBindings.length) {
          connectDebugOptionBindings.delete(optionKey);
        }
      };
    }

    function createPrototypeConnectDebugTab(container) {
      const cleanups = [];
      const commonOptionsLabel = createWidgetElement('div', 'canvas-layout-section-label', t('debug.commonFlags'));
      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = 'canvas-layout-button';
      toggleButton.style.width = '100%';
      toggleButton.style.alignSelf = 'stretch';

      const toggleLabel = document.createElement('span');
      toggleLabel.className = 'canvas-layout-button-label';
      toggleLabel.textContent = t('actions.portDebug');
      toggleButton.appendChild(toggleLabel);

      const toggleState = document.createElement('span');
      toggleState.className = 'canvas-layout-button-caption';
      toggleButton.appendChild(toggleState);
      container.appendChild(commonOptionsLabel);
      container.appendChild(toggleButton);

      const optionsPanel = document.createElement('div');
      optionsPanel.className = 'debug-options';
      optionsPanel.style.width = '100%';
      optionsPanel.style.boxSizing = 'border-box';
      container.appendChild(optionsPanel);

      cleanups.push(registerConnectDebugUiBinding({
        button: toggleButton,
        stateElement: toggleState,
        optionsPanel: optionsPanel
      }));

      const commonOptionConfigs = [
        { key: 'showRay', label: t('debug.showRay') },
        { key: 'showHitPoint', label: t('debug.showHitPoint') },
        { key: 'showPortNormal', label: t('debug.showPortNormal') },
        { key: 'showExactPlane', label: t('debug.showExactPlane') },
        { key: 'showLiftedOverlay', label: t('debug.showLiftedOverlay') },
        { key: 'showContactFootprint', label: t('debug.showContactFootprint') },
        { key: 'showShortlist', label: t('debug.showShortlist') }
      ];

      for (const optionConfig of commonOptionConfigs) {
        const label = document.createElement('label');
        label.className = 'debug-check';
        const input = document.createElement('input');
        input.type = 'checkbox';
        label.appendChild(input);
        label.appendChild(document.createTextNode(` ${optionConfig.label}`));
        optionsPanel.appendChild(label);
        cleanups.push(bindConnectDebugOption(input, optionConfig.key));
      }

      const strategyLabel = createWidgetElement('div', 'canvas-layout-section-label', t('legacy.sections.strategy'));
      container.appendChild(strategyLabel);

      const strategyControls = document.createElement('div');
      strategyControls.className = 'canvas-layout-widget-lines';
      strategyControls.style.width = '100%';
      strategyControls.style.minWidth = '0';
      container.appendChild(strategyControls);
      connectDebugController.attachControlsContainer(strategyControls);
      cleanups.push(function() {
        connectDebugController.detachControlsContainer(strategyControls);
      });

      return function() {
        while (cleanups.length) {
          const cleanup = cleanups.pop();
          cleanup();
        }
      };
    }

    function createPrototypeSettingsTab(container) {
      const cleanups = [];

      const label = document.createElement('div');
      label.className = 'canvas-layout-section-label';
      label.textContent = t('settings.targetStrategy');
      container.appendChild(label);

      const select = document.createElement('select');
      select.style.width = '100%';
      for (const strategy of targetSelectionStrategyRegistry.listStrategies()) {
        const option = document.createElement('option');
        option.value = strategy.id;
        option.textContent = strategy.label;
        select.appendChild(option);
      }
      select.value = targetSelectionStrategyRegistry.getActiveStrategyId();
      container.appendChild(select);

      function handleChange() {
        targetSelectionStrategyRegistry.setActiveStrategy(select.value);
        connectStrategyPanel.sync();
        applyActiveTargetSelectionStrategy();
      }

      select.addEventListener('change', handleChange);

      const alignLabel = createWidgetElement('div', 'canvas-layout-section-label', t('actions.alignment'));
      container.appendChild(alignLabel);

      const alignButton = document.createElement('button');
      alignButton.type = 'button';
      alignButton.className = 'canvas-layout-button';
      alignButton.style.width = '100%';
      alignButton.appendChild(createWidgetElement('span', 'canvas-layout-button-label', t('actions.alignment')));
      const alignState = createWidgetElement('span', 'canvas-layout-button-caption', '');
      alignButton.appendChild(alignState);
      function handleAlignClick(event) {
        event.preventDefault();
        toggleAlign();
      }
      alignButton.addEventListener('click', handleAlignClick);
      container.appendChild(alignButton);

      const undoLabel = createWidgetElement('div', 'canvas-layout-section-label', t('settings.undoHistory'));
      container.appendChild(undoLabel);

      const undoInfo = createWidgetElement('div', 'canvas-layout-widget-note', '');
      container.appendChild(undoInfo);

      const undoLimitRow = createWidgetElement('div', 'canvas-layout-widget-field-row');
      undoLimitRow.appendChild(createWidgetElement('span', 'canvas-layout-widget-field-label', t('settings.limit')));
      const undoLimitInput = createWidgetElement('input', 'canvas-layout-widget-number');
      undoLimitInput.type = 'number';
      undoLimitInput.min = '1';
      undoLimitInput.max = `${MAX_UNDO_HISTORY_LIMIT}`;
      undoLimitInput.step = '1';
      undoLimitInput.value = `${undoHistoryLimit}`;
      function handleUndoLimitChange() {
        setUndoHistoryLimit(undoLimitInput.value);
      }
      undoLimitInput.addEventListener('change', handleUndoLimitChange);
      undoLimitRow.appendChild(undoLimitInput);
      container.appendChild(undoLimitRow);

      const undoActions = createWidgetElement('div', 'canvas-layout-widget-actions');
      const undoButton = createCanvasActionButton({
        label: t('actions.undoStep'),
        caption: t('settings.undoActionCaption'),
        onClick: undoLastAction
      });
      const redoButton = createCanvasActionButton({
        label: t('actions.redoStep'),
        caption: t('settings.redoActionCaption'),
        onClick: redoLastAction
      });
      const clearUndoButton = createCanvasActionButton({
        label: t('actions.clearHistory'),
        caption: t('settings.clearHistoryCaption'),
        onClick: clearUndoHistory
      });
      undoActions.appendChild(undoButton);
      undoActions.appendChild(redoButton);
      undoActions.appendChild(clearUndoButton);
      container.appendChild(undoActions);

      cleanups.push(registerSettingsUiBinding({
        alignButton: alignButton,
        alignStateElement: alignState,
        undoInfoElement: undoInfo,
        undoButton: undoButton,
        redoButton: redoButton,
        clearUndoButton: clearUndoButton,
        undoLimitInput: undoLimitInput
      }));

      return function() {
        while (cleanups.length) {
          const cleanup = cleanups.pop();
          cleanup();
        }
        alignButton.removeEventListener('click', handleAlignClick);
        undoLimitInput.removeEventListener('change', handleUndoLimitChange);
        select.removeEventListener('change', handleChange);
      };
    }

    function createWidgetElement(tagName, className, text) {
      const element = document.createElement(tagName);
      if (className) {
        element.className = className;
      }
      if (typeof text === 'string') {
        element.textContent = text;
      }
      return element;
    }

    function createCanvasActionButton(config) {
      const button = createWidgetElement('button', 'canvas-layout-button', '');
      button.type = 'button';
      if (config.tone === 'accent') {
        button.classList.add('is-accent');
      }
      if (config.tone === 'success') {
        button.classList.add('is-success');
      }
      button.appendChild(createWidgetElement('span', 'canvas-layout-button-label', config.label || 'Action'));
      if (config.caption) {
        button.appendChild(createWidgetElement('span', 'canvas-layout-button-caption', config.caption));
      }
      if (config.disabled) {
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');
      }
      button.addEventListener('click', function(event) {
        event.preventDefault();
        if (button.disabled || typeof config.onClick !== 'function') {
          return;
        }
        config.onClick(event);
      });
      return button;
    }

    function mountPanelWidget(widget) {
      return function(container) {
        if (!widget || typeof widget.mount !== 'function') {
          return null;
        }
        widget.mount(container);
        return function() {
          if (typeof widget.unmount === 'function') {
            widget.unmount();
          }
        };
      };
    }

    function getPartPortJoints(partId, portId) {
      return assembly.getPartJoints(partId).filter(function(joint) {
        const matchesA = joint.a.partId === partId && joint.a.portId === portId;
        const matchesB = joint.b.partId === partId && joint.b.portId === portId;
        return matchesA || matchesB;
      });
    }

    function activateConnectSourcePort(partId, portId) {
      const part = getPart(partId);
      if (!part) {
        return false;
      }

      if (selectedPartId !== part.id || selectedJointId) {
        selectPart(part.id);
      }
      if (mode !== 'idle') {
        return false;
      }

      beginConnectMode();
      if (!connectState || !Array.isArray(connectState.sourceCandidates)) {
        return false;
      }

      const candidate = connectState.sourceCandidates.find(function(entry) {
        return entry && entry.port && entry.port.portId === portId;
      });
      if (!candidate) {
        return false;
      }

      beginConnectTargetPhase(candidate.key);
      refreshGizmo();
      refreshCallouts();
      return true;
    }

    function getProfileLengthEditConfig(part) {
      if (!part || part.typeId !== 'profile-20x20') {
        return {
          mode: 'disabled',
          reason: t('reasons.resizeOnlyProfile')
        };
      }

      const handles = getResizeHandlesConfig(part);
      if (handles[1].enabled && handles[1].hasAnchor) {
        return { mode: 'anchored', sign: 1 };
      }
      if (handles['-1'].enabled && handles['-1'].hasAnchor) {
        return { mode: 'anchored', sign: -1 };
      }
      if (handles[1].enabled || handles['-1'].enabled) {
        return { mode: 'centered' };
      }

      return {
        mode: 'disabled',
        reason: handles[1].reason || handles['-1'].reason || t('reasons.resizeFreeEndOnly')
      };
    }

    function applyProfileLengthFromProperties(partId, value) {
      const part = getPart(partId);
      if (!part || part.typeId !== 'profile-20x20') {
        return false;
      }

      const nextLength = clampProfileLength(value);
      if (Math.abs(nextLength - Number(part.params.length || 0)) < 0.001) {
        return true;
      }

      const editConfig = getProfileLengthEditConfig(part);
      if (editConfig.mode === 'disabled') {
        return false;
      }

      beginCommittedHistoryChange();
      if (editConfig.mode === 'anchored') {
        const position = getPartPositionVector(part);
        const quaternion = getPartQuaternion(part);
        const axis = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion).normalize();
        const fixedEnd = position.clone().addScaledVector(axis, -editConfig.sign * Number(part.params.length || 0) / 2);
        const center = fixedEnd.clone().addScaledVector(axis, editConfig.sign * nextLength / 2);
        assembly.updatePartParam(part.id, 'length', nextLength);
        assembly.setPartTransform(part.id, center, quaternion);
        syncPartView(part.id);
      } else {
        assembly.updatePartParam(part.id, 'length', nextLength);
        syncPartView(part.id);
      }

      refreshSceneOverlays();
      updateSelectionInfo();
      updateJointInfo();
      refreshGizmo();
      refreshCallouts();
      return true;
    }

    function openSelectedPartProperties(partId, options) {
      const config = Object.assign({ focusLength: false }, options || {});
      const targetPart = partId ? getPart(partId) : getSelectedPart();
      if (!targetPart) {
        return false;
      }

      if (selectedPartId !== targetPart.id || selectedJointId) {
        selectPart(targetPart.id);
      }
      activatePanelTab('left-sandbox-tabs', 'properties');
      if (config.focusLength && targetPart.typeId === 'profile-20x20' && propertiesWidget && typeof propertiesWidget.focusLengthInput === 'function') {
        propertiesWidget.focusLengthInput();
      }
      return true;
    }

    function openSelectedProfileLengthEditor(partId) {
      const targetPart = partId ? getPart(partId) : getSelectedPart();
      if (!targetPart || targetPart.typeId !== 'profile-20x20') {
        return false;
      }

      openSelectedPartProperties(targetPart.id, { focusLength: true });
      return true;
    }

    function buildSelectedPartWidgetState() {
      const part = getSelectedPart();
      if (!part || selectedJointId || areInspectorPanelsSuppressed()) {
        return {
          empty: t('widgets.partEmpty')
        };
      }

      const component = assembly.getConnectedComponent(part.id);
      const typeDef = getTypeDef(part);
      const position = part.transform.position;
      const jointCount = assembly.getJointCountForPart(part.id);
      const structureSelected = isSelectedStructureActive();

      return {
        title: `${typeDef.label} #${part.id}`,
        lines: [
          `${t('selection.length')}: ${part.typeId === 'profile-20x20' ? formatMillimeters(part.params.length) : t('common.dash')}`,
          `X:${position[0].toFixed(0)} Y:${position[1].toFixed(0)} Z:${position[2].toFixed(0)}`,
          `${t('selection.connections')}: ${jointCount}`,
          `${t('selection.subassembly')}: ${component.partIds.length}`
        ],
        actions: [
          {
            label: t('actions.connect'),
            caption: t('widgets.choosePortCaption'),
            tone: 'accent',
            disabled: !canConnectPart(part),
            onClick: beginConnectMode
          },
          {
            label: t('actions.selectConnectedStructure'),
            caption: t('widgets.selectStructureCaption'),
            tone: structureSelected ? 'accent' : null,
            disabled: component.partIds.length < 2,
            onClick: selectConnectedStructure
          },
          {
            label: t('actions.disconnect'),
            caption: t('widgets.disconnectCaption'),
            disabled: jointCount === 0,
            onClick: disconnectSelectedPart
          },
          {
            label: t('actions.delete'),
            caption: t('widgets.deleteCaption'),
            onClick: deleteSelected
          }
        ].concat(structureSelected ? [
          {
            label: t('actions.deleteStructure'),
            caption: t('widgets.deleteStructureCaption'),
            onClick: deleteSelectedStructure
          }
        ] : [])
      };
    }

    function buildStructureWidgetState() {
      const ungroupedItems = [];
      const groupedItems = new Map();
      const structurePartIds = getSelectedStructurePartIdSet();

      function buildItem(part) {
        const typeDef = getTypeDef(part);
        return {
          id: part.id,
          label: `${typeDef ? typeDef.label : part.typeId} #${part.id}`,
          caption: `${t('selection.connections')}: ${assembly.getJointCountForPart(part.id)}`,
          active: !selectedJointId && (structurePartIds.has(part.id) || selectedPartId === part.id)
        };
      }

      for (const part of assembly.getParts()) {
        const item = buildItem(part);
        const groupInfo = part.meta && part.meta.groupId
          ? {
            id: part.meta.groupId,
            name: part.meta.groupName || t('catalog.unnamed')
          }
          : null;

        if (!groupInfo) {
          ungroupedItems.push(item);
          continue;
        }

        if (!groupedItems.has(groupInfo.id)) {
          groupedItems.set(groupInfo.id, {
            id: groupInfo.id,
            name: groupInfo.name,
            partIds: [],
            items: []
          });
        }
        groupedItems.get(groupInfo.id).partIds.push(part.id);
        groupedItems.get(groupInfo.id).items.push(item);
      }

      return {
        ungroupedItems: ungroupedItems,
        groups: Array.from(groupedItems.values())
      };
    }

    function canSaveSelectedAssemblyToCatalog() {
      return mode === 'idle' && !!getSelectedPart() && !selectedJointId;
    }

    function canSaveSceneToCatalog() {
      return mode === 'idle' && assembly.getParts().length > 0;
    }

    function canClearScene() {
      return mode === 'idle' && assembly.getParts().length > 0;
    }

    function buildAssemblyCatalogWidgetState() {
      return {
        items: savedAssemblyEntries.map(function(entry) {
          return {
            id: entry.id,
            name: entry.name,
            scope: entry.scope,
            partCount: entry.partCount,
            jointCount: entry.jointCount,
            previewUrl: entry.thumbnailDataUrl || buildAssemblyCatalogPreviewDataUrl(entry)
          };
        })
      };
    }

    function buildSavedAssembliesWidgetState() {
      return {
        note: t('catalog.note'),
        canSaveSelection: canSaveSelectedAssemblyToCatalog(),
        canSaveScene: canSaveSceneToCatalog(),
        items: savedAssemblyEntries.map(function(entry) {
          return {
            id: entry.id,
            name: entry.name,
            scope: entry.scope,
            partCount: entry.partCount,
            jointCount: entry.jointCount
          };
        })
      };
    }

    function closeAssemblyCatalogModal() {
      if (typeof assemblyCatalogModalCleanup === 'function') {
        assemblyCatalogModalCleanup();
      }
      assemblyCatalogModalCleanup = null;
    }

    function getAssemblyCatalogEditingEntryRecord() {
      if (!assemblyCatalogEditingEntry) {
        return null;
      }

      return savedAssemblyEntries.find(function(entry) {
        return entry.id === assemblyCatalogEditingEntry.id;
      }) || null;
    }

    function openAssemblyCatalogModal(config) {
      closeAssemblyCatalogModal();

      if (!config || !overlayManager || typeof overlayManager.getLayerHost !== 'function') {
        return;
      }

      const modalHost = overlayManager.getLayerHost('modal');
      if (!modalHost) {
        return;
      }

      const cleanups = [];
      const backdrop = createWidgetElement('div', 'canvas-layout-catalog-modal-backdrop');
      const dialog = createWidgetElement('section', 'canvas-layout-widget-surface canvas-layout-catalog-modal');
      dialog.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', config.title || t('catalog.editorTitle')));
      dialog.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', config.note || t('catalog.modalNote')));

      const previewImage = document.createElement('img');
      previewImage.className = 'canvas-layout-catalog-modal-preview';
      previewImage.src = config.previewUrl || buildAssemblyCatalogPreviewDataUrl({
        name: config.name,
        scope: config.scope,
        partCount: config.partCount,
        jointCount: config.jointCount
      });
      previewImage.alt = config.name || t('catalog.unnamed');
      dialog.appendChild(previewImage);

      const lines = createWidgetElement('div', 'canvas-layout-tab-lines');
      lines.appendChild(createWidgetElement('div', '', `${t('catalog.scopeLabel')}: ${getAssemblyCatalogScopeLabel(config.scope)}`));
      lines.appendChild(createWidgetElement('div', '', `${t('catalog.parts')}: ${config.partCount}`));
      lines.appendChild(createWidgetElement('div', '', `${t('selection.connections')}: ${config.jointCount}`));
      dialog.appendChild(lines);

      const nameRow = createWidgetElement('label', 'canvas-layout-widget-field-row');
      nameRow.style.alignItems = 'center';
      nameRow.appendChild(createWidgetElement('span', 'canvas-layout-widget-field-label', t('catalog.nameLabel')));
      const nameInput = createWidgetElement('input', 'canvas-layout-widget-number');
      nameInput.type = 'text';
      nameInput.value = config.name || '';
      nameInput.style.width = '100%';
      nameInput.style.flex = '1 1 auto';
      nameRow.appendChild(nameInput);
      dialog.appendChild(nameRow);

      const actions = createWidgetElement('div', 'canvas-layout-widget-actions');
      actions.appendChild(createCanvasActionButton({
        label: config.confirmLabel || t('actions.done'),
        caption: config.confirmCaption || t('catalog.confirmCaption'),
        tone: config.confirmTone || 'success',
        onClick: function() {
          config.onConfirm();
        }
      }));
      if (config.secondaryAction) {
        actions.appendChild(createCanvasActionButton({
          label: config.secondaryAction.label,
          caption: config.secondaryAction.caption,
          onClick: function() {
            config.secondaryAction.onClick();
          }
        }));
      }
      actions.appendChild(createCanvasActionButton({
        label: t('actions.cancel'),
        caption: t('catalog.cancelCaption'),
        onClick: function() {
          config.onCancel();
        }
      }));
      dialog.appendChild(actions);

      backdrop.appendChild(dialog);
      modalHost.appendChild(backdrop);

      function syncDraftName() {
        config.onNameChange(nameInput.value);
      }

      function handleNameKeydown(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          config.onConfirm();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          config.onCancel();
        }
      }

      function handleBackdropClick(event) {
        if (event.target === backdrop) {
          config.onCancel();
        }
      }

      nameInput.addEventListener('input', syncDraftName);
      nameInput.addEventListener('keydown', handleNameKeydown);
      backdrop.addEventListener('click', handleBackdropClick);
      cleanups.push(function() {
        nameInput.removeEventListener('input', syncDraftName);
        nameInput.removeEventListener('keydown', handleNameKeydown);
        backdrop.removeEventListener('click', handleBackdropClick);
      });

      requestAnimationFrame(function() {
        nameInput.focus();
        nameInput.select();
      });

      assemblyCatalogModalCleanup = function() {
        while (cleanups.length) {
          const cleanup = cleanups.pop();
          cleanup();
        }
        backdrop.remove();
      };
    }

    function refreshAssemblyCatalogModal() {
      const editingEntry = getAssemblyCatalogEditingEntryRecord();

      if (assemblyCatalogDraft) {
        openAssemblyCatalogModal({
          title: t('catalog.editorTitle'),
          note: t('catalog.modalNote'),
          previewUrl: assemblyCatalogDraft.thumbnailDataUrl,
          name: assemblyCatalogDraft.name || assemblyCatalogDraft.defaultName,
          scope: assemblyCatalogDraft.scope,
          partCount: assemblyCatalogDraft.partCount,
          jointCount: assemblyCatalogDraft.jointCount,
          onNameChange: function(nextName) {
            if (assemblyCatalogDraft) {
              assemblyCatalogDraft.name = nextName;
            }
          },
          onConfirm: saveAssemblyCatalogDraft,
          onCancel: cancelAssemblyCatalogEntryDraft
        });
        return;
      }

      if (assemblyCatalogEditingEntry && editingEntry) {
        openAssemblyCatalogModal({
          title: t('catalog.manageTitle'),
          note: t('catalog.manageModalNote'),
          previewUrl: editingEntry.thumbnailDataUrl || buildAssemblyCatalogPreviewDataUrl(editingEntry),
          name: assemblyCatalogEditingEntry.name,
          scope: editingEntry.scope,
          partCount: editingEntry.partCount,
          jointCount: editingEntry.jointCount,
          confirmLabel: t('actions.renameCatalogEntry'),
          confirmCaption: t('catalog.renameCaption'),
          onNameChange: function(nextName) {
            if (assemblyCatalogEditingEntry) {
              assemblyCatalogEditingEntry.name = nextName;
            }
          },
          onConfirm: saveAssemblyCatalogEntryEditor,
          onCancel: cancelAssemblyCatalogEntryEditor,
          secondaryAction: {
            label: t('actions.removeFromCatalog'),
            caption: t('catalog.removeCaption'),
            onClick: removeAssemblyCatalogEntryFromEditor
          }
        });
        return;
      }

      closeAssemblyCatalogModal();
    }

    function refreshAssemblyCatalogWidget() {
      if (assemblyCatalogWidget) {
        assemblyCatalogWidget.update(buildAssemblyCatalogWidgetState());
      }
      if (savedAssembliesWidget) {
        savedAssembliesWidget.update(buildSavedAssembliesWidgetState());
      }
      refreshAssemblyCatalogModal();
    }

    function refreshPropertiesWidget() {
      if (propertiesWidget) {
        propertiesWidget.update(buildPropertiesWidgetState());
      }
    }

    function buildSelectedJointWidgetState() {
      const joint = getSelectedJoint();
      if (!joint || areInspectorPanelsSuppressed()) {
        return {
          empty: t('widgets.jointEmpty')
        };
      }

      const partA = getPart(joint.a.partId);
      const partB = getPart(joint.b.partId);
      const labelA = partA ? `${getTypeDef(partA).label} #${partA.id}` : joint.a.partId;
      const labelB = partB ? `${getTypeDef(partB).label} #${partB.id}` : joint.b.partId;

      return {
        title: joint.id,
        lines: [
          `${labelA} · ${joint.a.portId}`,
          `${labelB} · ${joint.b.portId}`,
          `${t('joint.rule')}: ${joint.ruleId}`
        ],
        actions: [
          {
            label: t('actions.split'),
            caption: 'Split joint',
            onClick: splitSelectedJoint
          }
        ]
      };
    }

    function buildPartPropertyPortItems(part) {
      if (!part) {
        return [];
      }

      const typeDef = getTypeDef(part);
      return resolvePartPorts(part, typeDef).map(function(port) {
        const joints = getPartPortJoints(part.id, port.portId);
        const primaryJoint = joints[0] || null;
        const linkedPartId = primaryJoint
          ? (primaryJoint.a.partId === part.id ? primaryJoint.b.partId : primaryJoint.a.partId)
          : null;
        const linkedPart = linkedPartId ? getPart(linkedPartId) : null;
        const isSourcePort = port.kind === 'fixed' && port.snapSource !== false;
        const canStartConnect = isSourcePort && assembly.getPortConnectionCount(part.id, port.portId) < port.capacity;
        const captionParts = [];

        if (joints.length) {
          captionParts.push(`${t('selection.connections')}: ${joints.length}`);
          if (linkedPart) {
            captionParts.push(`${getPartTypeLabel(getTypeDef(linkedPart))} #${linkedPart.id}`);
          }
        } else {
          captionParts.push(canStartConnect ? t('widgets.portReady') : t('widgets.portPassive'));
        }

        return {
          label: port.portId,
          caption: captionParts.join(' · '),
          tone: joints.length ? 'accent' : null,
          disabled: !joints.length && !canStartConnect,
          previewPartId: linkedPartId,
          onClick: function() {
            if (primaryJoint) {
              setSelectedJoint(primaryJoint.id);
              setModeLabel('JOINT');
              return;
            }
            activateConnectSourcePort(part.id, port.portId);
          }
        };
      });
    }

    function buildJointPropertyPartItems(joint) {
      if (!joint) {
        return [];
      }

      return [joint.a, joint.b].map(function(side) {
        const part = getPart(side.partId);
        const label = part
          ? `${getPartTypeLabel(getTypeDef(part))} #${part.id}`
          : side.partId;

        return {
          label: label,
          caption: side.portId,
          previewPartId: side.partId,
          onClick: function() {
            selectPart(side.partId);
            setModeLabel('SELECT');
          }
        };
      });
    }

    function buildPropertiesWidgetState() {
      if (areInspectorPanelsSuppressed()) {
        return {
          empty: t('widgets.propertiesEmpty')
        };
      }

      const joint = getSelectedJoint();
      if (joint) {
        const jointState = buildSelectedJointWidgetState();
        return {
          title: jointState.title,
          lines: jointState.lines,
          actions: jointState.actions,
          sections: [
            {
              title: t('widgets.propertiesLinkedParts'),
              items: buildJointPropertyPartItems(joint)
            }
          ]
        };
      }

      const part = getSelectedPart();
      if (part) {
        const partState = buildSelectedPartWidgetState();
        const lengthEditorConfig = part.typeId === 'profile-20x20'
          ? getProfileLengthEditConfig(part)
          : null;
        return {
          partId: part.id,
          title: partState.title,
          lines: partState.lines,
          actions: partState.actions,
          lengthEditor: lengthEditorConfig
            ? {
                label: t('legacy.fields.length'),
                value: clampProfileLength(part.params.length),
                disabled: lengthEditorConfig.mode === 'disabled',
                note: lengthEditorConfig.mode === 'disabled' ? lengthEditorConfig.reason : ''
              }
            : null,
          sections: [
            {
              title: t('widgets.propertiesPorts'),
              items: buildPartPropertyPortItems(part)
            }
          ]
        };
      }

      return {
        empty: t('widgets.propertiesEmpty')
      };
    }

    function createAddPartWidget() {
      const previewCache = {};

      function createPartPreviewSnapshot(typeId, params) {
        return {
          parts: [
            {
              id: 'preview-part',
              typeId: typeId,
              params: catalog.normalizeParams(typeId, params || {}),
              transform: {
                position: [0, PROFILE_SIZE / 2, 0],
                quaternion: [0, 0, 0, 1]
              },
              meta: {}
            }
          ],
          joints: []
        };
      }

      function getPartPreviewUrl(typeId, params) {
        const cacheKey = `${typeId}:${JSON.stringify(catalog.normalizeParams(typeId, params || {}))}`;
        if (!previewCache[cacheKey]) {
          previewCache[cacheKey] = captureAssemblyCatalogThumbnailDataUrl(createPartPreviewSnapshot(typeId, params));
        }
        return previewCache[cacheKey];
      }

      return createDomWidget({
        widgetType: 'control',
        initialState: { length: profileLengthValue },
        render: function(container, state) {
          container.style.width = '100%';
          container.style.alignItems = 'stretch';

          const defaultProfileLength = clampProfileLength(state && state.length);
          const items = [
            {
              id: 'profile-20x20',
              title: t('actions.profile'),
              lines: [
                t('partTypes.profile20x20'),
                `${t('selection.length')}: ${formatMillimeters(defaultProfileLength)}`
              ],
              previewUrl: getPartPreviewUrl('profile-20x20', { length: defaultProfileLength }),
              onAdd: addProfile,
              onAddAndEdit: function() {
                const part = addProfile();
                if (part) {
                  openSelectedProfileLengthEditor(part.id);
                }
              }
            },
            {
              id: 'connector-angle-20',
              title: t('actions.angle'),
              lines: [t('partTypes.connectorAngle20')],
              previewUrl: getPartPreviewUrl('connector-angle-20', {}),
              onAdd: function() {
                addConnector('connector-angle-20');
              }
            },
            {
              id: 'connector-straight-20',
              title: t('actions.straight'),
              lines: [t('partTypes.connectorStraight20')],
              previewUrl: getPartPreviewUrl('connector-straight-20', {}),
              onAdd: function() {
                addConnector('connector-straight-20');
              }
            }
          ];

          const grid = createWidgetElement('div', 'canvas-layout-tab-grid');
          grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(220px,240px))';
          grid.style.justifyContent = 'start';
          grid.style.width = '100%';

          for (const item of items) {
            const card = createWidgetElement('section', 'canvas-layout-tab-card');
            card.style.width = '100%';
            card.style.maxWidth = '240px';
            card.style.position = 'relative';

            const addButton = document.createElement('button');
            addButton.type = 'button';
            addButton.style.display = 'flex';
            addButton.style.flexDirection = 'column';
            addButton.style.gap = '6px';
            addButton.style.width = '100%';
            addButton.style.padding = '0';
            addButton.style.border = 'none';
            addButton.style.background = 'transparent';
            addButton.style.color = 'inherit';
            addButton.style.cursor = 'pointer';
            addButton.style.textAlign = 'left';
            addButton.setAttribute('aria-label', item.title);

            const previewImage = document.createElement('img');
            previewImage.src = item.previewUrl;
            previewImage.alt = item.title;
            previewImage.style.width = '100%';
            previewImage.style.aspectRatio = '16 / 9';
            previewImage.style.objectFit = 'cover';
            previewImage.style.borderRadius = '6px';
            previewImage.style.border = '1px solid #2f3f63';
            previewImage.style.background = 'rgba(16,21,31,.92)';
            addButton.appendChild(previewImage);
            addButton.appendChild(createWidgetElement('div', 'canvas-layout-tab-card-title', item.title));

            const lines = createWidgetElement('div', 'canvas-layout-tab-lines');
            for (const line of item.lines || []) {
              lines.appendChild(createWidgetElement('div', '', line));
            }
            addButton.appendChild(lines);

            addButton.addEventListener('click', function(event) {
              event.preventDefault();
              item.onAdd();
            });
            card.appendChild(addButton);

            if (typeof item.onAddAndEdit === 'function') {
              const quickEditButton = document.createElement('button');
              quickEditButton.type = 'button';
              quickEditButton.textContent = '✎';
              quickEditButton.title = t('actions.addAndEditLength');
              quickEditButton.setAttribute('aria-label', t('actions.addAndEditLength'));
              quickEditButton.style.position = 'absolute';
              quickEditButton.style.top = '12px';
              quickEditButton.style.right = '12px';
              quickEditButton.style.width = '28px';
              quickEditButton.style.height = '28px';
              quickEditButton.style.border = '1px solid #4d74b6';
              quickEditButton.style.borderRadius = '999px';
              quickEditButton.style.background = 'rgba(11,16,25,.94)';
              quickEditButton.style.color = '#dce6ff';
              quickEditButton.style.cursor = 'pointer';
              quickEditButton.style.fontFamily = 'JetBrains Mono, monospace';
              quickEditButton.style.fontSize = '12px';
              quickEditButton.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                item.onAddAndEdit();
              });
              card.appendChild(quickEditButton);
            }

            grid.appendChild(card);
          }

          container.appendChild(grid);
        }
      });
    }

    function createStructureWidget() {
      return createDomWidget({
        widgetType: 'inspector',
        initialState: buildStructureWidgetState(),
        render: function(container, state) {
          const cleanups = [];
          container.style.width = '100%';
          container.style.height = 'auto';
          container.style.minHeight = '0';
          container.style.alignItems = 'stretch';

          const card = createWidgetElement('section', 'canvas-layout-widget-surface');
          card.style.width = '100%';
          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.structure')));
          const hasUngroupedItems = !!(state && Array.isArray(state.ungroupedItems) && state.ungroupedItems.length);
          const hasGroups = !!(state && Array.isArray(state.groups) && state.groups.length);
          if (!hasUngroupedItems && !hasGroups) {
            card.appendChild(createWidgetElement('div', 'canvas-layout-widget-empty', t('widgets.structureEmpty')));
            container.appendChild(card);
            return;
          }

          function createStructureButton(item, options) {
            const button = createCanvasActionButton({
              label: item.label,
              caption: item.caption,
              tone: item.active ? 'accent' : null,
              onClick: function() {
                selectPart(item.id);
                setModeLabel('SELECT');
              }
            });
            button.style.width = '100%';

            const enablePreview = !options || options.enablePreview !== false;
            if (!enablePreview) {
              return button;
            }

            function handleMouseEnter() {
              setPreviewedPart(item.id);
            }

            function handleMouseLeave() {
              setPreviewedPart(null);
            }

            button.addEventListener('mouseenter', handleMouseEnter);
            button.addEventListener('mouseleave', handleMouseLeave);
            button.addEventListener('focus', handleMouseEnter);
            button.addEventListener('blur', handleMouseLeave);
            cleanups.push(function() {
              button.removeEventListener('mouseenter', handleMouseEnter);
              button.removeEventListener('mouseleave', handleMouseLeave);
              button.removeEventListener('focus', handleMouseEnter);
              button.removeEventListener('blur', handleMouseLeave);
            });

            return button;
          }

          if (hasUngroupedItems) {
            const actions = createWidgetElement('div', 'canvas-layout-button-stack is-column');
            actions.style.flexWrap = 'nowrap';
            for (const item of state.ungroupedItems) {
              actions.appendChild(createStructureButton(item));
            }
            card.appendChild(actions);
          }

          if (hasGroups) {
            const groups = createWidgetElement('div', 'canvas-layout-widget-lines');
            groups.style.gap = '8px';
            for (const group of state.groups) {
              const groupCard = createWidgetElement('section', 'canvas-layout-tab-card');
              groupCard.style.width = '100%';

              function handleGroupMouseEnter() {
                setPreviewedParts(group.partIds);
              }

              function handleGroupMouseLeave() {
                setPreviewedPart(null);
              }

              function handleGroupFocusOut(event) {
                if (groupCard.contains(event.relatedTarget)) {
                  return;
                }
                setPreviewedPart(null);
              }

              groupCard.addEventListener('mouseenter', handleGroupMouseEnter);
              groupCard.addEventListener('mouseleave', handleGroupMouseLeave);
              groupCard.addEventListener('focusin', handleGroupMouseEnter);
              groupCard.addEventListener('focusout', handleGroupFocusOut);
              cleanups.push(function() {
                groupCard.removeEventListener('mouseenter', handleGroupMouseEnter);
                groupCard.removeEventListener('mouseleave', handleGroupMouseLeave);
                groupCard.removeEventListener('focusin', handleGroupMouseEnter);
                groupCard.removeEventListener('focusout', handleGroupFocusOut);
              });

              groupCard.appendChild(createWidgetElement('div', 'canvas-layout-tab-card-title', group.name));
              groupCard.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', `${t('catalog.parts')}: ${group.items.length}`));
              const groupActions = createWidgetElement('div', 'canvas-layout-button-stack is-column');
              groupActions.style.flexWrap = 'nowrap';
              for (const item of group.items) {
                groupActions.appendChild(createStructureButton(item, { enablePreview: false }));
              }
              groupCard.appendChild(groupActions);
              groups.appendChild(groupCard);
            }
            card.appendChild(groups);
          }

          container.appendChild(card);

          return function() {
            setPreviewedPart(null);
            while (cleanups.length) {
              const cleanup = cleanups.pop();
              cleanup();
            }
          };
        }
      });
    }

    function createPropertiesWidget() {
      let lengthInput = null;
      let shouldFocusLengthInput = false;

      const widget = createDomWidget({
        widgetType: 'inspector',
        initialState: buildPropertiesWidgetState(),
        render: function(container, state) {
          const cleanups = [];
          container.style.width = '100%';
          container.style.alignItems = 'stretch';

          const card = createWidgetElement('section', 'canvas-layout-widget-surface');
          card.style.width = '100%';
          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.properties')));
          if (!state || state.empty) {
            card.appendChild(createWidgetElement('div', 'canvas-layout-widget-empty', state && state.empty ? state.empty : t('widgets.noData')));
            container.appendChild(card);
            return;
          }

          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', state.title));

          if (state.lengthEditor) {
            const row = createWidgetElement('label', 'canvas-layout-widget-field-row');
            row.style.alignItems = 'center';
            row.appendChild(createWidgetElement('span', 'canvas-layout-widget-field-label', state.lengthEditor.label));

            const input = createWidgetElement('input', 'canvas-layout-widget-number');
            input.type = 'number';
            input.min = '40';
            input.max = '800';
            input.step = '10';
            input.value = `${clampProfileLength(state.lengthEditor.value)}`;
            input.style.width = '88px';
            if (state.lengthEditor.disabled) {
              input.disabled = true;
            }
            row.appendChild(input);
            row.appendChild(createWidgetElement('span', 'canvas-layout-widget-field-label', t('common.mm')));
            card.appendChild(row);

            if (state.lengthEditor.note) {
              card.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', state.lengthEditor.note));
            }

            function applyLengthChange() {
              applyProfileLengthFromProperties(state.partId, input.value);
            }

            function handleKeydown(event) {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLengthChange();
                input.blur();
              }
            }

            input.addEventListener('change', applyLengthChange);
            input.addEventListener('keydown', handleKeydown);
            cleanups.push(function() {
              input.removeEventListener('change', applyLengthChange);
              input.removeEventListener('keydown', handleKeydown);
            });

            lengthInput = input;
            if (shouldFocusLengthInput && !input.disabled) {
              requestAnimationFrame(function() {
                if (lengthInput === input) {
                  input.focus();
                  input.select();
                  shouldFocusLengthInput = false;
                }
              });
            }
          } else {
            lengthInput = null;
          }

          const lines = createWidgetElement('div', 'canvas-layout-widget-lines');
          for (const line of state.lines || []) {
            lines.appendChild(createWidgetElement('div', '', line));
          }
          card.appendChild(lines);

          for (const section of state.sections || []) {
            card.appendChild(createWidgetElement('div', 'canvas-layout-section-label', section.title));

            if (!Array.isArray(section.items) || !section.items.length) {
              card.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', t('widgets.noData')));
              continue;
            }

            const sectionActions = createWidgetElement('div', 'canvas-layout-button-stack is-column');
            sectionActions.style.flexWrap = 'nowrap';
            for (const item of section.items) {
              const button = createCanvasActionButton(item);
              button.style.width = '100%';
              if (item.previewPartId) {
                function handlePreviewStart() {
                  setPreviewedPart(item.previewPartId);
                }

                function handlePreviewEnd() {
                  setPreviewedPart(null);
                }

                button.addEventListener('mouseenter', handlePreviewStart);
                button.addEventListener('mouseleave', handlePreviewEnd);
                button.addEventListener('focus', handlePreviewStart);
                button.addEventListener('blur', handlePreviewEnd);
                cleanups.push(function() {
                  button.removeEventListener('mouseenter', handlePreviewStart);
                  button.removeEventListener('mouseleave', handlePreviewEnd);
                  button.removeEventListener('focus', handlePreviewStart);
                  button.removeEventListener('blur', handlePreviewEnd);
                });
              }
              sectionActions.appendChild(button);
            }
            card.appendChild(sectionActions);
          }

          if (Array.isArray(state.actions) && state.actions.length) {
            const actions = createWidgetElement('div', 'canvas-layout-widget-actions');
            for (const action of state.actions) {
              actions.appendChild(createCanvasActionButton(action));
            }
            card.appendChild(actions);
          }

          container.appendChild(card);

          return function() {
            lengthInput = null;
            setPreviewedPart(null);
            while (cleanups.length) {
              const cleanup = cleanups.pop();
              cleanup();
            }
          };
        }
      });

      widget.focusLengthInput = function() {
        shouldFocusLengthInput = true;
        if (lengthInput && !lengthInput.disabled) {
          lengthInput.focus();
          lengthInput.select();
          shouldFocusLengthInput = false;
          return true;
        }
        return false;
      };

      return widget;
    }

    function createHintWidget() {
      return createDomWidget({
        widgetType: 'status',
        render: function(container) {
          const card = createWidgetElement('section', 'canvas-layout-widget-surface');
          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.hints')));
          const lines = createWidgetElement('div', 'canvas-layout-widget-lines');
          [
            t('hints.line1'),
            t('hints.line2'),
            t('hints.line3'),
            t('hints.line4'),
            t('hints.line5'),
            t('hints.line6')
          ].forEach(function(line) {
            lines.appendChild(createWidgetElement('div', '', line));
          });
          card.appendChild(lines);
          container.appendChild(card);
        }
      });
    }

    function createAssemblyCatalogWidget() {
      return createDomWidget({
        widgetType: 'catalog',
        initialState: buildAssemblyCatalogWidgetState(),
        render: function(container, state) {
          container.style.width = '100%';
          container.style.alignItems = 'stretch';

          if (!state || !Array.isArray(state.items) || state.items.length === 0) {
            const emptySurface = createWidgetElement('section', 'canvas-layout-widget-surface');
            emptySurface.style.width = '100%';
            emptySurface.appendChild(createWidgetElement('div', 'canvas-layout-widget-empty', t('catalog.empty')));
            container.appendChild(emptySurface);
            return;
          }

          const grid = createWidgetElement('div', 'canvas-layout-tab-grid');
          grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(220px,240px))';
          grid.style.justifyContent = 'start';
          grid.style.width = '100%';

          for (const item of state.items) {
            const card = createWidgetElement('button', 'canvas-layout-tab-card');
            card.type = 'button';
            card.style.textAlign = 'left';
            card.style.cursor = 'pointer';
            card.style.width = '100%';
            card.style.maxWidth = '240px';
            card.setAttribute('aria-label', `${t('catalog.insertCaption')}: ${item.name}`);
            const previewImage = document.createElement('img');
            previewImage.src = item.previewUrl;
            previewImage.alt = item.name;
            previewImage.style.width = '100%';
            previewImage.style.aspectRatio = '16 / 9';
            previewImage.style.objectFit = 'cover';
            previewImage.style.borderRadius = '6px';
            previewImage.style.border = '1px solid #2f3f63';
            previewImage.style.background = 'rgba(16,21,31,.92)';
            card.appendChild(previewImage);
            card.appendChild(createWidgetElement('div', 'canvas-layout-tab-card-title', item.name));

            card.addEventListener('click', function(event) {
              event.preventDefault();
              addAssemblyCatalogEntryToScene(item.id);
            });
            grid.appendChild(card);
          }

          container.appendChild(grid);
        }
      });
    }

    function createSavedAssembliesWidget() {
      return createDomWidget({
        widgetType: 'saved-assemblies',
        initialState: buildSavedAssembliesWidgetState(),
        render: function(container, state) {
          container.style.width = '100%';
          container.style.alignItems = 'stretch';

          const surface = createWidgetElement('section', 'canvas-layout-widget-surface');
          surface.style.width = '100%';
          surface.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.library')));
          surface.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', state && state.note ? state.note : t('catalog.note')));

          const actions = createWidgetElement('div', 'canvas-layout-widget-actions');
          actions.appendChild(createCanvasActionButton({
            label: t('actions.saveSelectionToCatalog'),
            caption: t('catalog.saveSelectionCaption'),
            tone: 'accent',
            disabled: !state || !state.canSaveSelection,
            onClick: function() {
              beginAssemblyCatalogEntryDraft('selection');
            }
          }));
          actions.appendChild(createCanvasActionButton({
            label: t('actions.saveSceneToCatalog'),
            caption: t('catalog.saveSceneCaption'),
            disabled: !state || !state.canSaveScene,
            onClick: function() {
              beginAssemblyCatalogEntryDraft('scene');
            }
          }));
          surface.appendChild(actions);
          container.appendChild(surface);

          if (!state || !Array.isArray(state.items) || state.items.length === 0) {
            const emptySurface = createWidgetElement('section', 'canvas-layout-widget-surface');
            emptySurface.style.width = '100%';
            emptySurface.appendChild(createWidgetElement('div', 'canvas-layout-widget-empty', t('catalog.empty')));
            container.appendChild(emptySurface);
          } else {
            const list = createWidgetElement('div', 'canvas-layout-widget-lines');
            list.style.gap = '8px';
            for (const item of state.items) {
              const card = createWidgetElement('button', 'canvas-layout-tab-card');
              card.type = 'button';
              card.style.width = '100%';
              card.style.textAlign = 'left';
              card.style.cursor = 'pointer';
              card.setAttribute('aria-label', item.name);

              card.appendChild(createWidgetElement('div', 'canvas-layout-tab-card-title', item.name));

              const lines = createWidgetElement('div', 'canvas-layout-tab-lines');
              lines.appendChild(createWidgetElement('div', '', `${t('catalog.scopeLabel')}: ${getAssemblyCatalogScopeLabel(item.scope)}`));
              lines.appendChild(createWidgetElement('div', '', `${t('catalog.parts')}: ${item.partCount}`));
              lines.appendChild(createWidgetElement('div', '', `${t('selection.connections')}: ${item.jointCount}`));
              card.appendChild(lines);

              card.addEventListener('click', function(event) {
                event.preventDefault();
                openAssemblyCatalogEntryEditor(item.id);
              });
              list.appendChild(card);
            }
            container.appendChild(list);
          }
        }
      });
    }

    function createConnectDebugDrawerWidget() {
      return createDomWidget({
        widgetType: 'connect-debug-drawer',
        render: function(container) {
          container.style.alignItems = 'flex-start';
          const surface = createWidgetElement('section', 'canvas-layout-widget-surface');
          surface.style.width = '100%';
          surface.style.alignSelf = 'flex-start';
          surface.style.height = 'auto';
          surface.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.targetDebug')));
          surface.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', t('widgets.targetDebugNote')));
          container.appendChild(surface);
          return createPrototypeConnectDebugTab(surface);
        }
      });
    }

    function createModeStatusWidget() {
      return createDomWidget({
        widgetType: 'status',
        initialState: { text: currentModeLabelText },
        render: function(container, state) {
          const chip = createWidgetElement('div', 'canvas-layout-status-chip');
          chip.appendChild(createWidgetElement('span', 'canvas-layout-status-chip-label', t('status.mode')));
          chip.appendChild(createWidgetElement('span', 'canvas-layout-status-chip-value', (state && state.text) || t('common.dash')));
          container.appendChild(chip);
        }
      });
    }

    function createSnapStatusWidget() {
      return createDomWidget({
        widgetType: 'status',
        initialState: { active: snapBadgeActive },
        render: function(container, state) {
          const chip = createWidgetElement('div', 'canvas-layout-status-chip');
          if (!state || !state.active) {
            chip.classList.add('is-hidden');
          } else {
            chip.classList.add('is-active');
          }
          chip.appendChild(createWidgetElement('span', 'canvas-layout-status-chip-label', t('status.snap')));
          chip.appendChild(createWidgetElement('span', 'canvas-layout-status-chip-value', t('status.snapActive')));
          container.appendChild(chip);
        }
      });
    }

    function createInteractionStatusWidget() {
      return createDomWidget({
        widgetType: 'status',
        initialState: { html: interactionHudMarkup },
        render: function(container, state) {
          const panel = createWidgetElement('div', 'canvas-layout-status-panel');
          if (!state || !state.html) {
            panel.classList.add('is-hidden');
          } else {
            panel.innerHTML = state.html;
          }
          container.appendChild(panel);
        }
      });
    }

    function bindTargetSelectionStrategyUi() {
      connectStrategyPanel.bind();
    }

    function exportJson() {
      const data = createEditorSnapshot();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'assembly.json';
      link.click();
      URL.revokeObjectURL(url);
    }

    function importJson(file) {
      const previousState = createEditorSnapshot();
      const reader = new FileReader();
      reader.onload = function(event) {
        const data = JSON.parse(event.target.result);
        beginCommittedHistoryChange(previousState);
        applyEditorSnapshot(data);
      };
      reader.readAsText(file);
    }

    function mountCanvasLayoutPrototype() {
      if (canvasLayoutPrototype && typeof canvasLayoutPrototype.destroy === 'function') {
        canvasLayoutPrototype.destroy();
      }

      canvasLayoutPrototype = createCanvasLayoutPrototype({
        container: overlayManager.getLayerHost('panels'),
        modalContainer: overlayManager.getLayerHost('modal'),
        onExportProject: exportJson,
        onImportProject: function() {
          elements.importInput.click();
        },
        topRightCollapsed: true,
        topRegionAnchorId: 'top-region',
        edgeDrawers: [
          {
            id: 'left-edge-debug-drawer',
            anchorId: 'top-region',
            label: t('legacy.sections.debug'),
            handleLabel: t('legacy.sections.debug'),
            width: '340px',
            handleSize: '30px',
            visibleEdgeWidth: subtleDrawerHandle.visibleEdgeWidth,
            hoverPeekWidth: subtleDrawerHandle.hoverPeekWidth,
            open: false,
            widget: connectDebugDrawerWidget
          }
        ],
        topRightTabs: [
          {
            id: 'project',
            label: t('project.tab'),
            buttons: [
              {
                label: t('actions.exportJson'),
                caption: t('project.exportCaption'),
                tone: 'accent',
                onClick: exportJson
              },
              {
                label: t('actions.importJson'),
                caption: t('project.importCaption'),
                onClick: function() {
                  elements.importInput.click();
                }
              }
            ]
          },
          {
            id: 'settings',
            label: t('settings.tab'),
            renderContent: createPrototypeSettingsTab
          }
        ],
        leftTabs: [
          {
            id: 'structure',
            label: t('widgets.structure'),
            renderContent: mountPanelWidget(structureWidget)
          },
          {
            id: 'properties',
            label: t('widgets.properties'),
            renderContent: mountPanelWidget(propertiesWidget)
          },
          {
            id: 'saved-assemblies',
            label: t('widgets.library'),
            renderContent: mountPanelWidget(savedAssembliesWidget)
          }
        ],
        iconRailItems: [
          {
            icon: '⌂',
            label: t('actions.resetView'),
            onClick: function() {
              viewport.resetCamera();
              refreshGizmo();
              refreshCallouts();
            }
          },
          {
            icon: '↶',
            label: t('actions.undoStep'),
            getDisabled: function() {
              return !canUndo() || isHistoryNavigationBlocked();
            },
            onClick: function() {
              undoLastAction();
            }
          },
          {
            icon: '↷',
            label: t('actions.redoStep'),
            getDisabled: function() {
              return !canRedo() || isHistoryNavigationBlocked();
            },
            onClick: function() {
              redoLastAction();
            }
          },
          {
            icon: '🗑',
            label: t('actions.clearScene'),
            getDisabled: function() {
              return !canClearScene();
            },
            onClick: function() {
              clearSceneWithConfirmation();
            }
          }
        ],
        secondaryIconRailItems: [
          {
            icon: '◫',
            label: t('actions.saveSelectionToCatalog'),
            getDisabled: function() {
              return !canSaveSelectedAssemblyToCatalog();
            },
            onClick: function() {
              beginAssemblyCatalogEntryDraft('selection');
            }
          },
          {
            icon: '▣',
            label: t('actions.saveSceneToCatalog'),
            getDisabled: function() {
              return !canSaveSceneToCatalog();
            },
            onClick: function() {
              beginAssemblyCatalogEntryDraft('scene');
            }
          }
        ],
        centerWidgets: [modeStatusWidget, snapStatusWidget, interactionStatusWidget],
        rightBottomWidgets: [viewCube],
        bottomTabs: [
          {
            id: 'help',
            label: t('widgets.hints'),
            renderContent: mountPanelWidget(hintWidget)
          },
          {
            id: 'parts',
            label: t('widgets.parts'),
            renderContent: mountPanelWidget(addPartWidget)
          },
          {
            id: 'catalog',
            label: t('widgets.assemblies'),
            renderContent: mountPanelWidget(assemblyCatalogWidget)
          }
        ],
        renderSettingsTab: createPrototypeSettingsTab
      });
    }

    function applyLocaleToUi() {
      syncStaticUiText();
      connectStrategyPanel.sync();
      if (addPartWidget && structureWidget && propertiesWidget && assemblyCatalogWidget && savedAssembliesWidget) {
        mountCanvasLayoutPrototype();
      }
      updateConnectDebugUi();
      updateSettingsUi();
      updateSelectionInfo();
      updateJointInfo();
    }

    syncStaticUiText();
    if (i18n && typeof i18n.subscribe === 'function') {
      i18n.subscribe(applyLocaleToUi);
    }

    elements.addProfileButton.addEventListener('click', addProfile);
    elements.addAngleButton.addEventListener('click', function() {
      addConnector('connector-angle-20');
    });
    elements.addStraightButton.addEventListener('click', function() {
      addConnector('connector-straight-20');
    });
    elements.connectButton.addEventListener('click', beginConnectMode);
    elements.disconnectButton.addEventListener('click', disconnectSelectedPart);
    elements.splitJointButton.addEventListener('click', splitSelectedJoint);
    elements.deleteButton.addEventListener('click', deleteCurrentSelection);
    elements.toggleAlignButton.addEventListener('click', toggleAlign);
    if (elements.topbarLanguageSelect) {
      elements.topbarLanguageSelect.addEventListener('change', handleLocaleSelectChange);
    }
    registerConnectDebugUiBinding({
      button: elements.toggleConnectDebugButton,
      stateElement: elements.connectDebugState,
      optionsPanel: elements.connectDebugOptionsPanel
    });
    bindConnectDebugOption(elements.debugShowRay, 'showRay');
    bindConnectDebugOption(elements.debugShowHitPoint, 'showHitPoint');
    bindConnectDebugOption(elements.debugShowPortNormal, 'showPortNormal');
    bindConnectDebugOption(elements.debugShowExactPlane, 'showExactPlane');
    bindConnectDebugOption(elements.debugShowLiftedOverlay, 'showLiftedOverlay');
    bindConnectDebugOption(elements.debugShowContactFootprint, 'showContactFootprint');
    bindConnectDebugOption(elements.debugShowShortlist, 'showShortlist');
    bindTargetSelectionStrategyUi();

    addPartWidget = createAddPartWidget();
    structureWidget = createStructureWidget();
    propertiesWidget = createPropertiesWidget();
    assemblyCatalogWidget = createAssemblyCatalogWidget();
    savedAssembliesWidget = createSavedAssembliesWidget();
    snapStatusWidget = createSnapStatusWidget();
    modeStatusWidget = createModeStatusWidget();
    interactionStatusWidget = createInteractionStatusWidget();
    const hintWidget = createHintWidget();
    const connectDebugDrawerWidget = createConnectDebugDrawerWidget();
    const subtleDrawerHandle = EDGE_DRAWER_PRESETS.subtleHandle;

    mountCanvasLayoutPrototype();
    elements.snapBadge.style.display = 'none';
    elements.dragHud.style.display = 'none';
    elements.modeLabel.style.display = 'none';
    syncProfileLength(profileLengthValue);
    structureWidget.update(buildStructureWidgetState());
    refreshPropertiesWidget();
    refreshAssemblyCatalogWidget();
    modeStatusWidget.update({ text: currentModeLabelText });
    snapStatusWidget.update({ active: snapBadgeActive });
    interactionStatusWidget.update({ html: interactionHudMarkup });
    elements.lengthInput.addEventListener('input', function() {
      syncProfileLength(elements.lengthInput.value);
    });
    elements.resetCameraButton.addEventListener('click', function() {
      viewport.resetCamera();
      refreshGizmo();
      refreshCallouts();
    });
    elements.exportButton.addEventListener('click', exportJson);
    elements.importButton.addEventListener('click', function() {
      elements.importInput.click();
    });
    elements.importInput.addEventListener('change', function(event) {
      const file = event.target.files && event.target.files[0];
      if (file) {
        importJson(file);
      }
      elements.importInput.value = '';
    });

    elements.canvas.addEventListener('mousedown', function(event) {
      clearTransientSelectionHighlights();
      if (event.button === 2) {
        clearGizmoHover();
        isPanning = true;
        lastMouse.x = event.clientX;
        lastMouse.y = event.clientY;
        event.preventDefault();
        return;
      }

      if (event.button !== 0) {
        return;
      }

      if (isConnectMode()) {
        event.preventDefault();
        return;
      }

      if (mode === 'postConnectAdjust') {
        clearPendingPick();
        event.preventDefault();
        return;
      }

      clearPendingPick();

      const hoveredJointCandidateId = resolveHoveredJointId(event.clientX, event.clientY);
      setHoveredJoint(hoveredJointCandidateId);

      if (selectedPartId && gizmo.isVisible()) {
        const hits = hitObjects(event.clientX, event.clientY, gizmo.getHandleMeshes());
        if (hits.length) {
          const userData = hits[0].object.userData;
          const selectedPart = getSelectedPart();
          const selectedPosition = getPartPositionVector(selectedPart);
          const selectedQuaternion = getPartQuaternion(selectedPart);
          gizmo.setActiveHandleId(userData.handleId);
          clearGizmoHover();

          if (userData.gizmoRole === 'translate') {
            beginRigidInteraction(selectedPartId);
            activeTranslateAxis = userData.gizmoAxis;
            const axisMap = {
              x: new THREE.Vector3(1, 0, 0),
              y: new THREE.Vector3(0, 1, 0),
              z: new THREE.Vector3(0, 0, 1)
            };
            mode = 'translate';
            tAxis.copy(axisMap[userData.gizmoAxis]).applyQuaternion(selectedQuaternion).normalize();
            const camForward = viewport.camera.getWorldDirection(new THREE.Vector3());
            const planeNormal = new THREE.Vector3().crossVectors(tAxis, camForward).cross(tAxis).normalize();
            if (planeNormal.lengthSq() < 0.001) {
              planeNormal.copy(camForward);
            }
            tDragPlane.setFromNormalAndCoplanarPoint(planeNormal, selectedPosition);
            tStartPos.copy(selectedPosition);
            const hit = rayOnPlane(event.clientX, event.clientY, planeNormal, selectedPosition);
            if (hit) {
              tStartHit.copy(hit);
            }
            setModeLabel(`MOVE ${userData.gizmoAxis.toUpperCase()}`);
            updateInteractionHud();
            refreshCallouts();
            event.preventDefault();
            return;
          }

          if (userData.gizmoRole === 'rotate') {
            beginRigidInteraction(selectedPartId);
            activeTranslateAxis = null;
            mode = 'rotate';
            activeRotateAxis = userData.gizmoAxis;
            activeRotateDelta = 0;
            activeRotateDisplayDelta = 0;
            rStartAngle = 0;
            rLastAngle = 0;
            const axisMap = {
              x: new THREE.Vector3(1, 0, 0),
              y: new THREE.Vector3(0, 1, 0),
              z: new THREE.Vector3(0, 0, 1)
            };
            rAxis.copy(axisMap[userData.gizmoAxis]).applyQuaternion(selectedQuaternion).normalize();
            rCenter.copy(selectedPosition);
            rStartQuat.copy(selectedQuaternion);
            const up = Math.abs(rAxis.y) < 0.9
              ? new THREE.Vector3(0, 1, 0)
              : new THREE.Vector3(1, 0, 0);
            rU.crossVectors(rAxis, up).normalize();
            rV.crossVectors(rU, rAxis).normalize();
            const hit = rayOnPlane(event.clientX, event.clientY, rAxis, rCenter);
            if (hit) {
              const toHit = hit.clone().sub(rCenter);
              rStartAngle = Math.atan2(toHit.dot(rV), toHit.dot(rU));
              rLastAngle = rStartAngle;
            }
            setModeLabel(`ROTATE ${userData.gizmoAxis.toUpperCase()}`);
            refreshCallouts();
            event.preventDefault();
            return;
          }

          if (userData.gizmoRole === 'length' && selectedPart.typeId === 'profile-20x20') {
            if (!beginLengthInteraction(
              selectedPart,
              userData.lenSign,
              userData.handleId,
              event.clientX,
              event.clientY,
              selectedPosition,
              selectedQuaternion
            )) {
              gizmo.clearInteractionState();
            }
            event.preventDefault();
            return;
          }
        }
      }

      if (hoveredJointCandidateId) {
        const joint = getJoint(hoveredJointCandidateId);
        if (joint) {
          pendingPick = {
            kind: 'joint',
            jointId: joint.id,
            startX: event.clientX,
            startY: event.clientY
          };
          event.preventDefault();
          return;
        }
      }

      const partMeshes = collectPartMeshes();
      const hits = hitObjects(event.clientX, event.clientY, partMeshes);
      if (hits.length) {
        const part = partFromObject(hits[0].object);
        if (part) {
          const camForward = viewport.camera.getWorldDirection(new THREE.Vector3()).negate();
          pendingPick = {
            kind: 'part',
            partId: part.id,
            startX: event.clientX,
            startY: event.clientY,
            dragPlaneHit: rayOnPlane(event.clientX, event.clientY, camForward, getPartPositionVector(part))
          };
          event.preventDefault();
          return;
        }
      }

      deselectAll();
      clearGizmoHover();
      isOrbiting = true;
      lastMouse.x = event.clientX;
      lastMouse.y = event.clientY;
      setModeLabel('ORBIT');
    });

    elements.canvas.addEventListener('mousemove', function(event) {
      if (mode === 'connectSource' && !isPanning) {
        setHoveredJoint(null);
        updateConnectSourceHover(event.clientX, event.clientY);
        return;
      }

      if (mode === 'postConnectAdjust') {
        setHoveredJoint(null);
        event.preventDefault();
        return;
      }
      if (mode === 'connectTarget' && !isPanning) {
        setHoveredJoint(null);
        updateConnectTargetPreview(event.clientX, event.clientY);
        return;
      }

      if (mode === 'postConnectAdjust') {
        setHoveredJoint(null);
        return;
      }

      updateGizmoHover(event.clientX, event.clientY);
      updateJointHover(event.clientX, event.clientY);

      if (pendingPick && pendingPick.kind === 'joint' && getPointerTravel(event.clientX, event.clientY) >= CLICK_DRAG_THRESHOLD) {
        clearPendingPick();
      }

      if (pendingPick && pendingPick.kind === 'part' && getPointerTravel(event.clientX, event.clientY) >= CLICK_DRAG_THRESHOLD) {
        const nextPendingPick = pendingPick;
        clearPendingPick();
        if (!beginPartDrag(nextPendingPick.partId, event.clientX, event.clientY, nextPendingPick)) {
          return;
        }
      }

      if (mode === 'translate' && activeInteraction) {
        const hit = rayOnPlane(event.clientX, event.clientY, tDragPlane.normal, tStartPos);
        if (!hit) {
          return;
        }
        const projection = tAxis.clone().multiplyScalar(hit.clone().sub(tStartHit).dot(tAxis));
        const nextRootPosition = tStartPos.clone().add(projection);
        nextRootPosition.y = Math.max(PROFILE_SIZE / 2, nextRootPosition.y);
        if (nextRootPosition.distanceTo(tStartPos) > 0.001) {
          interactionEdited = true;
        }
        applyComponentTransform(activeInteraction, nextRootPosition, activeInteraction.rootStartQuaternion);
        refreshSceneOverlays();
        updateSelectionInfo();
        updateInteractionHud();
        refreshGizmo();
        return;
      }

      if (mode === 'rotate' && activeInteraction) {
        const hit = rayOnPlane(event.clientX, event.clientY, rAxis, rCenter);
        if (!hit) {
          return;
        }
        const toHit = hit.clone().sub(rCenter);
        const angle = Math.atan2(toHit.dot(rV), toHit.dot(rU));
        const deltaStep = normalizeSignedAngleDelta(angle - rLastAngle);
        const delta = activeRotateDelta - deltaStep;
        activeRotateDelta = delta;
        activeRotateDisplayDelta = wrapRotateDisplayDelta(activeRotateDisplayDelta - deltaStep);
        rLastAngle = angle;
        if (Math.abs(delta) > 1e-4) {
          interactionEdited = true;
        }
        const quaternion = new THREE.Quaternion().setFromAxisAngle(rAxis, delta).multiply(rStartQuat);
        applyComponentTransform(activeInteraction, activeInteraction.rootStartPosition, quaternion);
        refreshSceneOverlays();
        updateSelectionInfo();
        updateInteractionHud();
        refreshGizmo();
        return;
      }

      if (mode === 'length' && selectedPartId) {
        const hit = rayOnPlane(event.clientX, event.clientY, lDragPlane.normal, lFixedEnd);
        if (!hit) {
          return;
        }
        const delta = hit.clone().sub(lStartHit).dot(lAxis) * lSign;
        const selectedPart = getSelectedPart();
        const nextLength = catalog.normalizeParams(selectedPart.typeId, {
          length: lStartLen + delta
        }).length;

        lResizeSnap = snapAlign
          ? snapSolver.findBestResizeSnap(selectedPart, lDraggedPortId, lFixedEnd, lStartQuat, nextLength)
          : null;

        const resolvedLength = lResizeSnap ? lResizeSnap.length : nextLength;
        const resolvedCenter = lResizeSnap
          ? lResizeSnap.center
          : lFixedEnd.clone().addScaledVector(lAxis, lSign * resolvedLength / 2);

        interactionEdited = Math.abs(resolvedLength - lStartLen) > 0.001;
        assembly.updatePartParam(selectedPartId, 'length', resolvedLength);
        assembly.setPartTransform(selectedPartId, resolvedCenter, lStartQuat);
        syncPartView(selectedPartId);

        if (lResizeSnap) {
          preview.showSnapRing(lResizeSnap.targetPt.world);
          preview.showFaceHighlight(lResizeSnap.targetPort);
          setSnapBadge(true);
        } else {
          preview.hideSnapRing();
          preview.hideFaceHighlight();
          setSnapBadge(false);
        }

        refreshSceneOverlays();
        updateSelectionInfo();
        updateInteractionHud();
        refreshGizmo();
        return;
      }

      if (mode === 'dragPart' && activeInteraction) {
        const hit = rayOnPlane(event.clientX, event.clientY, dpDragPlane.normal, activeInteraction.currentRootPosition);
        if (!hit) {
          return;
        }

        const nextRootPosition = hit.clone().add(dpOffset);
        nextRootPosition.y = Math.max(PROFILE_SIZE / 2, nextRootPosition.y);
        if (nextRootPosition.distanceTo(dragStartPos) > 0.001) {
          interactionEdited = true;
        }

        const nextRootQuaternion = activeInteraction.rootStartQuaternion.clone();
        applyComponentTransform(activeInteraction, nextRootPosition, nextRootQuaternion);

        activeSnap = snapSolver.findBestComponentSnap(activeInteraction, nextRootPosition, nextRootQuaternion, snapAlign);
        if (activeSnap) {
          const snapPoses = getComponentPoses(activeInteraction, activeSnap.snapPos, activeSnap.snapQuat);
          preview.updateGhost(snapPoses);
          preview.showSnapRing(activeSnap.targetPt.world);
          preview.showFaceHighlight(activeSnap.targetPort);
          setSnapBadge(true);
        } else {
          const currentPoses = getComponentPoses(activeInteraction, nextRootPosition, nextRootQuaternion);
          preview.updateGhost(currentPoses);
          preview.hideSnapRing();
          preview.hideFaceHighlight();
          setSnapBadge(false);
        }

        refreshSceneOverlays();
        updateInteractionHud();
        refreshGizmo();
        return;
      }

      if (isOrbiting) {
        viewport.orb.theta -= (event.clientX - lastMouse.x) * 0.007;
        viewport.orb.phi -= (event.clientY - lastMouse.y) * 0.007;
        lastMouse.x = event.clientX;
        lastMouse.y = event.clientY;
        viewport.applyOrbit();
        refreshGizmo();
        return;
      }

      if (isPanning) {
        const dx = event.clientX - lastMouse.x;
        const dy = event.clientY - lastMouse.y;
        lastMouse.x = event.clientX;
        lastMouse.y = event.clientY;
        const right = new THREE.Vector3()
          .crossVectors(new THREE.Vector3(0, 1, 0), viewport.camera.getWorldDirection(new THREE.Vector3()))
          .normalize();
        const speed = viewport.orb.radius * 0.00045;
        viewport.orb.tx += right.x * dx * speed * 50;
        viewport.orb.ty = Math.max(0, Math.min(400, viewport.orb.ty - dy * speed * 50));
        viewport.orb.tz += right.z * dx * speed * 50;
        viewport.applyOrbit();
        refreshGizmo();
      }
    });

    elements.canvas.addEventListener('mouseup', function(event) {
      if (event.button === 2 && isConnectMode()) {
        isPanning = false;
        updateInteractionHud();
        return;
      }

      clearGizmoHover();

      if (mode === 'connectSource') {
        updateConnectSourceHover(event.clientX, event.clientY);
        if (connectState && connectState.activeSourceKey) {
          beginConnectTargetPhase(connectState.activeSourceKey);
        } else {
          cancelConnectMode({ keepSelection: true });
        }
        return;
      }

      if (mode === 'connectTarget') {
        updateConnectTargetPreview(event.clientX, event.clientY);
        if (!confirmConnectTarget()) {
          cancelConnectMode({ keepSelection: true });
        }
        return;
      }

      if (mode === 'postConnectAdjust') {
        clearPendingPick();
        if (event.button === 0) {
          finishPostConnectAdjust({ commit: true });
        }
        return;
      }

      if (event.button === 0 && mode === 'idle') {
        const hoveredJointCandidateId = resolveHoveredJointId(event.clientX, event.clientY);
        setHoveredJoint(hoveredJointCandidateId);
        if (hoveredJointCandidateId) {
          const joint = getJoint(hoveredJointCandidateId);
          if (joint) {
            clearPendingPick();
            selectPart(null, { clearJoint: false });
            setSelectedJoint(joint.id);
            setModeLabel('JOINT');
            return;
          }
        }
      }

      if (pendingPick) {
        const nextPendingPick = pendingPick;
        clearPendingPick();

        if (nextPendingPick.kind === 'part') {
          selectPart(nextPendingPick.partId);
          setModeLabel('SELECT');
          return;
        }

        if (nextPendingPick.kind === 'joint') {
          const joint = getJoint(nextPendingPick.jointId);
          if (joint) {
            selectPart(null, { clearJoint: false });
            setSelectedJoint(joint.id);
            setModeLabel('JOINT');
          }
          return;
        }
      }

      if ((mode === 'dragPart' || mode === 'translate' || mode === 'rotate' || mode === 'length') && interactionEdited) {
        clearRedoHistory({ refresh: true });
      }

      if (mode === 'dragPart' && activeInteraction) {
        if (interactionEdited && activeSnap) {
          applyComponentTransform(activeInteraction, activeSnap.snapPos, activeSnap.snapQuat);
          assembly.connectPorts(
            { partId: activeSnap.sourcePort.partId, portId: activeSnap.sourcePort.portId },
            { partId: activeSnap.targetPort.partId, portId: activeSnap.targetPort.portId },
            activeSnap.ruleId,
            {
              replaceSource: activeSnap.sourcePort.capacity === 1,
              replaceTarget: activeSnap.targetPort.capacity === 1,
              meta: {
                contactPoint: [
                  activeSnap.targetPt.world.x,
                  activeSnap.targetPt.world.y,
                  activeSnap.targetPt.world.z
                ]
              }
            }
          );
        }

        refreshSceneOverlays();
        selectPart(null);
        endInteraction();
        return;
      }

      if (mode === 'length' && selectedPartId) {
        if (interactionEdited && lResizeSnap) {
          assembly.connectPorts(
            { partId: lResizeSnap.sourcePort.partId, portId: lResizeSnap.sourcePort.portId },
            { partId: lResizeSnap.targetPort.partId, portId: lResizeSnap.targetPort.portId },
            lResizeSnap.ruleId,
            {
              replaceSource: lResizeSnap.sourcePort.capacity === 1,
              replaceTarget: lResizeSnap.targetPort.capacity === 1,
              meta: {
                contactPoint: [
                  lResizeSnap.targetPt.world.x,
                  lResizeSnap.targetPt.world.y,
                  lResizeSnap.targetPt.world.z
                ]
              }
            }
          );
        }

        refreshSceneOverlays();
        updateSelectionInfo();
        updateInteractionHud();
        refreshGizmo();
        endInteraction();
        return;
      }

      if (mode === 'translate' || mode === 'rotate' || mode === 'length') {
        refreshSceneOverlays();
        updateSelectionInfo();
        refreshGizmo();
      }

      endInteraction();
    });

    elements.canvas.addEventListener('contextmenu', function(event) {
      event.preventDefault();
    });

    elements.canvas.addEventListener('wheel', function(event) {
      event.preventDefault();
      viewport.orb.radius *= event.deltaY > 0 ? 1.1 : 0.9;
      viewport.applyOrbit();
      refreshGizmo();
    }, { passive: false });

    window.addEventListener('keydown', function(event) {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !isEditableEventTarget(event.target) && !isHistoryNavigationBlocked()) {
        const key = String(event.key || '').toLowerCase();
        if (!event.shiftKey && key === 'z') {
          if (undoLastAction()) {
            event.preventDefault();
          }
          return;
        }

        if (key === 'y' || (event.shiftKey && key === 'z')) {
          if (redoLastAction()) {
            event.preventDefault();
          }
          return;
        }
      }

      if (mode === 'postConnectAdjust' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === 'ArrowLeft') {
          if (cyclePostConnectAdjustVariant(-1)) {
            event.preventDefault();
          }
          return;
        }

        if (event.key === 'ArrowRight') {
          if (cyclePostConnectAdjustVariant(1)) {
            event.preventDefault();
          }
          return;
        }

        if (event.key === 'Enter') {
          if (finishPostConnectAdjust({ commit: true })) {
            event.preventDefault();
          }
          return;
        }

        if (/^[1-9]$/.test(event.key)) {
          const variantIndex = Number(event.key) - 1;
          if (postConnectAdjustState && variantIndex < postConnectAdjustState.snapVariants.length) {
            if (setPostConnectAdjustVariant(variantIndex)) {
              event.preventDefault();
            }
          }
          return;
        }
      }

      if (mode === 'connectTarget' && !event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === 'ArrowLeft') {
          if (cycleConnectTargetVariant(-1)) {
            event.preventDefault();
          }
          return;
        }

        if (event.key === 'ArrowRight') {
          if (cycleConnectTargetVariant(1)) {
            event.preventDefault();
          }
          return;
        }

        if (event.key === 'Enter') {
          if (confirmConnectTarget()) {
            event.preventDefault();
          }
          return;
        }

        if (/^[1-9]$/.test(event.key)) {
          const variantIndex = Number(event.key) - 1;
          if (connectState && connectState.activeTargetSnapVariants && variantIndex < connectState.activeTargetSnapVariants.length) {
            if (setActiveConnectTargetVariant(variantIndex)) {
              event.preventDefault();
            }
          }
          return;
        }
      }

      if (event.key === 'Delete' && !event.altKey && !event.ctrlKey && !event.metaKey && !isEditableEventTarget(event.target)) {
        if (mode === 'idle' && selectedPartId && !selectedJointId && !isHistoryNavigationBlocked()) {
          deleteCurrentSelection();
          event.preventDefault();
        }
        return;
      }

      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      if (isConnectMode()) {
        cancelConnectMode({ keepSelection: true });
        return;
      }

      if (pendingPick || activeInteraction || mode === 'translate' || mode === 'rotate' || mode === 'length' || mode === 'dragPart' || mode === 'postConnectAdjust' || isOrbiting || isPanning) {
        cancelActiveInteraction();
        return;
      }

      if (selectedPartId || selectedJointId) {
        deselectAll();
        setModeLabel('—');
      }
    });

    window.addEventListener('resize', function() {
      viewport.resize();
    });

    function clonePlainData(value) {
      return JSON.parse(JSON.stringify(value));
    }

    const screenshotSceneSnapshot = Object.freeze({
      parts: [
        {
          id: 'part-1',
          typeId: 'profile-20x20',
          params: { length: 200 },
          transform: {
            position: [-246, PROFILE_SIZE / 2, 0],
            quaternion: [0, 0, 0, 1]
          },
          meta: {}
        },
        {
          id: 'part-2',
          typeId: 'connector-straight-20',
          params: {},
          transform: {
            position: [-133, PROFILE_SIZE / 2, 0],
            quaternion: [0, 0, 0, 1]
          },
          meta: {}
        },
        {
          id: 'part-3',
          typeId: 'profile-20x20',
          params: { length: 240 },
          transform: {
            position: [0, PROFILE_SIZE / 2, 0],
            quaternion: [0, 0, 0, 1]
          },
          meta: {}
        },
        {
          id: 'part-4',
          typeId: 'connector-angle-20',
          params: {},
          transform: {
            position: [133, PROFILE_SIZE / 2, 0],
            quaternion: [0, 1, 0, 0]
          },
          meta: {}
        },
        {
          id: 'part-5',
          typeId: 'profile-20x20',
          params: { length: 200 },
          transform: {
            position: [133, PROFILE_SIZE / 2, -113],
            quaternion: [0, 0.7071067811865475, 0, 0.7071067811865476]
          },
          meta: {}
        }
      ],
      joints: [
        {
          id: 'joint-1',
          a: { partId: 'part-1', portId: 'endB' },
          b: { partId: 'part-2', portId: 'socketA' },
          ruleId: 'profile-end-to-connector-socket-20',
          state: 'locked',
          meta: {}
        },
        {
          id: 'joint-2',
          a: { partId: 'part-2', portId: 'socketB' },
          b: { partId: 'part-3', portId: 'endA' },
          ruleId: 'profile-end-to-connector-socket-20',
          state: 'locked',
          meta: {}
        },
        {
          id: 'joint-3',
          a: { partId: 'part-3', portId: 'endB' },
          b: { partId: 'part-4', portId: 'socketX' },
          ruleId: 'profile-end-to-connector-socket-20',
          state: 'locked',
          meta: {}
        },
        {
          id: 'joint-4',
          a: { partId: 'part-4', portId: 'socketZ' },
          b: { partId: 'part-5', portId: 'endB' },
          ruleId: 'profile-end-to-connector-socket-20',
          state: 'locked',
          meta: {}
        }
      ],
      editor: {}
    });

    const screenshotPresetConfigs = Object.freeze({
      overview: Object.freeze({
        locale: 'en',
        camera: Object.freeze({ theta: 0.78, phi: 0.98, radius: 560, tx: -36, ty: 66, tz: -36 }),
        leftTabId: 'structure',
        topRightTabId: 'project',
        bottomTabId: 'help',
        fileName: 'threejs-tool-overview.png',
        note: 'Overview with structure tree, project panel, and the assembled workspace.'
      }),
      'selected-part': Object.freeze({
        locale: 'en',
        camera: Object.freeze({ theta: 0.72, phi: 0.94, radius: 430, tx: 12, ty: 54, tz: -22 }),
        selectedPartId: 'part-3',
        openProperties: true,
        fileName: 'threejs-tool-selected-part.png',
        note: 'Part callout plus unified Properties tab for the main profile.'
      }),
      settings: Object.freeze({
        locale: 'en',
        camera: Object.freeze({ theta: 0.78, phi: 0.98, radius: 590, tx: -36, ty: 66, tz: -36 }),
        topRightTabId: 'settings',
        bottomTabId: 'help',
        fileName: 'threejs-tool-settings-history.png',
        note: 'Settings-focused product shot with the right panel expanded.'
      })
    });

    function syncScreenshotSurfaceState() {
      refreshSceneOverlays();
      refreshGizmo();
      refreshCallouts();
      refreshLayoutControls();
      overlay.update();
      viewCube.update(viewport.camera);
    }

    function resetScreenshotLayout() {
      mountCanvasLayoutPrototype();
      refreshLayoutControls();
    }

    function applyScreenshotPreset(name, options) {
      const config = screenshotPresetConfigs[name];
      if (!config) {
        return null;
      }

      const runtimeOptions = Object.assign({ resetLayout: true }, options || {});
      if (i18n && typeof i18n.setLocale === 'function') {
        i18n.setLocale(config.locale || 'en', { force: true });
      }

      applyEditorSnapshot(clonePlainData(screenshotSceneSnapshot));
      setModeLabel('—');

      if (runtimeOptions.resetLayout !== false) {
        resetScreenshotLayout();
      }

      if (config.camera) {
        viewport.setCameraState(clonePlainData(config.camera));
      }
      if (config.topRightTabId) {
        activatePanelTab('top-right-control-tabs', config.topRightTabId);
      }
      if (config.leftTabId) {
        activatePanelTab('left-sandbox-tabs', config.leftTabId);
      }
      if (config.bottomTabId) {
        activatePanelTab('bottom-sandbox-tabs', config.bottomTabId);
      }

      if (config.selectedPartId) {
        if (config.openProperties) {
          openSelectedPartProperties(config.selectedPartId, { focusLength: false });
        } else {
          selectPart(config.selectedPartId);
        }
      } else {
        deselectAll();
      }

      syncScreenshotSurfaceState();
      return {
        preset: name,
        fileName: config.fileName,
        note: config.note,
        viewport: {
          width: elements.wrap.clientWidth,
          height: elements.wrap.clientHeight
        }
      };
    }

    const screenshotTools = {
      listPresets: function() {
        return Object.keys(screenshotPresetConfigs);
      },
      describePresets: function() {
        return Object.keys(screenshotPresetConfigs).map(function(name) {
          return {
            id: name,
            fileName: screenshotPresetConfigs[name].fileName,
            note: screenshotPresetConfigs[name].note
          };
        });
      },
      applyPreset: applyScreenshotPreset,
      resetLayout: resetScreenshotLayout,
      loadScene: function(snapshot, options) {
        applyEditorSnapshot(clonePlainData(snapshot));
        if (!options || options.resetLayout !== false) {
          resetScreenshotLayout();
        }
        syncScreenshotSurfaceState();
      },
      getBaseSnapshot: function() {
        return clonePlainData(screenshotSceneSnapshot);
      },
      setLocale: function(locale) {
        if (i18n && typeof i18n.setLocale === 'function') {
          i18n.setLocale(locale, { force: true });
        }
        syncScreenshotSurfaceState();
      },
      setCameraState: function(state) {
        viewport.setCameraState(clonePlainData(state));
        syncScreenshotSurfaceState();
      }
    };

    updateConnectDebugUi();
  applyActiveTargetSelectionStrategy();
    viewport.resize();
    syncAllPartViews();
    viewport.start(function() {
      preview.tick();
      overlay.update();
      viewCube.update(viewport.camera);
    });

    return {
      assembly,
      catalog,
      viewport,
      canvasLayoutPrototype,
      screenshotTools
    };
  }

  tool.app.createApp = createApp;
})();
