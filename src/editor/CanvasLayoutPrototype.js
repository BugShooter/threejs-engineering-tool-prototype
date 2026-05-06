(function() {
  const tool = window.EngineeringTool;

  function getI18nInstance() {
    return tool && tool.i18n && tool.i18n.instance ? tool.i18n.instance : null;
  }

  function interpolateTemplate(template, replacements) {
    if (!replacements) {
      return template;
    }
    return String(template).replace(/\{\{?\s*([\w.]+)\s*\}?\}/g, function(match, key) {
      return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
    });
  }

  function t(path, fallback, replacements) {
    const i18n = getI18nInstance();
    if (i18n && typeof i18n.t === 'function') {
      const translated = i18n.t(path, replacements);
      if (typeof translated === 'string' && translated !== path) {
        return interpolateTemplate(translated, replacements);
      }
    }
    return interpolateTemplate(fallback, replacements);
  }

  function ensurePrototypeStyles() {
    if (document.getElementById('canvas-layout-prototype-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'canvas-layout-prototype-styles';
    style.textContent = [
      '.canvas-layout-prototype,.canvas-layout-prototype-modal-host{position:absolute;inset:0;pointer-events:none;--canvas-layout-system-inset:18px;}',
      '.canvas-layout-prototype{z-index:16;}',
      '.canvas-layout-prototype-stage{position:absolute;inset:var(--canvas-layout-system-inset);display:block;min-width:0;min-height:0;}',
      '.canvas-layout-prototype-edge-host{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:18;}',
      '.canvas-layout-prototype-modal-host{z-index:26;}',
      '.canvas-layout-flow{display:flex;min-width:0;min-height:0;width:100%;height:100%;pointer-events:none;}',
      '.canvas-layout-flow.is-vertical{flex-direction:column;}',
      '.canvas-layout-flow.is-horizontal{flex-direction:row;}',
      '.canvas-layout-flow[data-layout-id="left-panel-row"]>.canvas-layout-tab-mount{flex:1 1 auto;min-width:0;}',
      '.canvas-layout-flow[data-layout-id="left-icon-rail-row"]{width:max-content;flex:0 0 auto;height:auto;}',
      '.canvas-layout-slot{display:grid;min-width:0;min-height:0;pointer-events:none;}',
      '.canvas-layout-slot.is-overlay-host{position:relative;overflow:visible;}',
      '.canvas-layout-slot>*{min-width:0;min-height:0;pointer-events:none;}',
      '.canvas-layout-slot-overlay{position:absolute;inset:0;display:flex;pointer-events:none;z-index:3;overflow:visible;}',
      '.canvas-layout-slot-overlay[data-anchor="left-stretch"]{align-items:stretch;justify-content:flex-start;}',
      '.canvas-layout-slot-overlay[data-anchor="right-bottom"]{align-items:flex-end;justify-content:flex-end;}',
      '.canvas-layout-card,.canvas-layout-tab-panel,.canvas-layout-icon-rail{background:rgba(11,14,20,.9);border:1px solid #28344f;border-radius:8px;box-shadow:0 18px 34px rgba(0,0,0,.24);backdrop-filter:blur(10px);color:#dce6ff;}',
      '.canvas-layout-card,.canvas-layout-tab-panel,.canvas-layout-icon-rail,.canvas-layout-button{pointer-events:auto;}',
      '.canvas-layout-card{display:flex;flex-direction:column;gap:10px;padding:7px 8px;max-width:min(100%,340px);}',
      '.canvas-layout-card.is-ghost{background:transparent;border:none;box-shadow:none;backdrop-filter:none;padding:0;}',
      '.canvas-layout-card-title{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8fb1ff;}',
      '.canvas-layout-card-note{font-size:8px;line-height:1.55;color:#7e90b7;}',
      '.canvas-layout-button-stack{display:flex;gap:6px;flex-wrap:wrap;}',
      '.canvas-layout-button-stack.is-column{flex-direction:column;align-items:stretch;}',
      '.canvas-layout-button-stack.is-row{flex-direction:row;align-items:center;justify-content:center;}',
      '.canvas-layout-button{display:flex;flex-direction:column;align-items:flex-start;gap:3px;border:1px solid #2f3f63;border-radius:6px;background:rgba(23,30,44,.88);color:#dce6ff;padding:6px 8px;min-width:120px;cursor:pointer;font-family:"JetBrains Mono",monospace;font-size:9px;line-height:1.35;transition:transform .12s,border-color .12s,background .12s;}',
      '.canvas-layout-button:hover{transform:translateY(-1px);border-color:#67a6ff;background:rgba(29,38,55,.96);}',
      '.canvas-layout-button.is-accent{border-color:#4ea1ff;background:rgba(24,44,73,.9);}',
      '.canvas-layout-button.is-success{border-color:#2bcf88;background:rgba(18,55,44,.9);}',
      '.canvas-layout-button-label{font-size:9px;color:#eef4ff;}',
      '.canvas-layout-button-caption{font-size:7px;color:#8da1cc;}',
      '.canvas-layout-tab-mount{min-width:0;min-height:0;display:flex;}',
      '.canvas-layout-tab-mount.is-slot-constrained{max-width:100%;max-height:100%;min-height:0;justify-content:flex-end;align-items:flex-start;}',
      '.canvas-layout-tab-mount.is-slot-constrained[data-dock="left"]{justify-content:flex-start;}',
      '.canvas-layout-widget-mount{display:flex;min-width:0;min-height:0;pointer-events:auto;}',
      '.canvas-layout-widget-surface{display:flex;flex-direction:column;gap:8px;border:1px solid #28344f;border-radius:8px;background:rgba(11,14,20,.9);box-shadow:0 18px 34px rgba(0,0,0,.24);backdrop-filter:blur(10px);color:#dce6ff;padding:7px 8px;min-width:0;}',
      '.canvas-layout-widget-title{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#dbe6ff;}',
      '.canvas-layout-widget-note{font-size:8px;line-height:1.5;color:#91a6d1;}',
      '.canvas-layout-widget-empty{font-size:8px;line-height:1.5;color:#6f82ad;}',
      '.canvas-layout-widget-lines{display:flex;flex-direction:column;gap:4px;font-size:8px;line-height:1.5;color:#91a6d1;}',
      '.canvas-layout-widget-field-row{display:flex;align-items:center;gap:6px;font-size:8px;color:#91a6d1;}',
      '.canvas-layout-widget-field-label{font-size:7px;letter-spacing:.08em;text-transform:uppercase;color:#7f94bf;white-space:nowrap;}',
      '.canvas-layout-widget-number{width:72px;background:#181b24;border:1px solid #252a38;color:#dce6ff;font-family:"JetBrains Mono",monospace;font-size:9px;padding:4px 6px;border-radius:6px;outline:none;}',
      '.canvas-layout-widget-number:focus{border-color:#5a8fff;}',
      '.canvas-layout-widget-actions{display:flex;flex-wrap:wrap;gap:6px;}',
      '.canvas-layout-widget-actions .canvas-layout-button{flex:1 1 140px;min-width:0;}',
      '.canvas-layout-status-chip{display:flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid #324264;border-radius:8px;background:rgba(23,30,44,.92);color:#dce6ff;box-shadow:0 10px 24px rgba(0,0,0,.2);}',
      '.canvas-layout-status-chip.is-hidden{display:none;}',
      '.canvas-layout-status-chip.is-active{border-color:#20ff88;color:#dfffea;background:rgba(16,41,31,.92);}',
      '.canvas-layout-status-chip-label{font-size:7px;letter-spacing:.08em;text-transform:uppercase;color:#8da1cc;}',
      '.canvas-layout-status-chip-value{font-size:8px;color:#eef4ff;}',
      '.canvas-layout-status-panel{min-width:176px;max-width:240px;padding:8px 10px;border:1px solid #28344f;border-radius:8px;background:rgba(10,12,16,.92);box-shadow:0 10px 26px rgba(0,0,0,.22);color:#8ea0c8;}',
      '.canvas-layout-status-panel.is-hidden{display:none;}',
      '.canvas-layout-status-panel .ttl{font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#cfe0ff;margin-bottom:4px;}',
      '.canvas-layout-status-panel .kv{color:#6f82ad;}',
      '.canvas-layout-status-panel .v{color:#d7e2ff;}',
      '.canvas-layout-view-widget{display:flex;align-items:flex-end;justify-content:flex-end;min-width:112px;min-height:112px;pointer-events:auto;}',
      '.canvas-layout-tab-panel{display:flex;flex-direction:column;min-width:0;min-height:0;max-width:100%;}',
      '.canvas-layout-tab-panel.is-slot-constrained{max-height:100%;overflow:hidden;}',
      '.canvas-layout-tab-panel.is-fill-height{height:100%;}',
      '.canvas-layout-tab-panel.is-stretch-x{width:100%;}',
      '.canvas-layout-tab-shell{display:flex;flex-direction:column;min-width:0;min-height:0;width:100%;}',
      '.canvas-layout-tab-panel.is-slot-constrained .canvas-layout-tab-shell{max-height:100%;}',
      '.canvas-layout-tab-panel.is-fill-height .canvas-layout-tab-shell{height:100%;}',
      '.canvas-layout-tab-strip{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px 6px 8px;min-width:0;}',
      '.canvas-layout-tab-list-viewport{display:flex;flex:1 1 auto;min-width:0;overflow:hidden;}',
      '.canvas-layout-tab-list{display:flex;flex:1 1 auto;gap:6px;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;scroll-behavior:smooth;}',
      '.canvas-layout-tab-list::-webkit-scrollbar{display:none;}',
      '.canvas-layout-tab-actions{display:flex;flex:0 0 auto;gap:4px;}',
      '.canvas-layout-tab-action,.canvas-layout-tab-button{border:1px solid #324264;border-radius:6px;background:rgba(23,30,44,.9);color:#dce6ff;font-family:"JetBrains Mono",monospace;cursor:pointer;transition:border-color .12s,background .12s,transform .12s;}',
      '.canvas-layout-tab-action:hover{border-color:#67a6ff;background:rgba(29,38,55,.96);transform:translateY(-1px);}',
      '.canvas-layout-tab-button:hover{border-color:#67a6ff;background:rgba(29,38,55,.96);transform:none;}',
      '.canvas-layout-tab-action{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;}',
      '.canvas-layout-tab-action.is-hidden{display:none;}',
      '.canvas-layout-tab-action[aria-disabled="true"]{opacity:.42;cursor:default;transform:none;}',
      '.canvas-layout-tab-action[aria-disabled="true"]:hover{border-color:#324264;background:rgba(23,30,44,.9);transform:none;}',
      '.canvas-layout-tab-button{display:flex;flex:0 0 auto;align-items:center;justify-content:center;padding:6px 8px;min-height:28px;font-size:8px;letter-spacing:.06em;color:#9bb2df;white-space:nowrap;}',
      '.canvas-layout-tab-button.is-active{border-color:#74b0ff;color:#eef4ff;background:rgba(26,41,68,.96);}',
      '.canvas-layout-tab-panel.is-collapsed{background:transparent;border:none;box-shadow:none;backdrop-filter:none;}',
      '.canvas-layout-tab-panel.is-collapsed .canvas-layout-tab-strip{padding:0;gap:0;overflow:hidden;}',
      '.canvas-layout-tab-panel.is-collapsed .canvas-layout-tab-list{gap:0;overflow:visible;}',
      '.canvas-layout-tab-panel[data-dock="top"].is-collapsed .canvas-layout-tab-list{justify-content:flex-end;}',
      '.canvas-layout-tab-panel.is-collapsed .canvas-layout-tab-actions{display:none;}',
      '.canvas-layout-tab-panel.is-collapsed .canvas-layout-tab-button{border:none;border-right:1px solid #324264;border-radius:0;min-height:24px;padding:5px 8px;background:rgba(23,30,44,.94);}',
      '.canvas-layout-tab-panel.is-collapsed .canvas-layout-tab-button:last-child{border-right:none;}',
      '.canvas-layout-tab-panel[data-collapse-mode="vertical-tabs"].is-collapsed .canvas-layout-tab-list{flex-direction:column;align-self:flex-start;}',
      '.canvas-layout-tab-panel[data-collapse-mode="vertical-tabs"].is-collapsed{width:max-content;}',
      '.canvas-layout-tab-panel[data-collapse-mode="vertical-tabs"].is-collapsed .canvas-layout-tab-shell,.canvas-layout-tab-panel[data-collapse-mode="vertical-tabs"].is-collapsed .canvas-layout-tab-strip{width:max-content;}',
      '.canvas-layout-tab-panel[data-collapse-mode="vertical-tabs"].is-collapsed .canvas-layout-tab-button{writing-mode:vertical-rl;text-orientation:mixed;justify-content:center;border-right:none;border-bottom:1px solid #324264;min-width:30px;min-height:84px;padding:7px 4px;white-space:normal;}',
      '.canvas-layout-tab-panel[data-collapse-mode="vertical-tabs"].is-collapsed .canvas-layout-tab-button:last-child{border-bottom:none;}',
      '.canvas-layout-tab-content{display:flex;flex-direction:column;gap:8px;min-width:0;min-height:0;padding:0 8px 7px 8px;overflow:auto;}',
      '.canvas-layout-tab-content,.canvas-layout-drawer-body,.canvas-layout-edge-drawer-body{scrollbar-width:thin;scrollbar-color:#78aefc rgba(10,14,22,.92);}',
      '.canvas-layout-tab-content::-webkit-scrollbar,.canvas-layout-drawer-body::-webkit-scrollbar,.canvas-layout-edge-drawer-body::-webkit-scrollbar{width:10px;height:10px;}',
      '.canvas-layout-tab-content::-webkit-scrollbar-track,.canvas-layout-drawer-body::-webkit-scrollbar-track,.canvas-layout-edge-drawer-body::-webkit-scrollbar-track{background:rgba(10,14,22,.92);border-radius:999px;}',
      '.canvas-layout-tab-content::-webkit-scrollbar-thumb,.canvas-layout-drawer-body::-webkit-scrollbar-thumb,.canvas-layout-edge-drawer-body::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#5a8cdb 0%,#8ab9ff 100%);border:2px solid rgba(10,14,22,.92);border-radius:999px;}',
      '.canvas-layout-tab-content::-webkit-scrollbar-thumb:hover,.canvas-layout-drawer-body::-webkit-scrollbar-thumb:hover,.canvas-layout-edge-drawer-body::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#71a3f3 0%,#a4cbff 100%);}',
      '.canvas-layout-tab-panel.is-fill-height .canvas-layout-tab-content,.canvas-layout-tab-panel.is-slot-constrained .canvas-layout-tab-content{flex:1 1 auto;}',
      '.canvas-layout-tab-panel[data-dock="left"]:not(.is-collapsed){min-width:300px;}',
      '.canvas-layout-tab-panel[data-dock="left"] .canvas-layout-tab-content{min-width:280px;max-width:min(420px,calc(100vw - 360px));max-height:none;}',
      '.canvas-layout-tab-panel[data-dock="bottom"] .canvas-layout-tab-content{width:100%;min-height:180px;max-height:min(320px,42vh);}',
      '.canvas-layout-tab-panel.is-collapsed .canvas-layout-tab-content{display:none;}',
      '.canvas-layout-tab-grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}',
      '.canvas-layout-tab-card{display:flex;flex-direction:column;gap:6px;border:1px solid #2a3650;border-radius:8px;background:rgba(18,23,33,.92);padding:7px 8px;min-width:0;}',
      '.canvas-layout-tab-card-title{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#dbe6ff;}',
      '.canvas-layout-tab-lines{display:flex;flex-direction:column;gap:4px;font-size:8px;line-height:1.5;color:#91a6d1;}',
      '.canvas-layout-section-label{font-size:7px;letter-spacing:.1em;text-transform:uppercase;color:#7f94bf;}',
      '.canvas-layout-action-row{display:flex;flex-wrap:wrap;gap:6px;}',
      '.canvas-layout-action-row .canvas-layout-button{flex:1 1 140px;min-width:0;}',
      '.canvas-layout-choice-row{display:flex;flex-wrap:wrap;gap:6px;}',
      '.canvas-layout-choice{padding:5px 8px;border:1px solid #324264;border-radius:6px;background:rgba(23,30,44,.9);color:#9bb2df;font-size:8px;letter-spacing:.04em;}',
      '.canvas-layout-choice.is-active{border-color:#74b0ff;color:#eef4ff;background:rgba(26,41,68,.96);}',
      '.canvas-layout-toggle-list{display:flex;flex-direction:column;gap:6px;}',
      '.canvas-layout-toggle{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid #2a3650;border-radius:6px;background:rgba(18,23,33,.92);font-size:8px;color:#dbe6ff;}',
      '.canvas-layout-toggle-mark{width:14px;height:14px;display:flex;align-items:center;justify-content:center;border:1px solid #40608f;border-radius:4px;background:transparent;color:transparent;font-size:10px;line-height:1;}',
      '.canvas-layout-toggle.is-checked .canvas-layout-toggle-mark{background:#84b8ff;border-color:#84b8ff;color:#0d121b;}',
      '.canvas-layout-tab-chip-row{display:flex;flex-wrap:wrap;gap:6px;}',
      '.canvas-layout-tab-chip{padding:3px 6px;border-radius:999px;border:1px solid #2e4468;background:rgba(25,37,56,.9);font-size:7px;color:#a8c0ee;}',
      '.canvas-layout-tab-panel.is-fullscreen{width:100%;height:100%;max-width:none;}',
      '.canvas-layout-tab-panel.is-fullscreen .canvas-layout-tab-content{max-height:none;height:100%;}',
      '.canvas-layout-prototype-modal{position:absolute;inset:var(--canvas-layout-system-inset);padding:0;border-radius:12px;background:rgba(4,7,12,.52);backdrop-filter:blur(10px);pointer-events:auto;display:flex;align-items:stretch;justify-content:stretch;}',
      '.canvas-layout-prototype-modal .canvas-layout-tab-panel{width:100% !important;height:100%;max-width:none;margin:0 !important;}',
      '.canvas-layout-prototype-modal .canvas-layout-tab-shell{height:100%;}',
      '.canvas-layout-prototype-modal .canvas-layout-tab-panel[data-dock="bottom"] .canvas-layout-tab-content{height:100%;max-height:none;}',
      '.canvas-layout-catalog-modal-backdrop{position:absolute;inset:0;padding:var(--canvas-layout-system-inset);display:flex;align-items:center;justify-content:center;background:rgba(4,7,12,.58);backdrop-filter:blur(10px);pointer-events:auto;}',
      '.canvas-layout-catalog-modal{width:min(460px,100%);max-width:460px;max-height:min(100%,720px);padding:10px 10px 12px 10px;box-shadow:0 24px 46px rgba(0,0,0,.34);}',
      '.canvas-layout-catalog-modal-preview{width:100%;aspect-ratio:16 / 9;object-fit:cover;border-radius:8px;border:1px solid #2f3f63;background:rgba(16,21,31,.92);}',
      '.canvas-layout-catalog-modal .canvas-layout-widget-actions .canvas-layout-button{flex:1 1 0;min-width:0;}',
      '.canvas-layout-icon-rail{display:flex;flex-direction:column;gap:6px;padding:5px;align-self:flex-start;}',
      '.canvas-layout-icon-rail.is-ghost{background:transparent;border:none;box-shadow:none;backdrop-filter:none;padding:0;}',
      '.canvas-layout-icon-button{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1px solid #34476b;border-radius:6px;background:rgba(23,30,44,.92);color:#dfe8ff;font-family:"JetBrains Mono",monospace;font-size:21px;cursor:pointer;transition:border-color .12s,background .12s,transform .12s;}',
      '.canvas-layout-icon-button:hover{border-color:#67a6ff;background:rgba(29,38,55,.98);transform:translateY(-1px);}',
      '.canvas-layout-icon-button.is-disabled{border-color:#283247;background:rgba(17,22,33,.78);color:#7080a5;opacity:.48;box-shadow:none;cursor:default;}',
      '.canvas-layout-icon-button.is-disabled:hover{border-color:#283247;background:rgba(17,22,33,.78);transform:none;}',
      '.canvas-layout-icon-button.is-pressed,.canvas-layout-icon-button[aria-pressed="true"]{border-color:#74b0ff;background:rgba(26,41,68,.98);color:#eef4ff;box-shadow:inset 0 0 0 1px rgba(144,191,255,.22),0 10px 22px rgba(7,14,28,.34);}',
      '.canvas-layout-icon-button.is-pressed:hover,.canvas-layout-icon-button[aria-pressed="true"]:hover{border-color:#96c3ff;background:rgba(31,49,79,.99);}',
      '.canvas-layout-drawer-mount{position:relative;display:flex;align-items:stretch;height:100%;pointer-events:none;overflow:visible;z-index:3;}',
      '.canvas-layout-drawer-panel{position:relative;display:flex;align-items:stretch;min-width:0;min-height:0;height:100%;width:var(--drawer-width,296px);padding-right:var(--drawer-handle-size,32px);border:1px solid #28344f;border-radius:0 10px 10px 0;background:rgba(11,14,20,.94);box-shadow:0 18px 34px rgba(0,0,0,.26);backdrop-filter:blur(10px);color:#dce6ff;pointer-events:auto;overflow:visible;transform:translateX(calc(-100% + var(--drawer-handle-size,32px)));transition:transform .18s ease,border-color .12s ease,box-shadow .12s ease;}',
      '.canvas-layout-drawer-panel.is-open{transform:translateX(0);box-shadow:0 22px 38px rgba(0,0,0,.32);}',
      '.canvas-layout-drawer-panel:not(.is-open) .canvas-layout-drawer-body{opacity:0;pointer-events:none;}',
      '.canvas-layout-drawer-body{display:flex;flex:1 1 auto;min-width:0;min-height:0;padding:10px 10px 10px 10px;overflow:auto;transition:opacity .12s ease;}',
      '.canvas-layout-drawer-body>.canvas-layout-widget-mount{width:100%;height:100%;align-items:stretch;}',
      '.canvas-layout-drawer-handle{position:absolute;top:-1px;right:-1px;bottom:-1px;width:var(--drawer-handle-size,32px);display:flex;align-items:center;justify-content:center;padding:10px 4px;border:1px solid #324264;border-left:none;border-radius:0 10px 10px 0;background:rgba(20,27,40,.98);color:#dce6ff;font-family:"JetBrains Mono",monospace;font-size:8px;letter-spacing:.08em;text-transform:uppercase;writing-mode:vertical-rl;text-orientation:mixed;cursor:pointer;transition:border-color .12s,background .12s,transform .12s;}',
      '.canvas-layout-drawer-handle:hover{border-color:#67a6ff;background:rgba(29,38,55,.98);}',
      '.canvas-layout-edge-drawer-mount{position:absolute;left:0;top:0;display:flex;align-items:stretch;overflow:visible;pointer-events:none;z-index:1;}',
      '.canvas-layout-edge-drawer-panel{position:relative;display:flex;align-items:stretch;min-width:0;min-height:0;height:100%;width:var(--drawer-width,296px);padding-right:var(--drawer-handle-size,32px);border:1px solid #28344f;border-radius:0 10px 10px 0;background:rgba(11,14,20,.94);box-shadow:0 18px 34px rgba(0,0,0,.26);backdrop-filter:blur(10px);color:#dce6ff;overflow:visible;transition:transform .18s ease,border-color .12s ease,box-shadow .12s ease;will-change:transform;}',
      '.canvas-layout-edge-drawer-panel.is-open{box-shadow:0 22px 38px rgba(0,0,0,.32);}',
      '.canvas-layout-edge-drawer-panel.is-peeking:not(.is-open){box-shadow:0 16px 28px rgba(0,0,0,.22);}',
      '.canvas-layout-edge-drawer-body{display:flex;flex:1 1 auto;min-width:0;min-height:0;padding:10px;overflow:auto;transition:opacity .12s ease;}',
      '.canvas-layout-edge-drawer-body>.canvas-layout-widget-mount{width:100%;height:100%;align-items:stretch;}',
      '.canvas-layout-edge-drawer-handle{position:absolute;top:-1px;right:-1px;bottom:-1px;width:var(--drawer-handle-size,32px);display:flex;align-items:center;justify-content:center;padding:10px 4px;border:1px solid #324264;border-left:none;border-radius:0 10px 10px 0;background:rgba(20,27,40,.98);color:#dce6ff;font-family:"JetBrains Mono",monospace;font-size:8px;letter-spacing:.08em;text-transform:uppercase;writing-mode:vertical-rl;text-orientation:mixed;cursor:pointer;transition:border-color .12s,background .12s,transform .12s,opacity .12s;pointer-events:auto;opacity:.96;}',
      '.canvas-layout-edge-drawer-handle:hover{border-color:#67a6ff;background:rgba(29,38,55,.98);}',
      '@media (max-width: 1180px){.canvas-layout-prototype,.canvas-layout-prototype-modal-host{--canvas-layout-system-inset:14px;}.canvas-layout-flow[data-layout-id="top-row"]{padding-right:0 !important;}.canvas-layout-tab-panel[data-dock="left"]:not(.is-collapsed){min-width:300px;}.canvas-layout-tab-panel[data-dock="left"] .canvas-layout-tab-content{min-width:240px;}.canvas-layout-button{min-width:104px;}}',
      '@media (max-width: 900px){.canvas-layout-prototype,.canvas-layout-prototype-modal-host{--canvas-layout-system-inset:12px;}.canvas-layout-prototype-stage{overflow:auto;}.canvas-layout-flow.is-horizontal>.canvas-layout-slot{flex:0 0 auto !important;}.canvas-layout-flow.is-horizontal{flex-direction:column;}.canvas-layout-flow[data-layout-id="left-panel-row"],.canvas-layout-flow[data-layout-id="left-icon-rail-row"]{flex-direction:row !important;}.canvas-layout-slot{justify-items:stretch !important;}.canvas-layout-card,.canvas-layout-tab-panel[data-dock="left"] .canvas-layout-tab-content{max-width:none;}.canvas-layout-tab-panel[data-dock="left"]:not(.is-collapsed){min-width:300px;}.canvas-layout-tab-panel[data-dock="bottom"] .canvas-layout-tab-content{min-height:96px;}.canvas-layout-tab-panel.is-fill-height,.canvas-layout-tab-panel.is-fill-height .canvas-layout-tab-shell{height:auto;}.canvas-layout-tab-panel.is-fill-height .canvas-layout-tab-content{flex:0 0 auto;}.canvas-layout-tab-panel.is-collapsed .canvas-layout-tab-list{flex-wrap:wrap;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (typeof text === 'string') {
      element.textContent = text;
    }
    return element;
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function applyInlineStyles(element, styleMap) {
    if (!styleMap) {
      return;
    }

    Object.keys(styleMap).forEach(function(key) {
      element.style[key] = styleMap[key];
    });
  }

  function normalizeGridAlignment(value, axis) {
    if (value === 'left' || value === 'top' || value === 'start') {
      return 'start';
    }
    if (value === 'right' || value === 'bottom' || value === 'end') {
      return 'end';
    }
    if (value === 'stretch') {
      return 'stretch';
    }
    if (value === 'center') {
      return 'center';
    }
    return axis === 'x' ? 'stretch' : 'stretch';
  }

  function applyFlexSpec(element, config) {
    if (!config) {
      return;
    }

    const grow = typeof config.grow === 'number' ? config.grow : (config.grow ? 1 : 0);
    const shrink = typeof config.shrink === 'number' ? config.shrink : 1;
    const basis = config.basis || 'auto';

    if (config.grow != null || config.basis || config.shrink != null) {
      element.style.flex = `${grow} ${shrink} ${basis}`;
    }
  }

  function buildDemoLayoutConfig(config) {
    const leftCellOverlays = Array.isArray(config.leftCellOverlays) ? config.leftCellOverlays.filter(Boolean) : [];
    const topRegionAnchorId = config.topRegionAnchorId || 'top-region';
    const topRegionOverlayWidgets = Array.isArray(config.topRegionOverlayWidgets) ? config.topRegionOverlayWidgets.filter(Boolean) : [];
    const rightBottomWidgets = Array.isArray(config.rightBottomWidgets) ? config.rightBottomWidgets.filter(Boolean) : [];
    const leftTabs = Array.isArray(config.leftTabs) && config.leftTabs.length
      ? config.leftTabs
      : [
          {
            id: 'modes',
            label: 'Modes',
            cards: [
              {
                title: 'Test modes',
                lines: ['Build', 'Inspect', 'Present']
              }
            ]
          }
        ];
    const iconRailItems = Array.isArray(config.iconRailItems) && config.iconRailItems.length
      ? config.iconRailItems
      : [
          { icon: '⌂', label: 'Overview' },
          { icon: '⊕', label: 'Add' },
          { icon: '⚙', label: 'Tools' },
          { icon: '◌', label: 'Debug' }
        ];
    const secondaryIconRailItems = Array.isArray(config.secondaryIconRailItems) && config.secondaryIconRailItems.length
      ? config.secondaryIconRailItems
      : [];
    const centerWidgets = Array.isArray(config.centerWidgets) ? config.centerWidgets.filter(Boolean) : [];
    const topRightTabs = Array.isArray(config.topRightTabs) && config.topRightTabs.length
      ? config.topRightTabs
      : [
          {
            id: 'project',
            label: 'Project',
            buttons: [
              {
                label: 'Export JSON',
                caption: 'Save the current state',
                tone: 'accent',
                onClick: typeof config.onExportProject === 'function' ? config.onExportProject : null
              },
              {
                label: 'Import JSON',
                caption: 'Load a file',
                onClick: typeof config.onImportProject === 'function' ? config.onImportProject : null
              }
            ]
          },
          {
            id: 'settings',
            label: 'Settings',
            renderContent: typeof config.renderSettingsTab === 'function' ? config.renderSettingsTab : null,
            choicesLabel: typeof config.renderSettingsTab === 'function' ? null : 'Target selection strategy',
            choices: typeof config.renderSettingsTab === 'function' ? [] : [
              { label: 'Visible / Hidden', active: true },
              { label: 'Planned Alt' },
              { label: 'Demo Compact' }
            ],
            cards: typeof config.renderSettingsTab === 'function' ? [] : [
              {
                title: 'General settings',
                lines: ['the strategy selector can move here', 'alignment mode and camera hints stay nearby', 'preparation for replacing the current shell panel']
              }
            ]
          },
          {
            id: 'debug',
            label: 'Debug',
            renderContent: typeof config.renderDebugTab === 'function' ? config.renderDebugTab : null,
            togglesLabel: typeof config.renderDebugTab === 'function' ? null : 'Debug options',
            toggles: typeof config.renderDebugTab === 'function' ? [] : [
              { label: 'Ray', checked: true },
              { label: 'Hit point', checked: true },
              { label: 'Normal', checked: true },
              { label: 'Exact plane', checked: true },
              { label: 'Hover shortlist', checked: false }
            ],
            cards: typeof config.renderDebugTab === 'function' ? [] : [
              {
                title: 'Diagnostics',
                lines: ['controls are still provisional', 'the real migration starts after the layout is approved', 'production UX and debug stay separated']
              }
            ]
          }
        ];
    const bottomTabs = Array.isArray(config.bottomTabs) && config.bottomTabs.length
      ? config.bottomTabs
      : [
          {
            id: 'catalog',
            label: 'Catalog',
            cards: [
              {
                title: 'Test cards',
                lines: ['Profile 200', 'Angle 90', 'Straight connector', 'Custom library later']
              }
            ],
            chips: ['catalog', 'drawer candidate', 'stretch-x']
          }
        ];

    return {
      type: 'layout',
      id: 'root-layout',
      direction: 'vertical',
      grow: 1,
      basis: '0px',
      gap: 18,
      children: [
        {
          type: 'slot',
          anchorId: topRegionAnchorId,
          grow: 1,
          basis: '0px',
          alignX: 'stretch',
          alignY: 'stretch',
          overlayChildren: topRegionOverlayWidgets.length
            ? topRegionOverlayWidgets.map(function(widget) {
                return {
                  anchor: 'right-bottom',
                  content: {
                    type: 'widget',
                    widget: widget
                  }
                };
              })
            : null,
          content: {
            type: 'layout',
            id: 'top-row',
            direction: 'horizontal',
            gap: 16,
            style: centerWidgets.length ? {} : { paddingRight: '132px' },
            children: [
              {
                type: 'slot',
                grow: 1,
                basis: '380px',
                alignX: 'left',
                alignY: 'top',
                overlayChildren: leftCellOverlays,
                content: {
                  type: 'layout',
                  id: 'left-panel-row',
                  direction: 'horizontal',
                  gap: 10,
                  style: {
                    alignItems: 'flex-start'
                  },
                  children: [
                    {
                      type: 'tabs',
                      id: 'left-sandbox-tabs',
                      dock: 'left',
                      collapsed: true,
                      collapseMode: 'vertical-tabs',
                      constrainHeightToSlot: true,
                      tabs: leftTabs
                    },
                    {
                      type: 'layout',
                      id: 'left-icon-rail-row',
                      direction: 'horizontal',
                      gap: 8,
                      style: {
                        alignItems: 'flex-start'
                      },
                      children: [
                        {
                          type: 'iconRail',
                          hideSurface: true,
                          items: iconRailItems
                        }
                      ].concat(secondaryIconRailItems.length
                        ? [
                            {
                              type: 'iconRail',
                              hideSurface: true,
                              items: secondaryIconRailItems
                            }
                          ]
                        : [])
                    }
                  ]
                }
              },
              {
                type: 'slot',
                grow: 1,
                basis: '0px',
                alignX: 'center',
                alignY: 'top',
                content: centerWidgets.length
                  ? {
                      type: 'layout',
                      direction: 'horizontal',
                      gap: 10,
                      children: centerWidgets.map(function(widget) {
                        return {
                          type: 'slot',
                          alignX: 'center',
                          alignY: 'top',
                          content: {
                            type: 'widget',
                            widget: widget
                          }
                        };
                      })
                    }
                  : {
                      type: 'group',
                      title: 'Center group',
                      note: 'Example group inside a centered slot. This is not a production toolbar, but a sandbox for layout behavior.',
                      direction: 'row',
                      buttons: [
                        {
                          label: 'Select node',
                          caption: 'Standalone action',
                          tone: 'accent'
                        },
                        {
                          label: 'Scene snapshot',
                          caption: 'Placeholder action'
                        },
                        {
                          label: 'Demo HUD',
                          caption: 'Future floating group',
                          tone: 'success'
                        }
                      ]
                    }
              },
              {
                type: 'slot',
                grow: 1,
                basis: '0px',
                alignX: 'stretch',
                alignY: 'stretch',
                content: rightBottomWidgets.length
                  ? {
                      type: 'layout',
                      direction: 'vertical',
                      gap: 12,
                      children: [
                        {
                          type: 'slot',
                          grow: 1,
                          basis: '0px',
                          alignX: 'right',
                          alignY: 'top',
                          content: {
                            type: 'tabs',
                            id: 'top-right-control-tabs',
                            dock: 'top',
                            constrainHeightToSlot: true,
                            style: {
                              width: '336px'
                            },
                            tabs: topRightTabs
                          }
                        },
                        {
                          type: 'slot',
                          alignX: 'right',
                          alignY: 'bottom',
                          content: {
                            type: 'layout',
                            direction: 'vertical',
                            gap: 10,
                            children: rightBottomWidgets.map(function(widget) {
                              return {
                                type: 'slot',
                                alignX: 'right',
                                alignY: 'bottom',
                                content: {
                                  type: 'widget',
                                  widget: widget
                                }
                              };
                            })
                          }
                        }
                      ]
                    }
                  : {
                      type: 'tabs',
                      id: 'top-right-control-tabs',
                      dock: 'top',
                      style: {
                        width: '336px',
                        marginLeft: 'auto'
                      },
                      tabs: topRightTabs
                    }
              }
            ]
          }
        },
        {
          type: 'slot',
          alignX: 'stretch',
          alignY: 'bottom',
          content: {
            type: 'tabs',
            id: 'bottom-sandbox-tabs',
            dock: 'bottom',
            stretchX: true,
            tabs: bottomTabs
          }
        }
      ]
    };
  }

  function renderLines(target, lines) {
    if (!lines || !lines.length) {
      return;
    }

    const linesElement = createElement('div', 'canvas-layout-tab-lines');
    lines.forEach(function(line) {
      linesElement.appendChild(createElement('div', '', line));
    });
    target.appendChild(linesElement);
  }

  function renderCards(target, cards) {
    if (!cards || !cards.length) {
      return;
    }

    const grid = createElement('div', 'canvas-layout-tab-grid');
    cards.forEach(function(card) {
      const cardElement = createElement('div', 'canvas-layout-tab-card');
      cardElement.appendChild(createElement('div', 'canvas-layout-tab-card-title', card.title || 'Card'));
      renderLines(cardElement, card.lines || []);
      grid.appendChild(cardElement);
    });
    target.appendChild(grid);
  }

  function renderChips(target, chips) {
    if (!chips || !chips.length) {
      return;
    }

    const chipRow = createElement('div', 'canvas-layout-tab-chip-row');
    chips.forEach(function(chip) {
      chipRow.appendChild(createElement('div', 'canvas-layout-tab-chip', chip));
    });
    target.appendChild(chipRow);
  }

  function renderSectionLabel(target, text) {
    if (!text) {
      return;
    }

    target.appendChild(createElement('div', 'canvas-layout-section-label', text));
  }

  function renderActionButtons(target, buttons) {
    if (!buttons || !buttons.length) {
      return;
    }

    const row = createElement('div', 'canvas-layout-action-row');
    buttons.forEach(function(buttonConfig) {
      row.appendChild(createButtonWidget(buttonConfig));
    });
    target.appendChild(row);
  }

  function renderChoices(target, choicesLabel, choices) {
    if (!choices || !choices.length) {
      return;
    }

    renderSectionLabel(target, choicesLabel);
    const row = createElement('div', 'canvas-layout-choice-row');
    choices.forEach(function(choice) {
      const chip = createElement('div', 'canvas-layout-choice', choice.label || 'Choice');
      if (choice.active) {
        chip.classList.add('is-active');
      }
      row.appendChild(chip);
    });
    target.appendChild(row);
  }

  function renderToggles(target, togglesLabel, toggles) {
    if (!toggles || !toggles.length) {
      return;
    }

    renderSectionLabel(target, togglesLabel);
    const list = createElement('div', 'canvas-layout-toggle-list');
    toggles.forEach(function(toggle) {
      const row = createElement('div', 'canvas-layout-toggle');
      if (toggle.checked) {
        row.classList.add('is-checked');
      }
      const mark = createElement('span', 'canvas-layout-toggle-mark', '✓');
      row.appendChild(mark);
      row.appendChild(createElement('span', '', toggle.label || 'Option'));
      list.appendChild(row);
    });
    target.appendChild(list);
  }

  function createButtonWidget(config) {
    const button = createElement('button', 'canvas-layout-button', '');
    button.type = 'button';
    if (config.tone === 'accent') {
      button.classList.add('is-accent');
    }
    if (config.tone === 'success') {
      button.classList.add('is-success');
    }
    button.appendChild(createElement('span', 'canvas-layout-button-label', config.label || 'Button'));
    if (config.caption) {
      button.appendChild(createElement('span', 'canvas-layout-button-caption', config.caption));
    }
    button.addEventListener('click', function(event) {
      event.preventDefault();
      if (typeof config.onClick === 'function') {
        config.onClick(event);
        return;
      }
      console.info('[canvas-layout-prototype]', config.label || 'button');
    });
    return button;
  }

  function createGroupWidget(config) {
    const card = createElement('section', 'canvas-layout-card');
    if (config.hideSurface) {
      card.classList.add('is-ghost');
    }
    card.appendChild(createElement('div', 'canvas-layout-card-title', config.title || 'Group'));
    if (config.note) {
      card.appendChild(createElement('div', 'canvas-layout-card-note', config.note));
    }

    const stack = createElement('div', 'canvas-layout-button-stack');
    stack.classList.add(config.direction === 'column' ? 'is-column' : 'is-row');
    (config.buttons || []).forEach(function(buttonConfig) {
      stack.appendChild(createButtonWidget(buttonConfig));
    });
    card.appendChild(stack);
    return card;
  }

  function createIconRailWidget(config) {
    const rail = createElement('section', 'canvas-layout-icon-rail');
    const stateSyncers = [];
    if (config.hideSurface) {
      rail.classList.add('is-ghost');
    }
    (config.items || []).forEach(function(item) {
      const button = createElement('button', 'canvas-layout-icon-button', item.icon || '•');
      const isToggleButton = typeof item.getPressed === 'function' || item.pressed != null;
      const isDisableable = typeof item.getDisabled === 'function' || item.disabled != null;

      function getDisabledState() {
        if (!isDisableable) {
          return false;
        }
        return typeof item.getDisabled === 'function' ? !!item.getDisabled() : !!item.disabled;
      }

      function syncPressedState() {
        if (!isToggleButton) {
          button.removeAttribute('aria-pressed');
          button.classList.remove('is-pressed');
          return;
        }
        const pressed = typeof item.getPressed === 'function' ? !!item.getPressed() : !!item.pressed;
        button.classList.toggle('is-pressed', pressed);
        button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      }

      function syncDisabledState() {
        const disabled = getDisabledState();
        button.classList.toggle('is-disabled', disabled);
        button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      }

      function syncButtonState() {
        syncPressedState();
        syncDisabledState();
      }

      button.type = 'button';
      if (item.label) {
        button.title = item.label;
        button.setAttribute('aria-label', item.label);
      }
      syncButtonState();
      button.addEventListener('pointerenter', syncButtonState);
      button.addEventListener('focus', syncButtonState);
      button.addEventListener('click', function(event) {
        event.preventDefault();
        syncButtonState();
        if (getDisabledState()) {
          return;
        }
        if (typeof item.onClick === 'function') {
          item.onClick(event);
          syncButtonState();
          return;
        }
        console.info('[canvas-layout-prototype-icon-rail]', item.label || item.icon || 'icon');
        syncButtonState();
      });
      stateSyncers.push(syncButtonState);
      rail.appendChild(button);
    });
    rail.__refreshState = function() {
      stateSyncers.forEach(function(syncState) {
        syncState();
      });
    };
    return rail;
  }

  function createMountedWidget(config, environment) {
    const mount = createElement('div', 'canvas-layout-widget-mount');
    applyFlexSpec(mount, config);
    applyInlineStyles(mount, config.style);
    if (config.widget && typeof config.widget.mount === 'function') {
      config.widget.mount(mount);
      if (environment && environment.cleanups) {
        environment.cleanups.push(function() {
          if (typeof config.widget.unmount === 'function') {
            config.widget.unmount();
          }
        });
      }
    }
    return mount;
  }

  function createTabPanelWidget(config, environment) {
    const mount = createElement('div', 'canvas-layout-tab-mount');
    mount.dataset.dock = config.dock || 'bottom';
    if (config.fillHeight) {
      mount.style.width = '100%';
      mount.style.height = '100%';
    }
    if (config.constrainHeightToSlot) {
      mount.classList.add('is-slot-constrained');
    }
    const panel = createElement('section', 'canvas-layout-tab-panel');
    panel.dataset.dock = config.dock || 'bottom';
    panel.dataset.collapseMode = config.collapseMode || 'compact-tabs';
    applyInlineStyles(panel, config.style);
    if (config.stretchX) {
      panel.classList.add('is-stretch-x');
    }

    const shell = createElement('div', 'canvas-layout-tab-shell');
    const strip = createElement('div', 'canvas-layout-tab-strip');
    const scrollPrevButton = createElement('button', 'canvas-layout-tab-action', '←');
    const tabListViewport = createElement('div', 'canvas-layout-tab-list-viewport');
    const tabList = createElement('div', 'canvas-layout-tab-list');
    const scrollNextButton = createElement('button', 'canvas-layout-tab-action', '→');
    const actions = createElement('div', 'canvas-layout-tab-actions');
    const content = createElement('div', 'canvas-layout-tab-content');

    scrollPrevButton.type = 'button';
    scrollPrevButton.title = t('actions.previous', 'Previous');
    scrollPrevButton.setAttribute('aria-label', t('actions.previous', 'Previous'));
    scrollNextButton.type = 'button';
    scrollNextButton.title = t('actions.next', 'Next');
    scrollNextButton.setAttribute('aria-label', t('actions.next', 'Next'));

    tabListViewport.appendChild(tabList);
    strip.appendChild(scrollPrevButton);
    strip.appendChild(tabListViewport);
    strip.appendChild(scrollNextButton);
    strip.appendChild(actions);
    shell.appendChild(strip);
    shell.appendChild(content);
    panel.appendChild(shell);
    mount.appendChild(panel);

    const state = {
      activeTabId: config.activeTabId || ((config.tabs && config.tabs[0]) ? config.tabs[0].id : null),
      collapsed: !!config.collapsed,
      fullscreen: false,
      backdrop: null
    };
    let activeContentCleanup = null;

    function getTabScrollStep() {
      return Math.max(96, Math.round(tabListViewport.clientWidth * 0.72));
    }

    function syncTabScrollButtons() {
      const needsScrollButtons = !state.collapsed && tabList.scrollWidth > tabList.clientWidth + 1;
      scrollPrevButton.classList.toggle('is-hidden', !needsScrollButtons);
      scrollNextButton.classList.toggle('is-hidden', !needsScrollButtons);

      if (!needsScrollButtons) {
        scrollPrevButton.setAttribute('aria-disabled', 'true');
        scrollNextButton.setAttribute('aria-disabled', 'true');
        return;
      }

      const atStart = tabList.scrollLeft <= 1;
      const atEnd = tabList.scrollLeft + tabList.clientWidth >= tabList.scrollWidth - 1;
      scrollPrevButton.setAttribute('aria-disabled', atStart ? 'true' : 'false');
      scrollNextButton.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
    }

    function scrollTabList(direction) {
      tabList.scrollBy({
        left: getTabScrollStep() * direction,
        behavior: 'smooth'
      });
    }

    function syncMountSizing() {
      const useCollapsedVerticalTabs = config.collapseMode === 'vertical-tabs' && state.collapsed;
      if (useCollapsedVerticalTabs) {
        mount.style.width = 'max-content';
        mount.style.height = 'max-content';
        mount.style.maxHeight = '';
        mount.style.flex = '0 0 auto';
        return;
      }

      if (config.fillHeight) {
        mount.style.width = '100%';
        mount.style.height = '100%';
        mount.style.maxHeight = '';
        mount.style.flex = '1 1 auto';
        return;
      }

      if (config.constrainHeightToSlot) {
        mount.style.width = '';
        mount.style.height = '100%';
        mount.style.maxHeight = '';
        mount.style.flex = '';
        return;
      }

      mount.style.width = '';
      mount.style.height = '';
      mount.style.maxHeight = '';
      mount.style.flex = '';
    }

    function handleDocumentKeyDown(event) {
      if (!state.fullscreen || event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      exitFullscreen();
    }

    document.addEventListener('keydown', handleDocumentKeyDown);
    if (environment.cleanups) {
      environment.cleanups.push(function() {
        document.removeEventListener('keydown', handleDocumentKeyDown);
        if (activeContentCleanup) {
          activeContentCleanup();
          activeContentCleanup = null;
        }
        if (state.backdrop) {
          state.backdrop.remove();
          state.backdrop = null;
        }
      });
    }

    tabList.addEventListener('scroll', syncTabScrollButtons);
    scrollPrevButton.addEventListener('click', function(event) {
      event.preventDefault();
      if (scrollPrevButton.getAttribute('aria-disabled') === 'true') {
        return;
      }
      scrollTabList(-1);
    });
    scrollNextButton.addEventListener('click', function(event) {
      event.preventDefault();
      if (scrollNextButton.getAttribute('aria-disabled') === 'true') {
        return;
      }
      scrollTabList(1);
    });

    if (typeof ResizeObserver === 'function') {
      const resizeObserver = new ResizeObserver(function() {
        syncTabScrollButtons();
      });
      resizeObserver.observe(tabListViewport);
      resizeObserver.observe(tabList);
      if (environment.cleanups) {
        environment.cleanups.push(function() {
          resizeObserver.disconnect();
        });
      }
    }
    if (environment.cleanups) {
      environment.cleanups.push(function() {
        tabList.removeEventListener('scroll', syncTabScrollButtons);
      });
    }

    function getActiveTab() {
      const tabs = config.tabs || [];
      for (let index = 0; index < tabs.length; index += 1) {
        if (tabs[index].id === state.activeTabId) {
          return tabs[index];
        }
      }
      return tabs[0] || null;
    }

    function exitFullscreen() {
      if (!state.backdrop) {
        return;
      }

      state.fullscreen = false;
      state.backdrop.removeChild(panel);
      mount.appendChild(panel);
      state.backdrop.remove();
      state.backdrop = null;
      render();
    }

    function enterFullscreen() {
      if (state.backdrop) {
        return;
      }

      state.fullscreen = true;
      state.backdrop = createElement('div', 'canvas-layout-prototype-modal');
      state.backdrop.addEventListener('click', function(event) {
        if (event.target === state.backdrop) {
          exitFullscreen();
        }
      });
      state.backdrop.appendChild(panel);
      environment.modalHost.appendChild(state.backdrop);
      render();
    }

    function renderActions() {
      clearNode(actions);

      if (state.collapsed) {
        return;
      }

      if (state.fullscreen) {
        const closeButton = createElement('button', 'canvas-layout-tab-action', '×');
        closeButton.type = 'button';
        closeButton.title = t('tooltips.closeFullscreen', 'Close fullscreen');
        closeButton.addEventListener('click', function(event) {
          event.preventDefault();
          exitFullscreen();
        });
        actions.appendChild(closeButton);
        return;
      }

      const fullscreenButton = createElement('button', 'canvas-layout-tab-action', state.fullscreen ? '↙' : '⤢');
      fullscreenButton.type = 'button';
      fullscreenButton.title = state.fullscreen
        ? t('tooltips.exitFullscreen', 'Exit fullscreen')
        : t('tooltips.enterFullscreen', 'Expand to almost full canvas');
      fullscreenButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (state.fullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      });
      actions.appendChild(fullscreenButton);

      const collapseButton = createElement('button', 'canvas-layout-tab-action', state.collapsed ? '▣' : '▤');
      collapseButton.type = 'button';
      collapseButton.title = state.collapsed
        ? t('tooltips.expandPanel', 'Expand panel')
        : t('tooltips.collapsePanel', 'Collapse panel');
      collapseButton.addEventListener('click', function(event) {
        event.preventDefault();
        state.collapsed = !state.collapsed;
        render();
      });
      actions.appendChild(collapseButton);
    }

    function renderTabs() {
      clearNode(tabList);
      (config.tabs || []).forEach(function(tab) {
        const button = createElement('button', 'canvas-layout-tab-button', tab.label || tab.id || 'Tab');
        button.type = 'button';
        if (tab.id === state.activeTabId) {
          button.classList.add('is-active');
        }
        button.addEventListener('click', function(event) {
          event.preventDefault();
          state.activeTabId = tab.id;
          if (state.collapsed) {
            state.collapsed = false;
          }
          render();
        });
        tabList.appendChild(button);
      });
      const activeButton = tabList.querySelector('.canvas-layout-tab-button.is-active');
      if (activeButton && typeof activeButton.scrollIntoView === 'function' && !state.collapsed) {
        activeButton.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    function renderContent() {
      if (activeContentCleanup) {
        activeContentCleanup();
        activeContentCleanup = null;
      }
      clearNode(content);
      const activeTab = getActiveTab();
      if (!activeTab) {
        return;
      }

      if (typeof activeTab.renderContent === 'function') {
        const cleanup = activeTab.renderContent(content);
        if (typeof cleanup === 'function') {
          activeContentCleanup = cleanup;
        }
      }
      renderActionButtons(content, activeTab.buttons || []);
      renderChoices(content, activeTab.choicesLabel, activeTab.choices || []);
      renderToggles(content, activeTab.togglesLabel, activeTab.toggles || []);
      renderCards(content, activeTab.cards || []);
      renderChips(content, activeTab.chips || []);
    }

    function render() {
      syncMountSizing();
      panel.classList.toggle('is-collapsed', state.collapsed);
      panel.classList.toggle('is-fill-height', !!config.fillHeight && !state.collapsed);
      panel.classList.toggle('is-slot-constrained', !!config.constrainHeightToSlot && !state.collapsed && !state.fullscreen);
      panel.classList.toggle('is-fullscreen', state.fullscreen);
      renderTabs();
      renderActions();
      renderContent();
      requestAnimationFrame(syncTabScrollButtons);
    }

    render();
    return mount;
  }

  function createDrawerPanelWidget(config, environment) {
    const mount = createElement('div', 'canvas-layout-drawer-mount');
    const panel = createElement('section', 'canvas-layout-drawer-panel');
    const body = createElement('div', 'canvas-layout-drawer-body');
    const handle = createElement('button', 'canvas-layout-drawer-handle', (config.handleLabel || config.label || 'Panel').trim());
    const drawerWidthValue = config.width || '296px';
    const handleSizeValue = config.handleSize || '32px';
    const drawerWidthPx = parseFloat(drawerWidthValue);
    const handleSizePx = parseFloat(handleSizeValue);
    const closedTranslateX = Number.isFinite(drawerWidthPx) && Number.isFinite(handleSizePx)
      ? `${handleSizePx - drawerWidthPx}px`
      : 'calc(-100% + var(--drawer-handle-size,32px))';
    const state = {
      open: !!config.open
    };

    panel.style.setProperty('--drawer-width', drawerWidthValue);
    panel.style.setProperty('--drawer-handle-size', handleSizeValue);
    applyInlineStyles(panel, config.style);
    handle.type = 'button';
    panel.appendChild(body);
    panel.appendChild(handle);
    mount.appendChild(panel);

    if (config.widget && typeof config.widget.mount === 'function') {
      const contentMount = createMountedWidget({ widget: config.widget }, environment);
      contentMount.style.width = '100%';
      contentMount.style.height = '100%';
      body.appendChild(contentMount);
    }

    handle.addEventListener('click', function(event) {
      event.preventDefault();
      state.open = !state.open;
      render();
    });

    function render() {
      const label = (config.label || config.handleLabel || 'Panel').trim();
      const handleTitle = state.open
        ? t('tooltips.hidePanel', 'Hide panel: {label}', { label: label })
        : t('tooltips.showPanel', 'Show panel: {label}', { label: label });
      panel.classList.toggle('is-open', state.open);
      panel.style.transform = state.open
        ? 'translateX(0px)'
        : `translateX(${closedTranslateX})`;
      panel.style.boxShadow = state.open
        ? '0 22px 38px rgba(0,0,0,.32)'
        : '0 18px 34px rgba(0,0,0,.26)';
      panel.style.pointerEvents = state.open ? 'auto' : 'none';
      body.style.opacity = state.open ? '1' : '0';
      body.style.visibility = state.open ? 'visible' : 'hidden';
      body.style.pointerEvents = state.open ? 'auto' : 'none';
      if ('inert' in body) {
        body.inert = !state.open;
      }
      body.setAttribute('aria-hidden', state.open ? 'false' : 'true');
      handle.style.pointerEvents = 'auto';
      handle.textContent = config.handleLabel || label;
      handle.title = handleTitle;
      handle.setAttribute('aria-label', handleTitle);
      handle.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    }

    render();
    return mount;
  }

  function createEdgeDrawerWidget(config, environment) {
    const anchorId = config.anchorId;
    const anchorElement = anchorId && environment.anchors ? environment.anchors[anchorId] : null;
    if (!anchorElement || !environment.edgeHost || !environment.root) {
      return document.createComment(`missing-edge-drawer-anchor:${anchorId || 'unknown'}`);
    }

    const mount = createElement('div', 'canvas-layout-edge-drawer-mount');
    const panel = createElement('section', 'canvas-layout-edge-drawer-panel');
    const body = createElement('div', 'canvas-layout-edge-drawer-body');
    const handle = createElement('button', 'canvas-layout-edge-drawer-handle', (config.handleLabel || config.label || 'Panel').trim());
    const drawerWidthValue = config.width || '296px';
    const handleSizeValue = config.handleSize || '32px';
    const visibleEdgeWidthValue = config.visibleEdgeWidth || null;
    const hoverPeekWidthValue = config.hoverPeekWidth || null;
    const handleSizePx = parseFloat(handleSizeValue);
    const state = {
      open: !!config.open,
      peeking: false,
      closedTranslateX: '0px',
      peekTranslateX: '0px'
    };
    let resizeObserver = null;

    panel.style.setProperty('--drawer-width', drawerWidthValue);
    panel.style.setProperty('--drawer-handle-size', handleSizeValue);
    applyInlineStyles(panel, config.style);

    handle.type = 'button';
    panel.appendChild(body);
    panel.appendChild(handle);
    mount.appendChild(panel);

    if (config.widget && typeof config.widget.mount === 'function') {
      const contentMount = createMountedWidget({ widget: config.widget }, environment);
      contentMount.style.width = '100%';
      contentMount.style.height = '100%';
      body.appendChild(contentMount);
    }

    function parseVisibleWidth(rawValue, fallbackValue) {
      const parsed = parseFloat(rawValue);
      if (Number.isFinite(parsed)) {
        return Math.max(0, parsed);
      }
      return fallbackValue;
    }

    function syncGeometry() {
      const rootRect = environment.root.getBoundingClientRect();
      const anchorRect = anchorElement.getBoundingClientRect();
      const defaultVisibleWidth = Math.max(0, Math.round(anchorRect.left - rootRect.left));
      const visibleWidth = parseVisibleWidth(visibleEdgeWidthValue, defaultVisibleWidth);
      const hoverPeekWidth = parseVisibleWidth(hoverPeekWidthValue, Math.min(handleSizePx || 32, visibleWidth + 10));
      const drawerWidth = panel.getBoundingClientRect().width || parseFloat(drawerWidthValue) || 296;

      mount.style.top = `${Math.round(anchorRect.top - rootRect.top)}px`;
      mount.style.height = `${Math.round(anchorRect.height)}px`;
      mount.style.left = '0px';
      state.closedTranslateX = `${visibleWidth - drawerWidth}px`;
      state.peekTranslateX = `${Math.max(visibleWidth, hoverPeekWidth) - drawerWidth}px`;
      if (!state.open) {
        panel.style.transform = state.peeking
          ? `translateX(${state.peekTranslateX})`
          : `translateX(${state.closedTranslateX})`;
      }
    }

    handle.addEventListener('click', function(event) {
      event.preventDefault();
      state.open = !state.open;
      state.peeking = false;
      render();
    });

    handle.addEventListener('mouseenter', function() {
      if (state.open) {
        return;
      }
      state.peeking = true;
      render();
    });

    handle.addEventListener('mouseleave', function() {
      if (state.open) {
        return;
      }
      state.peeking = false;
      render();
    });

    handle.addEventListener('focus', function() {
      if (state.open) {
        return;
      }
      state.peeking = true;
      render();
    });

    handle.addEventListener('blur', function() {
      if (state.open) {
        return;
      }
      state.peeking = false;
      render();
    });

    function render() {
      const label = (config.label || config.handleLabel || 'Panel').trim();
      const handleTitle = state.open
        ? t('tooltips.hidePanel', 'Hide panel: {label}', { label: label })
        : t('tooltips.showPanel', 'Show panel: {label}', { label: label });
      panel.classList.toggle('is-open', state.open);
      panel.classList.toggle('is-peeking', !state.open && state.peeking);
      panel.style.transform = state.open
        ? 'translateX(0px)'
        : `translateX(${state.peeking ? state.peekTranslateX : state.closedTranslateX})`;
      panel.style.pointerEvents = state.open ? 'auto' : 'none';
      panel.style.boxShadow = state.open
        ? '0 22px 38px rgba(0,0,0,.32)'
        : '0 18px 34px rgba(0,0,0,.26)';
      body.style.opacity = state.open ? '1' : '0';
      body.style.visibility = state.open ? 'visible' : 'hidden';
      body.style.pointerEvents = state.open ? 'auto' : 'none';
      if ('inert' in body) {
        body.inert = !state.open;
      }
      body.setAttribute('aria-hidden', state.open ? 'false' : 'true');
      handle.textContent = config.handleLabel || label;
      handle.title = handleTitle;
      handle.setAttribute('aria-label', handleTitle);
      handle.setAttribute('aria-expanded', state.open ? 'true' : 'false');
      handle.style.opacity = state.open ? '1' : (state.peeking ? '1' : '.96');
    }

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(function() {
        syncGeometry();
      });
      resizeObserver.observe(environment.root);
      resizeObserver.observe(anchorElement);
      resizeObserver.observe(panel);
      if (environment.cleanups) {
        environment.cleanups.push(function() {
          resizeObserver.disconnect();
        });
      }
    }

    syncGeometry();
    render();
    return mount;
  }

  function createSlotOverlayNode(config, environment) {
    const overlay = createElement('div', 'canvas-layout-slot-overlay');
    overlay.dataset.anchor = config.anchor || 'left-stretch';
    applyInlineStyles(overlay, config.style);
    overlay.appendChild(renderNode(config.content, environment));
    return overlay;
  }

  function renderNode(config, environment) {
    if (!config) {
      return document.createComment('empty-layout-node');
    }

    if (config.type === 'layout') {
      const flow = createElement('div', 'canvas-layout-flow');
      flow.classList.add(config.direction === 'vertical' ? 'is-vertical' : 'is-horizontal');
      if (config.id) {
        flow.dataset.layoutId = config.id;
      }
      if (typeof config.gap === 'number') {
        flow.style.gap = `${config.gap}px`;
      }
      applyFlexSpec(flow, config);
      applyInlineStyles(flow, config.style);
      (config.children || []).forEach(function(child) {
        flow.appendChild(renderNode(child, environment));
      });
      return flow;
    }

    if (config.type === 'slot') {
      const slot = createElement('div', 'canvas-layout-slot');
      if (config.anchorId) {
        slot.dataset.anchorId = config.anchorId;
        if (environment.anchors) {
          environment.anchors[config.anchorId] = slot;
        }
      }
      slot.style.justifyItems = normalizeGridAlignment(config.alignX, 'x');
      slot.style.alignItems = normalizeGridAlignment(config.alignY, 'y');
      if (config.padding) {
        slot.style.padding = config.padding;
      }
      if (config.minWidth) {
        slot.style.minWidth = config.minWidth;
      }
      if (config.minHeight) {
        slot.style.minHeight = config.minHeight;
      }
      applyFlexSpec(slot, config);
      applyInlineStyles(slot, config.style);
      slot.appendChild(renderNode(config.content, environment));
      if (Array.isArray(config.overlayChildren) && config.overlayChildren.length) {
        slot.classList.add('is-overlay-host');
        config.overlayChildren.forEach(function(overlayChild) {
          slot.appendChild(createSlotOverlayNode(overlayChild, environment));
        });
      }
      return slot;
    }

    if (config.type === 'group') {
      return createGroupWidget(config);
    }

    if (config.type === 'iconRail') {
      return createIconRailWidget(config);
    }

    if (config.type === 'button') {
      return createButtonWidget(config);
    }

    if (config.type === 'tabs') {
      return createTabPanelWidget(config, environment);
    }

    if (config.type === 'drawer') {
      return createDrawerPanelWidget(config, environment);
    }

    if (config.type === 'widget') {
      return createMountedWidget(config, environment);
    }

    return createElement('div', 'canvas-layout-card-note', `Unsupported node type: ${config.type}`);
  }

  function createCanvasLayoutPrototype(options) {
    const config = Object.assign({
      container: null,
      modalContainer: null
    }, options || {});

    ensurePrototypeStyles();

    const root = createElement('div', 'canvas-layout-prototype');
    const stage = createElement('div', 'canvas-layout-prototype-stage');
    const edgeHost = createElement('div', 'canvas-layout-prototype-edge-host');
    const modalHost = createElement('div', 'canvas-layout-prototype-modal-host');
    const cleanups = [];
    const rootContainer = config.container;
    const modalContainer = config.modalContainer || config.container;

    if (rootContainer && rootContainer.dataset && rootContainer.dataset.overlayLayerHost === 'true') {
      root.style.zIndex = 'auto';
    }
    if (modalContainer && modalContainer.dataset && modalContainer.dataset.overlayLayerHost === 'true') {
      modalHost.style.zIndex = 'auto';
    }

    root.appendChild(stage);
    root.appendChild(edgeHost);
    rootContainer.appendChild(root);
    modalContainer.appendChild(modalHost);

    const environment = {
      modalHost: modalHost,
      cleanups: cleanups,
      anchors: {},
      edgeHost: edgeHost,
      root: root
    };

    stage.appendChild(renderNode(buildDemoLayoutConfig(config), environment));

    if (Array.isArray(config.edgeDrawers) && config.edgeDrawers.length) {
      config.edgeDrawers.forEach(function(edgeDrawerConfig) {
        edgeHost.appendChild(createEdgeDrawerWidget(edgeDrawerConfig, environment));
      });
    }

    return {
      root: root,
      refresh: function() {
        root.querySelectorAll('.canvas-layout-icon-rail').forEach(function(rail) {
          if (typeof rail.__refreshState === 'function') {
            rail.__refreshState();
          }
        });
      },
      destroy: function() {
        while (cleanups.length) {
          const cleanup = cleanups.pop();
          cleanup();
        }
        root.remove();
        modalHost.remove();
      }
    };
  }

  tool.editor.createCanvasLayoutPrototype = createCanvasLayoutPrototype;
})();