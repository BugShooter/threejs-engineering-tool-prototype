(function() {
  const tool = window.EngineeringTool;
  const resolvePartPorts = tool.domain.resolvePartPorts;
  const resolveAssemblyPorts = tool.domain.resolveAssemblyPorts;
  const quatFaceToward = tool.math.quatFaceToward;
  const quatFaceTowardVariants = tool.math.quatFaceTowardVariants;
  const contactPointOnTarget = tool.math.contactPointOnTarget;
  const footprintFitsOnTarget = tool.math.footprintFitsOnTarget;

  class SnapSolver {
    constructor(options) {
      this.catalog = options.catalog;
      this.assembly = options.assembly;
      this.snapDistance = options.snapDistance || 50;
    }

    getMaxGap(rule) {
      return rule.constraints && typeof rule.constraints.maxGap === 'number'
        ? rule.constraints.maxGap
        : this.snapDistance;
    }

    normalsMatch(rule, sourceNormal, targetNormal) {
      const mode = rule.constraints && rule.constraints.normalMode;
      if (!mode || mode === 'opposite') {
        return sourceNormal.clone().normalize().dot(targetNormal.clone().normalize()) <= -0.98;
      }
      if (mode === 'same') {
        return sourceNormal.clone().normalize().dot(targetNormal.clone().normalize()) >= 0.98;
      }
      return true;
    }

    createLengthTestPart(part, length, centerPosition, quaternion) {
      return {
        id: part.id,
        typeId: part.typeId,
        params: Object.assign({}, part.params, { length }),
        transform: {
          position: [centerPosition.x, centerPosition.y, centerPosition.z],
          quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w]
        }
      };
    }

    findBestSnap(part, testPosition, currentQuaternion, snapAlign) {
      const typeDef = this.catalog.getType(part.typeId);
      const sourcePorts = resolvePartPorts(part, typeDef)
        .filter(port => port.snapSource !== false && port.kind === 'fixed');

      const targetPorts = resolveAssemblyPorts(this.assembly, this.catalog, { exceptPartId: part.id })
        .filter(port => port.kind === 'fixed' || port.kind === 'track');

      let best = null;
      let bestDistance = this.snapDistance;

      for (const sourcePort of sourcePorts) {
        for (const targetPort of targetPorts) {
          const rules = this.catalog.getMatchingRules(sourcePort, targetPort);
          for (const rule of rules) {
            if (rule.connectionMode === 'fixed-to-fixed' && targetPort.kind !== 'fixed') {
              continue;
            }
            if (rule.connectionMode === 'fixed-to-track' && targetPort.kind !== 'track') {
              continue;
            }

            const maxGap = this.getMaxGap(rule);

            const snapQuaternion = snapAlign
              ? quatFaceToward(
                  sourcePort.localNormal,
                  targetPort.normal.clone().negate(),
                  rule.constraints && rule.constraints.rollStepDeg
                )
              : currentQuaternion.clone();

            const sourceOffset = sourcePort.localPosition.clone().applyQuaternion(snapQuaternion);
            const sourcePoint = testPosition.clone().add(sourceOffset);
            const targetPoint = contactPointOnTarget(targetPort, sourcePoint);
            const distance = sourcePoint.distanceTo(targetPoint);

            if (distance >= bestDistance || distance > maxGap) {
              continue;
            }

            const requiresFit = !rule.constraints || rule.constraints.requireContactFit !== false;
            if (requiresFit && !footprintFitsOnTarget(sourcePort, targetPort, targetPoint, snapQuaternion)) {
              continue;
            }

            const snapPosition = targetPoint.clone().sub(sourceOffset);
            bestDistance = distance;
            best = {
              snapPos: snapPosition,
              snapQuat: snapQuaternion,
              sourcePort,
              targetPort,
              ruleId: rule.ruleId,
              targetPt: {
                world: targetPoint.clone(),
                normal: targetPort.normal.clone()
              }
            };
          }
        }
      }

      return best;
    }

    findBestComponentSnap(componentSnapshot, testRootPosition, currentRootQuaternion, snapAlign) {
      const excludedPartIds = new Set(componentSnapshot.partIds || []);
      const targetPorts = resolveAssemblyPorts(this.assembly, this.catalog)
        .filter(port => !excludedPartIds.has(port.partId))
        .filter(port => port.kind === 'fixed' || port.kind === 'track');

      let best = null;
      let bestScore = this.snapDistance;

      for (const sourcePort of componentSnapshot.sourcePorts || []) {
        for (const targetPort of targetPorts) {
          const rules = this.catalog.getMatchingRules(sourcePort, targetPort);
          for (const rule of rules) {
            if (rule.connectionMode === 'fixed-to-fixed' && targetPort.kind !== 'fixed') {
              continue;
            }
            if (rule.connectionMode === 'fixed-to-track' && targetPort.kind !== 'track') {
              continue;
            }

            const maxGap = this.getMaxGap(rule);

            const snapQuaternion = snapAlign
              ? quatFaceToward(
                  sourcePort.localNormal,
                  targetPort.normal.clone().negate(),
                  rule.constraints && rule.constraints.rollStepDeg
                )
              : currentRootQuaternion.clone();

            const sourceOffset = sourcePort.localPosition.clone().applyQuaternion(snapQuaternion);
            const sourcePoint = testRootPosition.clone().add(sourceOffset);
            const targetPoint = contactPointOnTarget(targetPort, sourcePoint);
            const distance = sourcePoint.distanceTo(targetPoint);
            const score = distance + (sourcePort.priorityBias || 0);

            if (distance > maxGap || score >= bestScore) {
              continue;
            }

            const requiresFit = !rule.constraints || rule.constraints.requireContactFit !== false;
            if (requiresFit && !footprintFitsOnTarget(sourcePort, targetPort, targetPoint, snapQuaternion)) {
              continue;
            }

            bestScore = score;
            best = {
              snapPos: targetPoint.clone().sub(sourceOffset),
              snapQuat: snapQuaternion,
              sourcePort,
              targetPort,
              ruleId: rule.ruleId,
              targetPt: {
                world: targetPoint.clone(),
                normal: targetPort.normal.clone()
              }
            };
          }
        }
      }

      return best;
    }

    findBestResizeSnap(part, draggedPortId, fixedPoint, currentQuaternion, testLength) {
      const typeDef = this.catalog.getType(part.typeId);
      const lengthDef = typeDef.params && typeDef.params.length;
      const draggedSign = draggedPortId === 'endB' ? 1 : -1;
      const dragAxis = new THREE.Vector3(draggedSign, 0, 0).applyQuaternion(currentQuaternion).normalize();
      const testCenter = fixedPoint.clone().addScaledVector(dragAxis, testLength / 2);
      const testPart = this.createLengthTestPart(part, testLength, testCenter, currentQuaternion);
      const testSourcePort = resolvePartPorts(testPart, typeDef).find(port => port.portId === draggedPortId);
      if (!testSourcePort) {
        return null;
      }

      const targetPorts = resolveAssemblyPorts(this.assembly, this.catalog, { exceptPartId: part.id })
        .filter(port => port.kind === 'fixed' || port.kind === 'track');

      let best = null;
      let bestScore = this.snapDistance;

      for (const targetPort of targetPorts) {
        const rules = this.catalog.getMatchingRules(testSourcePort, targetPort);
        for (const rule of rules) {
          if (rule.connectionMode === 'fixed-to-fixed' && targetPort.kind !== 'fixed') {
            continue;
          }
          if (rule.connectionMode === 'fixed-to-track' && targetPort.kind !== 'track') {
            continue;
          }
          if (!this.normalsMatch(rule, testSourcePort.normal, targetPort.normal)) {
            continue;
          }

          const maxGap = this.getMaxGap(rule);
          const targetPoint = contactPointOnTarget(targetPort, testSourcePort.position);
          const preSnapDistance = testSourcePort.position.distanceTo(targetPoint);
          if (preSnapDistance > maxGap) {
            continue;
          }

          const projectedLength = dragAxis.dot(targetPoint.clone().sub(fixedPoint));
          if (lengthDef && typeof lengthDef.min === 'number' && projectedLength < lengthDef.min - 0.5) {
            continue;
          }
          if (lengthDef && typeof lengthDef.max === 'number' && projectedLength > lengthDef.max + 0.5) {
            continue;
          }

          const normalizedLength = this.catalog.normalizeParams(part.typeId, Object.assign({}, part.params, { length: projectedLength })).length;
          const snappedCenter = fixedPoint.clone().addScaledVector(dragAxis, normalizedLength / 2);
          const snappedPart = this.createLengthTestPart(part, normalizedLength, snappedCenter, currentQuaternion);
          const sourcePort = resolvePartPorts(snappedPart, typeDef).find(port => port.portId === draggedPortId);
          if (!sourcePort) {
            continue;
          }

          const snappedTargetPoint = contactPointOnTarget(targetPort, sourcePort.position);
          const finalDistance = sourcePort.position.distanceTo(snappedTargetPoint);
          if (finalDistance > 1.5) {
            continue;
          }

          const requiresFit = !rule.constraints || rule.constraints.requireContactFit !== false;
          if (requiresFit && !footprintFitsOnTarget(sourcePort, targetPort, snappedTargetPoint, currentQuaternion)) {
            continue;
          }

          const score = preSnapDistance + Math.abs(normalizedLength - testLength) * 0.05;
          if (score >= bestScore) {
            continue;
          }

          bestScore = score;
          best = {
            length: normalizedLength,
            center: snappedCenter,
            sourcePort,
            targetPort,
            ruleId: rule.ruleId,
            targetPt: {
              world: snappedTargetPoint.clone(),
              normal: targetPort.normal.clone()
            }
          };
        }
      }

      return best;
    }

    findTargetedComponentSnap(componentSnapshot, sourcePort, targetPort, currentRootQuaternion, snapAlign, preferredWorldPoint) {
      const variants = this.findTargetedComponentSnapVariants(
        componentSnapshot,
        sourcePort,
        targetPort,
        currentRootQuaternion,
        snapAlign,
        preferredWorldPoint
      );
      return variants[0] || null;
    }

    findTargetedComponentSnapVariants(componentSnapshot, sourcePort, targetPort, currentRootQuaternion, snapAlign, preferredWorldPoint) {
      if (!sourcePort || !targetPort) {
        return [];
      }

      const rules = this.catalog.getMatchingRules(sourcePort, targetPort);
      const variants = [];
      for (const rule of rules) {
        if (rule.connectionMode === 'fixed-to-fixed' && targetPort.kind !== 'fixed') {
          continue;
        }
        if (rule.connectionMode === 'fixed-to-track' && targetPort.kind !== 'track') {
          continue;
        }

        const targetSeed = preferredWorldPoint || targetPort.position;
        const targetPoint = contactPointOnTarget(targetPort, targetSeed);
        const quaternions = snapAlign
          ? quatFaceTowardVariants(
              sourcePort.localNormal,
              targetPort.normal.clone().negate(),
              rule.constraints && rule.constraints.rollStepDeg
            )
          : [currentRootQuaternion.clone()];

        for (const snapQuaternion of quaternions) {
          const sourceOffset = sourcePort.localPosition.clone().applyQuaternion(snapQuaternion);
          const fitOk = footprintFitsOnTarget(sourcePort, targetPort, targetPoint, snapQuaternion);
          const duplicate = variants.some(function(existing) {
            return existing.ruleId === rule.ruleId &&
              Math.abs(existing.snapQuat.dot(snapQuaternion)) > 0.999999 &&
              existing.snapPos.distanceTo(targetPoint.clone().sub(sourceOffset)) <= 0.001;
          });
          if (duplicate) {
            continue;
          }

          variants.push({
            snapPos: targetPoint.clone().sub(sourceOffset),
            snapQuat: snapQuaternion.clone(),
            sourcePort,
            targetPort,
            ruleId: rule.ruleId,
            fitOk,
            targetPt: {
              world: targetPoint.clone(),
              normal: targetPort.normal.clone()
            }
          });
        }
      }

      return variants;
    }
  }

  tool.engine.SnapSolver = SnapSolver;
})();