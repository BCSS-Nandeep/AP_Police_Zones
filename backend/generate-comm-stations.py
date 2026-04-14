"""
Generate commissionerate-focused police station GeoJSON files.

For each commissionerate (NTR, Visakhapatnam):
  - Extract exact station boundaries from ap-police-stations.json
  - For missing stations: generate Voronoi polygons clipped to commissionerate boundary
  - Output: comm-ntr-stations.json, comm-vizag-stations.json
"""

import json
import os
import numpy as np
from scipy.spatial import Voronoi
from shapely.geometry import shape, Point, Polygon, MultiPolygon, mapping
from shapely.ops import unary_union

PROJ_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(PROJ_ROOT, 'public')

# ---------------------------------------------------------------------------
# 1. Load source data
# ---------------------------------------------------------------------------

with open(os.path.join(PUBLIC_DIR, 'ap-districts.json')) as f:
    districts_geo = json.load(f)

with open(os.path.join(PUBLIC_DIR, 'ap-police-stations.json')) as f:
    ps_geo = json.load(f)

def find_district_shape(name_key):
    for feat in districts_geo['features']:
        if feat['properties'].get('NAME_1', '').lower() == name_key.lower():
            return shape(feat['geometry'])
    return None

ntr_boundary = find_district_shape('NTR')
vizag_boundary = find_district_shape('Visakhapatnam')

print(f"NTR boundary loaded: {ntr_boundary is not None}")
print(f"Vizag boundary loaded: {vizag_boundary is not None}")

# ---------------------------------------------------------------------------
# 2. Extract exact station polygons from ap-police-stations.json
# ---------------------------------------------------------------------------

def extract_stations(district_name, division_filter=None):
    """Extract station features matching district and optional division."""
    results = []
    for feat in ps_geo['features']:
        p = feat['properties']
        if p.get('dn', '').upper() == district_name.upper():
            if division_filter is None or division_filter.upper() in p.get('dv', '').upper():
                results.append(feat)
    return results

# NTR: all VIJAYAWADA CITY division stations from KRISHNA district
ntr_exact = extract_stations('KRISHNA', 'VIJAYAWADA')
print(f"NTR exact stations: {len(ntr_exact)}")
for s in ntr_exact:
    print(f"  {s['properties']['ps']}")

# Vizag: VISAKHAPATNAM CITY subdivision stations
vizag_exact = extract_stations('VISAKHAPATNAM', 'VISAKHAPATNAM CITY')
print(f"\nVizag exact stations: {len(vizag_exact)}")
for s in vizag_exact:
    print(f"  {s['properties']['ps']}")

# ---------------------------------------------------------------------------
# 3. Define missing Vizag commissionerate stations with approximate coords
# ---------------------------------------------------------------------------
# These stations are listed on the AP Police portal under Vizag Commissionerate
# but have no polygon boundaries in the APSAC dataset.
# Coordinates are approximate urban locations within Visakhapatnam city.

vizag_missing_stations = [
    {"ps": "I TOWN",           "lat": 17.7150, "lng": 83.3050, "mn": "VISAKHAPATNAM"},
    {"ps": "II TOWN",          "lat": 17.7100, "lng": 83.2950, "mn": "VISAKHAPATNAM"},
    {"ps": "III TOWN",         "lat": 17.7200, "lng": 83.3100, "mn": "VISAKHAPATNAM"},
    {"ps": "IV TOWN",          "lat": 17.7250, "lng": 83.3200, "mn": "VISAKHAPATNAM"},
    {"ps": "MAHARANIPETA",     "lat": 17.7120, "lng": 83.3000, "mn": "VISAKHAPATNAM"},
    {"ps": "ARILOVA",          "lat": 17.7480, "lng": 83.2700, "mn": "VISAKHAPATNAM"},
    {"ps": "DWARAKA",          "lat": 17.7350, "lng": 83.2400, "mn": "VISAKHAPATNAM"},
    {"ps": "MUVVALAVANIPALEM", "lat": 17.7300, "lng": 83.3300, "mn": "VISAKHAPATNAM"},
    {"ps": "HARBOUR",          "lat": 17.6900, "lng": 83.2850, "mn": "VISAKHAPATNAM"},
    {"ps": "MALKAPURAM",       "lat": 17.7000, "lng": 83.2300, "mn": "GAJUWAKA"},
    {"ps": "STEELPLANT",       "lat": 17.6650, "lng": 83.1750, "mn": "GAJUWAKA"},
    {"ps": "AIRPORT",          "lat": 17.7230, "lng": 83.2250, "mn": "PEDAGANTYADA"},
    {"ps": "KANCHARAPALEM",    "lat": 17.7350, "lng": 83.2800, "mn": "VISAKHAPATNAM"},
]

