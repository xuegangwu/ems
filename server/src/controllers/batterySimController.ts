/**
 * Battery Simulator — 本地物理模型
 *
 * 模拟电池在不同工况下的:
 * - SoH (State of Health) 衰减
 * - 温度变化
 * - 循环寿命损耗
 * - 最佳充放电策略建议
 */

import express from 'express';

// ─── Battery Model Parameters ──────────────────────────────────────────────────
interface BatteryPack {
  name: string;
  chemistry: 'LFP' | 'NMC' | 'NCA';   // 正极材料，影响循环寿命
  nominalKwh: number;                   // 标称容量 kWh
  nominalKw: number;                     // 标称功率 kW
  maxDod: number;                        // 最大放电深度 DOD % (通常 LFP=80%, NMC/NCA=70%)
  maxChargeRateC: number;                // 最大充电倍率 C
  maxDischargeRateC: number;             // 最大放电倍率 C
  roundTripEfficiency: number;           // 往返效率 %
  operatingTempMin: number;              // 最低工作温度 °C
  operatingTempMax: number;              // 最高工作温度 °C
  nominalCycleLife: number;              // 标称循环寿命 (100% DOD)
  calendarAgingRate: number;             // 年日历衰减率 %/年
  internalResistanceMohm: number;        // 内阻 mΩ
  thermalMassKwhPerC: number;            // 热容 kWh/°C
  ambientTemp: number;                   // 环境温度 °C
}

interface SimPoint {
  timestamp: string;
  action: 'charge' | 'discharge' | 'idle';
  powerKw: number;           // + = charge, - = discharge
  energyKwh: number;         // 实际能量变化
  socBefore: number;          // % before action
  socAfter: number;           // % after action
  tempBefore: number;         // °C
  tempAfter: number;          // °C
  sohBefore: number;          // % before action
  sohAfter: number;           // % after action
  cycleWear: number;          // 这次动作的寿命损耗 %
  heatGenerated: number;     // 产生的热量 kWh
}

interface SimResult {
  battery: BatteryPack;
  initialSoH: number;         // 初始健康状态 %
  finalSoH: number;          // 模拟后健康状态 %
  sohLoss: number;           // 本次模拟 SoH 损失 %
  avgTemp: number;           // 平均温度 °C
  maxTemp: number;          // 最高温度 °C
  minTemp: number;          // 最低温度 °C
  tempAlarm: boolean;       // 温度告警
  cycleCount: number;        // 等效完整循环次数
  timeline: SimPoint[];      // 每步详细数据
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    tempRisk: string;
    cycleRisk: string;
    dodRisk: string;
  };
  recommendations: string[];
}

// ─── Battery database ──────────────────────────────────────────────────────────
const BATTERY_MODELS: Record<string, BatteryPack> = {
  'CATL-LFP-200': {
    name: 'CATL LFP 200kWh',
    chemistry: 'LFP',
    nominalKwh: 200,
    nominalKw: 100,
    maxDod: 80,
    maxChargeRateC: 0.5,
    maxDischargeRateC: 1.0,
    roundTripEfficiency: 92,
    operatingTempMin: -10,
    operatingTempMax: 55,
    nominalCycleLife: 4000,
    calendarAgingRate: 2.0,
    internalResistanceMohm: 0.8,
    thermalMassKwhPerC: 0.15,
    ambientTemp: 25,
  },
  'BYD-NMC-100': {
    name: 'BYD NMC 100kWh',
    chemistry: 'NMC',
    nominalKwh: 100,
    nominalKw: 50,
    maxDod: 70,
    maxChargeRateC: 0.8,
    maxDischargeRateC: 1.5,
    roundTripEfficiency: 90,
    operatingTempMin: 0,
    operatingTempMax: 50,
    nominalCycleLife: 3000,
    calendarAgingRate: 3.0,
    internalResistanceMohm: 0.6,
    thermalMassKwhPerC: 0.12,
    ambientTemp: 25,
  },
  'Tesla-NCA-200': {
    name: 'Tesla NCA 200kWh',
    chemistry: 'NCA',
    nominalKwh: 200,
    nominalKw: 100,
    maxDod: 70,
    maxChargeRateC: 0.7,
    maxDischargeRateC: 1.2,
    roundTripEfficiency: 89,
    operatingTempMin: -20,
    operatingTempMax: 50,
    nominalCycleLife: 2500,
    calendarAgingRate: 3.5,
    internalResistanceMohm: 0.5,
    thermalMassKwhPerC: 0.14,
    ambientTemp: 25,
  },
};

