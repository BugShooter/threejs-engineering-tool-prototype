(function() {
  const tool = window.EngineeringTool;
  const resolvePartPorts = tool.domain.resolvePartPorts;
  const HOVER_PART_THRESHOLD = 104;

  function createTargetSelectionContextBuilder(options) {
    const config = Object.assign({
      assembly: null,
      catalog: null,
      camera: null,
      canvas: null,
      wrap: null,
      worldToScreen: null,
      hitObjects: null,
      collectPartMeshes: null,
      partFromObject: null,
      getPartScreenRect: null
    }, options || {});
    const raycaster = new THREE.Raycaster();

    function getPortKey(port) {
      return `${port.partId}:${port.portId}`;
    }

    function toNDC(clientX, clientY) {
      const rect = config.canvas.getBoundingClientRect();
      return new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        ((clientY - rect.top) / rect.height) * -2 + 1
      );
    }

    function getWrapPointer(clientX, clientY) {
      const rect = config.wrap.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function getPointerRay(clientX, clientY) {
      raycaster.setFromCamera(toNDC(clientX, clientY), config.camera);
      return raycaster.ray.clone();
    }

    function distancePointToRect(point, rect) {
      if (!rect) {
        return Infinity;
      }

      const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
      const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
      return Math.hypot(dx, dy);
    }

    function pointInPolygon(point, polygon) {
      if (!polygon || polygon.length < 3) {
        return false;
      }

      let inside = false;
      for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
        const current = polygon[index];
        const prior = polygon[previous];
        const intersects = ((current.y > point.y) !== (prior.y > point.y)) &&
          (point.x < (prior.x - current.x) * (point.y - current.y) / ((prior.y - current.y) || 1e-6) + current.x);
        if (intersects) {
          inside = !inside;
        }
      }

      return inside;
    }

    function distancePointToSegment(point, start, end) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSq = dx * dx + dy * dy;
      if (lengthSq < 1e-6) {
        return Math.hypot(point.x - start.x, point.y - start.y);
      }

      const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq));
      const projX = start.x + dx * t;
      const projY = start.y + dy * t;
      return Math.hypot(point.x - projX, point.y - projY);
    }

    function distanceToPolygon(point, polygon) {
      if (!polygon || !polygon.length) {
        return Infinity;
      }
      if (pointInPolygon(point, polygon)) {
        return 0;
      }

      let best = Infinity;
      for (let index = 0; index < polygon.length; index += 1) {
        const next = (index + 1) % polygon.length;
        best = Math.min(best, distancePointToSegment(point, polygon[index], polygon[next]));
      }
      return best;
    }

    function projectPortScreenPolygon(port) {
      const halfU = Math.max(4, port.contactWidth || 20) / 2;
      const halfV = Math.max(4, port.contactHeight || 20) / 2;
      const corners = [
        port.position.clone().addScaledVector(port.axisU, -halfU).addScaledVector(port.axisV, -halfV),
        port.position.clone().addScaledVector(port.axisU, halfU).addScaledVector(port.axisV, -halfV),
        port.position.clone().addScaledVector(port.axisU, halfU).addScaledVector(port.axisV, halfV),
        port.position.clone().addScaledVector(port.axisU, -halfU).addScaledVector(port.axisV, halfV)
      ].map(config.worldToScreen);

      if (corners.some(function(corner) { return !corner || !corner.visible; })) {
        return null;
      }

      return corners.map(function(corner) {
        return { x: corner.x, y: corner.y };
      });
    }

    function isPortFacingCamera(port) {
      const toCamera = config.camera.position.clone().sub(port.position).normalize();
      return port.normal.dot(toCamera) > 0.05;
    }

    function getPortScreenMetrics(port, mousePoint) {
      const polygon = projectPortScreenPolygon(port);
      const center = config.worldToScreen(port.position);
      const point = mousePoint || { x: 0, y: 0 };
      const distance = polygon
        ? distanceToPolygon(point, polygon)
        : (center ? Math.hypot(center.x - point.x, center.y - point.y) : Infinity);

      return {
        polygon,
        center,
        inside: polygon ? pointInPolygon(point, polygon) : false,
        distance,
        facing: isPortFacingCamera(port)
      };
    }

    function getPortPlaneMetrics(ray, port) {
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(port.normal, port.position);
      const hit = ray.intersectPlane(plane, new THREE.Vector3());
      if (!hit) {
        return null;
      }

      const relative = hit.clone().sub(port.position);
      const halfU = Math.max(4, port.contactWidth || 20) / 2;
      const halfV = Math.max(4, port.contactHeight || 20) / 2;
      const du = Math.abs(relative.dot(port.axisU)) - halfU;
      const dv = Math.abs(relative.dot(port.axisV)) - halfV;
      const outsideU = Math.max(du, 0);
      const outsideV = Math.max(dv, 0);

      return {
        hit,
        inside: du <= 0 && dv <= 0,
        distance: Math.hypot(outsideU, outsideV)
      };
    }

    function getPortVisibilityMetrics(port, occlusionMeshes) {
      const toPort = port.position.clone().sub(config.camera.position);
      const distance = toPort.length();
      if (distance < 1e-6) {
        return { visible: true, occluded: false };
      }

      const visibilityRaycaster = new THREE.Raycaster(
        config.camera.position.clone(),
        toPort.clone().normalize(),
        0.01,
        Math.max(0.01, distance - 0.75)
      );
      const hits = visibilityRaycaster.intersectObjects(occlusionMeshes || [], false);
      return {
        visible: hits.length === 0,
        occluded: hits.length > 0
      };
    }

    function findConnectHoverParts(clientX, clientY, excludedPartIds) {
      const hoveredParts = [];
      const seen = new Set();
      const meshes = typeof config.collectPartMeshes === 'function'
        ? config.collectPartMeshes(excludedPartIds)
        : [];
      const partHits = typeof config.hitObjects === 'function'
        ? config.hitObjects(clientX, clientY, meshes)
        : [];

      if (partHits.length && typeof config.partFromObject === 'function') {
        const part = config.partFromObject(partHits[0].object);
        if (part) {
          hoveredParts.push({
            part,
            precise: true,
            partDistance: 0,
            screenRect: config.getPartScreenRect ? config.getPartScreenRect(part.id, 18) : null
          });
          seen.add(part.id);
        }
      }

      const mousePoint = getWrapPointer(clientX, clientY);

      for (const part of config.assembly.getParts()) {
        if ((excludedPartIds || []).includes(part.id)) {
          continue;
        }
        if (seen.has(part.id)) {
          continue;
        }

        const rect = config.getPartScreenRect ? config.getPartScreenRect(part.id, 18) : null;
        const distance = distancePointToRect(mousePoint, rect);
        if (distance <= HOVER_PART_THRESHOLD) {
          hoveredParts.push({ part, precise: false, partDistance: distance, screenRect: rect });
        }
      }

      hoveredParts.sort(function(a, b) {
        if (a.precise !== b.precise) {
          return a.precise ? -1 : 1;
        }
        return a.partDistance - b.partDistance;
      });

      return hoveredParts.slice(0, 4);
    }

    function getCompatibleTargetCandidates(sourcePort, snapshot, hoveredPartId) {
      const hoveredPart = config.assembly.getPart(hoveredPartId);
      if (!sourcePort || !snapshot || !hoveredPart) {
        return [];
      }

      if ((snapshot.partIds || []).includes(hoveredPartId)) {
        return [];
      }

      const typeDef = config.catalog.getType(hoveredPart.typeId);
      return resolvePartPorts(hoveredPart, typeDef)
        .filter(function(targetPort) {
          if ((targetPort.kind !== 'fixed' && targetPort.kind !== 'track') || !targetPort.highlightable) {
            return false;
          }

          if (config.assembly.getPortConnectionCount(targetPort.partId, targetPort.portId) >= targetPort.capacity) {
            return false;
          }

          const rules = config.catalog.getMatchingRules(sourcePort, targetPort);
          return rules.some(function(rule) {
            return (rule.connectionMode === 'fixed-to-fixed' && targetPort.kind === 'fixed') ||
              (rule.connectionMode === 'fixed-to-track' && targetPort.kind === 'track');
          });
        })
        .map(function(port) {
          return {
            key: getPortKey(port),
            role: 'target',
            port
          };
        });
    }

    function buildTargetCandidates(sourcePort, snapshot, hoveredPartInfos) {
      const targetCandidates = [];
      const seenTargetKeys = new Set();

      for (const hoveredPartInfo of hoveredPartInfos) {
        const partTargets = getCompatibleTargetCandidates(sourcePort, snapshot, hoveredPartInfo.part.id);
        for (const candidate of partTargets) {
          if (seenTargetKeys.has(candidate.key)) {
            continue;
          }
          seenTargetKeys.add(candidate.key);
          targetCandidates.push(Object.assign({}, candidate, {
            precisePart: hoveredPartInfo.precise,
            partDistance: hoveredPartInfo.partDistance
          }));
        }
      }

      return targetCandidates;
    }

    function buildContext(options) {
      const params = Object.assign({
        activeSourceKey: null,
        clientX: 0,
        clientY: 0,
        resolveActiveTargetHitPoint: null,
        snapAlign: true,
        snapSolver: null,
        snapshot: null,
        sourcePort: null,
        thresholds: null
      }, options || {});
      const excludedPartIds = params.snapshot && Array.isArray(params.snapshot.partIds)
        ? params.snapshot.partIds
        : [];
      const hoveredPartInfos = findConnectHoverParts(params.clientX, params.clientY, excludedPartIds);
      const targetCandidates = buildTargetCandidates(params.sourcePort, params.snapshot, hoveredPartInfos);

      return {
        activeSourceKey: params.activeSourceKey,
        sourcePort: params.sourcePort,
        snapshot: params.snapshot,
        hoveredPartInfos,
        targetCandidates,
        mousePoint: getWrapPointer(params.clientX, params.clientY),
        pointerRay: getPointerRay(params.clientX, params.clientY),
        thresholds: Object.assign({}, params.thresholds || {}),
        occlusionMeshes: typeof config.collectPartMeshes === 'function'
          ? config.collectPartMeshes(excludedPartIds)
          : [],
        snapAlign: params.snapAlign,
        snapSolver: params.snapSolver,
        getPortScreenMetrics,
        getPortPlaneMetrics,
        getPortVisibilityMetrics,
        resolveActiveTargetHitPoint: params.resolveActiveTargetHitPoint
      };
    }

    return {
      buildContext
    };
  }

  tool.connect.createTargetSelectionContextBuilder = createTargetSelectionContextBuilder;
})();