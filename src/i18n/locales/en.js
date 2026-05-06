(function() {
  const tool = window.EngineeringTool;
  const messages = {
    document: {
      title: '3D Engineering Tool v4'
    },
    locale: {
      code: 'EN',
      name: 'English'
    },
    common: {
      dash: '—',
      on: 'ON',
      off: 'OFF',
      mm: 'mm',
      lmb: 'LMB',
      rmb: 'RMB'
    },
    topbar: {
      title: '3D Engineering Tool',
      subtitle: 'Workspace',
      language: 'Language',
      profileName: 'Guest User',
      profileMeta: 'Profile Placeholder'
    },
    legacy: {
      heading: '⬡ Constructor 3D',
      sections: {
        add: 'Add',
        selected: 'Selected',
        connection: 'Connection',
        strategy: 'Strategy',
        alignment: 'Snap',
        debug: 'Debug',
        file: 'File'
      },
      fields: {
        length: 'Length'
      },
      hintHtml: '<b>Gizmo:</b><br>Colored axes → move<br>Rings → rotate<br>White arrows → profile length<br><br><b>Click a part / joint</b> → callout<br><b>Drag a part</b> → drag without callout<br><b>Connect</b> → choose a source port, then a target<br><b>Esc</b> → clear selection / cancel action<br><br><b>LMB</b> empty space → orbit<br><b>RMB</b> → pan<br><b>Wheel</b> → zoom'
    },
    actions: {
      profile: 'Profile',
      angle: 'Angle connector',
      straight: 'Straight connector',
      connect: 'Connect',
      disconnect: 'Disconnect part',
      delete: 'Delete',
      split: 'Split connection',
      alignment: 'Alignment',
      resetView: 'Reset view',
      portDebug: 'Port debug',
      exportJson: 'Export JSON',
      importJson: 'Import JSON',
      undoStep: 'Undo step',
      redoStep: 'Redo step',
      clearHistory: 'Clear history',
      saveSelectionToCatalog: 'Save selection',
      saveSceneToCatalog: 'Save scene',
      removeFromCatalog: 'Remove',
      renameCatalogEntry: 'Rename',
      previous: 'Previous',
      next: 'Next',
      done: 'Done',
      cancel: 'Cancel'
    },
    debug: {
      commonFlags: 'Common flags',
      showRay: 'Ray',
      showHitPoint: 'Hit point',
      showPortNormal: 'Port normal',
      showExactPlane: 'Exact plane',
      showLiftedOverlay: 'Lifted overlay',
      showContactFootprint: 'Footprint',
      showShortlist: 'Hover shortlist'
    },
    strategies: {
      visibleHidden: 'Visible / Hidden'
    },
    partTypes: {
      profile20x20: 'Profile 20x20',
      connectorStraight20: 'Straight connector',
      connectorAngle20: 'Angle connector'
    },
    visibleHiddenDebug: {
      showVisibleCandidates: 'Visible candidates',
      showHiddenCandidates: 'Hidden candidates',
      showHiddenActivationZone: 'Hidden activation zone',
      showScreenPolygons: 'Screen polygons',
      showCandidateScores: 'Candidate scores',
      visibleScreenMargin: 'Visible margin',
      visibleLockDistance: 'Visible lock',
      hiddenRayThresholdFixed: 'Hidden fixed',
      hiddenRayThresholdTrack: 'Hidden track',
      hiddenPartThreshold: 'Hidden part dist'
    },
    project: {
      tab: 'Project',
      exportCaption: 'Save the current assembly state',
      importCaption: 'Load a saved project file'
    },
    settings: {
      tab: 'Settings',
      targetStrategy: 'Target selection strategy',
      undoHistory: 'Undo history',
      limit: 'Limit',
      undoDepth: 'Undo / Redo steps: {{undoCount}} / {{redoCount}} · limit {{limit}}',
      undoActionCaption: 'Return one step back',
      redoActionCaption: 'Move one step forward',
      clearHistoryCaption: 'Clear accumulated snapshots'
    },
    widgets: {
      structure: 'Structure',
      catalog: 'Catalog',
      savedAssemblies: 'Saved',
      add: 'Add',
      part: 'Part',
      joint: 'Connection',
      hints: 'Hints',
      targetDebug: 'Target Selection Debug',
      targetDebugNote: 'Diagnostics live in the edge drawer so they do not occupy the main tabs. Settings are grouped vertically and stretch to the full drawer width.',
      noData: 'No data',
      structureEmpty: 'No parts in scene',
      partEmpty: 'No part selected',
      jointEmpty: 'No connection selected',
      choosePortCaption: 'Choose a port',
      disconnectCaption: 'Remove connections',
      deleteCaption: 'Delete the selected part'
    },
    catalog: {
      note: 'Saved assemblies stay in this browser and can be reused later.',
      empty: 'No saved assemblies yet',
      editorTitle: 'Save to catalog',
      saveSelectionCaption: 'Save the selected connected subassembly',
      saveSceneCaption: 'Save the current scene as a catalog item',
      insertCaption: 'Click to add this assembly to the scene',
      confirmCaption: 'Store this catalog entry',
      cancelCaption: 'Close the save form',
      removeCaption: 'Remove this saved entry',
      renameCaption: 'Update the saved assembly name',
      storageUnavailable: 'Browser storage is unavailable in this session.',
      modalNote: 'Check the preview and adjust the assembly name before saving it to the catalog.',
      nameLabel: 'Name',
      defaultNameBase: 'Assembly',
      namePromptSelection: 'Name for the saved subassembly:',
      namePromptScene: 'Name for the saved scene:',
      groupPrompt: 'Optional group name for related parts later:',
      removeConfirm: 'Remove "{{name}}" from the catalog?',
      unnamed: 'Unnamed assembly',
      defaultSceneName: 'Scene assembly',
      defaultSelectionName: '{{label}} subassembly',
      groupLabel: 'Group',
      ungrouped: 'No group',
      parts: 'Parts',
      scopeLabel: 'Scope',
      scopeScene: 'Scene',
      scopeSelection: 'Subassembly'
    },
    status: {
      mode: 'Mode',
      snap: 'Snap',
      snapActive: '⊕ ACTIVE',
      snapBadge: '⊕ SNAP'
    },
    hints: {
      line1: 'Gizmo: axes → move, rings → rotate, white arrows → length',
      line2: 'Click a part or connection → callout',
      line3: 'Drag a part → drag without callout',
      line4: 'Connect → choose a source port, then a target',
      line5: 'Esc → clear selection or cancel action',
      line6: 'LMB empty space → orbit, RMB → pan, wheel → zoom'
    },
    modes: {
      moveAxis: 'Move {axis}',
      rotateAxis: 'Rotate {axis}',
      lengthEnd: 'Length {end}',
      connected: 'Connected',
      adjusted: 'Adjusted',
      adjustJoint: 'Adjust joint',
      noSourcePort: 'No source port',
      connect: 'Connect',
      connectTarget: 'Connect target',
      resizeLocked: 'Resize locked',
      drag: 'Drag',
      joint: 'Joint',
      select: 'Select',
      orbit: 'Orbit'
    },
    tooltips: {
      closeFullscreen: 'Close fullscreen',
      exitFullscreen: 'Exit fullscreen',
      enterFullscreen: 'Expand to almost full canvas',
      expandPanel: 'Expand panel',
      collapsePanel: 'Collapse panel',
      showPanel: 'Show panel: {label}',
      hidePanel: 'Hide panel: {label}'
    },
    hud: {
      target: 'Target',
      snap: 'Snap',
      end: 'End',
      delta: 'Delta',
      axis: 'Axis',
      angle: 'Angle',
      mode: 'Mode',
      step: 'Step',
      available: 'Available',
      orientation: 'Orientation',
      switch: 'Switch',
      source: 'Source',
      confirm: 'Confirm',
      chooseSourcePort: 'Choose a source port',
      hoverPort: 'Hover a port'
    },
    reasons: {
      resizeOnlyProfile: 'Resizing is available only for profiles.',
      resizeFreeEndOnly: 'Only a free profile end can be stretched.',
      jointNotFound: 'Connection not found',
      adjustSideNotInJoint: 'This side does not belong to the selected connection',
      adjustLockedLoop: 'This side is locked because the connection belongs to a closed loop',
      adjustMissingSubassembly: 'Failed to build a subassembly for adjustment',
      adjustSourcePortUnavailable: 'The selected-side port is unavailable for adjustment',
      adjustMissingOtherSide: 'Failed to restore the other side of the connection',
      adjustOnlyOneOrientation: 'Only one orientation is available for this side',
      adjustMissingVariants: 'Failed to restore orientation variants'
    },
    callout: {
      position: 'Position',
      explicitConnectMode: 'Explicit connect mode via port selection',
      noFreeSourcePort: 'No free source port is available for connection',
      moveMode: 'Move mode',
      rotateMode: 'Rotate mode',
      lengthMode: 'Length mode',
      lengthModeBlocked: 'A free profile end is required to change the length',
      disconnectSelectedPart: 'Disconnect the selected part',
      deleteSelectedPart: 'Delete the selected part',
      adjustConnectionTitle: 'Connection adjustment',
      side: 'Side',
      previewNewOrientation: 'Preview: new orientation',
      previewCurrentPosition: 'Preview: current position',
      previousOrientation: 'Previous orientation (←)',
      nextOrientation: 'Next orientation (→)',
      applyOrientation: 'Apply orientation (Enter / LMB)',
      cancelAdjustment: 'Cancel adjustment (Esc)',
      connectionTitle: 'Connection {id}',
      rotateSide: 'Rotate {side}: {part}',
      split: 'Split',
      splitSelectedJoint: 'Split the selected connection'
    },
    selection: {
      length: 'Length',
      connections: 'Connections',
      subassembly: 'Subassembly'
    },
    joint: {
      rule: 'Rule'
    }
  };

  tool.i18n.instance.registerLocale('en', messages);
})();