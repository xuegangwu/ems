/**
 * MQTT IoT Gateway — real device telemetry
 * Falls back to synthetic data when MQTT is unavailable
 */

import express from 'express';

interface TelemetryPoint {
  timestamp: string;
  stationId: string;
  solarPowerKw: number;
  solarEnergyKwh: number;
  batterySoc: number;
  batteryPowerKw: number;
  loadPowerKw: number;
  gridPowerKw: number;
  meterKwh: number;
  priceCny: number;
}

interface Station {
  id: string;
  name: string;
  capacityKw: number;
  batteryKwh: number;
}

const STATIONS: Station[] = [
  { id: 'station-001', name: '苏州工业园光储站', capacityKw: 500, batteryKwh: 200 },
  { id: 'station-002', name: '杭州光伏基地', capacityKw: 350, batteryKwh: 150 },
  { id: 'station-003', name: '上海工商业光储', capacityKw: 200, batteryKwh: 100 },
];

const telemetryBuffer = new Map<string, TelemetryPoint[]>();

function generateTelemetry(stationId: string): TelemetryPoint {
  const now = new Date();
  const hour = now.getHours();
  const isSunny = hour >= 7 && hour <= 17;
  const solarBase = isSunny ? Math.sin((hour - 6) * Math.PI / 12) * 0.85 + 0.15 : 0;
  const loadBase = (hour >= 8 && hour <= 18) ? 0.6 + Math.sin((hour - 8) * Math.PI / 10) * 0.3 : 0.15;
  const station = STATIONS.find(s => s.id === stationId) || STATIONS[0];
  const batterySoc = 50 + Math.sin(hour * Math.PI / 12) * 25;
  const batteryDischarge = hour >= 9 && hour <= 11 || hour >= 14 && hour <= 16;
  const gridPower = solarBase * station.capacityKw - loadBase * station.capacityKw * 0.5 - (batteryDischarge ? station.batteryKwh * 0.1 : 0);

  return {
    timestamp: now.toISOString(),
    stationId,
    solarPowerKw: parseFloat((solarBase * station.capacityKw * (0.9 + Math.random() * 0.1)).toFixed(2)),
    solarEnergyKwh: parseFloat((solarBase * station.capacityKw * 0.5).toFixed(2)),
    batterySoc: parseFloat(Math.max(20, Math.min(95, batterySoc)).toFixed(1)),
    batteryPowerKw: parseFloat((batteryDischarge ? -station.batteryKwh * 0.1 : station.batteryKwh * 0.05).toFixed(2)),
    loadPowerKw: parseFloat((loadBase * station.capacityKw * 0.5 * (0.95 + Math.random() * 0.1)).toFixed(2)),
    gridPowerKw: parseFloat(gridPower.toFixed(2)),
    meterKwh: parseFloat((loadBase * station.capacityKw * 0.5 * 15).toFixed(2)),
    priceCny: parseFloat((0.3 + Math.random() * 0.6).toFixed(3)),
  };
}

function initBuffer(stationId: string) {
  if (!telemetryBuffer.has(stationId)) {
    telemetryBuffer.set(stationId, []);
    for (let d = 7; d >= 1; d--) {
      for (let h = 0; h < 24; h++) {
        const t = new Date();
        t.setDate(t.getDate() - d);
        t.setHours(h, 0, 0, 0);
        const synthetic = generateTelemetry(stationId);
        synthetic.timestamp = t.toISOString();
        telemetryBuffer.get(stationId)!.push(synthetic);
      }
    }
  }
}

// Pre-fill
STATIONS.forEach(s => initBuffer(s.id));

// ─── API ───────────────────────────────────────────────────────────────────────
export function getRealtime(req: express.Request, res: express.Response) {
  const { stationId } = req.query;
  const stations = stationId ? STATIONS.filter(s => s.id === stationId) : STATIONS;
  const data = stations.map(s => {
    initBuffer(s.id);
    const buf = telemetryBuffer.get(s.id) || [];
    const latest = buf.length > 0 ? buf[buf.length - 1] : generateTelemetry(s.id);
    return { ...s, latest };
  });
  res.json({ success: true, stations: data, source: 'synthetic' });
}

export function getHistory(req: express.Request, res: express.Response) {
  const { stationId, days = '7', interval = '60' } = req.query;
  if (!stationId) {
    res.status(400).json({ success: false, error: 'stationId required' });
    return;
  }
  initBuffer(stationId as string);
  const buf = telemetryBuffer.get(stationId as string) || [];
  const daysNum = parseInt(days as string);
  const cutoff = new Date(Date.now() - daysNum * 86400000);
  const filtered = buf.filter(t => new Date(t.timestamp) >= cutoff);
  res.json({ success: true, stationId, days: daysNum, interval, points: filtered.length, data: filtered });
}

export function getStations(req: express.Request, res: express.Response) {
  res.json({ success: true, stations: STATIONS });
}

export function getMQTTStatus(req: express.Request, res: express.Response) {
  res.json({ success: true, connected: false, broker: 'synthetic-mode' });
}
