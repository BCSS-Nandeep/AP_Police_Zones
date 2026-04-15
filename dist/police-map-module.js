// ============================================================
// AP POLICE GIS MAP MODULE  (police-map-module.js)
//
// Usage:
//   const mapApi = initPoliceBoundaryMap('map', config);
//
// config shape (all optional):
//   center:      [lng, lat]           default: AP center
//   zoom:        number               default: 7
//   basemap:     'carto-light'|'osm'|'satellite'
//   serviceUrls: { commissionerate, policeDistrict, psiBoundary, psiPoint }
//   geoJsonUrls: { commissionerate, policeDistrict, psiBoundary, psiPoint }
//   layerNames:  { commissionerate, policeDistrict, psiBoundary, psiPoint }
//   theme:       { commColor, districtColor, psColor, psPointColor }
// ============================================================

/* ----------------------------------------------------------------
   Basemap sources
----------------------------------------------------------------- */
const BASEMAPS = {
  'carto-light': 'https://{a-c}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
  'osm':         'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'satellite':   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

const AP_CENTER    = [79.74, 15.91];  // [lng, lat]
const AP_ZOOM      = 7;
const AP_EXTENT_3857 = ol.proj.transformExtent([77.0, 12.5, 85.0, 19.5], 'EPSG:4326', 'EPSG:3857');

/* ----------------------------------------------------------------
   Main init function
----------------------------------------------------------------- */
async function initPoliceBoundaryMap(containerId, userConfig = {}) {
  const cfg = {
    center:      userConfig.center      || AP_CENTER,
    zoom:        userConfig.zoom        || AP_ZOOM,
    basemap:     userConfig.basemap     || 'carto-light',
    serviceUrls: userConfig.serviceUrls || {},
    geoJsonUrls: userConfig.geoJsonUrls || {},
    layerNames:  userConfig.layerNames  || {},
    theme:       userConfig.theme       || {}
  };

  // Apply theme to styles module
  applyTheme(cfg.theme);

  // ---- Map ----
  const view = new ol.View({
    center:  ol.proj.fromLonLat(cfg.center),
    zoom:    cfg.zoom,
    minZoom: 5,
    maxZoom: 19,
    extent:  ol.proj.transformExtent([76.5,12.0,85.5,20.0],'EPSG:4326','EPSG:3857')
  });

  const map = new ol.Map({
    target:   containerId,
    view,
    controls: [new ol.control.ScaleLine({ units: 'metric' })]
  });

  // ---- Basemap ----
  const basemapLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url:    BASEMAPS[cfg.basemap] || BASEMAPS['carto-light'],
      maxZoom: 19
    }),
    zIndex: 0
  });
  map.addLayer(basemapLayer);

  // ---- Drawing / Measure layer ----
  const drawSource = new ol.source.Vector();
  const drawLayer  = new ol.layer.Vector({ source: drawSource, style: DRAW_STYLE, zIndex: 100 });
  map.addLayer(drawLayer);

  // ---- State ----
  const state = {
    layers: {},           // { comm, dist, psBound, psPoint }
    allFeatures: {},      // { comm: [], dist: [], psBound: [], psPoint: [] }
    selectedFeature: null,
    hoveredFeature:  null,
    activeFilter:    { comm: null, district: null, station: null },
    extentHistory:   [],
    historyIndex:    -1,
    drawInteraction: null,
    measureTooltipEl:      null,
    measureTooltipOverlay: null,
    isDark: document.body.classList.contains('dark')
  };

  // ---- Popup overlay ----
  const popupEl = document.getElementById('map-popup');
  const popup   = new ol.Overlay({
    element:     popupEl,
    positioning: 'bottom-center',
    stopEvent:   true,
    offset:      [0, -4]
  });
  map.addOverlay(popup);

  document.getElementById('map-popup-close').addEventListener('click', () => {
    popup.setPosition(undefined);
    clearSelection();
  });

  // ================================================================
  //  LAYER LOADING
  // ================================================================
  _showLoading('Loading map layers…');

  try {
    const [commLayer, distLayer, psBoundLayer, psPtLayer] = await Promise.all([
      loadCommissionerateLayer(cfg, f => commissionerateStyle(f, null, 'normal')),
      loadPoliceDistrictLayer (cfg, f => districtStyle(f, null, 'normal')),
      loadPoliceStationBoundaryLayer(cfg, f => psStyle(f, null, 'normal')),
      loadPoliceStationPointLayer   (cfg, f => psPointStyle(f, null, 'normal'))
    ]);

    state.layers = { comm: commLayer, dist: distLayer, psBound: psBoundLayer, psPoint: psPtLayer };

    Object.entries(state.layers).forEach(([, layer]) => map.addLayer(layer));

    // Cache features for filter lookups
    ['comm','dist','psBound','psPoint'].forEach(k => {
      const src = state.layers[k]?.getSource?.();
      state.allFeatures[k] = src ? src.getFeatures() : [];
    });
  } catch (err) {
    console.error('Layer load error:', err);
    _showError('Failed to load map layers. Check network or data config.');
    return null;
  } finally {
    _hideLoading();
  }

  // ================================================================
  //  POPULATE FILTER DROPDOWNS
  // ================================================================
  _populateFilterDropdowns(state);

  // ================================================================
  //  INTERACTIONS — Hover & Click
  // ================================================================
  map.on('pointermove', evt => {
    if (evt.dragging || state.drawInteraction) return;
    _updateCoordDisplay(evt.coordinate);

    const hit = map.forEachFeatureAtPixel(evt.pixel, f => f, { hitTolerance: 3 });
    if (hit !== state.hoveredFeature) {
      if (state.hoveredFeature && state.hoveredFeature !== state.selectedFeature) {
        _resetFeatureStyle(state.hoveredFeature, state);
      }
      state.hoveredFeature = hit || null;
      if (hit && hit !== state.selectedFeature) {
        _applyFeatureStyle(hit, 'hover', state);
      }
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    }
  });

  map.on('click', evt => {
    if (state.drawInteraction) return;
    const feature = map.forEachFeatureAtPixel(evt.pixel, f => f, { hitTolerance: 4 });
    if (!feature) {
      clearSelection();
      popup.setPosition(undefined);
      return;
    }
    selectFeature(feature, evt.coordinate, state);
  });

  // ================================================================
  //  EXTENT HISTORY
  // ================================================================
  let _trackExtent = true;
  view.on('change:center', () => {
    if (!_trackExtent) return;
    const ext = view.calculateExtent();
    if (state.historyIndex < state.extentHistory.length - 1) {
      state.extentHistory.splice(state.historyIndex + 1);
    }
    state.extentHistory.push(ext);
    if (state.extentHistory.length > 30) state.extentHistory.shift();
    state.historyIndex = state.extentHistory.length - 1;
  });

  function _navigateExtent(delta) {
    const next = state.historyIndex + delta;
    if (next < 0 || next >= state.extentHistory.length) return;
    state.historyIndex = next;
    _trackExtent = false;
    view.fit(state.extentHistory[next], { duration: 250 });
    setTimeout(() => { _trackExtent = true; }, 300);
  }

  // ================================================================
  //  COORDINATE DISPLAY
  // ================================================================
  function _updateCoordDisplay(coord3857) {
    const ll = ol.proj.toLonLat(coord3857);
    const el = document.getElementById('map-coord-text');
    if (el) el.textContent = `${ll[1].toFixed(5)}°N  ${ll[0].toFixed(5)}°E`;
  }

  map.on('moveend', () => {
    const center = ol.proj.toLonLat(view.getCenter());
    const el = document.getElementById('map-coord-text');
    if (el) el.textContent = `Center: ${center[1].toFixed(5)}°N  ${center[0].toFixed(5)}°E  |  Zoom: ${view.getZoom().toFixed(1)}`;
  });

  // ================================================================
  //  FEATURE SELECTION & POPUP
  // ================================================================
  function selectFeature(feature, coordinate, st) {
    if (st.selectedFeature && st.selectedFeature !== feature) {
      _resetFeatureStyle(st.selectedFeature, st);
    }
    st.selectedFeature = feature;
    _applyFeatureStyle(feature, 'selected', st);

    const p = feature.getProperties();
    const geomType = feature.getGeometry().getType();

    // Determine feature type
    if (p.commissionerateName && !p.ps) {
      // Commissionerate
      _showCommPopup(p, feature, coordinate, popup, map, st);
    } else if (p.ps) {
      // Police station (boundary or point)
      _showStationPopup(p, feature, coordinate, popup, map, st, view);
    } else if (p.NAME_1 || p.district || p.ISO) {
      // District
      _showDistrictPopup(p, feature, coordinate, popup, map, st, view);
    } else {
      _showGenericPopup(p, coordinate, popup);
    }

    // Also update the existing detail panel
    _updateDetailPanel(p, feature);
  }

  function clearSelection() {
    if (state.selectedFeature) {
      _resetFeatureStyle(state.selectedFeature, state);
      state.selectedFeature = null;
    }
    document.getElementById('detail-panel')?.classList.remove('open');
  }

  // ================================================================
  //  MEASURE TOOLS
  // ================================================================
  let _measureType = null;

  function _createMeasureTooltip() {
    _removeMeasureTooltip();
    state.measureTooltipEl = document.createElement('div');
    state.measureTooltipEl.className = 'measure-tooltip';
    state.measureTooltipOverlay = new ol.Overlay({
      element:     state.measureTooltipEl,
      offset:      [0, -15],
      positioning: 'bottom-center',
      stopEvent:   false
    });
    map.addOverlay(state.measureTooltipOverlay);
  }

  function _removeMeasureTooltip() {
    if (state.measureTooltipOverlay) {
      map.removeOverlay(state.measureTooltipOverlay);
      state.measureTooltipEl = null;
      state.measureTooltipOverlay = null;
    }
  }

  function startMeasure(type) {
    // type: 'distance' | 'area'
    stopInteraction();
    _measureType = type;
    const drawType = type === 'area' ? 'Polygon' : 'LineString';
    _createMeasureTooltip();
    state.drawInteraction = new ol.interaction.Draw({
      source: drawSource,
      type:   drawType,
      style:  DRAW_STYLE
    });

    let sketch;
    state.drawInteraction.on('drawstart', evt => {
      sketch = evt.feature;
      sketch.getGeometry().on('change', gEvt => {
        const geom = gEvt.target;
        let output, coord;
        if (geom.getType() === 'Polygon') {
          output = formatArea(ol.sphere.getArea(geom));
          coord  = geom.getInteriorPoint().getCoordinates();
        } else {
          output = formatLength(ol.sphere.getLength(geom));
          coord  = geom.getLastCoordinate();
        }
        state.measureTooltipEl.textContent = output;
        state.measureTooltipOverlay.setPosition(coord);
      });
    });

    state.drawInteraction.on('drawend', () => {
      if (state.measureTooltipEl) {
        state.measureTooltipEl.className = 'measure-tooltip static';
      }
      // Null out so next createMeasureTooltip starts fresh
      state.measureTooltipEl     = null;
      state.measureTooltipOverlay = null;
      // Create a fresh dynamic tooltip for the next segment
      _createMeasureTooltip();
      const doneInteraction = state.drawInteraction;
      state.drawInteraction = null;
      if (doneInteraction) map.removeInteraction(doneInteraction);
      _setToolbarActive(null);
    });

    map.addInteraction(state.drawInteraction);
  }

  function startDraw(type) {
    // type: 'Polygon' | 'LineString'
    stopInteraction();
    state.drawInteraction = new ol.interaction.Draw({
      source: drawSource,
      type,
      style:  DRAW_STYLE
    });
    state.drawInteraction.on('drawend', () => {
      const done = state.drawInteraction;
      state.drawInteraction = null;
      if (done) map.removeInteraction(done);
      _setToolbarActive(null);
    });
    map.addInteraction(state.drawInteraction);
  }

  function stopInteraction() {
    if (state.drawInteraction) {
      map.removeInteraction(state.drawInteraction);
      state.drawInteraction = null;
    }
    _removeMeasureTooltip();
    _setToolbarActive(null);
  }

  function clearDrawings() {
    drawSource.clear();
    map.getOverlays().getArray()
      .filter(o => o.getElement()?.classList.contains('measure-tooltip'))
      .forEach(o => map.removeOverlay(o));
    stopInteraction();
  }

  // ================================================================
  //  VIEW / FILTER LOGIC
  // ================================================================
  function setView(view_name) {
    popup.setPosition(undefined);
    const lyr = state.layers;

    const showAll = () => {
      if (lyr.comm)    lyr.comm.setVisible(true);
      if (lyr.dist)    lyr.dist.setVisible(true);
      if (lyr.psBound) lyr.psBound.setVisible(true);
      if (lyr.psPoint) lyr.psPoint.setVisible(true);
      resetFeatureStyles(state);
    };

    switch (view_name) {
      case 'all':
        showAll();
        view.animate({ center: ol.proj.fromLonLat(AP_CENTER), zoom: AP_ZOOM, duration: 600 });
        _setStatus('All layers — AP Overview');
        break;

      case 'comm':
        showAll();
        if (lyr.dist) lyr.dist.setVisible(false);
        view.animate({ center: ol.proj.fromLonLat([82.0, 16.8]), zoom: 8, duration: 600 });
        _setStatus('NTR + Visakhapatnam Commissionerates');
        break;

      case 'ntr':
        _filterByCommissionerate('ntr', state, view, map, popup);
        _setStatus('NTR Commissionerate');
        break;

      case 'vizag':
        _filterByCommissionerate('vizag', state, view, map, popup);
        _setStatus('Visakhapatnam Commissionerate');
        break;

      case 'dist':
        if (lyr.comm)    lyr.comm.setVisible(false);
        if (lyr.dist)    lyr.dist.setVisible(true);
        if (lyr.psBound) lyr.psBound.setVisible(true);
        if (lyr.psPoint) lyr.psPoint.setVisible(false);
        resetFeatureStyles(state);
        view.animate({ center: ol.proj.fromLonLat(AP_CENTER), zoom: AP_ZOOM, duration: 600 });
        _setStatus('District Police Boundaries');
        break;

      case 'ps':
        if (lyr.comm)    lyr.comm.setVisible(false);
        if (lyr.dist)    lyr.dist.setVisible(false);
        if (lyr.psBound) lyr.psBound.setVisible(true);
        if (lyr.psPoint) lyr.psPoint.setVisible(true);
        resetFeatureStyles(state);
        view.animate({ center: ol.proj.fromLonLat(AP_CENTER), zoom: 8, duration: 600 });
        _setStatus('All Police Stations');
        break;
    }
  }

  function filterByCommissionerate(commId) {
    const filterSelectEl = document.getElementById('filter-comm');
    if (filterSelectEl) filterSelectEl.value = commId || '';
    state.activeFilter.comm = commId || null;
    if (!commId) {
      resetFeatureStyles(state);
      return;
    }
    _filterByCommissionerate(commId, state, view, map, popup);
  }

  function filterByDistrict(districtId) {
    const filterSelectEl = document.getElementById('filter-district');
    if (filterSelectEl) filterSelectEl.value = districtId || '';
    state.activeFilter.district = districtId || null;
    if (!districtId) { resetFeatureStyles(state); return; }

    // Find district feature and zoom to it
    const feat = state.allFeatures.dist.find(f =>
      (f.get('id') || f.get('NAME_1') || '') === districtId
    );
    if (feat) {
      const ext = feat.getGeometry().getExtent();
      view.fit(ext, { padding: [60,60,60,60], duration: 600, maxZoom: 12 });
      selectFeature(feat, ol.extent.getCenter(ext), state);
    }

    // Dim unrelated PS
    const commId = state.allFeatures.dist
      .find(f => f.get('id') === districtId)?.get('commissionerate');
    _dimExcept(commId, state);
    _setStatus(`District: ${districtId}`);
  }

  function resetExtent() {
    popup.setPosition(undefined);
    clearSelection();
    view.animate({ center: ol.proj.fromLonLat(AP_CENTER), zoom: AP_ZOOM, duration: 600 });
    _setStatus('All layers — AP Overview');
  }

  // ================================================================
  //  DARK MODE SYNC
  // ================================================================
  function syncDarkMode(isDark) {
    state.isDark = isDark;
    const tiles = map.getTargetElement().querySelectorAll('.ol-tile-pane, .ol-layer canvas');
    tiles.forEach(el => {
      el.style.filter = isDark
        ? 'invert(100%) hue-rotate(180deg) brightness(88%) contrast(85%)'
        : 'none';
    });
    // Re-filter the tile layer
    const tileCanvas = map.getTargetElement().querySelector('.ol-layer canvas');
    if (tileCanvas) {
      tileCanvas.style.filter = isDark
        ? 'invert(100%) hue-rotate(180deg) brightness(88%) contrast(85%)'
        : 'none';
    }
  }

  // ================================================================
  //  LAT/LON SEARCH
  // ================================================================
  function goToLatLng(input) {
    const parts = input.split(',').map(s => s.trim());
    if (parts.length < 2) return false;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return false;
    view.animate({ center: ol.proj.fromLonLat([lng, lat]), zoom: 14, duration: 600 });
    return true;
  }

  // ================================================================
  //  LAYER CONTROL WIRING
  // ================================================================
  function toggleLayer(id, visible) {
    const lyrMap = { comm: state.layers.comm, dist: state.layers.dist,
                     'ps-bound': state.layers.psBound, 'ps-point': state.layers.psPoint };
    if (lyrMap[id]) lyrMap[id].setVisible(visible);
    const cb = document.getElementById(`layer-${id}`);
    if (cb) cb.checked = visible;
  }

  function setLayerOpacity(id, pct) {
    const lyrMap = { comm: state.layers.comm, dist: state.layers.dist,
                     'ps-bound': state.layers.psBound, 'ps-point': state.layers.psPoint };
    if (lyrMap[id]) lyrMap[id].setOpacity(pct / 100);
    const lbl = document.getElementById(`opacity-val-${id}`);
    if (lbl) lbl.textContent = `${Math.round(pct)}%`;
  }

  // ================================================================
  //  WIRE UP ALL UI ELEMENTS
  // ================================================================
  _wireToolbar(map, view, state, { startMeasure, startDraw, stopInteraction, clearDrawings });
  _wireLayerControls({ toggleLayer, setLayerOpacity });

  function _goToFeature(feature) {
    const geom = feature.getGeometry();
    const ext  = geom.getType() === 'Point'
      ? ol.extent.buffer(geom.getExtent(), 1500)
      : geom.getExtent();
    view.fit(ext, { padding: [60,60,60,60], duration: 500, maxZoom: 15 });
    const center = ol.extent.getCenter(ext);
    selectFeature(feature, center, state);
  }

  _wireFilters(state, {
    filterByCommissionerate,
    filterByDistrict,
    searchStations: q => _searchStations(q, state, view, map, popup, selectFeature),
    goToFeature:    _goToFeature
  });
  _wireSidebarCards(state, view, map, popup, selectFeature);
  _wireLatLngSearch(goToLatLng);

  // Initial map sizing
  setTimeout(() => map.updateSize(), 100);

  // ================================================================
  //  PUBLIC API
  // ================================================================
  return {
    map,
    view,
    layers: state.layers,
    setView,
    filterByCommissionerate,
    filterByDistrict,
    searchStations: q => _searchStations(q, state, view, map, popup, selectFeature),
    toggleLayer,
    setLayerOpacity,
    resetExtent,
    prevExtent:     () => _navigateExtent(-1),
    nextExtent:     () => _navigateExtent(+1),
    startMeasure,
    startDraw,
    stopInteraction,
    clearDrawings,
    goToLatLng,
    syncDarkMode
  };
}

