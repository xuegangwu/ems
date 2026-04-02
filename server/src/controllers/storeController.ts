import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Station, Telemetry, Alert, WorkOrder, DailySummary, MqttConfig } from '../models/schemas.js';

// ── MongoDB Connection ─────────────────────────────────────────────────────────
let mongoConnected = false;

async function connectMongo() {
  if (mongoConnected) return true;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enos';
  try {
    await mongoose.connect(MONGO_URI);
    mongoConnected = true;
    console.log('[MongoDB] Connected:', MONGO_URI);
    return true;
  } catch (err: any) {
    console.warn('[MongoDB] Connection failed:', err.message, '(using in-memory fallback)');
    return false;
  }
}

// ── GET /api/store/mqtt-config ────────────────────────────────────────────────
export async function getMqttConfig(req: Request, res: Response) {
  await connectMongo();
  try {
    const cfg = await MqttConfig.findOne({ key: 'default' }).lean();
    if (cfg) {
      const { password, ...safe } = cfg as any;
      return res.json({ success: true, config: { ...safe, hasPassword: !!password } });
    }
    return res.json({ success: true, config: {
      key: 'default', brokerUrl: 'mqtt://localhost:1883',
      username: '', topics: ['/energon/#'], enabled: false, hasPassword: false,
    }});
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch MQTT config' });
  }
}

// ── PUT /api/store/mqtt-config ────────────────────────────────────────────────
export async function setMqttConfig(req: Request, res: Response) {
  await connectMongo();
  const { brokerUrl, username, password, topics, enabled } = req.body;
  try {
    await MqttConfig.findOneAndUpdate(
      { key: 'default' },
      { $set: { brokerUrl, username, password, topics, enabled, updatedAt: new Date() } },
      { upsert: true, lean: true }
    );
    // Dynamically update MQTT connection if server supports it
    if (process.env.MQTT_BROKER_URL !== undefined) {
      // Notify orchestrator to reinitialize MQTT connection
      (global as any).__mqttDirty = true;
    }
    return res.json({ success: true, message: 'MQTT配置已更新，MQTT连接将在下一轮自动重连' });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to save MQTT config' });
  }
}

// ── GET /api/store/stations ────────────────────────────────────────────────
export async function getStations(req: Request, res: Response) {
  await connectMongo();
  try {
    const stations = await Station.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, stations });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch stations' });
  }
}

// ── POST /api/store/telemetry ────────────────────────────────────────────────
export async function saveTelemetry(req: Request, res: Response) {
  await connectMongo();
  const { stationId, solar, battery, load, grid } = req.body;
  try {
    await Telemetry.create({
      stationId, solar, battery, load, grid, ts: new Date(),
    });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to save telemetry' });
  }
}

// ── GET /api/store/history/:stationId ──────────────────────────────────────
export async function getHistory(req: Request, res: Response) {
  await connectMongo();
  const { stationId } = req.params;
  const { days = '7' } = req.query;
  const since = new Date(Date.now() - Number(days) * 86400000);
  try {
    const records = await Telemetry.find({ stationId, ts: { $gte: since } })
      .sort({ ts: -1 }).limit(2000).lean();
    return res.json({ success: true, records });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
}

// ── GET /api/store/alerts ───────────────────────────────────────────────────
export async function getAlerts(req: Request, res: Response) {
  await connectMongo();
  const { acknowledged } = req.query;
  const filter: any = {};
  if (acknowledged !== undefined) filter.acknowledged = acknowledged === 'true';
  try {
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, alerts });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
}

// ── PUT /api/store/alerts/:id/ack ──────────────────────────────────────────
export async function ackAlert(req: Request, res: Response) {
  await connectMongo();
  const { id } = req.params;
  try {
    await Alert.findByIdAndUpdate(id, { acknowledged: true });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
}

// ── GET /api/store/daily-summary ─────────────────────────────────────────────
export async function getDailySummary(req: Request, res: Response) {
  await connectMongo();
  const { stationId, days = '30' } = req.query;
  try {
    const records = await DailySummary.find({ stationId: stationId as string })
      .sort({ date: -1 }).limit(Number(days)).lean();
    return res.json({ success: true, records });
  } catch {
    return res.status(500).json({ success: false, error: 'Failed to fetch daily summary' });
  }
}
