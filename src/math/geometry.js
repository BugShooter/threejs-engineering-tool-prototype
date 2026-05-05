(function() {
  const tool = window.EngineeringTool;

  function safePerpendicular(normal, hint) {
    let base = hint ? hint.clone() : new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.dot(base)) > 0.9) {
      base = Math.abs(normal.x) < 0.9
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 0, 1);
    }
    return new THREE.Vector3().crossVectors(normal, base).normalize();
  }

  function buildFacingBaseQuaternion(source, target) {
    const first = new THREE.Quaternion();
    const dot = source.dot(target);

    if (dot > 0.9999) {
      first.identity();
      return first;
    }

    if (dot < -0.9999) {
      let perpendicular = new THREE.Vector3(1, 0, 0);
      if (Math.abs(source.dot(perpendicular)) > 0.9) {
        perpendicular = new THREE.Vector3(0, 1, 0);
      }
      first.setFromAxisAngle(new THREE.Vector3().crossVectors(source, perpendicular).normalize(), Math.PI);
      return first;
    }

    first.setFromUnitVectors(source, target);
    return first;
  }

  function buildRollVariantAngles(target, baseQuaternion, rollStepDeg) {
    const worldY = new THREE.Vector3(0, 1, 0).applyQuaternion(baseQuaternion);
    const projected = worldY.clone().sub(target.clone().multiplyScalar(worldY.dot(target)));
    if (projected.lengthSq() < 1e-6) {
      return {
        currentAngle: null,
        angles: [null]
      };
    }

    projected.normalize();
    const reference = Math.abs(target.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(target, reference).normalize();
    const v = new THREE.Vector3().crossVectors(u, target).normalize();
    const currentAngle = Math.atan2(projected.dot(v), projected.dot(u));
    const step = (rollStepDeg || 90) * Math.PI / 180;

    if (!(step > 1e-6) || step >= Math.PI * 2 - 1e-6) {
      return {
        currentAngle,
        angles: [currentAngle]
      };
    }

    const snappedAngle = Math.round(currentAngle / step) * step;
    const variantCount = Math.max(1, Math.round((Math.PI * 2) / step));
    const angles = [];
    for (let index = 0; index < variantCount; index += 1) {
      angles.push(snappedAngle + index * step);
    }
    return {
      currentAngle,
      angles
    };
  }

  function quatFaceTowardVariants(src, desired, rollStepDeg) {
    const source = src.clone().normalize();
    const target = desired.clone().normalize();
    const baseQuaternion = buildFacingBaseQuaternion(source, target);
    const rollData = buildRollVariantAngles(target, baseQuaternion, rollStepDeg);
    const variants = [];

    for (const angle of rollData.angles) {
      const quaternion = angle === null
        ? baseQuaternion.clone()
        : new THREE.Quaternion()
            .setFromAxisAngle(target, angle - rollData.currentAngle)
            .multiply(baseQuaternion.clone());
      const duplicate = variants.some(function(existing) {
        return Math.abs(existing.dot(quaternion)) > 0.999999;
      });
      if (!duplicate) {
        variants.push(quaternion);
      }
    }

    return variants.length ? variants : [baseQuaternion.clone()];
  }

  function quatFaceToward(src, desired, rollStepDeg) {
    return quatFaceTowardVariants(src, desired, rollStepDeg)[0];
  }

  function contactPointOnTarget(targetPort, worldPoint) {
    if (targetPort.kind === 'track') {
      const delta = worldPoint.clone().sub(targetPort.position);
      const slide = THREE.MathUtils.clamp(
        delta.dot(targetPort.axisU),
        targetPort.slideMin,
        targetPort.slideMax
      );
      return targetPort.position.clone().addScaledVector(targetPort.axisU, slide);
    }

    return targetPort.position.clone();
  }

  function sourceFootprintAxes(sourcePort, snapQuaternion) {
    const worldNormal = sourcePort.localNormal.clone().applyQuaternion(snapQuaternion).normalize();
    let axisV = sourcePort.localUp.clone().applyQuaternion(snapQuaternion);
    axisV.sub(worldNormal.clone().multiplyScalar(axisV.dot(worldNormal)));
    if (axisV.lengthSq() < 1e-6) {
      axisV = safePerpendicular(worldNormal);
    } else {
      axisV.normalize();
    }
    const axisU = new THREE.Vector3().crossVectors(axisV, worldNormal).normalize();
    return { axisU, axisV, normal: worldNormal };
  }

  function footprintFitsOnTarget(sourcePort, targetPort, contactPoint, snapQuaternion) {
    if (!targetPort.contactWidth || !targetPort.contactHeight) {
      return true;
    }

    const halfTargetU = targetPort.contactWidth / 2;
    const halfTargetV = targetPort.contactHeight / 2;
    const halfSourceU = (sourcePort.contactWidth || 0) / 2;
    const halfSourceV = (sourcePort.contactHeight || 0) / 2;
    const sourceAxes = sourceFootprintAxes(sourcePort, snapQuaternion);

    for (const su of [-1, 1]) {
      for (const sv of [-1, 1]) {
        const corner = contactPoint.clone()
          .addScaledVector(sourceAxes.axisU, su * halfSourceU)
          .addScaledVector(sourceAxes.axisV, sv * halfSourceV);
        const relative = corner.sub(targetPort.position);
        if (Math.abs(relative.dot(targetPort.axisU)) > halfTargetU + 0.5) {
          return false;
        }
        if (Math.abs(relative.dot(targetPort.axisV)) > halfTargetV + 0.5) {
          return false;
        }
      }
    }

    return true;
  }

  function quaternionFromAxes(axisU, axisV, normal) {
    const matrix = new THREE.Matrix4().makeBasis(
      axisU.clone().normalize(),
      axisV.clone().normalize(),
      normal.clone().normalize()
    );
    return new THREE.Quaternion().setFromRotationMatrix(matrix);
  }

  tool.math.safePerpendicular = safePerpendicular;
  tool.math.quatFaceToward = quatFaceToward;
  tool.math.quatFaceTowardVariants = quatFaceTowardVariants;
  tool.math.contactPointOnTarget = contactPointOnTarget;
  tool.math.sourceFootprintAxes = sourceFootprintAxes;
  tool.math.footprintFitsOnTarget = footprintFitsOnTarget;
  tool.math.quaternionFromAxes = quaternionFromAxes;
})();