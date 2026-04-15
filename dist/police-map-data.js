// ============================================================
// AP POLICE GIS — DATA ADAPTERS  (police-map-data.js)
//
// PRODUCTION INTEGRATION:
//   Set config.serviceUrls.X to a WMS/WFS endpoint URL, or
//   set config.geoJsonUrls.X to a GeoJSON file path.
//   When both are null the module uses built-in mock data.
// ============================================================

/* ----------------------------------------------------------------
   MOCK DATA — 2 Commissionerates, 3 Districts, 6 Police Stations
   Replace these FeatureCollections with real AP boundary data.
   Property field names mirror the existing comm-ntr-stations.json
   and ap-police-stations.json schemas.
----------------------------------------------------------------- */
const MOCK_COMMISSIONERATES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'ntr',
        ps: 'NTR Commissionerate',
        commissionerateName: 'NTR Commissionerate',
        parentCommissionerate: 'ntr',
        headquarters: 'Vijayawada',
        districts: 'NTR, Krishna',
        stationCount: 32,
        phone: '0866-2440990',
        email: 'cp-ntr@appolice.gov.in',
        officer: 'Commissioner of Police'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[80.42,16.44],[80.56,16.44],[80.60,16.48],
          [80.60,16.58],[80.56,16.63],[80.44,16.63],
          [80.40,16.57],[80.40,16.48],[80.42,16.44]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'vizag',
        ps: 'Visakhapatnam Commissionerate',
        commissionerateName: 'Visakhapatnam Commissionerate',
        parentCommissionerate: 'vizag',
        headquarters: 'Visakhapatnam',
        districts: 'Visakhapatnam',
        stationCount: 41,
        phone: '0891-2503000',
        email: 'cp-vizag@appolice.gov.in',
        officer: 'Commissioner of Police'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[83.16,17.62],[83.30,17.60],[83.42,17.64],
          [83.45,17.72],[83.40,17.80],[83.28,17.85],
          [83.18,17.82],[83.12,17.75],[83.16,17.62]]]
      }
    }
  ]
};

const MOCK_DISTRICTS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'ntr-dist',
        NAME_1: 'NTR',
        district: 'NTR District',
        commissionerate: 'ntr',
        headquarters: 'Vijayawada',
        ph: '0866-2576100',
        stationCount: 12
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[80.25,16.30],[80.75,16.30],[80.80,16.50],
          [80.75,16.75],[80.45,16.80],[80.25,16.65],
          [80.20,16.45],[80.25,16.30]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'vizag-dist',
        NAME_1: 'Visakhapatnam',
        district: 'Visakhapatnam District',
        commissionerate: 'vizag',
        headquarters: 'Visakhapatnam',
        ph: '0891-2562501',
        stationCount: 18
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[83.00,17.50],[83.50,17.45],[83.60,17.65],
          [83.55,17.90],[83.30,17.95],[83.10,17.90],
          [82.95,17.75],[83.00,17.50]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        id: 'krishna-dist',
        NAME_1: 'Krishna',
        district: 'Krishna District',
        commissionerate: null,
        headquarters: 'Machilipatnam',
        ph: '08672-222224',
        stationCount: 15
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[80.80,16.10],[81.20,16.10],[81.30,16.40],
          [81.20,16.65],[80.90,16.70],[80.70,16.55],
          [80.75,16.30],[80.80,16.10]]]
      }
    }
  ]
};

