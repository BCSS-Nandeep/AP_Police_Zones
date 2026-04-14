const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = 5002;
const mongoURI = 'mongodb://127.0.0.1:27017';
const dbName = 'ap_police_dashboard';

app.use(cors());
app.use(express.json());

let db;

MongoClient.connect(mongoURI, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connected correctly to MongoDB server');
        db = client.db(dbName);
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Get all zones (commissionerates + districts + grp)
app.get('/api/zones', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const { type } = req.query;
        const filter = type ? { type } : {};
        const zones = await db.collection('zones').find(filter).toArray();
        res.json(zones);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

// Get a single zone by id
app.get('/api/zones/:id', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const zone = await db.collection('zones').findOne({ id: req.params.id });
        if (!zone) return res.status(404).json({ error: 'Zone not found' });
        res.json(zone);
    } catch (err) {
      res.status(500).json({ error: err.toString() });
    }
});

// Get stations for a commissionerate
app.get('/api/zones/:commId/stations', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        const stations = await db.collection('zones').find({
            type: 'station',
            parentCommissionerate: req.params.commId
        }).toArray();
        res.json(stations);
    } catch (err) {
        res.status(500).json({ error: err.toString() });
    }
});

app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
});
