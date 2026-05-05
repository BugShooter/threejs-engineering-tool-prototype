(function() {
  const tool = window.EngineeringTool;

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeTransform(transform) {
    const position = transform && Array.isArray(transform.position)
      ? transform.position.slice(0, 3)
      : [0, 0, 0];

    while (position.length < 3) {
      position.push(0);
    }

    const quaternion = transform && Array.isArray(transform.quaternion)
      ? transform.quaternion.slice(0, 4)
      : [0, 0, 0, 1];

    while (quaternion.length < 4) {
      quaternion.push(quaternion.length === 3 ? 1 : 0);
    }

    return {
      position,
      quaternion
    };
  }

  function nextNumericId(prefix, seq) {
    return `${prefix}-${seq}`;
  }

  function extractSeq(id, prefix) {
    const match = new RegExp(`^${prefix}-(\\d+)$`).exec(id);
    return match ? Number(match[1]) : 0;
  }

  class Assembly {
    constructor(catalog) {
      this.catalog = catalog;
      this.parts = [];
      this.joints = [];
      this.partSeq = 0; // Note: these sequences are only used for generating new IDs, they don't reflect the actual count of parts/joints in the assembly
      this.jointSeq = 0; // (since parts/joints can be removed, the sequence is not necessarily equal to the count of parts/joints)
    }

    nextPartId() {
      this.partSeq += 1;
      return nextNumericId('part', this.partSeq);
    }

    nextJointId() {
      this.jointSeq += 1;
      return nextNumericId('joint', this.jointSeq);
    }

    createPart(typeId, params, transform) {
      const part = {
        id: this.nextPartId(),
        typeId,
        params: this.catalog.normalizeParams(typeId, params || {}),
        transform: normalizeTransform(transform)
      };
      this.parts.push(part);
      return part;
    }

    getParts() {
      return this.parts;
    }

    getPart(partId) {
      return this.parts.find(part => part.id === partId) || null;
    }

    getJoints() {
      return this.joints;
    }

    getJoint(jointId) {
      return this.joints.find(joint => joint.id === jointId) || null;
    }

    getJointCountForPart(partId) {
      return this.joints.filter(joint => joint.a.partId === partId || joint.b.partId === partId).length;
    }

    getPartJoints(partId, options) {
      const config = Object.assign({ excludedJointIds: [] }, options || {});
      const excluded = new Set(config.excludedJointIds || []);
      return this.joints.filter(joint => {
        if (excluded.has(joint.id)) {
          return false;
        }
        return joint.a.partId === partId || joint.b.partId === partId;
      });
    }

    getConnectedComponent(rootPartId, options) {
      const rootPart = this.getPart(rootPartId);
      if (!rootPart) {
        return { partIds: [], parts: [], joints: [] };
      }

      const config = Object.assign({ excludedJointIds: [] }, options || {});
      const excluded = new Set(config.excludedJointIds || []);
      const queue = [rootPartId];
      const visited = new Set([rootPartId]);

      while (queue.length) {
        const currentPartId = queue.shift();
        const partJoints = this.getPartJoints(currentPartId, { excludedJointIds: config.excludedJointIds });

        for (const joint of partJoints) {
          if (excluded.has(joint.id)) {
            continue;
          }

          const neighborPartId = joint.a.partId === currentPartId
            ? joint.b.partId
            : joint.a.partId;

          if (!visited.has(neighborPartId)) {
            visited.add(neighborPartId);
            queue.push(neighborPartId);
          }
        }
      }

      const partIds = Array.from(visited);
      const partIdSet = new Set(partIds);
      const joints = this.joints.filter(joint => {
        if (excluded.has(joint.id)) {
          return false;
        }
        return partIdSet.has(joint.a.partId) && partIdSet.has(joint.b.partId);
      });

      return {
        partIds,
        parts: partIds
          .map(partId => this.getPart(partId))
          .filter(Boolean),
        joints
      };
    }

    getPortConnectionCount(partId, portId, options) {
      const config = Object.assign({ excludedJointIds: [] }, options || {});
      const excluded = new Set(config.excludedJointIds || []);
      let count = 0;

      for (const joint of this.joints) {
        if (excluded.has(joint.id)) {
          continue;
        }

        const matchesA = joint.a.partId === partId && joint.a.portId === portId;
        const matchesB = joint.b.partId === partId && joint.b.portId === portId;
        if (matchesA || matchesB) {
          count += 1;
        }
      }

      return count;
    }

    setPartTransform(partId, position, quaternion) {
      const part = this.getPart(partId);
      if (!part) {
        return null;
      }

      part.transform.position = [position.x, position.y, position.z];
      part.transform.quaternion = [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
      return part;
    }

    updatePartParam(partId, paramName, value) {
      const part = this.getPart(partId);
      if (!part) {
        return null;
      }

      const nextParams = Object.assign({}, part.params, { [paramName]: value });
      part.params = this.catalog.normalizeParams(part.typeId, nextParams);
      return part;
    }

    removePart(partId) {
      this.disconnectPart(partId);
      this.parts = this.parts.filter(part => part.id !== partId);
    }

    disconnectPart(partId) {
      this.joints = this.joints.filter(joint => joint.a.partId !== partId && joint.b.partId !== partId);
    }

    disconnectJoint(jointId) {
      this.joints = this.joints.filter(joint => joint.id !== jointId);
    }

    disconnectPort(partId, portId) {
      this.joints = this.joints.filter(joint => {
        const matchesA = joint.a.partId === partId && joint.a.portId === portId;
        const matchesB = joint.b.partId === partId && joint.b.portId === portId;
        return !matchesA && !matchesB;
      });
    }

    connectPorts(a, b, ruleId, options) {
      const config = Object.assign({
        replaceSource: true,
        replaceTarget: true,
        meta: {}
      }, options || {});

      if (config.replaceSource) {
        this.disconnectPort(a.partId, a.portId);
      }
      if (config.replaceTarget) {
        this.disconnectPort(b.partId, b.portId);
      }

      const joint = {
        id: this.nextJointId(),
        a: cloneValue(a),
        b: cloneValue(b),
        ruleId,
        state: 'locked',
        meta: cloneValue(config.meta)
      };
      this.joints.push(joint);
      return joint;
    }

    clear() {
      this.parts = [];
      this.joints = [];
      this.partSeq = 0;
      this.jointSeq = 0;
    }

    load(data) {
      this.clear();

      for (const rawPart of data.parts || []) {
        const part = {
          id: rawPart.id || this.nextPartId(),
          typeId: rawPart.typeId,
          params: this.catalog.normalizeParams(rawPart.typeId, rawPart.params || {}),
          transform: normalizeTransform(rawPart.transform)
        };
        this.parts.push(part);
        this.partSeq = Math.max(this.partSeq, extractSeq(part.id, 'part'));
      }

      for (const rawJoint of data.joints || []) {
        const joint = {
          id: rawJoint.id || this.nextJointId(),
          a: cloneValue(rawJoint.a),
          b: cloneValue(rawJoint.b),
          ruleId: rawJoint.ruleId,
          state: rawJoint.state || 'locked',
          meta: cloneValue(rawJoint.meta || {})
        };
        this.joints.push(joint);
        this.jointSeq = Math.max(this.jointSeq, extractSeq(joint.id, 'joint'));
      }

      return {
        editor: cloneValue(data.editor || {})
      };
    }
  }

  tool.domain.Assembly = Assembly;
})();