# ---------------------------------------------------------------------------
# 4. Generate Voronoi polygons for missing stations clipped to boundary
# ---------------------------------------------------------------------------

def voronoi_polygons_clipped(points, labels, clip_boundary, existing_union=None):
    """
    Generate Voronoi polygons from points, clip to boundary,
    subtract existing exact polygons.
    Returns list of (label, polygon) tuples for the inferred stations.
    """
    if len(points) < 3:
        return []

    coords = np.array(points)

    # Add boundary-derived far points to ensure all Voronoi regions are finite
    bounds = clip_boundary.bounds  # (minx, miny, maxx, maxy)
    margin = 2.0
    far_points = np.array([
        [bounds[0] - margin, bounds[1] - margin],
        [bounds[2] + margin, bounds[1] - margin],
        [bounds[0] - margin, bounds[3] + margin],
        [bounds[2] + margin, bounds[3] + margin],
    ])
    all_points = np.vstack([coords, far_points])

    vor = Voronoi(all_points)

    polygons = []
    for i in range(len(coords)):
        region_idx = vor.point_region[i]
        region = vor.regions[region_idx]
        if -1 in region or len(region) == 0:
            continue
        vertices = [vor.vertices[v] for v in region]
        if len(vertices) < 3:
            continue
        poly = Polygon(vertices)
        # Clip to commissionerate boundary
        clipped = poly.intersection(clip_boundary)
        if clipped.is_empty:
            continue
        # Subtract existing exact polygons if provided
        if existing_union is not None and not existing_union.is_empty:
            clipped = clipped.difference(existing_union)
        if clipped.is_empty:
            continue
        polygons.append((labels[i], clipped))

    return polygons