// Police station boundaries — matches comm-ntr-stations schema
const MOCK_PS_BOUNDARIES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        ps: 'ONE TOWN', parentCommissionerate: 'ntr',
        commissionerateName: 'NTR Commissionerate',
        division: 'VIJAYAWADA CITY', mandal: 'VIJAYAWADA (URBAN)',
        phone: '0866-2572100', lat: '16.511', lng: '80.474',
        geometrySource: 'mock'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[80.460,16.500],[80.488,16.500],
          [80.488,16.522],[80.460,16.522],[80.460,16.500]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        ps: 'LABBIPET', parentCommissionerate: 'ntr',
        commissionerateName: 'NTR Commissionerate',
        division: 'VIJAYAWADA CITY', mandal: 'VIJAYAWADA (URBAN)',
        phone: '0866-2435600', lat: '16.520', lng: '80.435',
        geometrySource: 'mock'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[80.420,16.510],[80.450,16.510],
          [80.450,16.532],[80.420,16.532],[80.420,16.510]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        ps: 'GOVERNORPET', parentCommissionerate: 'ntr',
        commissionerateName: 'NTR Commissionerate',
        division: 'VIJAYAWADA CITY', mandal: 'VIJAYAWADA (URBAN)',
        phone: '0866-2575700', lat: '16.540', lng: '80.465',
        geometrySource: 'mock'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[80.452,16.530],[80.480,16.530],
          [80.480,16.552],[80.452,16.552],[80.452,16.530]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        ps: 'DWARAKA NAGAR', parentCommissionerate: 'vizag',
        commissionerateName: 'Visakhapatnam Commissionerate',
        division: 'VISAKHAPATNAM CITY', mandal: 'VISAKHAPATNAM (URBAN)',
        phone: '0891-2754800', lat: '17.735', lng: '83.328',
        geometrySource: 'mock'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[83.315,17.724],[83.342,17.724],
          [83.342,17.748],[83.315,17.748],[83.315,17.724]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        ps: 'GAJUWAKA', parentCommissionerate: 'vizag',
        commissionerateName: 'Visakhapatnam Commissionerate',
        division: 'VISAKHAPATNAM CITY', mandal: 'GAJUWAKA',
        phone: '0891-2588100', lat: '17.680', lng: '83.225',
        geometrySource: 'mock'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[83.210,17.668],[83.240,17.668],
          [83.240,17.692],[83.210,17.692],[83.210,17.668]]]
      }
    },
    {
      type: 'Feature',
      properties: {
        ps: 'PENDURTHI', parentCommissionerate: 'vizag',
        commissionerateName: 'Visakhapatnam Commissionerate',
        division: 'VISAKHAPATNAM CITY', mandal: 'PENDURTHI',
        phone: '0891-2706500', lat: '17.785', lng: '83.175',
        geometrySource: 'mock'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[83.160,17.772],[83.192,17.772],
          [83.192,17.798],[83.160,17.798],[83.160,17.772]]]
      }
    }
  ]
};

// Point layer derived from boundary centroids
const MOCK_PS_POINTS = {
  type: 'FeatureCollection',
  features: MOCK_PS_BOUNDARIES.features.map(f => ({
    type: 'Feature',
    properties: { ...f.properties },
    geometry: {
      type: 'Point',
      coordinates: [parseFloat(f.properties.lng), parseFloat(f.properties.lat)]
    }
  }))
};

/* ----------------------------------------------------------------
   INTERNAL HELPERS
----------------------------------------------------------------- */
const _geoJSONFormat = () => new ol.format.GeoJSON({
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
});

async function _fetchGeoJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

function _makeVectorLayer(geojsonData, styleFn, zIndex) {
  const features = _geoJSONFormat().readFeatures(geojsonData);
  const source = new ol.source.Vector({ features });
  return new ol.layer.Vector({ source, style: styleFn, zIndex: zIndex || 0, declutter: true });
}

// WMS layer factory — insert real GIS server URL + layer name here
// PRODUCTION: replace null with actual OGC WMS endpoint
function _makeWMSLayer(wmsUrl, layerName, zIndex) {
  const source = new ol.source.ImageWMS({
    // REPLACE: url: 'https://your-geoserver.appolice.gov.in/geoserver/ap/wms'
    url: wmsUrl,
    params: {
      LAYERS: layerName,   // e.g. 'ap:commissionerate_boundary'
      VERSION: '1.3.0',
      FORMAT: 'image/png',
      TRANSPARENT: true,
      CRS: 'EPSG:3857'
    },
    ratio: 1,
    serverType: 'geoserver'
  });
  return new ol.layer.Image({ source, zIndex: zIndex || 0 });
}

/* ----------------------------------------------------------------
   ADAPTER FUNCTIONS — Public API
   Each returns a promise resolving to an OL layer.
   Hierarchy: WMS endpoint → GeoJSON URL → mock data
----------------------------------------------------------------- */

/**
 * loadCommissionerateLayer(config)
 * config.serviceUrls.commissionerate — WMS endpoint URL or null
 * config.geoJsonUrls.commissionerate — GeoJSON file path or null
 * PRODUCTION URL PLACEHOLDER: 'https://<geoserver>/wms?service=WMS'
 * PRODUCTION LAYER NAME:       'ap:commissionerate_boundaries'
 */
async function loadCommissionerateLayer(config, styleFn) {
  const wmsUrl = config?.serviceUrls?.commissionerate;
  const gjUrl  = config?.geoJsonUrls?.commissionerate;

  if (wmsUrl) {
    // WMS path — GetFeatureInfo handled separately in module
    return _makeWMSLayer(wmsUrl,
      config?.layerNames?.commissionerate || 'ap:commissionerate_boundaries', 40);
  }
  const data = gjUrl ? await _fetchGeoJSON(gjUrl) : MOCK_COMMISSIONERATES;
  return _makeVectorLayer(data, styleFn, 40);
}

/**
 * loadPoliceDistrictLayer(config)
 * PRODUCTION URL PLACEHOLDER: 'https://<geoserver>/wms?service=WMS'
 * PRODUCTION LAYER NAME:       'ap:police_district_boundaries'
 * PRODUCTION GEOJSON:          '/public/ap-districts.json'  (existing file)
 */
