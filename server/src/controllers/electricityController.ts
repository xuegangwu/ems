import { Request, Response } from 'express';

// Simulate EPEX Spot-like real-time pricing
// China industrial pricing: peak (8-11, 14-17, 18-21), valley (0-6, 11-13, 17-18, 21-23)
// We use 30-min granularity to match international standards

const PRICE_ZONES = {
  peak: { hours: [8,9,10,14,15,16,18,19,20], multiplier: 1.3 },      // 尖峰
  normal: { hours: [7,11,12,13,17], multiplier: 1.0 },             // 平段
  valley: { hours: [0,1,2,3,4,5,6,22,23], multiplier: 0.4 },       // 谷时
};

const BASE_PRICE = 0.65; // 元/kWh average

function getPriceForHalfHour(hour: number, minute: number, volatility: number): number {
  const isPeak = PRICE_ZONES.peak.hours.includes(hour);
  const isValley = PRICE_ZONES.valley.hours.includes(hour);

  let multiplier = PRICE_ZONES.normal.multiplier;
  if (isPeak) multiplier = PRICE_ZONES.peak.multiplier;
  if (isValley) multiplier = PRICE_ZONES.valley.multiplier;

  // Add realistic 30-min variation from wholesale market
  const halfHourNoise = (Math.sin(hour * 2 + minute / 30 * Math.PI) * 0.08);
  const randomNoise = (Math.random() - 0.5) * 0.06;

  return Math.max(0.15, Math.min(2.0,
    BASE_PRICE * multiplier + volatility + halfHourNoise + randomNoise
  ));
}

// Generate 48 half-hour slots: past 24h + next 24h prediction
function generate48HourPrices(region: string) {
  const now = new Date();
  const slots = [];

  for (let i = 48; i >= 1; i--) {
    const t = new Date(now.getTime() - i * 30 * 60000);
    const hour = t.getHours();
    const minute = t.getMinutes();
    const isPast = i > 24;

    // Simulate different market conditions
    const volatility = (Math.random() - 0.5) * 0.1;
    const price = getPriceForHalfHour(hour, minute, volatility);
    const isPeak = PRICE_ZONES.peak.hours.includes(hour);
    const isValley = PRICE_ZONES.valley.hours.includes(hour);

    slots.push({
      timestamp: t.toISOString(),
      time: `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
      price: parseFloat(price.toFixed(4)),
      zone: isPeak ? 'peak' : isValley ? 'valley' : 'normal',
      zoneText: isPeak ? '尖峰' : isValley ? '谷时' : '平段',
      isPast,
      region,
    });
  }
  return slots;
}

// Find optimal arbitrage windows in next 24h
function findOptimalWindows(slots: ReturnType<typeof generate48HourPrices>) {
  const future = slots.filter(s => !s.isPast);

  // Find best charge (lowest price) and discharge (highest price) windows
  const sorted = [...future].sort((a, b) => a.price - b.price);
  const bestCharge = sorted.slice(0, 3);
  const bestDischarge = sorted.slice(-3).reverse();

  // Find current action
  const nowSlot = future[0];
  const action = nowSlot.price < 0.45
    ? { text: '⚡ 建议储能充电', reason: '当前电价偏低（谷时/低价时段）', color: '#00D4AA' }
    : nowSlot.price > 1.05
      ? { text: '💰 建议储能放电', reason: '当前电价偏高（峰时/高价时段）', color: '#FF4D4F' }
      : { text: '📊 正常调度', reason: '当前电价处于平段，可根据预测灵活调整', color: '#667EEA' };

  return { bestCharge, bestDischarge, action };
}

export const electricityController = {

  // 30-min granularity 48h prices (past 24h + next 24h forecast)
  getHalfHourlyPrices: (req: Request, res: Response) => {
    const region = (req.query.region as string) || '华东电网';
    const prices = generate48HourPrices(region);
    const optimal = findOptimalWindows(prices);
    res.json({ success: true, data: { prices, optimal } });
  },

  // Current real-time price with rich metadata
  getRealtimePrice: (req: Request, res: Response) => {
    const region = (req.query.region as string) || '华东电网';
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const price = getPriceForHalfHour(hour, minute, 0);

    const zones = {
      peak: { label: '尖峰', range: '08-11时 / 14-17时 / 18-21时', price: parseFloat((BASE_PRICE * 1.3).toFixed(4)) },
      normal: { label: '平段', range: '07时 / 11-13时 / 17-18时', price: parseFloat((BASE_PRICE * 1.0).toFixed(4)) },
      valley: { label: '谷时', range: '00-07时 / 22-24时', price: parseFloat((BASE_PRICE * 0.4).toFixed(4)) },
    };

    res.json({
      success: true,
      data: {
        region,
        currentPrice: parseFloat(price.toFixed(4)),
        unit: '元/kWh',
        hour,
        minute,
        zone: PRICE_ZONES.peak.hours.includes(hour) ? 'peak' : PRICE_ZONES.valley.hours.includes(hour) ? 'valley' : 'normal',
        zones,
        updatedAt: now.toISOString(),
        source: 'Ripple EnOS Market Data (Simulated EPEX)',
      },
    });
  },

  // 24h prediction with confidence bands
  getPricePrediction: (req: Request, res: Response) => {
    const region = (req.query.region as string) || '华东电网';
    const now = new Date();
    const predictions = Array.from({ length: 24 }, (_, i) => {
      const t = new Date(now.getTime() + (i + 1) * 3600000);
      const hour = t.getHours();
      const isPeak = PRICE_ZONES.peak.hours.includes(hour);
      const isValley = PRICE_ZONES.valley.hours.includes(hour);
      const base = isPeak ? 0.95 + Math.random() * 0.3 : isValley ? 0.28 + Math.random() * 0.15 : 0.55 + Math.random() * 0.4;

      return {
        timestamp: t.toISOString(),
        hour: `${String(hour).padStart(2,'0')}:00`,
        predictedPrice: parseFloat(base.toFixed(4)),
        confidence: parseFloat((0.75 + Math.random() * 0.2).toFixed(2)),
        upperBound: parseFloat((base * 1.15).toFixed(4)),
        lowerBound: parseFloat((base * 0.85).toFixed(4)),
        zone: isPeak ? 'peak' : isValley ? 'valley' : 'normal',
        reason: isPeak ? '高峰时段' : isValley ? '低谷时段' : '平段正常',
      };
    });

    res.json({ success: true, data: predictions });
  },

  getRegions: (req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        { id: 'east', name: '华东电网', code: 'CN-EAST' },
        { id: 'north', name: '华北电网', code: 'CN-NORTH' },
        { id: 'south', name: '华南电网', code: 'CN-SOUTH' },
        { id: 'central', name: '华中电网', code: 'CN-CENTRAL' },
        { id: 'northeast', name: '东北电网', code: 'CN-NE' },
      ],
    });
  },
};
