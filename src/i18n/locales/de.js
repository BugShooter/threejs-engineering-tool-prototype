(function() {
  const tool = window.EngineeringTool;
  const messages = {
    document: {
      title: '3D-Engineering-Tool v4'
    },
    locale: {
      code: 'DE',
      name: 'Deutsch'
    },
    common: {
      dash: '—',
      on: 'EIN',
      off: 'AUS',
      mm: 'mm',
      lmb: 'LMB',
      rmb: 'RMB'
    },
    topbar: {
      title: '3D-Engineering-Tool',
      subtitle: 'Arbeitsbereich',
      language: 'Sprache',
      profileName: 'Gastnutzer',
      profileMeta: 'Profil-Platzhalter'
    },
    legacy: {
      heading: '⬡ Konstruktor 3D',
      sections: {
        add: 'Hinzufügen',
        selected: 'Ausgewählt',
        connection: 'Verbindung',
        strategy: 'Strategie',
        alignment: 'Ausrichtung',
        debug: 'Debug',
        file: 'Datei'
      },
      fields: {
        length: 'Länge'
      },
      hintHtml: '<b>Gizmo:</b><br>Farbige Achsen → verschieben<br>Ringe → drehen<br>Weiße Pfeile → Profillänge<br><br><b>Klick auf Teil / Verbindung</b> → Hinweisfenster<br><b>Teil ziehen</b> → Drag ohne Hinweisfenster<br><b>Verbinden</b> → Quellport wählen, dann Ziel<br><b>Esc</b> → Auswahl aufheben / Aktion abbrechen<br><br><b>LMB</b> leerer Bereich → Orbit<br><b>RMB</b> → verschieben<br><b>Mausrad</b> → zoomen'
    },
    actions: {
      profile: 'Profil',
      angle: 'Winkelverbinder',
      straight: 'Gerader Verbinder',
      connect: 'Verbinden',
      disconnect: 'Teil trennen',
      delete: 'Löschen',
      split: 'Verbindung trennen',
      alignment: 'Ausrichtung',
      resetView: 'Ansicht zurücksetzen',
      portDebug: 'Port-Debug',
      exportJson: 'JSON exportieren',
      importJson: 'JSON importieren',
      undoStep: 'Schritt rückgängig',
      clearHistory: 'Verlauf löschen',
      previous: 'Zurück',
      next: 'Weiter',
      done: 'Fertig',
      cancel: 'Abbrechen'
    },
    debug: {
      commonFlags: 'Allgemeine Flags',
      showRay: 'Strahl',
      showHitPoint: 'Treffpunkt',
      showPortNormal: 'Port-Normale',
      showExactPlane: 'Exakte Ebene',
      showLiftedOverlay: 'Angehobenes Overlay',
      showContactFootprint: 'Kontaktfläche',
      showShortlist: 'Hover-Shortlist'
    },
    strategies: {
      visibleHidden: 'Sichtbar / Versteckt'
    },
    partTypes: {
      profile20x20: 'Profil 20x20',
      connectorStraight20: 'Gerader Verbinder',
      connectorAngle20: 'Winkelverbinder'
    },
    visibleHiddenDebug: {
      showVisibleCandidates: 'Sichtbare Kandidaten',
      showHiddenCandidates: 'Versteckte Kandidaten',
      showHiddenActivationZone: 'Aktivierungszone versteckt',
      showScreenPolygons: 'Bildschirm-Polygone',
      showCandidateScores: 'Kandidaten-Scores',
      visibleScreenMargin: 'Sichtbarer Rand',
      visibleLockDistance: 'Sichtbare Sperre',
      hiddenRayThresholdFixed: 'Versteckt fest',
      hiddenRayThresholdTrack: 'Versteckt Track',
      hiddenPartThreshold: 'Teilabstand versteckt'
    },
    project: {
      tab: 'Projekt',
      exportCaption: 'Aktuellen Baugruppenstatus speichern',
      importCaption: 'Gespeicherte Projektdatei laden'
    },
    settings: {
      tab: 'Einstellungen',
      targetStrategy: 'Zielauswahlstrategie',
      undoHistory: 'Undo-Verlauf',
      limit: 'Limit',
      undoDepth: 'Schritte im Verlauf: {{count}} / {{limit}}',
      undoActionCaption: 'Einen Schritt zurückgehen',
      clearHistoryCaption: 'Gesammelte Snapshots löschen'
    },
    widgets: {
      add: 'Hinzufügen',
      part: 'Teil',
      joint: 'Verbindung',
      hints: 'Hinweise',
      targetDebug: 'Debug der Zielauswahl',
      targetDebugNote: 'Die Diagnose liegt im Edge Drawer, damit sie die Haupt-Tabs nicht belegt. Die Einstellungen sind vertikal gruppiert und füllen die gesamte Drawer-Breite.',
      noData: 'Keine Daten',
      partEmpty: 'Kein Teil ausgewählt',
      jointEmpty: 'Keine Verbindung ausgewählt',
      choosePortCaption: 'Port auswählen',
      disconnectCaption: 'Verbindungen entfernen',
      deleteCaption: 'Ausgewähltes Teil löschen'
    },
    status: {
      mode: 'Modus',
      snap: 'Snap',
      snapActive: '⊕ AKTIV',
      snapBadge: '⊕ SNAP'
    },
    hints: {
      line1: 'Gizmo: Achsen → verschieben, Ringe → drehen, weiße Pfeile → Länge',
      line2: 'Klick auf Teil oder Verbindung → Hinweisfenster',
      line3: 'Teil ziehen → Drag ohne Hinweisfenster',
      line4: 'Verbinden → Quellport und dann Ziel wählen',
      line5: 'Esc → Auswahl aufheben oder Aktion abbrechen',
      line6: 'LMB leerer Bereich → Orbit, RMB → verschieben, Rad → zoomen'
    },
    modes: {
      moveAxis: 'Verschieben {axis}',
      rotateAxis: 'Drehen {axis}',
      lengthEnd: 'Laenge {end}',
      connected: 'Verbunden',
      adjusted: 'Angepasst',
      adjustJoint: 'Verbindung anpassen',
      noSourcePort: 'Kein Quellanschluss',
      connect: 'Verbinden',
      connectTarget: 'Verbindungsziel',
      resizeLocked: 'Groesse gesperrt',
      drag: 'Ziehen',
      joint: 'Verbindung',
      select: 'Auswaehlen',
      orbit: 'Orbit'
    },
    tooltips: {
      closeFullscreen: 'Vollbild schliessen',
      exitFullscreen: 'Vollbild verlassen',
      enterFullscreen: 'Fast auf die volle Canvas-Groesse erweitern',
      expandPanel: 'Panel erweitern',
      collapsePanel: 'Panel einklappen',
      showPanel: 'Panel anzeigen: {label}',
      hidePanel: 'Panel ausblenden: {label}'
    },
    hud: {
      target: 'Ziel',
      snap: 'Snap',
      end: 'Ende',
      delta: 'Delta',
      axis: 'Achse',
      angle: 'Winkel',
      mode: 'Modus',
      step: 'Schritt',
      available: 'Verfuegbar',
      orientation: 'Orientierung',
      switch: 'Wechsel',
      source: 'Quelle',
      confirm: 'Bestaetigen',
      chooseSourcePort: 'Quellport auswaehlen',
      hoverPort: 'Port mit dem Cursor anfahren'
    },
    reasons: {
      resizeOnlyProfile: 'Die Groessenanpassung ist nur fuer Profile verfuegbar.',
      resizeFreeEndOnly: 'Es kann nur ein freies Profilende gezogen werden.',
      jointNotFound: 'Verbindung nicht gefunden',
      adjustSideNotInJoint: 'Diese Seite gehoert nicht zur ausgewaehlten Verbindung',
      adjustLockedLoop: 'Diese Seite ist gesperrt, weil die Verbindung zu einer geschlossenen Schleife gehoert',
      adjustMissingSubassembly: 'Eine Unterbaugruppe fuer die Anpassung konnte nicht erstellt werden',
      adjustSourcePortUnavailable: 'Der Port der gewaehlten Seite ist fuer die Anpassung nicht verfuegbar',
      adjustMissingOtherSide: 'Die zweite Seite der Verbindung konnte nicht wiederhergestellt werden',
      adjustOnlyOneOrientation: 'Fuer diese Seite ist nur eine Orientierung verfuegbar',
      adjustMissingVariants: 'Orientierungsvarianten konnten nicht wiederhergestellt werden'
    },
    callout: {
      position: 'Position',
      explicitConnectMode: 'Expliziter Verbindungsmodus ueber Portauswahl',
      noFreeSourcePort: 'Kein freier Quellport fuer die Verbindung verfuegbar',
      moveMode: 'Verschiebemodus',
      rotateMode: 'Drehmodus',
      lengthMode: 'Laengenmodus',
      lengthModeBlocked: 'Zum Aendern der Laenge ist ein freies Profilende noetig',
      disconnectSelectedPart: 'Ausgewaehltes Teil trennen',
      deleteSelectedPart: 'Ausgewaehltes Teil loeschen',
      adjustConnectionTitle: 'Verbindung anpassen',
      side: 'Seite',
      previewNewOrientation: 'Vorschau: neue Orientierung',
      previewCurrentPosition: 'Vorschau: aktuelle Position',
      previousOrientation: 'Vorherige Orientierung (←)',
      nextOrientation: 'Naechste Orientierung (→)',
      applyOrientation: 'Orientierung anwenden (Enter / LMB)',
      cancelAdjustment: 'Anpassung abbrechen (Esc)',
      connectionTitle: 'Verbindung {id}',
      rotateSide: '{side} drehen: {part}',
      split: 'Trennen',
      splitSelectedJoint: 'Ausgewaehlte Verbindung trennen'
    },
    selection: {
      length: 'Länge',
      connections: 'Verbindungen',
      subassembly: 'Unterbaugruppe'
    },
    joint: {
      rule: 'Regel'
    }
  };

  tool.i18n.instance.registerLocale('de', messages);
})();