async function loadPoliceDistrictLayer(config, styleFn) {
  const wmsUrl = config?.serviceUrls?.policeDistrict;
  const gjUrl  = config?.geoJsonUrls?.policeDistrict ?? 'ap-districts.json';

  if (wmsUrl) {
    return _makeWMSLayer(wmsUrl,
      config?.layerNames?.policeDistrict || 'ap:police_district_boundaries', 30);
  }
  try {
    const data = await _fetchGeoJSON(gjUrl);
    return _makeVectorLayer(data, styleFn, 30);
  } catch {
    return _makeVectorLayer(MOCK_DISTRICTS, styleFn, 30);
  }
}

/**
 * loadPoliceStationBoundaryLayer(config)
 * PRODUCTION URL PLACEHOLDER: 'https://<geoserver>/wms?service=WMS'
 * PRODUCTION LAYER NAME:       'ap:police_station_boundaries'
 * PRODUCTION GEOJSON (NTR):    '/public/comm-ntr-stations.json'  (existing)
 * PRODUCTION GEOJSON (Vizag):  '/public/comm-vizag-stations.json' (existing)
 * PRODUCTION GEOJSON (all):    '/public/ap-police-stations.json'  (existing)
 */
async function loadPoliceStationBoundaryLayer(config, styleFn) {
  const wmsUrl = config?.serviceUrls?.psiBoundary;
  const gjUrl  = config?.geoJsonUrls?.psiBoundary ?? 'ap-police-stations.json';

  if (wmsUrl) {
    return _makeWMSLayer(wmsUrl,
      config?.layerNames?.psiBoundary || 'ap:police_station_boundaries', 20);
  }
  try {
    const data = await _fetchGeoJSON(gjUrl);
    return _makeVectorLayer(data, styleFn, 20);
  } catch {
    return _makeVectorLayer(MOCK_PS_BOUNDARIES, styleFn, 20);
  }
}

/**
 * loadPoliceStationPointLayer(config)
 * PRODUCTION URL PLACEHOLDER: 'https://<geoserver>/wfs?service=WFS'
 * PRODUCTION LAYER NAME:       'ap:police_station_points'
 * Point geometries — lat/lng from station properties.
 */
async function loadPoliceStationPointLayer(config, styleFn) {
  const wmsUrl = config?.serviceUrls?.psiPoint;
  const gjUrl  = config?.geoJsonUrls?.psiPoint;

  if (wmsUrl) {
    return _makeWMSLayer(wmsUrl,
      config?.layerNames?.psiPoint || 'ap:police_station_points', 50);
  }

  // Build point features from the boundary layer's lat/lng properties
  let pointData = MOCK_PS_POINTS;
  if (gjUrl) {
    try { pointData = await _fetchGeoJSON(gjUrl); } catch { /* use mock */ }
  } else {
    // Derive from the boundary source files
    try {
      const [ntr, vizag] = await Promise.all([
        _fetchGeoJSON('comm-ntr-stations.json'),
        _fetchGeoJSON('comm-vizag-stations.json')
      ]);
      const allFeatures = [...ntr.features, ...vizag.features]
        .filter(f => f.properties.lat && f.properties.lng)
        .map(f => ({
          type: 'Feature',
          properties: { ...f.properties },
          geometry: {
            type: 'Point',
            coordinates: [parseFloat(f.properties.lng), parseFloat(f.properties.lat)]
          }
        }));
      if (allFeatures.length) pointData = { type: 'FeatureCollection', features: allFeatures };
    } catch { /* stay with mock */ }
  }
  return _makeVectorLayer(pointData, styleFn, 50);
}

/**
 * WFS GetFeature request helper (for BBOX-filtered loading)
 * PRODUCTION: configure wfsUrl + typeName for real AP WFS service
 * PRODUCTION URL PLACEHOLDER: 'https://<geoserver>/wfs'
 */
async function wfsFetchByBbox(wfsUrl, typeName, bbox, srsName = 'EPSG:4326') {
  // REPLACE wfsUrl and typeName with real AP WFS values
  const bboxStr = bbox.join(',') + `,${srsName}`;
  const url = `${wfsUrl}?service=WFS&version=2.0.0&request=GetFeature`
    + `&typeName=${typeName}&outputFormat=application/json`
    + `&bbox=${bboxStr}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WFS error: ${res.status}`);
  return res.json();
}

/**
 * GetFeatureInfo helper for WMS click interactions
 * PRODUCTION: use real WMS endpoint + layer name
 */
async function wmsGetFeatureInfo(wmsUrl, layerName, coordinate, viewResolution, projection) {
  // REPLACE with real AP WMS endpoint
  const source = new ol.source.ImageWMS({
    url: wmsUrl,
    params: { LAYERS: layerName }
  });
  const url = source.getFeatureInfoUrl(coordinate, viewResolution, projection, {
    INFO_FORMAT: 'application/json',
    FEATURE_COUNT: 1
  });
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}
