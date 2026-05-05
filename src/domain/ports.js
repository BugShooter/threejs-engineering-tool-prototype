(function() {
  const tool = window.EngineeringTool;

  function resolveNumber(definition, params) {
    if (typeof definition === 'number') {
      return definition;
    }

    if (definition == null) {
      return 0;
    }

    if (typeof definition === 'object') {
      let value = 0;

      if (typeof definition.value === 'number') {
        value += definition.value;
      }

      if (typeof definition.fromParam === 'string') {
        value += Number(params[definition.fromParam] || 0) * (definition.factor == null ? 1 : definition.factor);
      }

      if (typeof definition.offset === 'number') {
        value += definition.offset;
      }

      if (typeof definition.min === 'number') {
        value = Math.max(definition.min, value);
      }

      if (typeof definition.max === 'number') {
        value = Math.min(definition.max, value);
      }

      return value;
    }

    return Number(definition) || 0;
  }

  function resolveVector(definition, params) {
    if (Array.isArray(definition)) {
      return new THREE.Vector3(
        resolveNumber(definition[0], params),
        resolveNumber(definition[1], params),
        resolveNumber(definition[2], params)
      );
    }

    return new THREE.Vector3(
      resolveNumber(definition && definition.x, params),
      resolveNumber(definition && definition.y, params),
      resolveNumber(definition && definition.z, params)
    );
  }

  function safePerpendicular(normal) {
    const hint = Math.abs(normal.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    return new THREE.Vector3().crossVectors(normal, hint).normalize();
  }

  function resolveSlideRange(definition, params) {
    if (!definition) {
      return { min: 0, max: 0 };
    }

    if (typeof definition === 'number') {
      return { min: -definition, max: definition };
    }

    if (typeof definition === 'object' && ('min' in definition || 'max' in definition)) {
      return {
        min: resolveNumber(definition.min, params),
        max: resolveNumber(definition.max, params)
      };
    }

    const span = resolveNumber(definition, params);
    return { min: -span, max: span };
  }

  function getPartPositionVector(part) {
    return new THREE.Vector3(
      part.transform.position[0],
      part.transform.position[1],
      part.transform.position[2]
    );
  }

  function getPartQuaternion(part) {
    return new THREE.Quaternion(
      part.transform.quaternion[0],
      part.transform.quaternion[1],
      part.transform.quaternion[2],
      part.transform.quaternion[3]
    );
  }

  function resolvePartPorts(part, typeDef) {
    const position = getPartPositionVector(part);
    const quaternion = getPartQuaternion(part);

    return (typeDef.ports || []).map(portTemplate => {
      const localPosition = resolveVector(portTemplate.localPosition, part.params);
      const localNormal = resolveVector(portTemplate.localNormal, part.params).normalize();
      const localUp = resolveVector(portTemplate.localUp || [0, 1, 0], part.params).normalize();
      const worldPosition = localPosition.clone().applyQuaternion(quaternion).add(position);
      const worldNormal = localNormal.clone().applyQuaternion(quaternion).normalize();
      let axisU;
      let axisV;

      if (portTemplate.kind === 'track') {
        axisU = resolveVector(portTemplate.slideAxis || [1, 0, 0], part.params)
          .applyQuaternion(quaternion)
          .normalize();
        axisV = new THREE.Vector3().crossVectors(worldNormal, axisU).normalize();
      } else {
        axisU = localUp.clone().applyQuaternion(quaternion);
        axisU.sub(worldNormal.clone().multiplyScalar(axisU.dot(worldNormal)));
        if (axisU.lengthSq() < 1e-6) {
          axisU = safePerpendicular(worldNormal);
        } else {
          axisU.normalize();
        }
        axisV = new THREE.Vector3().crossVectors(worldNormal, axisU).normalize();
      }

      if (axisV.lengthSq() < 1e-6) {
        axisV = safePerpendicular(worldNormal);
      }

      const slideRange = resolveSlideRange(portTemplate.slideRange, part.params);

      return {
        partId: part.id,
        typeId: part.typeId,
        portId: portTemplate.portId,
        kind: portTemplate.kind,
        tags: (portTemplate.tags || []).slice(),
        capacity: portTemplate.capacity == null ? 1 : portTemplate.capacity,
        snapVisible: !!portTemplate.snapVisible,
        snapSource: portTemplate.snapSource !== false,
        highlightable: portTemplate.highlightable !== false,
        localPosition,
        localNormal,
        localUp,
        position: worldPosition,
        normal: worldNormal,
        up: localUp.clone().applyQuaternion(quaternion).normalize(),
        axisU,
        axisV,
        contactShape: portTemplate.contact && portTemplate.contact.shape || 'rect',
        contactWidth: resolveNumber(portTemplate.contact && portTemplate.contact.width, part.params),
        contactHeight: resolveNumber(portTemplate.contact && portTemplate.contact.height, part.params),
        slideMin: slideRange.min,
        slideMax: slideRange.max
      };
    });
  }

  function resolveAssemblyPorts(assembly, catalog, options) {
    const config = Object.assign({ exceptPartId: null }, options || {});
    const ports = [];
    for (const part of assembly.getParts()) {
      if (config.exceptPartId && part.id === config.exceptPartId) {
        continue;
      }
      const typeDef = catalog.getType(part.typeId);
      ports.push(...resolvePartPorts(part, typeDef));
    }
    return ports;
  }

  tool.domain.resolveNumber = resolveNumber;
  tool.domain.resolveVector = resolveVector;
  tool.domain.getPartPositionVector = getPartPositionVector;
  tool.domain.getPartQuaternion = getPartQuaternion;
  tool.domain.resolvePartPorts = resolvePartPorts;
  tool.domain.resolveAssemblyPorts = resolveAssemblyPorts;
})();