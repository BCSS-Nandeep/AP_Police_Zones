const { MongoClient } = require('mongodb');

const mongoURI = 'mongodb://127.0.0.1:27017';
const dbName = 'ap_police_dashboard';

// Data sourced from https://citizen.appolice.gov.in/jsp/distcommcontact.do?method=retrieveUserDistCommStations
const initialData = [
  // ===== COMMISSIONERATES =====
  {
    id: "ntr",
    type: "commissionerate",
    name: "NTR Commissionerate",
    city: "Vijayawada",
    district: "NTR",
    lat: 16.5062,
    lng: 80.6480,
    officer: "Commissioner of Police",
    comm: "Shri S.V. Raja Sekhara Babu, IPS",
    rank: "Addl. Director General of Police",
    bio: "A distinguished 1996-batch IPS officer, known for implementing advanced technology in policing and maintaining communal harmony in Vijayawada.",
    color: "#0ea5e9",
    zones: 6,
    phone: "0866-2577100",
    email: "cp-vja-ap@gov.in"
  },
  {
    id: "vizag",
    type: "commissionerate",
    name: "Visakhapatnam Commissionerate",
    city: "Visakhapatnam",
    district: "Visakhapatnam",
    lat: 17.6868,
    lng: 83.2185,
    officer: "Commissioner of Police",
    comm: "Shri Shanka Brata Bagchi, IPS",
    rank: "Addl. Director General of Police",
    bio: "An accomplished IPS officer focusing on coastal security, international standard traffic management, and smart policing initiatives in Visakhapatnam.",
    color: "#ef4444",
    zones: 5,
    phone: "0891-2562222",
    email: "cp-vsp-ap@gov.in"
  },

  // ===== DISTRICTS =====
  {
    id: "srikakulam",
    type: "district",
    name: "Srikakulam District",
    city: "Srikakulam",
    district: "Srikakulam",
    lat: 18.2949,
    lng: 83.8938,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Srikakulam",
    color: "#6366f1",
    zones: 3,
    phone: "08942-225828",
    email: "sp-skl-ap@gov.in"
  },
  {
    id: "vizianagaram",
    type: "district",
    name: "Vizianagaram District",
    city: "Vizianagaram",
    district: "Vizianagaram",
    lat: 18.1067,
    lng: 83.3956,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Vizianagaram",
    color: "#8b5cf6",
    zones: 3,
    phone: "08922-226209",
    email: "sp-vzm-ap@gov.in"
  },
  {
    id: "parvathipuram_manyam",
    type: "district",
    name: "Parvathipuram Manyam District",
    city: "Parvathipuram",
    district: "Parvathipuram Manyam",
    lat: 18.7668,
    lng: 83.4260,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Parvathipuram Manyam",
    color: "#059669",
    zones: 2,
    phone: "08941-222333",
    email: "sp-pvm-ap@gov.in"
  },
  {
    id: "alluri_sitharama_raju",
    type: "district",
    name: "Alluri Sitharama Raju District",
    city: "Paderu",
    district: "Alluri Sitharama Raju",
    lat: 18.0711,
    lng: 82.6632,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, ASR",
    color: "#d97706",
    zones: 2,
    phone: "08936-250033",
    email: "sp-asr-ap@gov.in"
  },
  {
    id: "anakapalli",
    type: "district",
    name: "Anakapalli District",
    city: "Anakapalli",
    district: "Anakapalli",
    lat: 17.6910,
    lng: 83.0037,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Anakapalli",
    color: "#0284c7",
    zones: 3,
    phone: "08924-221100",
    email: "sp-akp-ap@gov.in"
  },
  {
    id: "kakinada",
    type: "district",
    name: "Kakinada District",
    city: "Kakinada",
    district: "Kakinada",
    lat: 16.9891,
    lng: 82.2475,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Kakinada",
    color: "#dc2626",
    zones: 3,
    phone: "0884-2364500",
    email: "sp-kkd-ap@gov.in"
  },
  {
    id: "east_godavari",
    type: "district",
    name: "East Godavari District",
    city: "Rajamahendravaram",
    district: "East Godavari",
    lat: 17.0005,
    lng: 81.8040,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, East Godavari",
    color: "#e11d48",
    zones: 4,
    phone: "0883-2467533",
    email: "sp-egd-ap@gov.in"
  },
  {
    id: "konaseema",
    type: "district",
    name: "Dr. B R Ambedkar Konaseema District",
    city: "Amalapuram",
    district: "Dr. B R Ambedkar Konaseema",
    lat: 16.5789,
    lng: 82.0060,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Konaseema",
    color: "#7c3aed",
    zones: 2,
    phone: "08856-232250",
    email: "sp-knm-ap@gov.in"
  },
  {
    id: "polavaram",
    type: "district",
    name: "Polavaram District",
    city: "Polavaram",
    district: "Polavaram",
    lat: 17.2471,
    lng: 81.6432,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Polavaram",
    color: "#0891b2",
    zones: 2,
    phone: "08812-252233",
    email: "sp-plv-ap@gov.in"
  },
  {
    id: "west_godavari",
    type: "district",
    name: "West Godavari District",
    city: "Bhimavaram",
    district: "West Godavari",
    lat: 16.5449,
    lng: 81.5212,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, West Godavari",
    color: "#ca8a04",
    zones: 3,
    phone: "08816-223377",
    email: "sp-wgd-ap@gov.in"
  },
  {
    id: "eluru",
    type: "district",
    name: "Eluru District",
    city: "Eluru",
    district: "Eluru",
    lat: 16.7107,
    lng: 81.0952,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Eluru",
    color: "#15803d",
    zones: 3,
    phone: "08812-227555",
    email: "sp-elr-ap@gov.in"
  },
  {
    id: "krishna",
    type: "district",
    name: "Krishna District",
    city: "Machilipatnam",
    district: "Krishna",
    lat: 16.1875,
    lng: 81.1389,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Krishna",
    color: "#2563eb",
    zones: 3,
    phone: "08672-228100",
    email: "sp-krs-ap@gov.in"
  },
  {
    id: "guntur",
    type: "district",
    name: "Guntur District",
    city: "Guntur",
    district: "Guntur",
    lat: 16.3067,
    lng: 80.4365,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Guntur",
    color: "#8b5cf6",
    zones: 4,
    phone: "0863-2255800",
    email: "sp-gnt-ap@gov.in"
  },
  {
    id: "palnadu",
    type: "district",
    name: "Palnadu District",
    city: "Narasaraopet",
    district: "Palnadu",
    lat: 16.2347,
    lng: 79.9090,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Palnadu",
    color: "#b45309",
    zones: 3,
    phone: "08647-222333",
    email: "sp-pnd-ap@gov.in"
  },
  {
    id: "bapatla",
    type: "district",
    name: "Bapatla District",
    city: "Bapatla",
    district: "Bapatla",
    lat: 15.9050,
    lng: 80.4675,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Bapatla",
    color: "#0d9488",
    zones: 2,
    phone: "08643-224400",
    email: "sp-bpl-ap@gov.in"
  },
  {
    id: "prakasam",
    type: "district",
    name: "Prakasam District",
    city: "Ongole",
    district: "Prakasam",
    lat: 15.5057,
    lng: 80.0499,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Prakasam",
    color: "#c026d3",
    zones: 4,
    phone: "08592-232255",
    email: "sp-pkm-ap@gov.in"
  },
  {
    id: "markapuram",
    type: "district",
    name: "Markapuram District",
    city: "Markapuram",
    district: "Markapuram",
    lat: 15.7355,
    lng: 79.2696,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Markapuram",
    color: "#9333ea",
    zones: 2,
    phone: "08596-252233",
    email: "sp-mkp-ap@gov.in"
  },
  {
    id: "nellore",
    type: "district",
    name: "Sri Potti Sriramulu Nellore District",
    city: "Nellore",
    district: "Sri Potti Sriramulu Nellore",
    lat: 14.4426,
    lng: 79.9865,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Nellore",
    color: "#ea580c",
    zones: 4,
    phone: "0861-2314500",
    email: "sp-nlr-ap@gov.in"
  },
  {
    id: "kurnool",
    type: "district",
    name: "Kurnool District",
    city: "Kurnool",
    district: "Kurnool",
    lat: 15.8281,
    lng: 78.0373,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Kurnool",
    color: "#be123c",
    zones: 4,
    phone: "08518-222210",
    email: "sp-knl-ap@gov.in"
  },
  {
    id: "nandyal",
    type: "district",
    name: "Nandyal District",
    city: "Nandyal",
    district: "Nandyal",
    lat: 15.4776,
    lng: 78.4836,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Nandyal",
    color: "#4f46e5",
    zones: 3,
    phone: "08514-222200",
    email: "sp-ndl-ap@gov.in"
  },
  {
    id: "ananthapuram",
    type: "district",
    name: "Ananthapuram District",
    city: "Ananthapuram",
    district: "Ananthapuram",
    lat: 14.6819,
    lng: 77.6006,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Ananthapuram",
    color: "#16a34a",
    zones: 4,
    phone: "08554-274400",
    email: "sp-atp-ap@gov.in"
  },
  {
    id: "sri_sathya_sai",
    type: "district",
    name: "Sri Sathya Sai District",
    city: "Puttaparthi",
    district: "Sri Sathya Sai",
    lat: 14.1700,
    lng: 77.8120,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Sri Sathya Sai",
    color: "#a21caf",
    zones: 2,
    phone: "08555-287333",
    email: "sp-sss-ap@gov.in"
  },
  {
    id: "ysr_kadapa",
    type: "district",
    name: "YSR Kadapa District",
    city: "Kadapa",
    district: "YSR Kadapa",
    lat: 14.4674,
    lng: 78.8241,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, YSR Kadapa",
    color: "#0369a1",
    zones: 3,
    phone: "08562-244600",
    email: "sp-cdp-ap@gov.in"
  },
  {
    id: "annamayya",
    type: "district",
    name: "Annamayya District",
    city: "Rayachoti",
    district: "Annamayya",
    lat: 14.0562,
    lng: 78.7505,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Annamayya",
    color: "#d946ef",
    zones: 2,
    phone: "08564-255500",
    email: "sp-amy-ap@gov.in"
  },
  {
    id: "chittoor",
    type: "district",
    name: "Chittoor District",
    city: "Chittoor",
    district: "Chittoor",
    lat: 13.2172,
    lng: 79.1003,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Chittoor",
    color: "#14b8a6",
    zones: 4,
    phone: "08572-231700",
    email: "sp-ctr-ap@gov.in"
  },
  {
    id: "tirupathi",
    type: "district",
    name: "Tirupathi District",
    city: "Tirupati",
    district: "Tirupathi",
    lat: 13.6288,
    lng: 79.4192,
    officer: "Superintendent of Police",
    comm: "Superintendent of Police, Tirupathi",
    color: "#f59e0b",
    zones: 3,
    phone: "0877-2233500",
    email: "sp-tpt-ap@gov.in"
  },

  // ===== GRP (Government Railway Police) =====
  {
    id: "grp_vijayawada",
    type: "grp",
    name: "GRP Vijayawada",
    city: "Vijayawada",
    district: "GRP Vijayawada",
    lat: 16.5175,
    lng: 80.6300,
    officer: "Superintendent of Police (Railways)",
    comm: "SP Railways, Vijayawada",
    color: "#78716c",
    zones: 2,
    phone: "0866-2577222",
    email: "sp-grp-vja-ap@gov.in"
  },
  {
    id: "grp_guntakal",
    type: "grp",
    name: "GRP Guntakal",
    city: "Guntakal",
    district: "GRP Guntakal",
    lat: 15.1710,
    lng: 77.3790,
    officer: "Superintendent of Police (Railways)",
    comm: "SP Railways, Guntakal",
    color: "#a8a29e",
    zones: 2,
    phone: "08552-222333",
    email: "sp-grp-gtl-ap@gov.in"
  }
];

async function seedDB() {
    const client = new MongoClient(mongoURI, { useUnifiedTopology: true });
    try {
        await client.connect();
        console.log("Connected correctly to MongoDB server");
        const db = client.db(dbName);
        const col = db.collection('zones');

        // Remove old data
        await col.deleteMany({});

        // Insert new data
        const p = await col.insertMany(initialData);
        console.log(`Successfully inserted ${p.insertedCount} units!`);
        console.log(`  - Commissionerates: ${initialData.filter(d => d.type === 'commissionerate').length}`);
        console.log(`  - Districts: ${initialData.filter(d => d.type === 'district').length}`);
        console.log(`  - GRP: ${initialData.filter(d => d.type === 'grp').length}`);

    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

seedDB();
