const fs = require('fs');
const path = require('path');

const root = process.cwd();
const publicDir = path.join(root, 'public');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function normalizeKey(name) {
  return String(name || '')
    .replace(/\*/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CANONICAL_BY_KEY = new Map([
  ['ALLURI SITHARAMA RAJU', 'Alluri Sitharama Raju'],
  ['ALLURI SEETHARAMARAJU', 'Alluri Sitharama Raju'],
  ['ANAKAPALLI', 'Anakapalli'],
  ['ANANTAPUR', 'Ananthapuram'],
  ['ANANTHAPURAM', 'Ananthapuram'],
  ['ANANTHAPURAMU', 'Ananthapuram'],
  ['ANANTAPURAM', 'Ananthapuram'],
  ['ANNAMAYYA', 'Annamayya'],
  ['ANNAMAYA', 'Annamayya'],
  ['BAPATLA', 'Bapatla'],
  ['CHITTOOR', 'Chittoor'],
  ['DR B R AMBEDKAR KONASEEMA', 'Dr. B.R. Ambedkar Konaseema'],
  ['KONASEEMA', 'Dr. B.R. Ambedkar Konaseema'],
  ['EAST GODAVARI', 'East Godavari'],
  ['ELURU', 'Eluru'],
  ['GUNTUR', 'Guntur'],
  ['KAKINADA', 'Kakinada'],
  ['KRISHNA', 'Krishna'],
  ['KURNOOL', 'Kurnool'],
  ['NANDYAL', 'Nandyal'],
  ['NTR', 'NTR'],
  ['NANDAMURI TARAKA RAMARAO', 'NTR'],
  ['PALNADU', 'Palnadu'],
  ['PARVATHIPURAM MANYAM', 'Parvathipuram Manyam'],
  ['PRAKASAM', 'Prakasam'],
  ['SRI POTTI SRIRAMULU NELL', 'Sri Potti Sriramulu Nellore'],
  ['SRI POTTI SRIRAMULU NELLORE', 'Sri Potti Sriramulu Nellore'],
  ['POTTI SRIRAMULU NELLORE', 'Sri Potti Sriramulu Nellore'],
  ['SRI SATHYA SAI', 'Sri Sathya Sai'],
  ['SRI SATHYA SAII', 'Sri Sathya Sai'],
  ['SRIKAKULAM', 'Srikakulam'],
  ['TIRUPATHI', 'Tirupati'],
  ['TIRUPATI', 'Tirupati'],
  ['VISAKHAPATNAM', 'Visakhapatnam'],
  ['VIZIANAGARAM', 'Vizianagaram'],
  ['WEST GODAVARI', 'West Godavari'],
  ['YSR', 'Y.S.R. Kadapa'],
  ['Y S R', 'Y.S.R. Kadapa'],
  ['YSR KADAPA', 'Y.S.R. Kadapa'],
  ['Y S R KADAPA', 'Y.S.R. Kadapa']
]);

const DISTRICT_ID_BY_NAME = new Map([
  ['Alluri Sitharama Raju', 'alluri'],
  ['Anakapalli', 'anakapalli'],
  ['Ananthapuram', 'ananthapuram'],
  ['Annamayya', 'annamayya'],
  ['Bapatla', 'bapatla'],
  ['Chittoor', 'chittoor'],
  ['Dr. B.R. Ambedkar Konaseema', 'konaseema'],
  ['East Godavari', 'eastgodavari'],
  ['Eluru', 'eluru'],
  ['Guntur', 'guntur'],
  ['Kakinada', 'kakinada'],
  ['Krishna', 'krishna'],
  ['Kurnool', 'kurnool'],
  ['Nandyal', 'nandyal'],
  ['NTR', 'ntr'],
  ['Palnadu', 'palnadu'],
  ['Parvathipuram Manyam', 'parvathipurammanyam'],
  ['Prakasam', 'prakasam'],
  ['Sri Potti Sriramulu Nellore', 'spsnellore'],
  ['Sri Sathya Sai', 'srisathyasai'],
  ['Srikakulam', 'srikakulam'],
  ['Tirupati', 'tirupati'],
  ['Visakhapatnam', 'visakhapatnam'],
  ['Vizianagaram', 'vizianagaram'],
  ['West Godavari', 'westgodavari'],
  ['Y.S.R. Kadapa', 'ysrkadapa']
]);

const HQ_BY_NAME = new Map([
  ['Alluri Sitharama Raju', 'Paderu'],
  ['Anakapalli', 'Anakapalli'],
  ['Ananthapuram', 'Ananthapuram'],
  ['Annamayya', 'Rayachoti'],
  ['Bapatla', 'Bapatla'],
  ['Chittoor', 'Chittoor'],
  ['Dr. B.R. Ambedkar Konaseema', 'Amalapuram'],
  ['East Godavari', 'Rajamahendravaram'],
  ['Eluru', 'Eluru'],
  ['Guntur', 'Guntur'],
  ['Kakinada', 'Kakinada'],
  ['Krishna', 'Machilipatnam'],
  ['Kurnool', 'Kurnool'],
  ['Nandyal', 'Nandyal'],
  ['NTR', 'Vijayawada'],
  ['Palnadu', 'Narasaraopet'],
  ['Parvathipuram Manyam', 'Parvathipuram'],
  ['Prakasam', 'Ongole'],
  ['Sri Potti Sriramulu Nellore', 'Nellore'],
  ['Sri Sathya Sai', 'Puttaparthi'],
  ['Srikakulam', 'Srikakulam'],
  ['Tirupati', 'Tirupati'],
  ['Visakhapatnam', 'Visakhapatnam'],
  ['Vizianagaram', 'Vizianagaram'],
  ['West Godavari', 'Bhimavaram'],
  ['Y.S.R. Kadapa', 'Kadapa']
]);

function canonicalDistrictName(name) {
  const key = normalizeKey(name);
  if (CANONICAL_BY_KEY.has(key)) return CANONICAL_BY_KEY.get(key);
  // light fallback title-case
  return String(name || '')
    .replace(/\*/g, '')
    .toLowerCase()
    .replace(/\b\w/g, ch => ch.toUpperCase())
    .trim();
}

function districtUpper(name) {
  return canonicalDistrictName(name)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(name) {
  return canonicalDistrictName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function collectCoords(geometry, out) {
  if (!geometry) return;
  const c = geometry.coordinates;
  if (!c) return;
  const stack = [c];
  while (stack.length) {
    const cur = stack.pop();
    if (!Array.isArray(cur)) continue;
    if (typeof cur[0] === 'number' && typeof cur[1] === 'number') {
      out.push(cur);
      continue;
    }
    for (const item of cur) stack.push(item);
  }
}

function geometryCenter(geometry) {
  const pts = [];
  collectCoords(geometry, pts);
  if (!pts.length) return [79.74, 15.91];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersects = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, polygonCoords) {
  if (!polygonCoords || !polygonCoords.length) return false;
  if (!pointInRing(point, polygonCoords[0])) return false;
  for (let i = 1; i < polygonCoords.length; i++) {
    if (pointInRing(point, polygonCoords[i])) return false;
  }
  return true;
}

function pointInGeometry(point, geometry) {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates);
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some(poly => pointInPolygon(point, poly));
  }
  return false;
}

function parseFloatSafe(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function cleanHtmlText(s) {
  return String(s || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseOfficerDirectory(decodedHtml) {
  const officers = [];
  const carry = {
    landline: { value: '', remain: 0 },
    mobile: { value: '', remain: 0 },
    email: { value: '', remain: 0 }
  };

  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRe.exec(decodedHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const tdRe = /<td\b([^>]*)>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let tdMatch;
    while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
      cells.push({ attrs: tdMatch[1] || '', text: cleanHtmlText(tdMatch[2] || '') });
    }
    if (!cells.length) continue;

    const slNo = parseInt(cells[0].text, 10);
    if (!Number.isFinite(slNo)) continue;

    const designation = cells[1]?.text || '';
    if (!designation || /sl\.?\s*no/i.test(designation)) continue;

    let landline = carry.landline.remain > 0 ? carry.landline.value : '';
    if (carry.landline.remain > 0) carry.landline.remain -= 1;

    let mobile = carry.mobile.remain > 0 ? carry.mobile.value : '';
    if (carry.mobile.remain > 0) carry.mobile.remain -= 1;

    let email = carry.email.remain > 0 ? carry.email.value : '';
    if (carry.email.remain > 0) carry.email.remain -= 1;

    const maybeLandline = cells[2]?.text;
    const maybeMobile = cells[3]?.text;
    const maybeEmail = cells[4]?.text;

    if (maybeLandline !== undefined) {
      landline = maybeLandline;
      const rs = parseInt((cells[2].attrs.match(/rowspan\s*=\s*"(\d+)"/i) || [])[1] || '0', 10);
      if (rs > 1) carry.landline = { value: landline, remain: rs - 1 };
    }
    if (maybeMobile !== undefined) {
      mobile = maybeMobile;
      const rs = parseInt((cells[3].attrs.match(/rowspan\s*=\s*"(\d+)"/i) || [])[1] || '0', 10);
      if (rs > 1) carry.mobile = { value: mobile, remain: rs - 1 };
    }
    if (maybeEmail !== undefined) {
      email = maybeEmail;
      const rs = parseInt((cells[4].attrs.match(/rowspan\s*=\s*"(\d+)"/i) || [])[1] || '0', 10);
      if (rs > 1) carry.email = { value: email, remain: rs - 1 };
    }

    officers.push({
      slNo,
      designation,
      landline: landline || '',
      mobile: mobile || '',
      email: email || ''
    });
  }

  return officers;
}

function hashString(input) {
  let hash = 2166136261;
  const str = String(input || '');
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let s = seed >>> 0;
  return function rand() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  if (max <= min) return min;
  return Math.floor(rng() * (max - min + 1)) + min;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toFiniteNumber(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

function hasMeaningfulStats(stats) {
  if (!stats || typeof stats !== 'object') return false;
  return ['activeCases', 'personnelOnDuty', 'patrolUnits', 'firs', 'solved']
    .some(k => Number.isFinite(stats[k]) && stats[k] > 0);
}

function hasMeaningfulCaseload(caseload) {
  if (!caseload || typeof caseload !== 'object') return false;
  return ['total', 'active', 'solved', 'highPriority']
    .some(k => Number.isFinite(caseload[k]) && caseload[k] > 0);
}

function hasNamedTasks(tasks) {
  return Array.isArray(tasks) && tasks.some(t => t && String(t.title || '').trim());
}

function needsFallbackOfficerName(name) {
  const v = String(name || '').trim();
  if (!v) return true;
  return /^SP[, ]/i.test(v) || /^Superintendent of Police/i.test(v);
}

function badgeFromName(name, fallback = 'SP') {
  const initials = String(name || '')
    .replace(/,.*$/, '')
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .map(p => p[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return initials || fallback;
}

function buildDummyDistrictProfile({ id, canonical, hq, stationCount }) {
  const rng = createRng(hashString(`${id}|${canonical}|${hq}|${stationCount}`));

  const baseLoad = Math.max(120, stationCount * randInt(rng, 7, 12));
  const active = randInt(rng, Math.round(baseLoad * 0.34), Math.round(baseLoad * 0.56));
  const solved = randInt(rng, Math.round(baseLoad * 0.38), Math.round(baseLoad * 0.64));
  const backlog = randInt(rng, 10, 42);
  const total = Math.max(active + solved + backlog, active + solved + 1);
  const highPriority = randInt(
    rng,
    Math.max(7, Math.round(active * 0.08)),
    Math.max(14, Math.round(active * 0.17))
  );
  const solvingRate = clamp(Math.round((solved / Math.max(total, 1)) * 100), 58, 91);

  const personnelOnDuty = randInt(
    rng,
    Math.max(850, stationCount * 28),
    Math.max(1800, stationCount * 60)
  );
  const patrolUnits = randInt(
    rng,
    Math.max(14, Math.round(stationCount * 0.5)),
    Math.max(28, Math.round(stationCount * 1.2))
  );
  const firs = randInt(rng, Math.max(26, Math.round(total * 0.14)), Math.max(68, Math.round(total * 0.24)));

  const firstNames = ['A.', 'B.', 'C.', 'D.', 'K.', 'L.', 'M.', 'N.', 'P.', 'R.', 'S.', 'T.', 'V.'];
  const middleNames = ['Srinivas', 'Ramesh', 'Harika', 'Anjali', 'Venkata', 'Raghav', 'Sai', 'Bhanu', 'Vivek'];
  const lastNames = ['Rao', 'Reddy', 'Naidu', 'Varma', 'Kumar', 'Prasad', 'Chowdary', 'Devi', 'Krishna'];
  const operations = ['Corridor Patrol', 'Cyber Fraud Sweep', 'Narcotics Control', 'Night Beat Reinforcement', 'Highway Safety Grid'];
  const hotspots = ['Town Core', 'Rural Belt', 'Transit Zone', 'Market Cluster', 'Border Check'];
  const priorities = ['critical', 'high', 'medium'];

  const spName = `${firstNames[randInt(rng, 0, firstNames.length - 1)]} ${middleNames[randInt(rng, 0, middleNames.length - 1)]} ${lastNames[randInt(rng, 0, lastNames.length - 1)]}, IPS`;
  const slug = slugify(canonical);
  const phone = `0${randInt(rng, 8500, 8999)}-${randInt(rng, 220000, 299999)}`;
  const email = `sp-${slug}@appolice.gov.in`;
  const status = (active >= Math.round(total * 0.48) || highPriority >= 18) ? 'high-caseload' : 'operational';

  const priorityTasks = [];
  const taskCount = randInt(rng, 1, 3);
  for (let i = 0; i < taskCount; i++) {
    const priority = priorities[Math.min(i, priorities.length - 1)];
    const op = operations[randInt(rng, 0, operations.length - 1)];
    const area = hotspots[randInt(rng, 0, hotspots.length - 1)];
    priorityTasks.push({
      title: `${canonical} ${op}`,
      priority,
      progress: randInt(rng, 38, 92),
      target: `${area} monitoring`,
      status: 'active',
      daysActive: randInt(rng, 3, 24)
    });
  }

  return {
    phone,
    email,
    status,
    sp: {
      name: spName,
      rank: 'Superintendent of Police',
      badge: badgeFromName(spName, 'SP')
    },
    stats: {
      activeCases: active,
      personnelOnDuty,
      patrolUnits,
      firs,
      solved
    },
    caseload: {
      total,
      active,
      solved,
      highPriority,
      solvingRate
    },
    priorityTasks
  };
}

function main() {
  const apDistrictsPath = path.join(publicDir, 'ap-districts.json');
  const apStationsPath = path.join(publicDir, 'ap-police-stations.json');
  const dataPath = path.join(publicDir, 'data.json');
  const opPath = path.join(publicDir, 'ap-operational-data.json');
  const officerDecodedPath = path.join(root, 'tmp_officerDetails_decoded.html');
  const officerOutPath = path.join(publicDir, 'ap-officers-directory.json');
  const distOfficerPath = path.join(root, 'dist', 'ap-officers-directory.json');

  const apDistricts = readJson(apDistrictsPath);
  const apStations = readJson(apStationsPath);
  const data = readJson(dataPath);
  const op = readJson(opPath);

  const districtGeoms = (apDistricts.features || []).map((f, idx) => {
    const rawName = f?.properties?.NAME_1 || f?.properties?.district || f?.properties?.name || `District-${idx + 1}`;
    const canonical = canonicalDistrictName(rawName);
    const upper = districtUpper(canonical);
    const center = geometryCenter(f.geometry);
    return {
      canonical,
      upper,
      geometry: f.geometry,
      center
    };
  });

  // Re-map station district labels from old 13-district tagging to new 26-district boundaries.
  let remappedCount = 0;
  const stationCounts = new Map();
  for (const feature of apStations.features || []) {
    const p = feature.properties || {};
    let lng = parseFloatSafe(p.ln ?? p.lng);
    let lat = parseFloatSafe(p.lt ?? p.lat);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      const c = geometryCenter(feature.geometry);
      lng = c[0];
      lat = c[1];
    }

    let match = null;
    for (const d of districtGeoms) {
      if (pointInGeometry([lng, lat], d.geometry)) {
        match = d;
        break;
      }
    }

    if (match) {
      if (p.dn !== match.upper) remappedCount += 1;
      p.dn = match.upper;
      p.district = match.canonical;
    }

    const key = (p.dn || '').toUpperCase().trim();
    if (key) stationCounts.set(key, (stationCounts.get(key) || 0) + 1);
  }

  writeJson(apStationsPath, apStations);

  const oldDistrictById = new Map((data.districts || []).map(d => [d.id, d]));
  const oldDistrictByKey = new Map((data.districts || []).map(d => [normalizeKey(d.name || d.city || d.id), d]));
  const oldOpById = new Map((op.districts || []).map(d => [d.id, d]));
  const dummyById = new Map();

  const generatedDistricts = districtGeoms.map((d, idx) => {
    const id = DISTRICT_ID_BY_NAME.get(d.canonical) || slugify(d.canonical);
    const old = oldDistrictById.get(id)
      || oldDistrictByKey.get(normalizeKey(d.canonical))
      || oldDistrictByKey.get(normalizeKey(`${d.canonical} District Police`))
      || null;

    const hq = HQ_BY_NAME.get(d.canonical) || d.canonical;
    const stationCount = stationCounts.get(d.upper) || 0;
    const dummy = buildDummyDistrictProfile({ id, canonical: d.canonical, hq, stationCount });
    dummyById.set(id, dummy);

    const baseStats = hasMeaningfulStats(old?.stats) ? old.stats : dummy.stats;
    const baseSpName = needsFallbackOfficerName(old?.sp?.name) ? dummy.sp.name : old.sp.name;

    return {
      id,
      name: `${d.canonical} District Police`,
      city: hq,
      hq,
      colorHue: Number.isFinite(old?.colorHue) ? old.colorHue : ((idx * 41) % 360),
      phone: old?.phone || dummy.phone,
      email: old?.email || dummy.email,
      lat: Number(d.center[1].toFixed(4)),
      lng: Number(d.center[0].toFixed(4)),
      stationCount,
      sp: {
        name: baseSpName,
        rank: old?.sp?.rank || 'Superintendent of Police',
        badge: old?.sp?.badge || dummy.sp.badge
      },
      stats: {
        activeCases: toFiniteNumber(baseStats.activeCases, dummy.stats.activeCases),
        personnelOnDuty: toFiniteNumber(baseStats.personnelOnDuty, dummy.stats.personnelOnDuty),
        patrolUnits: toFiniteNumber(baseStats.patrolUnits, dummy.stats.patrolUnits),
        firs: toFiniteNumber(baseStats.firs, dummy.stats.firs),
        solved: toFiniteNumber(baseStats.solved, dummy.stats.solved)
      },
      priorityTasks: hasNamedTasks(old?.priorityTasks) ? old.priorityTasks : dummy.priorityTasks
    };
  });

  // Keep commissionerate cards, but sync station counts from source files when available.
  const commCountById = new Map();
  const commNtr = readJson(path.join(publicDir, 'comm-ntr-stations.json'));
  const commVizag = readJson(path.join(publicDir, 'comm-vizag-stations.json'));
  commCountById.set('ntr', (commNtr.features || []).length);
  commCountById.set('vizag', (commVizag.features || []).length);

  for (const c of (data.commissionerates || [])) {
    if (commCountById.has(c.id)) c.stationCount = commCountById.get(c.id);
  }

  data.districts = generatedDistricts;
  data.totalStats = data.totalStats || {};
  data.totalStats.policeDistricts = generatedDistricts.length;
  data.totalStats.policeStations = (apStations.features || []).length;

  writeJson(dataPath, data);

  op.districts = generatedDistricts.map(d => {
    const oldOp = oldOpById.get(d.id);
    const dummy = dummyById.get(d.id) || buildDummyDistrictProfile({
      id: d.id,
      canonical: d.name.replace(/ District Police$/i, ''),
      hq: d.city,
      stationCount: d.stationCount || 0
    });

    const sourceCaseload = hasMeaningfulCaseload(oldOp?.caseload) ? oldOp.caseload : dummy.caseload;
    const caseload = {
      total: toFiniteNumber(sourceCaseload.total, dummy.caseload.total),
      active: toFiniteNumber(sourceCaseload.active, dummy.caseload.active),
      solved: toFiniteNumber(sourceCaseload.solved, dummy.caseload.solved),
      highPriority: toFiniteNumber(sourceCaseload.highPriority, dummy.caseload.highPriority),
      solvingRate: toFiniteNumber(sourceCaseload.solvingRate, dummy.caseload.solvingRate)
    };

    if (caseload.total < caseload.active + caseload.solved) {
      caseload.total = caseload.active + caseload.solved;
    }
    if (!Number.isFinite(caseload.solvingRate) || caseload.solvingRate <= 0) {
      caseload.solvingRate = clamp(
        Math.round((caseload.solved / Math.max(caseload.total, 1)) * 100),
        45,
        98
      );
    }

    const baseSpName = needsFallbackOfficerName(oldOp?.sp?.name)
      ? (needsFallbackOfficerName(d.sp?.name) ? dummy.sp.name : d.sp.name)
      : oldOp.sp.name;
    const hasOldActiveCases = hasMeaningfulCaseload(oldOp?.caseload)
      && Number.isFinite(oldOp?.sp?.activeCases)
      && oldOp.sp.activeCases > 0;

    return {
      id: d.id,
      name: d.name,
      city: d.city,
      status: oldOp?.status || dummy.status,
      caseload,
      sp: {
        name: baseSpName,
        rank: oldOp?.sp?.rank || d.sp.rank,
        badge: oldOp?.sp?.badge || d.sp.badge || dummy.sp.badge,
        activeCases: hasOldActiveCases ? oldOp.sp.activeCases : caseload.active
      },
      priorityTasks: hasNamedTasks(oldOp?.priorityTasks) ? oldOp.priorityTasks : dummy.priorityTasks
    };
  });

  writeJson(opPath, op);

  let officers = [];
  if (fs.existsSync(officerDecodedPath)) {
    const decodedHtml = fs.readFileSync(officerDecodedPath, 'utf8');
    officers = parseOfficerDirectory(decodedHtml);
  } else if (fs.existsSync(officerOutPath)) {
    const existing = readJson(officerOutPath);
    officers = Array.isArray(existing?.officers) ? existing.officers : [];
    if (!officers.length && fs.existsSync(distOfficerPath)) {
      const fallback = readJson(distOfficerPath);
      officers = Array.isArray(fallback?.officers) ? fallback.officers : [];
    }
  } else if (fs.existsSync(distOfficerPath)) {
    const fallback = readJson(distOfficerPath);
    officers = Array.isArray(fallback?.officers) ? fallback.officers : [];
  }

  const officerDirectory = {
    source: 'AP Police Telephone Directory',
    sourceUrl: 'https://citizen.appolice.gov.in/jsp/chiefOfficecontact.do?method=retrieveOfficerDetailsList',
    updatedAt: new Date().toISOString(),
    officers
  };
  writeJson(officerOutPath, officerDirectory);

  console.log(`Updated stations with remapped district labels: ${remappedCount}`);
  console.log(`Generated district entries: ${generatedDistricts.length}`);
  console.log(`Officer directory records: ${officers.length}`);
}

main();
