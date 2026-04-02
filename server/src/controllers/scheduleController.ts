/**
 * AI Schedule Engine — Peak-Valley Shaving + Economic Optimization
 * Uses LSTM forecast data to compute optimal battery dispatch schedule
 *
 * Algorithm:
 * 1. Analyze 24h load + price forecast
 * 2. Identify peak (charge) and valley (discharge) windows
 * 3. Calculate optimal battery SoC trajectory
 * 4. Compute expected savings
 * 5. Output actionable hourly schedule
 */

import express from 'express';

// ─── Constants ─────────────────────────────────────────────────────────────────
const BATTERY_CAPACITY_KWH = 200;      // 200kWh battery system
const BATTERY_MAX_SOC = 0.95;           // 95% max state of charge
const BATTERY_MIN_SOC = 0.15;           // 15% minimum safe discharge
const BATTERY_RATED_POWER_KW = 100;     // 100kW charge/discharge rate
const EFFICIENCY_ROUND_TRIP = 0.85;    // 85% round-trip efficiency

// ─── Types ────────────────────────────────────────────────────────────────────
interface ForecastHour {
  hour: string;
  load: number;         // kW
  price: number;        // CNY/kWh
  confidence: number;
}

interface ScheduleItem {
  hour: string;
  action: 'charge' | 'discharge' | 'hold';
  soc: number;           // battery state of charge (0-1)
  powerKw: number;       // kW (+ = charge, - = discharge)
  loadKwh: number;       // load energy for this hour
  price: number;
  savings: number;       // CNY saved this hour
  reason: string;
}

interface DaySchedule {
  date: string;
  totalChargeKwh: number;
  totalDischargeKwh: number;
  totalSavings: number;   // CNY
  peakShaveKw: number;     // max reduction in peak load
  valleyFillKw: number;    // min increase in valley load
  items: ScheduleItem[];
  summary: {
    chargeHours: number;
    dischargeHours: number;
    holdHours: number;
    avgSoC: number;
    bestChargeWindow: string;
    bestDischargeWindow: string;
  };
}

