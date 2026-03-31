import { Request, Response } from 'express';

// Simulated real-time price (changes every 15 min)
const getCurrentPrice = (region: string): number => {
  const hour = new Date().getHours();
  // Peak: 8-21, Valley: 0-6
  if (hour >= 8 && hour <= 21) {
    return 0.85 + Math.random() * 0.43; // 0.85-1.28
  }
  return 0.28 + Math.random() * 0.17; // 0.28-0.45
};

// Generate 24h price prediction using simple simulation
const generatePrediction = (region: string) => {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now.getTime() + i * 3600000);
    const hour = t.getHours();
    let basePrice: number, confidence: number, reason: string;

    if (hour >= 6 && hour <= 9) {
      basePrice = 1.10 + Math.random() * 0.18;
      confidence = 0.82;
      reason = '早高峰预期';
    } else if (hour >= 17 && hour <= 20) {
      basePrice = 1.15 + Math.random() * 0.13;
      confidence = 0.85;
      reason = '晚高峰预期';
    } else if (hour >= 10 && hour <= 16) {
      basePrice = 0.95 + Math.random() * 0.30;
      confidence = 0.78;
      reason = '日间负荷';
    } else if (hour >= 0 && hour <= 5) {
      basePrice = 0.30 + Math.random() * 0.15;
      confidence = 0.90;
      reason = '谷时低价';
    } else {
      basePrice = 0.55 + Math.random() * 0.25;
      confidence = 0.75;
      reason = '夜间过渡';
    }

    return {
      timestamp: t.toISOString(),
      predictedPrice: parseFloat(basePrice.toFixed(3)),
      confidence: parseFloat(confidence.toFixed(2)),
      reason,
    };
  });
};

export const electricityController = {
  getPrices: (req: Request, res: Response) => {
    const region = (req.query.region as string) || '华东电网';
    const now = new Date();
    const data = Array.from({ length: 24 }, (_, i) => {
      const t = new Date(now.getTime() - (23 - i) * 3600000);
      const hour = t.getHours();
      let peak = 0, valley = 0, flat = 0;
      if (hour >= 8 && hour <= 21) {
        peak = 0.85 + Math.random() * 0.43;
        flat = 0.65 + Math.random() * 0.30;
      } else {
        valley = 0.28 + Math.random() * 0.17;
        flat = 0.45 + Math.random() * 0.25;
      }
      return {
        id: `price-${i}`,
        timestamp: t.toISOString(),
        region,
        peakPrice: parseFloat(peak.toFixed(3)),
        valleyPrice: parseFloat(valley.toFixed(3)),
        flatPrice: parseFloat(flat.toFixed(3)),
        currentPrice: hour >= 8 && hour <= 21 ? parseFloat((peak * 0.9).toFixed(3)) : parseFloat((valley * 1.1).toFixed(3)),
        priceTrend: Math.random() > 0.5 ? 'rising' : 'falling',
      };
    });
    res.json({ success: true, data });
  },

  getRealtimePrice: (req: Request, res: Response) => {
    const region = (req.query.region as string) || '华东电网';
    const price = getCurrentPrice(region);
    const hour = new Date().getHours();
    res.json({
      success: true,
      data: {
        region,
        currentPrice: price,
        priceTrend: hour >= 8 && hour <= 21 ? 'rising' : 'falling',
        nextPeakTime: '08:00',
        nextValleyTime: '00:00',
        arbitrageSuggestion: hour >= 0 && hour <= 5
          ? '建议储能充电'
          : hour >= 8 && hour <= 21
            ? '建议储能放电'
            : '正常调度',
      },
    });
  },

  getPricePrediction: (req: Request, res: Response) => {
    const region = (req.query.region as string) || '华东电网';
    const prediction = generatePrediction(region);
    res.json({ success: true, data: prediction });
  },

  getRegions: (req: Request, res: Response) => {
    res.json({
      success: true,
      data: ['华东电网', '华北电网', '华南电网', '华中电网', '东北电网'],
    });
  },
};
