import { Router } from 'express';
import { getStationLatestData, buildRealtimeFromInflux } from '../services/influxdb.js';

const router = Router();

// GET /api/realtime — all stations latest data from InfluxDB
router.get('/', async (req, res) => {
  try {
    const data = await getStationLatestData();
    const stations = data.map(buildRealtimeFromInflux);
    res.json({ success: true, data: stations, source: 'influxdb', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[Realtime] error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch realtime data' });
  }
});

export { router as realtimeRoutes };
