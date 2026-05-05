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
    let hoveredJointId = null;
    let previewedPartId = null;
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
    let selectedPartWidget = null;
    let selectedJointWidget = null;
    let snapStatusWidget = null;
    let modeStatusWidget = null;
    let interactionStatusWidget = null;

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

    function getSelectedJoint() {
      return selectedJointId ? getJoint(selectedJointId) : null;
    }

    function setPreviewedPart(partId) {
      const nextPartId = partId && getPart(partId) ? partId : null;
      if (nextPartId === previewedPartId) {
        return;
      }

      const previousPartId = previewedPartId;
      previewedPartId = nextPartId;
      if (previousPartId && getPart(previousPartId)) {
        syncPartView(previousPartId);
      }
      if (previewedPartId && getPart(previewedPartId)) {
        syncPartView(previewedPartId);
      }
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

      const group = createPartVisualGroup(getTypeDef(part), part, {
        selected: selectedPartId === partId,
        highlighted: selectedPartId !== partId && previewedPartId === partId
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

    function createEditorSnapshotKey(snapshot) {
      return JSON.stringify(snapshot);
    }

    function getUndoDepth() {
      return undoHistory.length;
    }

    function canUndo() {
      return getUndoDepth() > 0;
    }

    function trimUndoHistory() {
      if (undoHistory.length > undoHistoryLimit) {
        undoHistory.splice(0, undoHistory.length - undoHistoryLimit);
      }
    }

    function setUndoHistoryLimit(value) {
      const numericValue = Number(value);
      const nextLimit = Math.max(1, Math.min(MAX_UNDO_HISTORY_LIMIT, Math.round(Number.isFinite(numericValue) ? numericValue : undoHistoryLimit)));
      undoHistoryLimit = nextLimit;
      trimUndoHistory();
      refreshLayoutControls();
      return undoHistoryLimit;
    }

    function clearUndoHistory() {
      undoHistory.length = 0;
      refreshLayoutControls();
    }

    function rememberUndoSnapshot(snapshot) {
      const nextSnapshot = snapshot || createEditorSnapshot();
      const nextKey = createEditorSnapshotKey(nextSnapshot);
      const lastEntry = undoHistory[undoHistory.length - 1] || null;
      if (!lastEntry || lastEntry.key !== nextKey) {
        undoHistory.push({ snapshot: nextSnapshot, key: nextKey });
        trimUndoHistory();
      }
      refreshLayoutControls();
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
      hoveredJointId = null;
      mode = 'idle';
      clearConnectPreview();
      gizmo.clearInteractionState();

      const result = assembly.load(snapshot);
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

      const entry = undoHistory.pop();
      const applied = applyEditorSnapshot(entry.snapshot);
      if (!applied) {
        undoHistory.push(entry);
      }
      refreshLayoutControls();
      return applied;
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
          limit: undoHistoryLimit
        });
      }

      if (binding.undoButton) {
        binding.undoButton.disabled = !canUndo();
        binding.undoButton.setAttribute('aria-disabled', binding.undoButton.disabled ? 'true' : 'false');
      }

      if (binding.clearUndoButton) {
        binding.clearUndoButton.disabled = !canUndo();
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
          rememberUndoSnapshot();
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

      rememberUndoSnapshot();

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
      const part = getSelectedPart();
      if (!part || selectedJointId) {
        return null;
      }

      const canResize = canResizePart(part);
      const canConnect = canConnectPart(part);
      const effectiveMode = getEffectiveGizmoMode(part);
      const partId = part.id;
      const typeDef = getTypeDef(part);
      const lines = [
        `${t('callout.position')}: ${part.transform.position[0].toFixed(0)}, ${part.transform.position[1].toFixed(0)}, ${part.transform.position[2].toFixed(0)}`,
        `${t('selection.connections')}: ${assembly.getJointCountForPart(part.id)}`
      ];
      if (part.typeId === 'profile-20x20') {
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
            icon: '⇄',
            tooltip: t('callout.disconnectSelectedPart'),
            disabled: assembly.getJointCountForPart(part.id) === 0,
            onClick: disconnectSelectedPart
          },
          {
            icon: '✕',
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
        if (selectedPartWidget) {
          selectedPartWidget.update(buildSelectedPartWidgetState());
        }
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
      if (selectedPartWidget) {
        selectedPartWidget.update(buildSelectedPartWidgetState());
      }
      refreshCallouts();
    }

    function updateJointInfo() {
      const joint = getSelectedJoint();
      if (!joint || areInspectorPanelsSuppressed()) {
        elements.jointPanel.style.display = 'none';
        elements.jointInfo.innerHTML = '—';
        if (selectedJointWidget) {
          selectedJointWidget.update(buildSelectedJointWidgetState());
        }
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
      if (selectedJointWidget) {
        selectedJointWidget.update(buildSelectedJointWidgetState());
      }
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
      selectPart(null);
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
      if (previewedPartId && !getPart(previewedPartId)) {
        previewedPartId = null;
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

      rememberUndoSnapshot();

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

      rememberUndoSnapshot();
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
      rememberUndoSnapshot();
      const length = clampProfileLength(profileLengthValue);
      const part = assembly.createPart('profile-20x20', { length }, {
        position: [viewport.orb.tx, PROFILE_SIZE / 2, viewport.orb.tz],
        quaternion: [0, 0, 0, 1]
      });
      syncPartView(part.id);
      refreshSceneOverlays();
      selectPart(part.id);
    }

    function addConnector(typeId) {
      rememberUndoSnapshot();
      const part = assembly.createPart(typeId, {}, {
        position: [viewport.orb.tx, PROFILE_SIZE / 2, viewport.orb.tz],
        quaternion: [0, 0, 0, 1]
      });
      syncPartView(part.id);
      refreshSceneOverlays();
      selectPart(part.id);
    }

    function deleteSelected() {
      const part = getSelectedPart();
      if (!part) {
        return;
      }
      rememberUndoSnapshot();
      removePartView(part.id);
      assembly.removePart(part.id);
      selectedPartId = null;
      selectedJointId = null;
      refreshSceneOverlays();
      updateSelectionInfo();
      updateJointInfo();
      refreshGizmo();
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
      const clearUndoButton = createCanvasActionButton({
        label: t('actions.clearHistory'),
        caption: t('settings.clearHistoryCaption'),
        onClick: clearUndoHistory
      });
      undoActions.appendChild(undoButton);
      undoActions.appendChild(clearUndoButton);
      container.appendChild(undoActions);

      cleanups.push(registerSettingsUiBinding({
        alignButton: alignButton,
        alignStateElement: alignState,
        undoInfoElement: undoInfo,
        undoButton: undoButton,
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
        ]
      };
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

    function createAddPartWidget() {
      return createDomWidget({
        widgetType: 'control',
        initialState: { length: profileLengthValue },
        render: function(container, state) {
          const card = createWidgetElement('section', 'canvas-layout-widget-surface');
          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.add')));

          const row = createWidgetElement('label', 'canvas-layout-widget-field-row');
          row.appendChild(createWidgetElement('span', 'canvas-layout-widget-field-label', t('legacy.fields.length')));
          const input = createWidgetElement('input', 'canvas-layout-widget-number');
          input.type = 'number';
          input.min = '40';
          input.max = '800';
          input.step = '10';
          input.value = `${clampProfileLength(state && state.length)}`;
          row.appendChild(input);
          row.appendChild(createWidgetElement('span', 'canvas-layout-widget-field-label', t('common.mm')));
          card.appendChild(row);

          const actions = createWidgetElement('div', 'canvas-layout-widget-actions');
          actions.appendChild(createCanvasActionButton({
            label: t('actions.profile'),
            caption: t('partTypes.profile20x20'),
            tone: 'accent',
            onClick: addProfile
          }));
          actions.appendChild(createCanvasActionButton({
            label: t('actions.angle'),
            caption: t('partTypes.connectorAngle20'),
            onClick: function() {
              addConnector('connector-angle-20');
            }
          }));
          actions.appendChild(createCanvasActionButton({
            label: t('actions.straight'),
            caption: t('partTypes.connectorStraight20'),
            onClick: function() {
              addConnector('connector-straight-20');
            }
          }));
          card.appendChild(actions);
          container.appendChild(card);

          function handleInput() {
            syncProfileLength(input.value, { updateWidget: false });
          }

          input.addEventListener('input', handleInput);
          return function() {
            input.removeEventListener('input', handleInput);
          };
        }
      });
    }

    function createSelectedPartWidget() {
      return createDomWidget({
        widgetType: 'inspector',
        initialState: buildSelectedPartWidgetState(),
        render: function(container, state) {
          const card = createWidgetElement('section', 'canvas-layout-widget-surface');
          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.part')));
          if (!state || state.empty) {
            card.appendChild(createWidgetElement('div', 'canvas-layout-widget-empty', state && state.empty ? state.empty : t('widgets.noData')));
            container.appendChild(card);
            return;
          }

          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', state.title));
          const lines = createWidgetElement('div', 'canvas-layout-widget-lines');
          for (const line of state.lines || []) {
            lines.appendChild(createWidgetElement('div', '', line));
          }
          card.appendChild(lines);

          const actions = createWidgetElement('div', 'canvas-layout-widget-actions');
          for (const action of state.actions || []) {
            actions.appendChild(createCanvasActionButton(action));
          }
          card.appendChild(actions);
          container.appendChild(card);
        }
      });
    }

    function createSelectedJointWidget() {
      return createDomWidget({
        widgetType: 'inspector',
        initialState: buildSelectedJointWidgetState(),
        render: function(container, state) {
          const card = createWidgetElement('section', 'canvas-layout-widget-surface');
          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-title', t('widgets.joint')));
          if (!state || state.empty) {
            card.appendChild(createWidgetElement('div', 'canvas-layout-widget-empty', state && state.empty ? state.empty : t('widgets.noData')));
            container.appendChild(card);
            return;
          }

          card.appendChild(createWidgetElement('div', 'canvas-layout-widget-note', state.title));
          const lines = createWidgetElement('div', 'canvas-layout-widget-lines');
          for (const line of state.lines || []) {
            lines.appendChild(createWidgetElement('div', '', line));
          }
          card.appendChild(lines);

          const actions = createWidgetElement('div', 'canvas-layout-widget-actions');
          for (const action of state.actions || []) {
            actions.appendChild(createCanvasActionButton(action));
          }
          card.appendChild(actions);
          container.appendChild(card);
        }
      });
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
        rememberUndoSnapshot(previousState);
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
            id: 'add',
            label: t('widgets.add'),
            renderContent: mountPanelWidget(addPartWidget)
          },
          {
            id: 'part',
            label: t('widgets.part'),
            renderContent: mountPanelWidget(selectedPartWidget)
          },
          {
            id: 'joint',
            label: t('widgets.joint'),
            renderContent: mountPanelWidget(selectedJointWidget)
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
              return !canUndo() || pendingPick || activeInteraction || isOrbiting || isPanning || isConnectMode() || mode === 'postConnectAdjust';
            },
            onClick: function() {
              undoLastAction();
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
          }
        ],
        renderSettingsTab: createPrototypeSettingsTab
      });
    }

    function applyLocaleToUi() {
      syncStaticUiText();
      connectStrategyPanel.sync();
      if (addPartWidget && selectedPartWidget && selectedJointWidget) {
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
    elements.deleteButton.addEventListener('click', deleteSelected);
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
    selectedPartWidget = createSelectedPartWidget();
    selectedJointWidget = createSelectedJointWidget();
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
    selectedPartWidget.update(buildSelectedPartWidgetState());
    selectedJointWidget.update(buildSelectedJointWidgetState());
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

    const seedProfileA = assembly.createPart('profile-20x20', { length: 200 }, {
      position: [-140, PROFILE_SIZE / 2, 0],
      quaternion: [0, 0, 0, 1]
    });
    const seedProfileB = assembly.createPart('profile-20x20', { length: 200 }, {
      position: [110, PROFILE_SIZE / 2, 0],
      quaternion: [0, 0, 0, 1]
    });
    const seedAngle = assembly.createPart('connector-angle-20', {}, {
      position: [20, PROFILE_SIZE / 2, 90],
      quaternion: [0, 0, 0, 1]
    });
    const seedStraight = assembly.createPart('connector-straight-20', {}, {
      position: [20, PROFILE_SIZE / 2, -90],
      quaternion: [0, 0, 0, 1]
    });

    void seedProfileA;
    void seedProfileB;
    void seedAngle;
    void seedStraight;

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
      canvasLayoutPrototype
    };
  }

  tool.app.createApp = createApp;
})();
