/**
 * InfluxDB 2.x Service — Real-time station data using curl subprocess
 */

import { execSync } from 'child_process';

const INFLUX_HOST = process.env.INFLUX_HOST || 'localhost';
const INFLUX_PORT = process.env.INFLUX_PORT || '8086';
const INFLUX_ORG = process.env.INFLUX_ORG || 'solaripple';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || '';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'enos';

function queryCurl(flux: string): string[] {
  try {
    const url = 'http://' + INFLUX_HOST + ':' + INFLUX_PORT + '/api/v2/query?org=' + INFLUX_ORG + '&bucket=' + INFLUX_BUCKET;
    const cmd = "curl -s -X POST '" + url + "' -H 'Authorization: Token " + INFLUX_TOKEN + "' -H 'Content-Type: application/vnd.flux' -H 'Accept: text/csv' --data-raw '" + flux + "' 2>&1";
    console.log('[queryCurl] TOKEN len:', INFLUX_TOKEN.length, 'URL:', url);
    console.log('[queryCurl] CMD:', cmd.slice(0, 150));
    const result = execSync(cmd, { timeout: 15000, stdio: 'pipe' });
    const data = result.toString();
    console.log('[queryCurl] result len:', data.length, 'first 100:', data.slice(0, 100));
    if (data.startsWith('{')) {
      console.error('[InfluxDB] query error:', data.slice(0, 200));
      return [];
    }
    // InfluxDB CSV: each line starts with ',' (first column is unnamed). Don't filter these.
    const lines = data.split('\n').filter((l: string) => l.trim() && !l.startsWith('#'));
    console.log('[queryCurl] lines:', lines.length);
    return lines;
  } catch (e: any) {
    console.error('[InfluxDB curl] error:', e.message, (e.stderr || '').toString().slice(0, 100));
    return [];
  }
}

async function queryTail(measurement: string, n = 3): Promise<Map<string, Record<string, number>>> {
  const flux = 'from(bucket: "' + INFLUX_BUCKET + '") |> range(start: -1h) |> filter(fn: (r) => r._measurement == "' + measurement + '") |> tail(n: ' + String(n) + ')';
  const lines = queryCurl(flux);
  const map = new Map<string, Record<string, number>>();
  for (const line of lines) {
    const cols = line.split(',');
    const sid = cols[9];
    const field = cols[7];
    const value = parseFloat(cols[6]);
    if (!sid || !field || isNaN(value)) continue;
    if (!map.has(sid)) map.set(sid, {});
    map.get(sid)![field] = value;
  }
  return map;
}

export async function getStationLatestData(_stationId?: string) {
  const [pvMap, loadMap, bessMap, evMap, priceMap] = await Promise.all([
    queryTail('pv_generation', 6),
    queryTail('load', 6),
    queryTail('bess', 12),
    queryTail('ev_charging', 6),
    queryTail('electricity_price', 3),
  ]);

  const allIds = new Set<string>();
  [pvMap, loadMap, bessMap, evMap, priceMap].forEach(m => m.forEach((_, k) => allIds.add(k)));

  return Array.from(allIds).map(sid => ({
    station_id: sid,
    pv_power_kw: pvMap.get(sid)?.['power_kw'] ?? 0,
    load_power_kw: loadMap.get(sid)?.['power_kw'] ?? 0,
    bess_soc_pct: bessMap.get(sid)?.['soc_pct'] ?? 78,
    ev_power_kw: evMap.get(sid)?.['power_kw'] ?? 0,
    price_yuan_per_kwh: priceMap.get(sid)?.['price_yuan_per_kwh'] ?? 0.82,
  }));
}

export function buildRealtimeFromInflux(sd: Record<string, any>) {
  const pvKw = sd.pv_power_kw ?? 0;
  const loadKw = sd.load_power_kw ?? 0;
  const socPct = sd.bess_soc_pct ?? 78;
  const evKw = sd.ev_power_kw ?? 0;
  const priceYuan = sd.price_yuan_per_kwh ?? 0.82;
  return {
    station_id: sd.station_id || '',
    generation: pvKw,
    consumption: loadKw,
    storage: (socPct / 100) * 4800,
    storageSoc: socPct,
    gridExport: Math.max(0, pvKw - loadKw),
    gridImport: Math.max(0, loadKw - pvKw),
    efficiency: 94.2,
    temperature: 28.5,
    evCharging: evKw,
    price: priceYuan,
  };
}
