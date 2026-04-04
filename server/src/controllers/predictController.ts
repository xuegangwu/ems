/**
 * LSTM Prediction Controller — TensorFlow.js based
 * Handles: load forecast, price forecast, dispatch recommendations
 */

import express from 'express';
import * as tf from '@tensorflow/tfjs';

const SEQUENCE_LEN = 24;
const FORECAST_HORIZON = 48;
const HIDDEN_UNITS = 32;
const EPOCHS = 5;
const BATCH_SIZE = 16;

let loadModel: tf.LayersModel | null = null;
let priceModel: tf.LayersModel | null = null;
let solarModel: tf.LayersModel | null = null;
let modelsReady = false;

// ─── Synthetic historical data ────────────────────────────────────────────────
function generateHistoricalData(days = 90): { load: number[]; price: number[]; solar: number[] } {
  const load: number[] = [];
  const price: number[] = [];
  const solar: number[] = [];
  const now = Date.now();

  for (let d = days; d >= 0; d--) {
    const dayStart = now - d * 86400000;
    for (let h = 0; h < 24; h++) {
      const ts = new Date(dayStart + h * 3600000);
      const hour = h;
      const isWeekend = ts.getDay() === 0 || ts.getDay() === 6;

      const isPeak = [8, 9, 10, 14, 15, 16, 18, 19, 20].includes(hour);
      const isValley = [0, 1, 2, 3, 4, 5, 6, 22, 23].includes(hour);

      let baseLoad = isPeak ? (isWeekend ? 1800 : 2800) : isValley ? (isWeekend ? 600 : 800) : isWeekend ? 1100 : 1500;
      baseLoad += (Math.random() - 0.5) * baseLoad * 0.2;
      load.push(Math.max(200, baseLoad));

      let basePrice = isPeak ? (isWeekend ? 0.88 : 1.20) : isValley ? (isWeekend ? 0.26 : 0.28) : (isWeekend ? 0.55 : 0.66);
      basePrice += (Math.random() - 0.5) * 0.12;
      price.push(Math.max(0.1, basePrice));

      // Solar: bell curve peaking at noon, zero at night
      const solarFactor = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(hour)
        ? Math.sin((hour - 6) / 12 * Math.PI) * (0.85 + Math.random() * 0.15)
        : 0;
      const cloudFactor = 1 - (Math.random() * 0.25); // 75%-100% efficiency
      solar.push(Math.max(0, solarFactor * cloudFactor * 4800)); // 4800kW peak capacity
    }
  }

  return { load, price, solar };
}

// ─── Normalize / denormalize ─────────────────────────────────────────────────
function normalize(data: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  return { normalized: data.map(v => (v - min) / (max - min + 1e-8)), min, max };
}

function denormalize(normalized: number[], min: number, max: number): number[] {
  return normalized.map(v => v * (max - min) + min);
}

// ─── Build LSTM model ─────────────────────────────────────────────────────────
function buildLSTM(inputShape: [number, number]): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.lstm({ units: HIDDEN_UNITS, returnSequences: true, inputShape }));
  model.add(tf.layers.lstm({ units: HIDDEN_UNITS / 2, returnSequences: false }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: FORECAST_HORIZON }));
  model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError', metrics: ['mae'] });
  return model;
}