/* ================================================================
   INTERNAL HELPERS (not exported)
================================================================ */

function _showLoading(text) {
  const el = document.getElementById('map-loading-text');
  if (el) el.textContent = text;
  document.getElementById('map-loading')?.classList.add('visible');
}
function _hideLoading() {
  document.getElementById('map-loading')?.classList.remove('visible');
}
function _showError(msg) {
  const body = document.getElementById('sidebar-body');
  if (body) body.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><p style="color:var(--text-secondary)">${msg}</p></div>`;
}
function _setStatus(text) {
  const el = document.getElementById('map-status-text');
  if (el) el.textContent = text;
}

function _applyFeatureStyle(feature, styleState, st) {
  const layerForFeature = _getLayerForFeature(feature, st);
  if (!layerForFeature) return;
  const type = _getFeatureType(feature, st);
  const styleFns = {
    comm:    (f, s) => commissionerateStyle(f, null, s),
    dist:    (f, s) => districtStyle(f, null, s),
    psBound: (f, s) => psStyle(f, null, s),
    psPoint: (f, s) => psPointStyle(f, null, s)
  };
  if (styleFns[type]) feature.setStyle(styleFns[type](feature, styleState));
}

function _resetFeatureStyle(feature, st) {
  feature.setStyle(null); // revert to layer's default style function
}

function resetFeatureStyles(st) {
  ['comm','dist','psBound','psPoint'].forEach(k => {
    if (st.allFeatures[k]) st.allFeatures[k].forEach(f => f.setStyle(null));
  });
}

function _getFeatureType(feature, st) {
  const p = feature.getProperties();
  if (p.commissionerateName && !p.ps) return 'comm';
  if (p.ps && feature.getGeometry().getType() === 'Point') return 'psPoint';
  if (p.ps) return 'psBound';
  if (p.NAME_1 || p.district || p.ISO) return 'dist';
  return 'dist';
}

function _getLayerForFeature(feature, st) {
  for (const [, layer] of Object.entries(st.layers)) {
    const src = layer.getSource?.();
    if (src?.getFeatures?.().includes(feature)) return layer;
  }
  return null;
}

function _dimExcept(commId, st) {
  if (!commId) return;
  ['psBound','psPoint'].forEach(k => {
    (st.allFeatures[k] || []).forEach(f => {
      const fComm = f.get('parentCommissionerate') || f.get('commissionerate');
      const styleFn = k === 'psPoint' ? psPointStyle : psStyle;
      f.setStyle(styleFn(f, null, fComm === commId ? 'normal' : 'dimmed'));
    });
  });
}

function _filterByCommissionerate(commId, st, view, map, popup) {
  popup.setPosition(undefined);
  resetFeatureStyles(st);

  // Show all layers
  Object.values(st.layers).forEach(l => l?.setVisible(true));

  // Dim other commissionerates and their stations
  (st.allFeatures.comm || []).forEach(f => {
    const fId = f.get('id') || f.get('parentCommissionerate');
    f.setStyle(commissionerateStyle(f, null, fId === commId ? 'normal' : 'dimmed'));
  });
  _dimExcept(commId, st);

  // Zoom to commissionerate
  const commFeat = (st.allFeatures.comm || []).find(
    f => f.get('id') === commId || f.get('parentCommissionerate') === commId
  );
  if (commFeat) {
    view.fit(commFeat.getGeometry().getExtent(), { padding: [60,80,60,60], duration: 600, maxZoom: 13 });
  }
  _setStatus(`Commissionerate: ${commId.toUpperCase()}`);
}

function _populateFilterDropdowns(st) {
  const commSel = document.getElementById('filter-comm');
  const distSel = document.getElementById('filter-district');
  if (!commSel || !distSel) return;

  // Commissionerates
  (st.allFeatures.comm || []).forEach(f => {
    const id   = f.get('id') || f.get('parentCommissionerate') || '';
    const name = f.get('commissionerateName') || f.get('ps') || id;
    if (!commSel.querySelector(`option[value="${id}"]`)) {
      commSel.add(new Option(name, id));
    }
  });

  // Districts — from district layer OR from ps properties
  const distNames = new Set();
  (st.allFeatures.dist || []).forEach(f => {
    const id = f.get('id') || f.get('NAME_1') || '';
    const name = f.get('district') || f.get('NAME_1') || id;
    if (id && !distNames.has(id)) {
      distNames.add(id);
      distSel.add(new Option(name, id));
    }
  });
  // Also add from ps boundary properties (dn field)
  (st.allFeatures.psBound || []).forEach(f => {
    const dn = f.get('dn') || '';
    if (dn && !distNames.has(dn)) {
      distNames.add(dn);
      distSel.add(new Option(dn, dn));
    }
  });
}

function _searchStations(query, st, view, map, popup, selectFeatureFn) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const matches = [];
  const allPS = [...(st.allFeatures.psBound || []), ...(st.allFeatures.psPoint || [])];
  const seen = new Set();
  allPS.forEach(f => {
    const name = (f.get('ps') || '').toLowerCase();
    if (name.includes(q) && !seen.has(name)) {
      seen.add(name);
      matches.push(f);
    }
  });
  return matches;
}

function _showCommPopup(p, feature, coordinate, popup, map, st) {
  const el   = document.getElementById('map-popup');
  const type = document.getElementById('map-popup-type');
  const ttl  = document.getElementById('map-popup-title');
  const body = document.getElementById('map-popup-body');

  if (!el) return;
  type.textContent = 'Commissionerate';
  ttl.textContent  = p.commissionerateName || p.ps || 'Commissionerate';
  body.innerHTML   = `
    <div class="map-popup-row">
      <div class="map-popup-field">
        <div class="map-popup-label">Headquarters</div>
        <div class="map-popup-value">${p.headquarters || '—'}</div>
      </div>
      <div class="map-popup-field">
        <div class="map-popup-label">Stations</div>
        <div class="map-popup-value">${p.stationCount || '—'}</div>
      </div>
    </div>
    <div class="map-popup-row">
      <div class="map-popup-field">
        <div class="map-popup-label">Districts Covered</div>
        <div class="map-popup-value">${p.districts || '—'}</div>
      </div>
    </div>
    ${p.phone ? `<div class="map-popup-row"><div class="map-popup-field"><div class="map-popup-label">Phone</div><div class="map-popup-value">${p.phone}</div></div></div>` : ''}
    <div class="map-popup-actions">
      <button class="map-popup-btn accent" onclick="document.getElementById('detail-panel').classList.add('open')">Full Details</button>
    </div>
  `;
  popup.setPosition(coordinate);
}

function _showStationPopup(p, feature, coordinate, popup, map, st, view) {
  const el   = document.getElementById('map-popup');
  const type = document.getElementById('map-popup-type');
  const ttl  = document.getElementById('map-popup-title');
  const body = document.getElementById('map-popup-body');
  if (!el) return;

  type.textContent = 'Police Station';
  ttl.textContent  = p.ps || p.name || 'Station';
  const lat = parseFloat(p.lat || p.lt || 0);
  const lng = parseFloat(p.lng || p.ln || 0);
  body.innerHTML   = `
    <div class="map-popup-row">
      <div class="map-popup-field">
        <div class="map-popup-label">Division</div>
        <div class="map-popup-value">${p.division || p.dn || p.dv || '—'}</div>
      </div>
      <div class="map-popup-field">
        <div class="map-popup-label">Mandal</div>
        <div class="map-popup-value">${p.mandal || p.mn || '—'}</div>
      </div>
    </div>
    ${p.commissionerateName ? `<div class="map-popup-row"><div class="map-popup-field"><div class="map-popup-label">Commissionerate</div><div class="map-popup-value">${p.commissionerateName}</div></div></div>` : ''}
    ${(lat && lng) ? `<div class="map-popup-row"><div class="map-popup-field"><div class="map-popup-label">Coordinates</div><div class="map-popup-value">${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div></div></div>` : ''}
    ${p.phone || p.ph ? `<div class="map-popup-row"><div class="map-popup-field"><div class="map-popup-label">Phone</div><div class="map-popup-value">${p.phone || p.ph}</div></div></div>` : ''}
    <div class="map-popup-actions">
      <button class="map-popup-btn" onclick="_fitToFeatureBounds()">Zoom In</button>
      <button class="map-popup-btn accent" onclick="document.getElementById('detail-panel').classList.add('open')">Details</button>
    </div>
  `;

  // Attach zoom-to handler
  window._fitToFeatureBounds = () => {
    const geom = feature.getGeometry();
    const ext  = geom.getType() === 'Point'
      ? ol.extent.buffer(geom.getExtent(), 1500)
      : geom.getExtent();
    view.fit(ext, { padding: [60,60,60,60], duration: 500, maxZoom: 15 });
  };

  popup.setPosition(coordinate);
}

function _showDistrictPopup(p, feature, coordinate, popup, map, st, view) {
  const el   = document.getElementById('map-popup');
  const type = document.getElementById('map-popup-type');
  const ttl  = document.getElementById('map-popup-title');
  const body = document.getElementById('map-popup-body');
  if (!el) return;

  type.textContent = 'District Police';
  ttl.textContent  = p.district || p.NAME_1 || p.ISO || 'District';
  body.innerHTML   = `
    <div class="map-popup-row">
      <div class="map-popup-field">
        <div class="map-popup-label">Headquarters</div>
        <div class="map-popup-value">${p.headquarters || p.NAME_1 || '—'}</div>
      </div>
      <div class="map-popup-field">
        <div class="map-popup-label">Stations</div>
        <div class="map-popup-value">${p.stationCount || '—'}</div>
      </div>
    </div>
    ${p.commissionerate ? `<div class="map-popup-row"><div class="map-popup-field"><div class="map-popup-label">Commissionerate</div><div class="map-popup-value">${p.commissionerate}</div></div></div>` : ''}
    <div class="map-popup-actions">
      <button class="map-popup-btn accent" onclick="document.getElementById('detail-panel').classList.add('open')">Full Details</button>
    </div>
  `;
  popup.setPosition(coordinate);
}

function _showGenericPopup(p, coordinate, popup) {
  const ttl  = document.getElementById('map-popup-title');
  const body = document.getElementById('map-popup-body');
  if (!ttl) return;
  ttl.textContent = p.NAME_1 || p.name || p.ps || 'Feature';
  body.innerHTML = Object.entries(p)
    .filter(([k, v]) => k !== 'geometry' && v)
    .slice(0, 6)
    .map(([k, v]) => `<div class="map-popup-row"><div class="map-popup-field"><div class="map-popup-label">${k}</div><div class="map-popup-value">${v}</div></div></div>`)
    .join('');
  popup.setPosition(coordinate);
}

function _updateDetailPanel(p, feature) {
  const typeEl  = document.getElementById('panel-type');
  const titleEl = document.getElementById('panel-title');
  const bodyEl  = document.getElementById('panel-body');
  if (!typeEl || !titleEl || !bodyEl) return;

  if (p.ps) {
    // Delegate to existing showStationPanel if it exists (backward compat)
    if (typeof showStationPanel === 'function') showStationPanel(p);
  } else if (p.commissionerateName && !p.ps) {
    typeEl.textContent  = 'Commissionerate';
    titleEl.textContent = p.commissionerateName || p.ps || 'Commissionerate';
    bodyEl.innerHTML    = `
      <div class="panel-section" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><div class="panel-section-label">Headquarters</div><div class="panel-value">${p.headquarters||'—'}</div></div>
        <div><div class="panel-section-label">Stations</div><div class="panel-value">${p.stationCount||'—'}</div></div>
      </div>
      <div class="divider"></div>
      <div class="panel-section"><div class="panel-section-label">Districts</div><div class="panel-value-sm">${p.districts||'—'}</div></div>
      ${p.phone?`<div class="divider"></div><div class="panel-section"><div class="panel-section-label">Phone</div><div class="panel-value-sm">${p.phone}</div></div>`:''}
    `;
  } else {
    typeEl.textContent  = 'District Police';
    titleEl.textContent = p.district || p.NAME_1 || '—';
    bodyEl.innerHTML    = `
      <div class="panel-section" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><div class="panel-section-label">Headquarters</div><div class="panel-value">${p.headquarters||p.NAME_1||'—'}</div></div>
        <div><div class="panel-section-label">Stations</div><div class="panel-value">${p.stationCount||'—'}</div></div>
      </div>
    `;
  }

  // Automatically show the panel
  document.getElementById('detail-panel')?.classList.add('open');
}

/* ================================================================
   UI WIRING HELPERS
================================================================ */

function _wireToolbar(map, view, st, tools) {
  const $ = id => document.getElementById(id);
  $('tb-home')?.addEventListener('click', () => {
    view.animate({ center: ol.proj.fromLonLat(AP_CENTER), zoom: AP_ZOOM, duration: 600 });
  });
  $('tb-prev')?.addEventListener('click', () => tools.stopInteraction?.() || view.adjustZoom(-1));
  $('tb-next')?.addEventListener('click', () => view.adjustZoom(+1));
  $('tb-measure-dist')?.addEventListener('click', function() {
    const active = this.classList.contains('active');
    tools.stopInteraction();
    if (!active) { tools.startMeasure('distance'); _setToolbarActive('tb-measure-dist'); }
  });
  $('tb-measure-area')?.addEventListener('click', function() {
    const active = this.classList.contains('active');
    tools.stopInteraction();
    if (!active) { tools.startMeasure('area'); _setToolbarActive('tb-measure-area'); }
  });
  $('tb-draw-poly')?.addEventListener('click', function() {
    const active = this.classList.contains('active');
    tools.stopInteraction();
    if (!active) { tools.startDraw('Polygon'); _setToolbarActive('tb-draw-poly'); }
  });
  $('tb-draw-line')?.addEventListener('click', function() {
    const active = this.classList.contains('active');
    tools.stopInteraction();
    if (!active) { tools.startDraw('LineString'); _setToolbarActive('tb-draw-line'); }
  });
  $('tb-clear')?.addEventListener('click', tools.clearDrawings);
  $('tb-stop')?.addEventListener('click', tools.stopInteraction);
}

function _setToolbarActive(btnId) {
  document.querySelectorAll('.map-tb-btn').forEach(b => b.classList.remove('active'));
  if (btnId) document.getElementById(btnId)?.classList.add('active');
}

function _wireLayerControls({ toggleLayer, setLayerOpacity }) {
  const pairs = [
    ['layer-comm', 'opacity-comm', 'comm'],
    ['layer-dist', 'opacity-dist', 'dist'],
    ['layer-ps-bound', 'opacity-ps-bound', 'ps-bound'],
    ['layer-ps-point', 'opacity-ps-point', 'ps-point']
  ];
  pairs.forEach(([cbId, sliderId, layerId]) => {
    const cb = document.getElementById(cbId);
    const sl = document.getElementById(sliderId);
    cb?.addEventListener('change', () => toggleLayer(layerId, cb.checked));
    sl?.addEventListener('input',  () => setLayerOpacity(layerId, parseFloat(sl.value)));
  });

  // Collapsible sections
  document.querySelectorAll('.collapse-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      hdr.closest('.collapse-section').classList.toggle('collapsed');
    });
  });
}

function _wireFilters(st, { filterByCommissionerate, filterByDistrict, searchStations, goToFeature }) {
  document.getElementById('filter-comm')?.addEventListener('change', function() {
    filterByCommissionerate(this.value);
    st.activeFilter.comm = this.value || null;
  });
  document.getElementById('filter-district')?.addEventListener('change', function() {
    filterByDistrict(this.value);
    st.activeFilter.district = this.value || null;
  });

  const stInput = document.getElementById('filter-station');
  const sugBox  = document.getElementById('station-suggestions');
  stInput?.addEventListener('input', function() {
    const q = this.value.trim();
    if (!q || q.length < 2) { sugBox.classList.remove('visible'); return; }
    const results = searchStations(q).slice(0, 8);
    if (!results.length) { sugBox.classList.remove('visible'); return; }
    sugBox.innerHTML = results.map(f => {
      const name = f.get('ps') || '';
      const div  = f.get('division') || f.get('dn') || '';
      const q2   = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex chars
      const high = name.replace(new RegExp(`(${q2})`, 'gi'), '<strong>$1</strong>');
      return `<div class="station-suggestion-item" data-name="${name}">${high}<br><span style="font-size:9.5px;color:var(--text-muted)">${div}</span></div>`;
    }).join('');
    sugBox.classList.add('visible');
  });

  sugBox?.addEventListener('click', e => {
    const item = e.target.closest('.station-suggestion-item');
    if (!item) return;
    const name = item.dataset.name;
    stInput.value = name;
    sugBox.classList.remove('visible');
    const hits = searchStations(name);
    if (hits.length) goToFeature(hits[0]);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#filter-station') && !e.target.closest('#station-suggestions')) {
      sugBox?.classList.remove('visible');
    }
  });

  document.getElementById('filter-reset')?.addEventListener('click', () => {
    document.getElementById('filter-comm').value     = '';
    document.getElementById('filter-district').value = '';
    if (stInput) stInput.value = '';
    sugBox?.classList.remove('visible');
    st.activeFilter = { comm: null, district: null, station: null };
    resetFeatureStyles(st);
    _setStatus('All layers — AP Overview');
  });
}

function _wireSidebarCards(st, view, map, popup, selectFeatureFn) {
  // Cards already have click handlers from existing code — no re-wiring needed.
  // This hook is available for additional card → layer sync if needed.
}

function _wireLatLngSearch(goToLatLng) {
  document.getElementById('latlng-go')?.addEventListener('click', () => {
    const input = document.getElementById('latlng-input')?.value || '';
    const ok = goToLatLng(input);
    if (!ok) {
      const el = document.getElementById('latlng-input');
      if (el) { el.style.borderColor = '#ef4444'; setTimeout(() => { el.style.borderColor = ''; }, 1500); }
    }
  });
  document.getElementById('latlng-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('latlng-go')?.click();
  });
}