// ─── Simulation engine ──────────────────────────────────────────────────────────
function simulateBattery(
  model: BatteryPack,
  schedule: { hour: number; action: 'charge' | 'discharge' | 'idle'; powerKw: number; durationH: number }[],
  initialSoc: number,
  initialSoH: number,
  startTemp: number
): SimResult {
  const timeline: SimPoint[] = [];
  let soc = initialSoc;
  let soh = initialSoH;
  let temp = startTemp;
  let cycleEquivalent = 0;

  for (const step of schedule) {
    const powerKw = Math.max(-model.nominalKw, Math.min(model.nominalKw, step.powerKw));
    const isCharge = powerKw > 0;
    const action = isCharge ? 'charge' : step.action === 'idle' ? 'idle' : 'discharge';

    // Energy change (kWh)
    const rawEnergy = powerKw * step.durationH;
    const efficiency = model.roundTripEfficiency / 100;
    const sign = isCharge ? 1 : -1;
    const energyKwh = sign * rawEnergy * efficiency;

    // SOC change (%)
    const socDelta = (energyKwh / model.nominalKwh) * 100;
    const socBefore = soc;
    const tempBefore = temp;

    // Clamp SOC
    soc = Math.max(0, Math.min(100, soc + socDelta));

    // Temperature model
    // Heat generated = I²R = (powerKw * 1000 / V)² * R * time
    // Simplified: heat ≈ powerKw² * internalResistance * durationH * factor
    const heatGenKwh = (powerKw * powerKw) * (model.internalResistanceMohm / 1000) * step.durationH * 0.1;
    const heatDissipated = ((temp - model.ambientTemp) / 30) * step.durationH; // simplified convection
    const netHeat = Math.max(0, heatGenKwh - heatDissipated * model.thermalMassKwhPerC);
    temp = temp + netHeat / model.thermalMassKwhPerC;
    temp = Math.max(model.ambientTemp - 5, Math.min(model.operatingTempMax + 10, temp));

    // Cycle wear model
    // DOD-based wear: full cycle = 100% DOD = 1 cycle equivalent
    const dodFraction = Math.abs(socDelta) / 100;
    // Chemistry factor: LFP is more cycle-friendly
    const chemistryFactor = model.chemistry === 'LFP' ? 0.6 : model.chemistry === 'NMC' ? 1.0 : 1.3;
    const tempFactor = temp > 35 ? 1.5 : temp > 45 ? 2.0 : 1.0;
    const cycleWear = dodFraction * (1 / model.nominalCycleLife) * chemistryFactor * tempFactor * 100;

    soh = Math.max(0, soh - cycleWear);

    // Accumulate cycle equivalent
    cycleEquivalent += dodFraction;

    timeline.push({
      timestamp: `T+${step.hour}h`,
      action,
      powerKw,
      energyKwh: parseFloat(energyKwh.toFixed(3)),
      socBefore: parseFloat(socBefore.toFixed(1)),
      socAfter: parseFloat(soc.toFixed(1)),
      tempBefore: parseFloat(tempBefore.toFixed(1)),
      tempAfter: parseFloat(temp.toFixed(1)),
      sohBefore: parseFloat((soh + cycleWear).toFixed(2)),
      sohAfter: parseFloat(soh.toFixed(2)),
      cycleWear: parseFloat(cycleWear.toFixed(4)),
      heatGenerated: parseFloat(netHeat.toFixed(4)),
    });
  }

  // Risk assessment
  const maxTempReached = Math.max(...timeline.map(t => t.tempAfter));
  const minSocReached = Math.min(...timeline.map(t => t.socAfter));
  const avgTemp = timeline.reduce((s, t) => s + t.tempAfter, 0) / timeline.length;

  const tempRisk = maxTempReached > model.operatingTempMax ? 'HIGH' : maxTempReached > 45 ? 'MEDIUM' : 'LOW';
  const cycleRisk = cycleEquivalent > 1.0 ? 'HIGH' : cycleEquivalent > 0.5 ? 'MEDIUM' : 'LOW';
  const dodRisk = minSocReached < 10 ? 'HIGH' : minSocReached < 20 ? 'MEDIUM' : 'LOW';

  const riskLevel: SimResult['riskAssessment']['level'] =
    tempRisk === 'HIGH' || dodRisk === 'HIGH' ? 'critical' :
    tempRisk === 'MEDIUM' || cycleRisk === 'HIGH' ? 'high' :
    cycleRisk === 'MEDIUM' || dodRisk === 'MEDIUM' ? 'medium' : 'low';

  const recommendations: string[] = [];
  if (maxTempReached > model.operatingTempMax) {
    recommendations.push(`⚠️ 温度超过安全上限！建议降低充放电功率，或增加散热措施`);
  }
  if (minSocReached < 10) {
    recommendations.push(`⚠️ SOC过低(${minSocReached.toFixed(0)}%)，深度放电影响寿命，建议限制最低SOC为20%`);
  }
  if (cycleEquivalent > 1.0) {
    recommendations.push(`⚠️ 单次模拟超过1个完整循环，等效循环次数: ${cycleEquivalent.toFixed(2)}，长期高频循环会加速老化`);
  }
  if (avgTemp > 35) {
    recommendations.push(`⚠️ 平均温度${avgTemp.toFixed(1)}°C偏高，建议降低充放电倍率或改善散热`);
  }
  if (riskLevel === 'low') {
    recommendations.push(`✅ 工况安全，电池在正常参数范围内运行`);
  }

  return {
    battery: model,
    initialSoH,
    finalSoH: parseFloat(soh.toFixed(2)),
    sohLoss: parseFloat((soh - initialSoH).toFixed(4)),
    avgTemp: parseFloat(avgTemp.toFixed(1)),
    maxTemp: parseFloat(maxTempReached.toFixed(1)),
    minTemp: parseFloat(Math.min(...timeline.map(t => t.tempAfter)).toFixed(1)),
    tempAlarm: maxTempReached > model.operatingTempMax,
    cycleCount: parseFloat(cycleEquivalent.toFixed(3)),
    timeline,
    riskAssessment: { level: riskLevel, tempRisk, cycleRisk, dodRisk },
    recommendations,
  };
}