// ─── Core dispatch algorithm ──────────────────────────────────────────────────
function computeDaySchedule(forecast: ForecastHour[]): DaySchedule {
  const items: ScheduleItem[] = [];
  let currentSoC = 0.50; // start at 50%
  let totalSavings = 0;

  // Sort by price to find best charge/discharge windows
  const sortedByPrice = [...forecast].sort((a, b) => a.price - b.price);
  const avgPrice = forecast.reduce((s, h) => s + h.price, 0) / forecast.length;
  const priceThreshold = {
    charge: sortedByPrice[Math.floor(sortedByPrice.length * 0.25)].price, // bottom 25% price → charge
    discharge: sortedByPrice[Math.floor(sortedByPrice.length * 0.75)].price, // top 25% → discharge
  };

  // Calculate load percentiles
  const loads = forecast.map(h => h.load).sort((a, b) => a - b);
  const p50 = loads[Math.floor(loads.length * 0.5)];
  const peakLoadThreshold = p50 * 1.2;

  // Initial pass: identify action for each hour
  const actions = forecast.map(h => {
    if (h.price <= priceThreshold.charge && currentSoC < BATTERY_MAX_SOC) {
      return 'charge' as const;
    } else if ((h.price >= priceThreshold.discharge || h.load > peakLoadThreshold) && currentSoC > BATTERY_MIN_SOC) {
      return 'discharge' as const;
    }
    return 'hold' as const;
  });

  // Smooth: prevent rapid charge/discharge alternation
  for (let i = 0; i < actions.length; i++) {
    if (actions[i] === 'discharge' && i > 0 && actions[i - 1] === 'charge') {
      // Don't switch immediately from charge to discharge
      actions[i] = 'hold';
    }
    if (actions[i] === 'charge' && i > 0 && actions[i - 1] === 'discharge') {
      actions[i] = 'hold';
    }
  }

  // Build schedule items
  const socHistory: number[] = [];
  const chargeHours: string[] = [];
  const dischargeHours: string[] = [];

  forecast.forEach((h, i) => {
    const action = actions[i];
    let powerKw = 0;
    let deltaSoc = 0;

    if (action === 'charge') {
      // Charge at maximum rate until price window ends or full
      const chargeNeeded = BATTERY_MAX_SOC - currentSoC;
      powerKw = Math.min(BATTERY_RATED_POWER_KW, chargeNeeded * BATTERY_CAPACITY_KWH);
      deltaSoc = (powerKw * EFFICIENCY_ROUND_TRIP) / BATTERY_CAPACITY_KWH;
      currentSoC = Math.min(BATTERY_MAX_SOC, currentSoC + deltaSoc);
      chargeHours.push(h.hour);
    } else if (action === 'discharge') {
      // Discharge to shave peak or capture high price
      const dischargeNeeded = currentSoC - BATTERY_MIN_SOC;
      // Limit discharge if load is low
      const maxDischarge = h.load > 0 ? Math.min(dischargeNeeded * BATTERY_CAPACITY_KWH, h.load * 0.3) : 0;
      powerKw = Math.min(BATTERY_RATED_POWER_KW, maxDischarge) * -1;
      deltaSoc = Math.abs(powerKw) / BATTERY_CAPACITY_KWH;
      currentSoC = Math.max(BATTERY_MIN_SOC, currentSoC - deltaSoc);
      dischargeHours.push(h.hour);
    }

    socHistory.push(currentSoC);

    // Calculate savings: avoided cost = (discharged kWh × price) - (charged kWh × price)
    const chargedKwh = action === 'charge' ? Math.abs(powerKw) : 0;
    const dischargedKwh = action === 'discharge' ? Math.abs(powerKw) : 0;
    const avoidedCost = dischargedKwh * h.price * EFFICIENCY_ROUND_TRIP;
    const chargeCost = chargedKwh * h.price;
    const savings = avoidedCost - chargeCost;
    totalSavings += savings;

    let reason = '';
    if (action === 'charge') {
      reason = `谷时低价 ¥${h.price.toFixed(2)}，储能充电至${(currentSoC * 100).toFixed(0)}%`;
    } else if (action === 'discharge') {
      reason = `峰时高价 ¥${h.price.toFixed(2)}，储能放电削峰`;
    } else {
      reason = '电价/负荷平稳，维持当前状态';
    }

    items.push({
      hour: h.hour,
      action,
      soc: parseFloat(currentSoC.toFixed(3)),
      powerKw: parseFloat(powerKw.toFixed(1)),
      loadKwh: parseFloat(h.load.toFixed(1)),
      price: parseFloat(h.price.toFixed(4)),
      savings: parseFloat(savings.toFixed(2)),
      reason,
    });
  });

  // Peak shaving: max load reduction
  const originalPeak = Math.max(...forecast.map(h => h.load));
  const scheduledLoads = items.map(item => Math.max(0, item.loadKwh + item.powerKw));
  const newPeak = Math.max(...scheduledLoads);
  const peakShaveKw = Math.max(0, originalPeak - newPeak);

  // Valley filling: min load increase
  const originalValley = Math.min(...forecast.map(h => h.load));
  const newValley = Math.min(...scheduledLoads.filter(l => l > 0));
  const valleyFillKw = Math.max(0, newValley - originalValley);

  // Find best windows
  const bestChargeWindow = chargeHours.length > 0
    ? `${chargeHours[0]} - ${chargeHours[chargeHours.length - 1]}` : '无';
  const bestDischargeWindow = dischargeHours.length > 0
    ? `${dischargeHours[0]} - ${dischargeHours[dischargeHours.length - 1]}` : '无';

  return {
    date: new Date().toISOString().split('T')[0],
    totalChargeKwh: parseFloat(items.reduce((s, i) => s + (i.action === 'charge' ? Math.abs(i.powerKw) : 0), 0).toFixed(1)),
    totalDischargeKwh: parseFloat(items.reduce((s, i) => s + (i.action === 'discharge' ? Math.abs(i.powerKw) : 0), 0).toFixed(1)),
    totalSavings: parseFloat(totalSavings.toFixed(2)),
    peakShaveKw: parseFloat(peakShaveKw.toFixed(1)),
    valleyFillKw: parseFloat(valleyFillKw.toFixed(1)),
    items,
    summary: {
      chargeHours: chargeHours.length,
      dischargeHours: dischargeHours.length,
      holdHours: forecast.length - chargeHours.length - dischargeHours.length,
      avgSoC: parseFloat((socHistory.reduce((s, v) => s + v, 0) / socHistory.length).toFixed(3)),
      bestChargeWindow,
      bestDischargeWindow,
    },
  };
}

