// ============================================================
// AP POLICE GIS MAP MODULE — Integration Examples
// ============================================================

// ----------------------------------------------------------------
// EXAMPLE 1: Plain HTML page integration
// ----------------------------------------------------------------
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AP Police Map</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@9.2.4/dist/ol.css">
  <script src="https://cdn.jsdelivr.net/npm/ol@9.2.4/dist/ol.js"></script>
  <link rel="stylesheet" href="police-map.css">
  <style>
    body { margin: 0; font-family: 'Inter', system-ui, sans-serif; }
    #app  { display: flex; height: 100vh; }
    #map  { flex: 1; }
    #sidebar { width: 280px; overflow-y: auto; background: #f0f4f8; padding: 12px; }
  </style>
</head>
<body>
  <!-- Required popup element inside map container -->
  <div id="app">
    <div id="sidebar">
      <select id="filter-comm"><option value="">All Commissionerates</option></select>
      <select id="filter-district"><option value="">All Districts</option></select>
      <input id="filter-station" type="search" placeholder="Search station…">
      <div id="station-suggestions" class="station-suggestions"></div>
      <button id="filter-reset">Reset</button>
      <div id="layer-controls">
        <label><input type="checkbox" id="layer-comm" checked> Commissionerates</label>
        <input type="range" id="opacity-comm" min="0" max="100" value="80">
        <label><input type="checkbox" id="layer-dist" checked> Districts</label>
        <input type="range" id="opacity-dist" min="0" max="100" value="70">
        <label><input type="checkbox" id="layer-ps-bound" checked> Station Zones</label>
        <input type="range" id="opacity-ps-bound" min="0" max="100" value="65">
        <label><input type="checkbox" id="layer-ps-point" checked> Station Points</label>
        <input type="range" id="opacity-ps-point" min="0" max="100" value="85">
      </div>
    </div>
    <div id="map" style="position:relative;">
      <div id="map-popup" class="map-popup">
        <div class="map-popup-head">
          <div>
            <div class="map-popup-type" id="map-popup-type"></div>
            <div class="map-popup-title" id="map-popup-title"></div>
          </div>
          <button class="map-popup-close" id="map-popup-close">&times;</button>
        </div>
        <div class="map-popup-body" id="map-popup-body"></div>
      </div>
      <div class="map-coord-bar">
        <span class="map-coord-text" id="map-coord-text">Move cursor over map</span>
      </div>
      <div id="map-loading" class="map-loading">
        <div class="map-loading-inner"><div class="spinner"></div><p id="map-loading-text">Loading…</p></div>
      </div>
      <div id="map-status" class="map-status">
        <span class="map-status-dot"></span><span id="map-status-text">All layers</span>
      </div>
      <!-- Toolbar -->
      <div class="map-toolbar">
        <button class="map-tb-btn" id="tb-home">⌖</button>
        <button class="map-tb-btn" id="zoom-in">+</button>
        <button class="map-tb-btn" id="zoom-out">−</button>
        <div class="map-tb-divider"></div>
        <button class="map-tb-btn" id="tb-measure-dist">📏</button>
        <button class="map-tb-btn" id="tb-measure-area">⬟</button>
        <button class="map-tb-btn" id="tb-draw-poly">⬡</button>
        <button class="map-tb-btn" id="tb-draw-line">╱</button>
        <button class="map-tb-btn" id="tb-clear">✕</button>
        <div class="map-tb-divider"></div>
        <input class="map-latlng-input" id="latlng-input" placeholder="Lat, Lng">
        <button class="map-latlng-go" id="latlng-go">Go</button>
      </div>
      <!-- Detail panel (optional) -->
      <aside class="detail-panel" id="detail-panel">
        <div class="panel-head">
          <div class="panel-head-left">
            <div class="panel-type-label" id="panel-type"></div>
            <div class="panel-title" id="panel-title"></div>
          </div>
          <button class="panel-close-btn" id="panel-close">&times;</button>
        </div>
        <div class="panel-body" id="panel-body"></div>
      </aside>
    </div>
  </div>

  <script src="police-map-data.js"></script>
  <script src="police-map-styles.js"></script>
  <script src="police-map-module.js"></script>
  <script>
    (async () => {
      const mapApi = await initPoliceBoundaryMap('map', {
        center:  [79.74, 15.91],
        zoom:    7,
        basemap: 'carto-light',
        // PRODUCTION: replace with real AP GIS WMS/WFS URLs
        serviceUrls: { commissionerate: null, policeDistrict: null, psiBoundary: null, psiPoint: null },
        geoJsonUrls: {
          policeDistrict: 'ap-districts.json',
          psiBoundary:    'ap-police-stations.json'
        },
        theme: {
          commColor:     '#8b1a1a',
          districtColor: '#1e40af',
          psColor:       '#c2410c',
          psPointColor:  '#1e293b'
        }
      });

      // Programmatic control
      // mapApi.setView('ntr');
      // mapApi.filterByCommissionerate('vizag');
      // mapApi.filterByDistrict('ntr-dist');
      // mapApi.startMeasure('distance');
      // mapApi.resetExtent();
    })();
  </script>
