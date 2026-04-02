/**
 * Historical Data API
 * Stores and retrieves 30-day historical records for:
 * - Energy production/consumption
 * - Battery charge/discharge cycles
 * - Grid import/export
 * - Financial summaries (daily/monthly revenue)
 * - Work orders history
 * - Alerts history
 */

import express from 'express';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DailySummary {
  date: string; // YYYY-MM-DD
  stationId: string;
  solarKwh: number;
  loadKwh: number;
  gridImportKwh: number;
  gridExportKwh: number;
  batteryChargeKwh: number;
  batteryDischargeKwh: number;
  peakPowerKw: number;
  avgSoc: number;
  revenue: number;    // CNY
  cost: number;       // CNY
  savings: number;    // CNY
  selfSufficiency: number; // %
}

interface AlertRecord {
  id: string;
  timestamp: string;
  stationId: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  code: string;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

interface WorkOrderRecord {
  id: string;
  timestamp: string;
  stationId: string;
  type: 'inspect' | 'repair' | 'maintenance' | 'alarm';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string;
  completedAt?: string;
  rating?: number;
}

// ─── In-memory 30-day rolling store ───────────────────────────────────────────
function generateDailySummaries(stationId: string): DailySummary[] {
  const summaries: DailySummary[] = [];
  const station = STATIONS.find(s => s.id === stationId) || { capacityKw: 200, batteryKwh: 100 };
  const baseSolar = station.capacityKw * 4.5; // kWh/day average
  const baseLoad = station.capacityKw * 3.0;

  for (let d = 30; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const seasonFactor = 0.7 + Math.sin((date.getMonth() - 3) * Math.PI / 6) * 0.3;
    const solarKwh = baseSolar * seasonFactor * (0.8 + Math.random() * 0.4);
    const loadKwh = baseLoad * (isWeekend ? 0.6 : 1.0) * (0.9 + Math.random() * 0.2);
    const selfUse = Math.min(solarKwh, loadKwh);
    const exportKwh = Math.max(0, solarKwh - loadKwh);
    const importKwh = Math.max(0, loadKwh - solarKwh);
    const peakPrice = 0.9 + Math.random() * 0.3;
    const valleyPrice = 0.28 + Math.random() * 0.08;
    const avgPrice = (peakPrice + valleyPrice) / 2;
    const revenue = exportKwh * avgPrice * 0.8;
    const cost = importKwh * avgPrice;
    const savings = selfUse * avgPrice;

    summaries.push({
      date: date.toISOString().slice(0, 10),
      stationId,
      solarKwh: parseFloat(solarKwh.toFixed(1)),
      loadKwh: parseFloat(loadKwh.toFixed(1)),
      gridImportKwh: parseFloat(importKwh.toFixed(1)),
      gridExportKwh: parseFloat(exportKwh.toFixed(1)),
      batteryChargeKwh: parseFloat((solarKwh * 0.3).toFixed(1)),
      batteryDischargeKwh: parseFloat((loadKwh * 0.15).toFixed(1)),
      peakPowerKw: parseFloat((station.capacityKw * 0.9 * (0.85 + Math.random() * 0.15)).toFixed(1)),
      avgSoc: parseFloat((50 + Math.random() * 20).toFixed(1)),
      revenue: parseFloat(revenue.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      savings: parseFloat(savings.toFixed(2)),
      selfSufficiency: parseFloat(Math.min(100, (selfUse / loadKwh * 100)).toFixed(1)),
    });
  }
  return summaries;
}

const STATIONS = [
  { id: 'station-001', name: '苏州工业园光储站', capacityKw: 500, batteryKwh: 200 },
  { id: 'station-002', name: '杭州光伏基地', capacityKw: 350, batteryKwh: 150 },
  { id: 'station-003', name: '上海工商业光储', capacityKw: 200, batteryKwh: 100 },
];

const dailySummaries = new Map<string, DailySummary[]>();
const alerts: AlertRecord[] = [];
const workOrders: WorkOrderRecord[] = [];

// Initialize
STATIONS.forEach(s => dailySummaries.set(s.id, generateDailySummaries(s.id)));

// Generate some initial alerts and work orders
function initHistoricalData() {
  const now = Date.now();
  const alertMessages = [
    { code: 'BAT_001', message: '电池SOC低于20%，请注意充电', level: 'warning' as const },
    { code: 'GRID_001', message: '电网电压波动超过±10%', level: 'error' as const },
    { code: 'SOLAR_001', message: '光伏逆变器效率下降至85%', level: 'warning' as const },
    { code: 'LOAD_001', message: '负荷峰值超出预期150%', level: 'critical' as const },
    { code: 'INFO_001', message: '系统定时巡检完成，无异常', level: 'info' as const },
  ];

  for (let d = 7; d >= 0; d--) {
    const ts = new Date(now - d * 86400000).toISOString();
    const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
    const alert = alertMessages[Math.floor(Math.random() * alertMessages.length)];
    alerts.push({
      id: `alert-${d}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: ts,
      stationId: station.id,
      level: alert.level,
      code: alert.code,
      message: alert.message,
      acknowledged: Math.random() > 0.4,
      acknowledgedBy: Math.random() > 0.5 ? 'operator' : undefined,
      acknowledgedAt: Math.random() > 0.5 ? ts : undefined,
    });

    if (Math.random() > 0.5) {
      const types = ['inspect', 'repair', 'maintenance', 'alarm'];
      const statuses = ['open', 'assigned', 'in_progress', 'completed'];
      workOrders.push({
        id: `wo-${d}-${Math.random().toString(36).slice(2, 5)}`,
        timestamp: ts,
        stationId: station.id,
        type: types[Math.floor(Math.random() * types.length)] as any,
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
        title: `${station.name} — ${['月度巡检', '故障维修', '逆变器保养', '电池维护'][Math.floor(Math.random() * 4)]}`,
        description: '系统自动生成的工单记录',
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        assignee: Math.random() > 0.3 ? '运维人员A' : undefined,
        completedAt: Math.random() > 0.6 ? ts : undefined,
        rating: Math.random() > 0.7 ? 5 : undefined,
      });
    }
  }
}
initHistoricalData();

// ─── API Handlers ─────────────────────────────────────────────────────────────
export function getDailySummaries(req: express.Request, res: express.Response) {
  const { stationId, days = '30' } = req.query;
  const daysNum = parseInt(days as string);
  const summaries = stationId
    ? (dailySummaries.get(stationId as string) || []).slice(-daysNum)
    : STATIONS.flatMap(s => (dailySummaries.get(s.id) || []).slice(-daysNum));

  // Compute aggregates
  const total = {
    solarKwh: summaries.reduce((s: number, d) => s + d.solarKwh, 0),
    loadKwh: summaries.reduce((s: number, d) => s + d.loadKwh, 0),
    gridImportKwh: summaries.reduce((s: number, d) => s + d.gridImportKwh, 0),
    gridExportKwh: summaries.reduce((s: number, d) => s + d.gridExportKwh, 0),
    revenue: summaries.reduce((s: number, d) => s + d.revenue, 0),
    cost: summaries.reduce((s: number, d) => s + d.cost, 0),
    savings: summaries.reduce((s: number, d) => s + d.savings, 0),
    selfSufficiency: summaries.length > 0 ? summaries.reduce((s: number, d) => s + d.selfSufficiency, 0) / summaries.length : 0,
  };

  res.json({ success: true, stationId: stationId || 'all', days: daysNum, total, summaries });
}

export function getMonthlyReport(req: express.Request, res: express.Response) {
  const { stationId, year, month } = req.query;
  const y = parseInt(year as string) || new Date().getFullYear();
  const m = parseInt(month as string) || new Date().getMonth() + 1;

  const base: DailySummary[][] = stationId ? [dailySummaries.get(stationId as string) || []] : STATIONS.map(s => dailySummaries.get(s.id) || []);
  const summaries: DailySummary[] = base.flat().filter(s => !!s).filter(s => {
      const [y2, m2] = s.date.split('-').map(Number);
      return y2 === y && m2 === m;
    });

  const report: Record<string, number> = {
    year: y, month: m,
    solarKwh: 0, loadKwh: 0, gridImportKwh: 0, gridExportKwh: 0,
    revenue: 0, cost: 0, savings: 0, selfSufficiency: 0, days: summaries.length,
  };
  summaries.forEach(d => {
    if (!d) return;
    report.solarKwh += d.solarKwh;
    report.loadKwh += d.loadKwh;
    report.gridImportKwh += d.gridImportKwh;
    report.gridExportKwh += d.gridExportKwh;
    report.revenue += d.revenue;
    report.cost += d.cost;
    report.savings += d.savings;
    report.selfSufficiency += d.selfSufficiency;
  });
  report.selfSufficiency /= summaries.length || 1;

  res.json({ success: true, report });
}

export function getAlerts(req: express.Request, res: express.Response) {
  const { stationId, level, acknowledged, days = '7', limit = '50' } = req.query;
  const cutoff = new Date(Date.now() - parseInt(days as string) * 86400000);
  let filtered = alerts.filter(a => new Date(a.timestamp) >= cutoff);
  if (stationId) filtered = filtered.filter(a => a.stationId === stationId);
  if (level) filtered = filtered.filter(a => a.level === level);
  if (acknowledged !== undefined) filtered = filtered.filter(a => a.acknowledged === (acknowledged === 'true'));

  res.json({ success: true, total: filtered.length, alerts: filtered.slice(0, parseInt(limit as string)) });
}

export function acknowledgeAlert(req: express.Request, res: express.Response) {
  const { id } = req.params;
  const { username } = req.body; // from auth
  const alert = alerts.find(a => a.id === id);
  if (!alert) { res.status(404).json({ success: false, error: 'Alert not found' }); return; }
  alert.acknowledged = true;
  alert.acknowledgedBy = username || 'unknown';
  alert.acknowledgedAt = new Date().toISOString();
  res.json({ success: true, alert });
}

export function getWorkOrders(req: express.Request, res: express.Response) {
  const { stationId, status, type, days = '30', limit = '50' } = req.query;
  const cutoff = new Date(Date.now() - parseInt(days as string) * 86400000);
  let filtered = workOrders.filter(w => new Date(w.timestamp) >= cutoff);
  if (stationId) filtered = filtered.filter(w => w.stationId === stationId);
  if (status) filtered = filtered.filter(w => w.status === status);
  if (type) filtered = filtered.filter(w => w.type === type);

  res.json({ success: true, total: filtered.length, workOrders: filtered.slice(0, parseInt(limit as string)) });
}

export function createWorkOrder(req: express.Request, res: express.Response) {
  const { stationId, type, priority, title, description } = req.body;
  if (!stationId || !title) { res.status(400).json({ success: false, error: '缺少必填字段' }); return; }

  const wo: WorkOrderRecord = {
    id: `wo-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    stationId,
    type: type || 'inspect',
    priority: priority || 'medium',
    title,
    description: description || '',
    status: 'open',
  };
  workOrders.unshift(wo);
  res.json({ success: true, workOrder: wo });
}

export function getStats(req: express.Request, res: express.Response) {
  const { stationId } = req.query;
  const summaries = stationId
    ? (dailySummaries.get(stationId as string) || []).slice(-30)
    : STATIONS.flatMap(s => (dailySummaries.get(s.id) || []).slice(-30));

  const today = summaries[summaries.length - 1];
  const yesterday = summaries[summaries.length - 2];

  const todayRevenue = today?.revenue || 0;
  const monthRevenue = summaries.reduce((s: number, d) => s + d.revenue, 0);
  const monthCost = summaries.reduce((s: number, d) => s + d.cost, 0);
  const monthSavings = summaries.reduce((s: number, d) => s + d.savings, 0);

  res.json({
    success: true,
    today: {
      solarKwh: today?.solarKwh || 0,
      loadKwh: today?.loadKwh || 0,
      peakPowerKw: today?.peakPowerKw || 0,
      avgSoc: today?.avgSoc || 0,
      selfSufficiency: today?.selfSufficiency || 0,
      revenue: todayRevenue,
      savings: today?.savings || 0,
      gridImportKwh: today?.gridImportKwh || 0,
      gridExportKwh: today?.gridExportKwh || 0,
    },
    compareYesterday: {
      solarKwh: yesterday ? ((today?.solarKwh - yesterday.solarKwh) / (yesterday.solarKwh || 1) * 100).toFixed(1) : '0',
      loadKwh: yesterday ? ((today?.loadKwh - yesterday.loadKwh) / (yesterday.loadKwh || 1) * 100).toFixed(1) : '0',
    },
    month: { revenue: monthRevenue, cost: monthCost, savings: monthSavings },
    total: {
      solarKwh: summaries.reduce((s: number, d) => s + d.solarKwh, 0),
      loadKwh: summaries.reduce((s: number, d) => s + d.loadKwh, 0),
      revenue: summaries.reduce((s: number, d) => s + d.revenue, 0),
      savings: summaries.reduce((s: number, d) => s + d.savings, 0),
    },
    stations: STATIONS.map(s => ({
      ...s,
      today: (dailySummaries.get(s.id) || []).slice(-1)[0] || null,
    })),
  });
}