// ─── API Handlers ─────────────────────────────────────────────────────────────
export function getModels(req: express.Request, res: express.Response) {
  const models = Object.entries(BATTERY_MODELS).map(([id, m]) => ({
    id,
    name: m.name,
    chemistry: m.chemistry,
    nominalKwh: m.nominalKwh,
    nominalKw: m.nominalKw,
    nominalCycleLife: m.nominalCycleLife,
  }));
  res.json({ success: true, models });
}

export function runSimulation(req: express.Request, res: express.Response) {
  const { modelId = 'CATL-LFP-200', initialSoc = 80, initialSoH = 95, startTemp = 28, schedule } = req.body;

  const model = BATTERY_MODELS[modelId];
  if (!model) {
    res.status(400).json({ success: false, error: `Unknown model: ${modelId}` });
    return;
  }

  // Default schedule if none provided
  const defaultSchedule = [
    { hour: 0, action: 'idle' as const, powerKw: 0, durationH: 6 },
    { hour: 6, action: 'charge' as const, powerKw: 50, durationH: 2 },   // 谷时充电
    { hour: 8, action: 'discharge' as const, powerKw: 30, durationH: 2 }, // 峰时放电
    { hour: 10, action: 'idle' as const, powerKw: 0, durationH: 4 },
    { hour: 14, action: 'discharge' as const, powerKw: 40, durationH: 3 }, // 午峰
    { hour: 17, action: 'charge' as const, powerKw: 60, durationH: 3 },    // 重新充电
    { hour: 20, action: 'discharge' as const, powerKw: 50, durationH: 2 }, // 晚峰
    { hour: 22, action: 'idle' as const, powerKw: 0, durationH: 2 },
  ];

  const simSchedule = schedule || defaultSchedule;

  try {
    const result = simulateBattery(model, simSchedule, initialSoc, initialSoH, startTemp);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[BatterySim] error:', err);
    res.status(500).json({ success: false, error: 'Simulation failed' });
  }
}

export function quickSimulate(req: express.Request, res: express.Response) {
  const { modelId = 'CATL-LFP-200', dischargeKwh = 50, chargeKwh = 30, initialSoc = 70, initialSoH = 94 } = req.body;

  const model = BATTERY_MODELS[modelId] || BATTERY_MODELS['CATL-LFP-200'];

  // Simple 24h schedule based on inputs
  const schedule = [
    { hour: 0, action: 'charge' as const, powerKw: chargeKwh / 4, durationH: 4 },    // 谷时慢充
    { hour: 4, action: 'idle' as const, powerKw: 0, durationH: 4 },
    { hour: 8, action: 'discharge' as const, powerKw: dischargeKwh / 2, durationH: 2 }, // 峰时放电
    { hour: 10, action: 'idle' as const, powerKw: 0, durationH: 4 },
    { hour: 14, action: 'discharge' as const, powerKw: dischargeKwh / 3, durationH: 3 }, // 午峰
    { hour: 17, action: 'charge' as const, powerKw: chargeKwh / 3, durationH: 3 },
    { hour: 20, action: 'discharge' as const, powerKw: dischargeKwh / 4, durationH: 2 }, // 晚峰
    { hour: 22, action: 'idle' as const, powerKw: 0, durationH: 2 },
  ];

  const result = simulateBattery(model, schedule, initialSoc, initialSoH, 28);
  res.json({
    success: true,
    result: {
      battery: { name: model.name, chemistry: model.chemistry, nominalKwh: model.nominalKwh, nominalKw: model.nominalKw },
      initialSoH,
      finalSoH: result.finalSoH,
      sohLoss: result.sohLoss,
      avgTemp: result.avgTemp,
      maxTemp: result.maxTemp,
      minTemp: result.minTemp,
      tempAlarm: result.tempAlarm,
      cycleCount: result.cycleCount,
      timeline: result.timeline,
      riskAssessment: result.riskAssessment,
      recommendations: result.recommendations,
    },
  });
}
