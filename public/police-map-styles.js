// ============================================================
// AP POLICE GIS — LAYER STYLE FUNCTIONS  (police-map-styles.js)
//
// All functions accept (feature, resolution, state) where
// state is 'normal' | 'hover' | 'selected' | 'dimmed'.
// Colors can be overridden via config.theme in the module.
// ============================================================

/* ---- Default theme colors (override via config.theme) ---- */
const DEFAULT_THEME = {
  commColor:      '#8b1a1a',   // maroon — commissionerate
  districtColor:  '#1e40af',   // blue   — district police
  psColor:        '#c2410c',   // orange — police station boundary
  psPointColor:   '#1e293b',   // dark   — police station point
  selectedColor:  '#f59e0b',   // accent gold — selected feature
  dimmedOpacity:  0.2
};

let _theme = { ...DEFAULT_THEME };

/** Call once from the module to apply config.theme overrides */
function applyTheme(themeConfig) {
  _theme = { ...DEFAULT_THEME, ...themeConfig };
}

/* ----------------------------------------------------------------
   COMMISSIONERATE — thick maroon outline, light fill
----------------------------------------------------------------- */
function commissionerateStyle(feature, resolution, state) {
  const c = _theme.commColor;
  switch (state) {
    case 'hover':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.28) }),
        stroke: new ol.style.Stroke({ color: c, width: 4 }),
        zIndex: 10
      });
    case 'selected':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.35) }),
        stroke: new ol.style.Stroke({ color: _theme.selectedColor, width: 4, lineDash: [8, 4] }),
        zIndex: 20
      });
    case 'dimmed':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.04) }),
        stroke: new ol.style.Stroke({ color: c, width: 1.5, lineDash: [4, 4] })
      });
    default: // normal
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.12) }),
        stroke: new ol.style.Stroke({ color: c, width: 3 })
      });
  }
}

/* ----------------------------------------------------------------
   POLICE DISTRICT — medium blue outline, transparent fill
----------------------------------------------------------------- */
function districtStyle(feature, resolution, state) {
  const c = _theme.districtColor;
  // If feature is a real district (from ap-districts.json) that is also
  // a commissionerate, keep the fill transparent to let comm layer show.
  switch (state) {
    case 'hover':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.22) }),
        stroke: new ol.style.Stroke({ color: c, width: 3 }),
        zIndex: 5
      });
    case 'selected':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.28) }),
        stroke: new ol.style.Stroke({ color: _theme.selectedColor, width: 3, lineDash: [8, 4] }),
        zIndex: 15
      });
    case 'dimmed':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.03) }),
        stroke: new ol.style.Stroke({ color: c, width: 1, lineDash: [4, 4] })
      });
    default:
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.07) }),
        stroke: new ol.style.Stroke({ color: c, width: 1.8 })
      });
  }
}

/* ----------------------------------------------------------------
   POLICE STATION BOUNDARY — thin orange outline, light fill
----------------------------------------------------------------- */
function psStyle(feature, resolution, state) {
  const c = _theme.psColor;
  // Show label only at sufficient zoom (< ~300m/px)
  const label = resolution < 80
    ? new ol.style.Text({
        text: (feature.get('ps') || '').replace(/ PS$/, ''),
        font: '600 9px Inter, system-ui, sans-serif',
        fill: new ol.style.Fill({ color: '#1a2744' }),
        stroke: new ol.style.Stroke({ color: 'rgba(255,255,255,0.85)', width: 3 }),
        overflow: true,
        placement: 'point'
      })
    : null;

  switch (state) {
    case 'hover':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.28) }),
        stroke: new ol.style.Stroke({ color: c, width: 2.5 }),
        text:   label,
        zIndex: 8
      });
    case 'selected':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.35) }),
        stroke: new ol.style.Stroke({ color: _theme.selectedColor, width: 2.5, lineDash: [6, 3] }),
        text:   label,
        zIndex: 18
      });
    case 'dimmed':
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.04) }),
        stroke: new ol.style.Stroke({ color: c, width: 0.7 })
      });
    default:
      return new ol.style.Style({
        fill:   new ol.style.Fill({ color: hex2rgba(c, 0.14) }),
        stroke: new ol.style.Stroke({ color: c, width: 2.2 }),
        text:   label
      });
  }
}

/* ----------------------------------------------------------------
   POLICE STATION POINT — dark circle markers
----------------------------------------------------------------- */
function psPointStyle(feature, resolution, state) {
  const c = _theme.psPointColor;
  switch (state) {
    case 'hover':
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 9,
          fill:   new ol.style.Fill({ color: c }),
          stroke: new ol.style.Stroke({ color: _theme.selectedColor, width: 2.5 })
        }),
        zIndex: 12
      });
    case 'selected':
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          fill:   new ol.style.Fill({ color: _theme.selectedColor }),
          stroke: new ol.style.Stroke({ color: c, width: 2 })
        }),
        zIndex: 22
      });
    case 'dimmed':
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 4,
          fill:   new ol.style.Fill({ color: hex2rgba(c, 0.3) }),
          stroke: new ol.style.Stroke({ color: '#fff', width: 1 })
        })
      });
    default:
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill:   new ol.style.Fill({ color: c }),
          stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
        })
      });
  }
}

/* ----------------------------------------------------------------
   DRAW / MEASURE styles
----------------------------------------------------------------- */
const DRAW_STYLE = new ol.style.Style({
  fill:   new ol.style.Fill({ color: 'rgba(245,158,11,0.12)' }),
  stroke: new ol.style.Stroke({ color: '#f59e0b', width: 2, lineDash: [8, 4] }),
  image:  new ol.style.Circle({
    radius: 5,
    fill:   new ol.style.Fill({ color: '#f59e0b' }),
    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
  })
});

/* ----------------------------------------------------------------
   UTILITY
----------------------------------------------------------------- */
function hex2rgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatLength(meters) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)} km`
    : `${Math.round(meters)} m`;
}

function formatArea(sqm) {
  return sqm >= 1_000_000
    ? `${(sqm / 1_000_000).toFixed(2)} km²`
    : `${Math.round(sqm)} m²`;
}
