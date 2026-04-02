import mongoose from 'mongoose';

// ── Station Schema ────────────────────────────────────────────────────────────
const stationSchema = new mongoose.Schema({
  id: String, name: String, type: String,
  capacity: Number, installedCapacity: Number, peakPower: Number,
  location: String, status: String,
  gridConnectionDate: String, owner: String, contact: String,
  createdAt: { type: Date, default: Date.now },
});
export const Station = mongoose.model('Station', stationSchema);

// ── Telemetry Schema (time-series) ──────────────────────────────────────────
const telemetrySchema = new mongoose.Schema({
  stationId: String,
  ts: { type: Date, default: Date.now, index: true },
  solar: { powerKw: Number, dailyKwh: Number },
  battery: { soc: Number, temp: Number, chargeKw: Number, dischargeKw: Number },
  load: { powerKw: Number, dailyKwh: Number },
  grid: { importKw: Number, exportKw: Number },
});
telemetrySchema.index({ stationId: 1, ts: -1 });
export const Telemetry = mongoose.model('Telemetry', telemetrySchema);

// ── Alert Schema ─────────────────────────────────────────────────────────────
const alertSchema = new mongoose.Schema({
  stationId: String, level: String, message: String,
  acknowledged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
});
export const Alert = mongoose.model('Alert', alertSchema);

// ── Work Order Schema ────────────────────────────────────────────────────────
const workOrderSchema = new mongoose.Schema({
  id: String, stationId: String, stationName: String,
  issueType: String, description: String,
  priority: String, status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export const WorkOrder = mongoose.model('WorkOrder', workOrderSchema);

// ── Daily Summary Schema ─────────────────────────────────────────────────────
const dailySummarySchema = new mongoose.Schema({
  stationId: String,
  date: { type: String, index: true },
  solarKwh: Number, loadKwh: Number, gridImportKwh: Number, gridExportKwh: Number,
  revenue: Number, cost: Number,
  createdAt: { type: Date, default: Date.now },
});
export const DailySummary = mongoose.model('DailySummary', dailySummarySchema);

// ── MQTT Config Schema ────────────────────────────────────────────────────────
const mqttConfigSchema = new mongoose.Schema({
  key: { type: String, unique: true, index: true },
  brokerUrl: String, username: String, password: String,
  topics: [String], enabled: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});
export const MqttConfig = mongoose.model('MqttConfig', mqttConfigSchema);