// ─── API Handler ──────────────────────────────────────────────────────────────
export async function getSchedule(req: express.Request, res: express.Response) {
  try {
    // Get forecast from query or generate synthetic
    let forecast: ForecastHour[] = [];

    if (req.query.forecast) {
      try {
        forecast = JSON.parse(req.query.forecast as string);
      } catch {
        res.status(400).json({ success: false, error: 'Invalid forecast JSON' });
        return;
      }
    } else {
      // Generate realistic 24h forecast pattern
      const now = new Date();
      for (let h = 0; h < 24; h++) {
        const t = new Date(now);
        t.setHours((now.getHours() + h) % 24, 0, 0, 0);
        const hour = t.getHours();
        const isPeak = [8, 9, 10, 14, 15, 16, 18, 19, 20].includes(hour);
        const isValley = [0, 1, 2, 3, 4, 5, 6, 22, 23].includes(hour);
        const baseLoad = isPeak ? 2800 : isValley ? 800 : 1500;
        const basePrice = isPeak ? 1.05 : isValley ? 0.32 : 0.62;

        forecast.push({
          hour: `${String(hour).padStart(2, '0')}:00`,
          load: baseLoad + (Math.random() - 0.5) * baseLoad * 0.15,
          price: basePrice + (Math.random() - 0.5) * 0.12,
          confidence: 0.75 + Math.random() * 0.2,
        });
      }
    }

    const schedule = computeDaySchedule(forecast);

    // Daily projections
    const monthlySavings = schedule.totalSavings * 30;
    const yearlySavings = schedule.totalSavings * 365;
    const monthlyPeakReduction = schedule.peakShaveKw * 30 * 0.5; // assume 30 peak events/month

    res.json({
      success: true,
      schedule,
      projections: {
        dailySavings: schedule.totalSavings,
        monthlySavings: parseFloat(monthlySavings.toFixed(2)),
        yearlySavings: parseFloat(yearlySavings.toFixed(2)),
        monthlyPeakReductionKw: parseFloat(monthlyPeakReduction.toFixed(1)),
      },
      batteryConfig: {
        capacityKwh: BATTERY_CAPACITY_KWH,
        ratedPowerKw: BATTERY_RATED_POWER_KW,
        roundTripEfficiency: EFFICIENCY_ROUND_TRIP,
        maxSoC: BATTERY_MAX_SOC,
        minSoC: BATTERY_MIN_SOC,
      },
    });
  } catch (err) {
    console.error('[Schedule] getSchedule error:', err);
    res.status(500).json({ success: false, error: 'Schedule computation failed' });
  }
}

export async function getRealTimeDispatch(req: express.Request, res: express.Response) {
  try {
    const hour = new Date().getHours();
    const isPeak = [8, 9, 10, 14, 15, 16, 18, 19, 20].includes(hour);
    const isValley = [0, 1, 2, 3, 4, 5, 6, 22, 23].includes(hour);
    const currentPrice = isPeak ? 1.05 : isValley ? 0.32 : 0.62;

    // Simple real-time decision
    let action: 'charge' | 'discharge' | 'hold' = 'hold';
    let powerKw = 0;
    let reason = '当前电价平稳，建议维持';

    // Simulate current SoC (in real system, read from BMS)
    const currentSoC = 0.50;

    if (isValley && currentPrice < 0.40 && currentSoC < BATTERY_MAX_SOC) {
      action = 'charge';
      powerKw = BATTERY_RATED_POWER_KW;
      reason = `谷时低价（¥${currentPrice.toFixed(2)}），建议充电功率 ${powerKw}kW`;
    } else if (isPeak && currentPrice > 1.00 && currentSoC > BATTERY_MIN_SOC) {
      action = 'discharge';
      powerKw = BATTERY_RATED_POWER_KW;
      reason = `峰时高价（¥${currentPrice.toFixed(2)}），建议放电功率 ${powerKw}kW`;
    }

    res.json({
      success: true,
      currentTime: new Date().toISOString(),
      action,
      powerKw,
      batterySoC: currentSoC,
      currentPrice: parseFloat(currentPrice.toFixed(4)),
      reason,
      nextAction: isPeak ? '预计峰时段结束后自动切换至充电' : isValley ? '预计谷时段结束后自动切换至放电' : '等待电价信号',
    });
  } catch (err) {
    console.error('[Schedule] getRealTimeDispatch error:', err);
    res.status(500).json({ success: false, error: 'Real-time dispatch failed' });
  }
}