def build_comm_geojson(exact_features, missing_stations, boundary, comm_id, comm_name):
    """Build a GeoJSON FeatureCollection for one commissionerate."""
    features = []

    # Collect all exact station polygons for union (to subtract from Voronoi)
    exact_shapes = []
    exact_names = set()

    for feat in exact_features:
        geom = shape(feat['geometry'])
        if not geom.is_valid:
            geom = geom.buffer(0)
        # Clip to boundary
        clipped = geom.intersection(boundary)
        if clipped.is_empty:
            continue

        p = feat['properties']
        exact_shapes.append(clipped)
        exact_names.add(p.get('ps', '').upper())

        # Ensure geometry is Polygon or MultiPolygon for GeoJSON
        if isinstance(clipped, (Polygon, MultiPolygon)):
            geom_out = clipped
        else:
            continue

        features.append({
            "type": "Feature",
            "properties": {
                "ps": p.get('ps', ''),
                "parentCommissionerate": comm_id,
                "commissionerateName": comm_name,
                "geometrySource": "exact",
                "division": p.get('dv', ''),
                "phone": p.get('ph', ''),
                "mandal": p.get('mn', ''),
                "lat": p.get('lt', ''),
                "lng": p.get('ln', '')
            },
            "geometry": json.loads(json.dumps(mapping(geom_out)))
        })

    exact_union = unary_union(exact_shapes) if exact_shapes else Polygon()

    # Generate Voronoi for missing stations
    if missing_stations:
        # Collect ALL station points (exact + missing) for Voronoi
        all_points = []
        all_labels = []
        is_missing = []

        # Add exact station centroids
        for feat in exact_features:
            p = feat['properties']
            lat = float(p.get('lt', 0) or 0)
            lng = float(p.get('ln', 0) or 0)
            if lat and lng:
                all_points.append([lng, lat])
                all_labels.append(p.get('ps', ''))
                is_missing.append(False)

        # Add missing station coords
        for ms in missing_stations:
            all_points.append([ms['lng'], ms['lat']])
            all_labels.append(ms['ps'])
            is_missing.append(True)

        if len(all_points) >= 3:
            voronoi_results = voronoi_polygons_clipped(
                all_points, all_labels, boundary, exact_union
            )

            for label, poly in voronoi_results:
                # Only keep Voronoi cells for missing stations
                if label.upper() in exact_names:
                    continue

                # Find the missing station data
                ms_data = next((m for m in missing_stations if m['ps'] == label), None)
                if not ms_data:
                    continue

                if isinstance(poly, (Polygon, MultiPolygon)):
                    geom_out = poly
                else:
                    continue

                features.append({
                    "type": "Feature",
                    "properties": {
                        "ps": label,
                        "parentCommissionerate": comm_id,
                        "commissionerateName": comm_name,
                        "geometrySource": "inferred",
                        "division": "",
                        "phone": "",
                        "mandal": ms_data.get('mn', ''),
                        "lat": str(ms_data['lat']),
                        "lng": str(ms_data['lng'])
                    },
                    "geometry": json.loads(json.dumps(mapping(geom_out)))
                })

    # Ensure all missing stations got a polygon; fallback to small buffer if not
    generated_names = {f['properties']['ps'].upper() for f in features}
    for ms in missing_stations:
        if ms['ps'].upper() not in generated_names:
            pt = Point(ms['lng'], ms['lat'])
            # Create a small hexagonal approximation (~500m radius in degrees)
            fallback = pt.buffer(0.005, resolution=6).intersection(boundary)
            if not exact_union.is_empty:
                fallback = fallback.difference(exact_union)
            if fallback.is_empty:
                fallback = pt.buffer(0.005, resolution=6).intersection(boundary)
            if not fallback.is_empty and isinstance(fallback, (Polygon, MultiPolygon)):
                features.append({
                    "type": "Feature",
                    "properties": {
                        "ps": ms['ps'],
                        "parentCommissionerate": comm_id,
                        "commissionerateName": comm_name,
                        "geometrySource": "inferred",
                        "division": "",
                        "phone": "",
                        "mandal": ms.get('mn', ''),
                        "lat": str(ms['lat']),
                        "lng": str(ms['lng'])
                    },
                    "geometry": json.loads(json.dumps(mapping(fallback)))
                })
                print(f"    (fallback buffer for {ms['ps']})")

    return {
        "type": "FeatureCollection",
        "features": features
    }


# ---------------------------------------------------------------------------
# 5. Build and write output files
# ---------------------------------------------------------------------------

# --- NTR Commissionerate ---
# NTR has all exact boundaries, no missing stations
ntr_geojson = build_comm_geojson(ntr_exact, [], ntr_boundary, "ntr", "NTR Commissionerate")
ntr_path = os.path.join(PUBLIC_DIR, 'comm-ntr-stations.json')
with open(ntr_path, 'w') as f:
    json.dump(ntr_geojson, f, separators=(',', ':'))
ntr_size = os.path.getsize(ntr_path)
print(f"\nWrote {ntr_path}")
print(f"  {len(ntr_geojson['features'])} station features, {ntr_size/1024:.0f} KB")
for feat in ntr_geojson['features']:
    p = feat['properties']
    print(f"    {p['ps']:30s}  [{p['geometrySource']}]")

# --- Vizag Commissionerate ---
vizag_geojson = build_comm_geojson(vizag_exact, vizag_missing_stations, vizag_boundary, "vizag", "Visakhapatnam Commissionerate")
vizag_path = os.path.join(PUBLIC_DIR, 'comm-vizag-stations.json')
with open(vizag_path, 'w') as f:
    json.dump(vizag_geojson, f, separators=(',', ':'))
vizag_size = os.path.getsize(vizag_path)
print(f"\nWrote {vizag_path}")
print(f"  {len(vizag_geojson['features'])} station features, {vizag_size/1024:.0f} KB")
for feat in vizag_geojson['features']:
    p = feat['properties']
    print(f"    {p['ps']:30s}  [{p['geometrySource']}]")

print("\nDone.")
