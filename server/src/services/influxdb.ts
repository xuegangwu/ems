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
    const result = execSync(cmd, { timeout: 15000, stdio: 'pipe' });
    const data = result.toString();
    if (data.startsWith('{')) {
      console.error('[InfluxDB] query error:', data.slice(0, 200));
      return [];
    }
    const lines = data.split('\n').filter((l: string) => l.trim() && !l.startsWith('#'));
    return lines;
  } catch (e: any) {
    console.error('[InfluxDB curl] error:', e.message);
    return [];
  }
}

function parseInfluxCSV(lines: string[], idTag: string): Map<string, Record<string, number>> {
  const map = new Map<string, Record<string, number>>();
  if (lines.length < 2) return map;
  const header = lines[0].split(',');
  // Find column indices — look up by column name rather than hardcoding
  const fieldIdx = header.indexOf('_field');
  const valueIdx = header.indexOf('_value');
  const idIdx = header.indexOf(idTag);
  if (fieldIdx < 0 || valueIdx < 0 || idIdx < 0) {
    console.error('[InfluxDB parse] missing columns:', header);
    return map;
  }
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const sid = cols[idIdx];
    const field = cols[fieldIdx];
    const value = parseFloat(cols[valueIdx]);
    if (!sid || !field || isNaN(value)) continue;
    if (!map.has(sid)) map.set(sid, {});
    map.get(sid)![field] = value;
  }
  return map;
}

async function queryStationData(measurement: string): Promise<Map<string, Record<string, number>>> {
  // Skip string fields (is_peak, period, region) to avoid schema collision
  // Group by station_id + _field to get one row per (station, field) pair
  const flux = 'from(bucket: "' + INFLUX_BUCKET + '") |> range(start: -24h) |> filter(fn: (r) => r._measurement == "' + measurement + '" and r._field != "is_peak" and r._field != "period" and r._field != "region") |> group(columns: ["station_id", "_field"]) |> last()';
  const lines = queryCurl(flux);
  return parseInfluxCSV(lines, 'station_id');
}

async function queryPriceData(): Promise<{ price: number; region: string }> {
  const flux = 'from(bucket: "' + INFLUX_BUCKET + '") |> range(start: -24h) |> filter(fn: (r) => r._measurement == "electricity_price" and r._field == "price_yuan_per_kwh") |> last()';
  const lines = queryCurl(flux);
  // Parse: field=price_yuan_per_kwh, value=the price, region=the region tag
  let price = 0.82;
  let region = 'zhejiang';
  if (lines.length >= 2) {
    const header = lines[0].split(',');
    const dataCols = lines[1].split(',');
    const fieldIdx = header.indexOf('_field');
    const valueIdx = header.indexOf('_value');
    const regionIdx = header.indexOf('region');
    if (regionIdx >= 0) region = dataCols[regionIdx];
    if (fieldIdx >= 0 && valueIdx >= 0) {
      const v = parseFloat(dataCols[valueIdx]);
      if (!isNaN(v)) price = v;
    }
  }
  return { price, region };
}

export async function getStationLatestData(_stationId?: string) {
  const [pvMap, loadMap, bessMap, evMap, priceInfo] = await Promise.all([
    queryStationData('pv_generation'),
    queryStationData('load'),
    queryStationData('bess'),
    queryStationData('ev_charging'),
    queryPriceData(),
  ]);

  const allIds = new Set<string>();
  [pvMap, loadMap, bessMap, evMap].forEach(m => m.forEach((_, k) => allIds.add(k)));

  return Array.from(allIds).map(sid => ({
    station_id: sid,
    pv_power_kw: pvMap.get(sid)?.['power_kw'] ?? 0,
    load_power_kw: loadMap.get(sid)?.['power_kw'] ?? 0,
    bess_soc_pct: bessMap.get(sid)?.['soc_pct'] ?? 78,
    ev_power_kw: evMap.get(sid)?.['ev_power_kw'] ?? 0,
    price_yuan_per_kwh: priceInfo.price,
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