// ─── Create training sequences ────────────────────────────────────────────────
function createSequences(values: number[]): { X: tf.Tensor; y: tf.Tensor } {
  const X: number[][] = [];
  const y: number[][] = [];
  const { normalized } = normalize(values);

  for (let i = 0; i <= normalized.length - SEQUENCE_LEN - FORECAST_HORIZON; i++) {
    X.push(normalized.slice(i, i + SEQUENCE_LEN));
    y.push(normalized.slice(i + SEQUENCE_LEN, i + SEQUENCE_LEN + FORECAST_HORIZON));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Xflat = (X as any).flat();
  const Xreshaped = tf.tensor(Xflat).reshape([X.length, SEQUENCE_LEN, 1]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yflat = (y as any).flat();
  const yreshaped = tf.tensor(yflat).reshape([y.length, FORECAST_HORIZON]);
  return { X: Xreshaped, y: yreshaped };
}

// ─── Initialize models ────────────────────────────────────────────────────────
async function initModels() {
  if (modelsReady) return;
  console.log('[Predict] Training LSTM models (~5 epochs, please wait)...');

  const { load, price, solar } = generateHistoricalData(30);

  // Load model
  const loadSeqs = createSequences(load);
  loadModel = buildLSTM([SEQUENCE_LEN, 1]);
  await loadModel.fit(loadSeqs.X, loadSeqs.y, {
    epochs: EPOCHS, batchSize: BATCH_SIZE, verbose: 0, validationSplit: 0.1,
  });
  loadSeqs.X.dispose();
  loadSeqs.y.dispose();
  console.log('[Predict] Load model trained ✓');

  // Price model
  const priceSeqs = createSequences(price);
  priceModel = buildLSTM([SEQUENCE_LEN, 1]);
  await priceModel.fit(priceSeqs.X, priceSeqs.y, {
    epochs: EPOCHS, batchSize: BATCH_SIZE, verbose: 0, validationSplit: 0.1,
  });
  priceSeqs.X.dispose();
  priceSeqs.y.dispose();
  console.log('[Predict] Price model trained ✓');

  // Solar model
  const solarSeqs = createSequences(solar);
  solarModel = buildLSTM([SEQUENCE_LEN, 1]);
  await solarModel.fit(solarSeqs.X, solarSeqs.y, {
    epochs: EPOCHS, batchSize: BATCH_SIZE, verbose: 0, validationSplit: 0.1,
  });
  solarSeqs.X.dispose();
  solarSeqs.y.dispose();
  console.log('[Predict] Solar model trained ✓');

  modelsReady = true;
}

// ─── Run forecast ─────────────────────────────────────────────────────────────
async function runForecast(
  model: tf.LayersModel,
  recentValues: number[],
): Promise<{ values: number[]; confidence: number }> {
  const { normalized, min, max } = normalize(recentValues.slice(-SEQUENCE_LEN));
  const input = tf.tensor(normalized).reshape([1, SEQUENCE_LEN, 1]);
  const prediction = model.predict(input, { batchSize: 1 }) as tf.Tensor;
  const predData = await prediction.data();
  input.dispose();
  prediction.dispose();

  const denorm = denormalize(Array.from(predData), min, max);

  // Confidence from prediction smoothness
  const avgDelta = denorm.reduce((acc, v, i) => {
    if (i === 0) return acc;
    return acc + Math.abs(v - denorm[i - 1]) / (denorm[i - 1] + 1e-8);
  }, 0) / (denorm.length - 1);

  const confidence = Math.max(0.65, Math.min(0.96, 1 - avgDelta * 4));
  return { values: denorm, confidence };
}

// ─── Dispatch recommendations ────────────────────────────────────────────────
// ─── Battery dispatch config ─────────────────────────────────────────────────────
const BESS_CAPACITY_KWH = 4800;     // 4.8 MWh = 4800 kWh
const BESS_MAX_SOC = 0.95;          // 95% max SOC
const BESS_MIN_SOC = 0.20;          // 20% min SOC (depth of discharge limit)
const BESS_MAX_POWER_KW = 1200;      // Max charge/discharge power (kW)
const BESS_ROUNDTRIP_EFF = 0.90;     // Round-trip efficiency
const CURRENT_SOC = 0.78;            // Current battery SOC (from station real-time)

// ─── SOC-aware dispatch ─────────────────────────────────────────────────────────
interface DispatchHour {
  hour: string;
  recommendation: 'charge' | 'discharge' | 'hold';
  reason: string;
  price: number;
  load: number;
  solar?: number;
  soc: number;
  chargePowerKw: number;
  dischargePowerKw: number;
  availableEnergyKwh: number;
  actionEnergyKwh: number;
  revenue: number;
}

function makeDispatch(loadF: number[], priceF: number[], solarF?: number[]): DispatchHour[] {
  const now = new Date();
  let currentSoc = CURRENT_SOC;
  const results: DispatchHour[] = [];

  // Dynamic price thresholds based on data distribution (data-driven)
  const sortedPrices = [...priceF].sort((a, b) => a - b);
  const p25 = sortedPrices[Math.floor(sortedPrices.length * 0.25)];
  const p75 = sortedPrices[Math.floor(sortedPrices.length * 0.75)];
  const avgPrice = priceF.reduce((s, p) => s + p, 0) / priceF.length;
  const peakPriceThreshold = p75;          // Discharge when price > 75th percentile
  const valleyPriceThreshold = p25;        // Charge when price < 25th percentile
  const loadCapacity = Math.max(...loadF) * 0.80; // Discharge when load > 80% of daily peak
  const loadBase = Math.min(...loadF) * 1.20;     // Charge when load < 120% of daily valley

  for (let i = 0; i < loadF.length; i++) {
    const t = new Date(now.getTime() + (i + 1) * 3600000);
    const h = t.getHours();
    const hour = `${String(h).padStart(2, '0')}:00`;
    const price = priceF[i];
    const load = loadF[i];
    const solar = solarF?.[i] ?? 0;

    const availableKwh = Math.max(0, (currentSoc - BESS_MIN_SOC) * BESS_CAPACITY_KWH);
    const canChargeKwh = Math.max(0, (BESS_MAX_SOC - currentSoc) * BESS_CAPACITY_KWH);
    const chargePowerKw = Math.min(BESS_MAX_POWER_KW, canChargeKwh);
    const dischargePowerKw = Math.min(BESS_MAX_POWER_KW, availableKwh);

    // Decision logic with SOC constraints
    let recommendation: 'charge' | 'discharge' | 'hold' = 'hold';
    let reason = '价格适中，负荷平稳';
    let actionEnergyKwh = 0;
    let revenue = 0;

    if (price < valleyPriceThreshold && currentSoc < BESS_MAX_SOC - 0.03) {
      // Valley: price below 90% of daily average → charge
      recommendation = 'charge';
      actionEnergyKwh = Math.min(chargePowerKw * 1, canChargeKwh);
      currentSoc = Math.min(BESS_MAX_SOC, currentSoc + actionEnergyKwh / BESS_CAPACITY_KWH);
      reason = `低价 ¥${price.toFixed(3)} < ¥${valleyPriceThreshold.toFixed(3)}，储能充电 ${actionEnergyKwh.toFixed(0)}kWh`;
      revenue = -(actionEnergyKwh * price * BESS_ROUNDTRIP_EFF);
    } else if (price > peakPriceThreshold && currentSoc > BESS_MIN_SOC + 0.03) {
      // Peak: price above 110% of daily average → discharge
      recommendation = 'discharge';
      actionEnergyKwh = Math.min(dischargePowerKw * 1, availableKwh);
      currentSoc = Math.max(BESS_MIN_SOC, currentSoc - actionEnergyKwh / BESS_CAPACITY_KWH);
      reason = `高价 ¥${price.toFixed(3)} > ¥${peakPriceThreshold.toFixed(3)}，储能放电 ${actionEnergyKwh.toFixed(0)}kWh`;
      revenue = actionEnergyKwh * price * BESS_ROUNDTRIP_EFF;
    } else if (load > loadCapacity && currentSoc > BESS_MIN_SOC + 0.03) {
      // Peak shaving: grid overload → discharge to reduce demand charge
      recommendation = 'discharge';
      actionEnergyKwh = Math.min(dischargePowerKw * 1, availableKwh, Math.max(0, load - loadCapacity) * 1);
      currentSoc = Math.max(BESS_MIN_SOC, currentSoc - actionEnergyKwh / BESS_CAPACITY_KWH);
      reason = `负荷尖峰 ${load}kW，储能放电削峰 ${actionEnergyKwh.toFixed(0)}kWh`;
      revenue = actionEnergyKwh * price * BESS_ROUNDTRIP_EFF;
    } else if (load < loadBase && price > avgPrice * 0.95 && currentSoc < BESS_MAX_SOC - 0.03) {
      // Low load + high price: charge to store cheap energy or use excess solar
      recommendation = 'charge';
      actionEnergyKwh = solar > 50 ? Math.min(solar * 0.5, canChargeKwh) : Math.min(200, canChargeKwh);
      currentSoc = Math.min(BESS_MAX_SOC, currentSoc + actionEnergyKwh / BESS_CAPACITY_KWH);
      reason = solar > 50 ? `光伏剩余 ${solar.toFixed(0)}kW，储能消纳` : `谷时储能补充`;
      revenue = -(actionEnergyKwh * price * BESS_ROUNDTRIP_EFF);
    }

    results.push({
      hour,
      recommendation,
      reason,
      price: parseFloat(Math.max(0.1, price).toFixed(4)),
      load: Math.round(load),
      solar: solar ? Math.round(solar) : undefined,
      soc: parseFloat((currentSoc * 100).toFixed(1)),
      chargePowerKw: Math.round(chargePowerKw),
      dischargePowerKw: Math.round(dischargePowerKw),
      availableEnergyKwh: parseFloat(availableKwh.toFixed(1)),
      actionEnergyKwh: parseFloat(actionEnergyKwh.toFixed(1)),
      revenue: parseFloat(revenue.toFixed(2)),
    });
  }

  return results;
}

// ─── Revenue calculation ─────────────────────────────────────────────────────────
function calcRevenue(results: DispatchHour[]): {
  dailyRevenue: number;
  monthlyProjected: number;
  annualProjected: number;
  peakShavingRevenue: number;
  arbitrageRevenue: number;
  carbonSavingKwh: number;
  withoutAIDailyCost: number;
  withAIDailyCost: number;
  dailySaving: number;
} {
  let arbitrageRevenue = 0;
  let peakShavingRevenue = 0;
  let carbonSavingKwh = 0;
  let withAIDailyCost = 0;
  let withoutAIDailyCost = 0;

  const priceF = results.map(r => r.price);
  const loadF = results.map(r => r.load);

  // AI-optimized cost: follow dispatch recommendations
  for (const r of results) {
    withAIDailyCost += r.revenue; // revenue is negative for cost, positive for income
    if (r.recommendation === 'discharge') {
      // All discharge revenue counts as arbitrage
      arbitrageRevenue += r.revenue > 0 ? r.revenue : 0;
    }
    if (r.recommendation === 'discharge' && r.load > 1500) {
      peakShavingRevenue += r.revenue > 0 ? r.revenue : 0;
    }
    if (r.recommendation === 'charge' && (r.solar ?? 0) > 50) {
      carbonSavingKwh += r.actionEnergyKwh;
    }
  }

  // Without AI baseline: flatSOC = keep at 50%, no arbitrage
  // Cost = load(kW) * price(yuan/kWh) * hours = yuan
  for (let i = 0; i < priceF.length; i++) {
    withoutAIDailyCost += loadF[i] * priceF[i]; // kW * yuan/kWh = yuan
  }

  const dailyRevenue = arbitrageRevenue + peakShavingRevenue;
  const dailySaving = withoutAIDailyCost + withAIDailyCost;

  return {
    dailyRevenue: parseFloat(dailyRevenue.toFixed(2)),
    monthlyProjected: parseFloat((dailySaving * 30).toFixed(2)),
    annualProjected: parseFloat((dailySaving * 365).toFixed(2)),
    peakShavingRevenue: parseFloat(peakShavingRevenue.toFixed(2)),
    arbitrageRevenue: parseFloat(arbitrageRevenue.toFixed(2)),
    carbonSavingKwh: parseFloat(carbonSavingKwh.toFixed(1)),
    withoutAIDailyCost: parseFloat(withoutAIDailyCost.toFixed(2)),
    withAIDailyCost: parseFloat(withAIDailyCost.toFixed(2)),
    dailySaving: parseFloat(dailySaving.toFixed(2)),
  };
}

// ─── API Handlers ─────────────────────────────────────────────────────────────
export async function getLoadForecast(req: express.Request, res: express.Response) {
  try {
    await initModels();
    const recent = generateHistoricalData(1).load.slice(-SEQUENCE_LEN);
    const { values, confidence } = await runForecast(loadModel!, recent);
    const now = new Date();

    const data = values.map((load, i) => ({
      timestamp: new Date(now.getTime() + (i + 1) * 3600000).toISOString(),
      hour: `${String(new Date(now.getTime() + (i + 1) * 3600000).getHours()).padStart(2, '0')}:00`,
      load: Math.round(load),
      loadUpper: Math.round(load * 1.12),
      loadLower: Math.round(load * 0.88),
      confidence: parseFloat(confidence.toFixed(2)),
    }));

    res.json({ success: true, horizon: FORECAST_HORIZON, data });
  } catch (err) {
    console.error('[Predict] getLoadForecast error:', err);
    res.status(500).json({ success: false, error: 'Load forecast failed' });
  }
}

export async function getPriceForecast(req: express.Request, res: express.Response) {
  try {
    await initModels();
    const recent = generateHistoricalData(1).price.slice(-SEQUENCE_LEN);
    const { values, confidence } = await runForecast(priceModel!, recent);
    const now = new Date();

    const data = values.map((price, i) => ({
      timestamp: new Date(now.getTime() + (i + 1) * 3600000).toISOString(),
      hour: `${String(new Date(now.getTime() + (i + 1) * 3600000).getHours()).padStart(2, '0')}:00`,
      price: parseFloat(Math.max(0.1, price).toFixed(4)),
      priceUpper: parseFloat((Math.max(0.1, price) * 1.18).toFixed(4)),
      priceLower: parseFloat((Math.max(0.1, price) * 0.82).toFixed(4)),
      confidence: parseFloat(confidence.toFixed(2)),
    }));

    res.json({ success: true, horizon: FORECAST_HORIZON, data });
  } catch (err) {
    console.error('[Predict] getPriceForecast error:', err);
    res.status(500).json({ success: false, error: 'Price forecast failed' });
  }
}

export async function getDispatchRecommendations(req: express.Request, res: express.Response) {
  try {
    await initModels();
    const hist = generateHistoricalData(1);
    const recentLoad = hist.load.slice(-SEQUENCE_LEN);
    const recentPrice = hist.price.slice(-SEQUENCE_LEN);
    const recentSolar = hist.solar.slice(-SEQUENCE_LEN);

    const [loadResult, priceResult, solarResult] = await Promise.all([
      runForecast(loadModel!, recentLoad),
      runForecast(priceModel!, recentPrice),
      solarModel ? runForecast(solarModel, recentSolar) : Promise.resolve({ values: recentSolar, confidence: 0.8 }),
    ]);

    const recommendations = makeDispatch(loadResult.values, priceResult.values, solarResult.values);
    const revenue = calcRevenue(recommendations);
    const avgConfidence = (loadResult.confidence + priceResult.confidence + solarResult.confidence) / 3;

    res.json({
      success: true,
      confidence: parseFloat(avgConfidence.toFixed(2)),
      chargeCount: recommendations.filter(r => r.recommendation === 'charge').length,
      dischargeCount: recommendations.filter(r => r.recommendation === 'discharge').length,
      holdCount: recommendations.filter(r => r.recommendation === 'hold').length,
      revenue,
      data: recommendations.slice(0, 24),
    });
  } catch (err) {
    console.error('[Predict] getDispatchRecommendations error:', err);
    res.status(500).json({ success: false, error: 'Dispatch failed' });
  }
}

export async function getSolarForecast(req: express.Request, res: express.Response) {
  try {
    await initModels();
    const recent = generateHistoricalData(1).solar.slice(-SEQUENCE_LEN);
    const { values, confidence } = await runForecast(solarModel!, recent);
    const now = new Date();

    const data = values.map((power, i) => {
      const t = new Date(now.getTime() + (i + 1) * 3600000);
      const h = t.getHours();
      const isDaylight = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(h);
      const efficiency = isDaylight ? Math.sin((h - 6) / 12 * Math.PI) : 0;
      return {
        timestamp: t.toISOString(),
        hour: `${String(h).padStart(2, '0')}:00`,
        power: Math.round(power),
        powerUpper: Math.round(power * 1.1),
        powerLower: Math.round(power * 0.75),
        confidence: parseFloat(confidence.toFixed(2)),
        efficiency: parseFloat((efficiency * 100).toFixed(1)),
      };
    });

    res.json({ success: true, horizon: FORECAST_HORIZON, data });
  } catch (err) {
    console.error('[Predict] getSolarForecast error:', err);
    res.status(500).json({ success: false, error: 'Solar forecast failed' });
  }
}

export async function getCombinedForecast(req: express.Request, res: express.Response) {
  try {
    await initModels();
    const hist = generateHistoricalData(1);
    const recentLoad = hist.load.slice(-SEQUENCE_LEN);
    const recentPrice = hist.price.slice(-SEQUENCE_LEN);

    const [loadResult, priceResult] = await Promise.all([
      runForecast(loadModel!, recentLoad),
      runForecast(priceModel!, recentPrice),
    ]);

    const recommendations = makeDispatch(loadResult.values, priceResult.values);
    const now = new Date();

    const data = loadResult.values.map((load, i) => ({
      timestamp: new Date(now.getTime() + (i + 1) * 3600000).toISOString(),
      hour: `${String(new Date(now.getTime() + (i + 1) * 3600000).getHours()).padStart(2, '0')}:00`,
      load: Math.round(load),
      loadUpper: Math.round(load * 1.12),
      loadLower: Math.round(load * 0.88),
      price: parseFloat(Math.max(0.1, priceResult.values[i]).toFixed(4)),
      priceUpper: parseFloat((Math.max(0.1, priceResult.values[i]) * 1.18).toFixed(4)),
      priceLower: parseFloat((Math.max(0.1, priceResult.values[i]) * 0.82).toFixed(4)),
      confidence: parseFloat(((loadResult.confidence + priceResult.confidence) / 2).toFixed(2)),
      recommendation: recommendations[i]?.recommendation ?? 'hold',
      reason: recommendations[i]?.reason ?? '',
    }));

    res.json({ success: true, horizon: FORECAST_HORIZON, modelVersion: 'LSTM-v1.0', data });
  } catch (err) {
    console.error('[Predict] getCombinedForecast error:', err);
    res.status(500).json({ success: false, error: 'Combined forecast failed' });
  }
}

export async function getThreeInOneForecast(req: express.Request, res: express.Response) {
  try {
    await initModels();
    const hist = generateHistoricalData(1);
    const recentLoad = hist.load.slice(-SEQUENCE_LEN);
    const recentPrice = hist.price.slice(-SEQUENCE_LEN);
    const recentSolar = hist.solar.slice(-SEQUENCE_LEN);

    const [loadResult, priceResult, solarResult] = await Promise.all([
      runForecast(loadModel!, recentLoad),
      runForecast(priceModel!, recentPrice),
      runForecast(solarModel!, recentSolar),
    ]);

    const recommendations = makeDispatch(loadResult.values, priceResult.values, solarResult.values);
    const revenue = calcRevenue(recommendations);
    const now = new Date();

    const data = recommendations.slice(0, FORECAST_HORIZON).map((rec, i) => {
      const t = new Date(now.getTime() + (i + 1) * 3600000);
      const h = t.getHours();
      const isDaylight = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(h);
      const efficiency = isDaylight ? Math.sin((h - 6) / 12 * Math.PI) : 0;

      return {
        timestamp: t.toISOString(),
        hour: rec.hour,
        load: rec.load,
        loadUpper: Math.round(rec.load * 1.12),
        loadLower: Math.round(rec.load * 0.88),
        solar: rec.solar ?? 0,
        solarUpper: Math.round((rec.solar ?? 0) * 1.1),
        solarLower: Math.round((rec.solar ?? 0) * 0.75),
        price: rec.price,
        priceUpper: parseFloat((rec.price * 1.18).toFixed(4)),
        priceLower: parseFloat((rec.price * 0.82).toFixed(4)),
        efficiency: parseFloat((efficiency * 100).toFixed(1)),
        confidence: parseFloat(((loadResult.confidence + priceResult.confidence + solarResult.confidence) / 3).toFixed(2)),
        recommendation: rec.recommendation,
        reason: rec.reason,
        soc: rec.soc,
        chargePowerKw: rec.chargePowerKw,
        dischargePowerKw: rec.dischargePowerKw,
        availableEnergyKwh: rec.availableEnergyKwh,
        actionEnergyKwh: rec.actionEnergyKwh,
        revenue: rec.revenue,
      };
    });

    // Summary stats
    const peakSolarRec = data.reduce((max, d) => d.solar > max.solar ? d : max, data[0]);
    const peakLoadRec = data.reduce((max, d) => d.load > max.load ? d : max, data[0]);

    res.json({
      success: true,
      horizon: FORECAST_HORIZON,
      modelVersion: 'LSTM-v2.0-solar-soc',
      summary: {
        peakSolar: { hour: peakSolarRec.hour, power: peakSolarRec.solar },
        peakLoad: { hour: peakLoadRec.hour, load: peakLoadRec.load },
        chargeCount: data.filter(d => d.recommendation === 'charge').length,
        dischargeCount: data.filter(d => d.recommendation === 'discharge').length,
        avgConfidence: parseFloat(((loadResult.confidence + priceResult.confidence + solarResult.confidence) / 3).toFixed(2)),
        revenue,
      },
      data,
    });
  } catch (err) {
    console.error('[Predict] getThreeInOneForecast error:', err);
    res.status(500).json({ success: false, error: 'Three-in-one forecast failed' });
  }
}