</body>
</html>
*/

// ----------------------------------------------------------------
// EXAMPLE 2: React component integration
// ----------------------------------------------------------------
/*
// PoliceBoundaryMap.jsx
import { useEffect, useRef } from 'react';

export default function PoliceBoundaryMap({ config = {} }) {
  const containerRef = useRef(null);
  const mapApiRef    = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Ensure OL scripts are loaded before init
    if (typeof window.initPoliceBoundaryMap !== 'function') {
      console.error('police-map-module.js not loaded');
      return;
    }

    let destroyed = false;

    (async () => {
      const api = await window.initPoliceBoundaryMap(containerRef.current.id, {
        center:  [79.74, 15.91],
        zoom:    7,
        basemap: config.basemap || 'carto-light',
        serviceUrls: config.serviceUrls || {},
        geoJsonUrls: config.geoJsonUrls || {
          policeDistrict: '/ap-districts.json',
          psiBoundary:    '/ap-police-stations.json'
        },
        theme: config.theme || {}
      });
      if (!destroyed) mapApiRef.current = api;
    })();

    return () => {
      destroyed = true;
      if (mapApiRef.current?.map) {
        mapApiRef.current.map.setTarget(undefined); // OL cleanup
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Required OL popup element */}
      <div id="map-popup" className="map-popup">
        <div className="map-popup-head">
          <div>
            <div className="map-popup-type" id="map-popup-type"></div>
            <div className="map-popup-title" id="map-popup-title"></div>
          </div>
          <button className="map-popup-close" id="map-popup-close">&times;</button>
        </div>
        <div className="map-popup-body" id="map-popup-body"></div>
      </div>
      <div className="map-coord-bar">
        <span className="map-coord-text" id="map-coord-text">Move cursor</span>
      </div>
      <div id="map-loading" className="map-loading">
        <div className="map-loading-inner">
          <div className="spinner"></div>
          <p id="map-loading-text">Loading…</p>
        </div>
      </div>
      <div id="map-status" className="map-status">
        <span className="map-status-dot"></span>
        <span id="map-status-text">All layers</span>
      </div>
      {/* Map target — must have an id */}
      <div
        id="police-boundary-map"
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        aria-label="AP Police boundary map"
      />
    </div>
  );
}

// Usage in a parent component:
// <PoliceBoundaryMap
//   config={{
//     basemap: 'carto-light',
//     geoJsonUrls: {
//       policeDistrict: '/api/districts.geojson',
//       psiBoundary:    '/api/police-stations.geojson'
//     },
//     serviceUrls: {
//       // PRODUCTION: real AP GIS WMS endpoint
//       commissionerate: 'https://gis.appolice.gov.in/wms'
//     },
//     theme: {
//       commColor: '#8b1a1a',
//       districtColor: '#1e40af'
//     }
//   }}
// />
*/
