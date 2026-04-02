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
let modelsReady = false;

// ─── Synthetic historical data ────────────────────────────────────────────────
function generateHistoricalData(days = 90): { load: number[]; price: number[] } {
  const load: number[] = [];
  const price: number[] = [];
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

      let basePrice = isPeak ? 1.05 : isValley ? 0.32 : 0.62;
      basePrice += (Math.random() - 0.5) * 0.15;
      price.push(Math.max(0.1, basePrice));
    }
  }

  return { load, price };
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

  const { load, price } = generateHistoricalData(30);

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
function makeDispatch(loadF: number[], priceF: number[]): Array<{
  hour: string;
  recommendation: 'charge' | 'discharge' | 'hold';
  reason: string;
  price: number;
  load: number;
}> {
  const now = new Date();
  return loadF.map((load, i) => {
    const t = new Date(now.getTime() + (i + 1) * 3600000);
    const h = t.getHours();
    const hour = `${String(h).padStart(2, '0')}:00`;
    const price = priceF[i];

    const isPeak = [8, 9, 10, 14, 15, 16, 18, 19, 20].includes(h);
    const isValley = [0, 1, 2, 3, 4, 5, 6, 22, 23].includes(h);

    let recommendation: 'charge' | 'discharge' | 'hold' = 'hold';
    let reason = '负荷与电价平稳';

    if (isValley && price < 0.40) {
      recommendation = 'charge';
      reason = `谷时低价 ¥${price.toFixed(2)}/kWh，储能充电`;
    } else if (isPeak && price > 1.00) {
      recommendation = 'discharge';
      reason = `峰时高价 ¥${price.toFixed(2)}/kWh，放电套利`;
    } else if (load > 3200) {
      recommendation = 'discharge';
      reason = `尖峰负荷 ${(load / 1000).toFixed(1)}MW，储能放电削峰`;
    } else if (load < 700 && price > 0.65) {
      recommendation = 'charge';
      reason = '负荷低谷 + 电价偏高，储能补充充电';
    }

    return {
      hour,
      recommendation,
      reason,
      price: parseFloat(Math.max(0.1, price).toFixed(4)),
      load: Math.round(load),
    };
  });
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

    const [loadResult, priceResult] = await Promise.all([
      runForecast(loadModel!, recentLoad),
      runForecast(priceModel!, recentPrice),
    ]);

    const recommendations = makeDispatch(loadResult.values, priceResult.values);
    const avgConfidence = (loadResult.confidence + priceResult.confidence) / 2;

    res.json({
      success: true,
      confidence: parseFloat(avgConfidence.toFixed(2)),
      chargeCount: recommendations.filter(r => r.recommendation === 'charge').length,
      dischargeCount: recommendations.filter(r => r.recommendation === 'discharge').length,
      holdCount: recommendations.filter(r => r.recommendation === 'hold').length,
      data: recommendations.slice(0, 24),
    });
  } catch (err) {
    console.error('[Predict] getDispatchRecommendations error:', err);
    res.status(500).json({ success: false, error: 'Dispatch failed' });
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
