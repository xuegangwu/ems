import { Request, Response } from 'express';

export const tradeController = {
  getOrders: (req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        {
          id: 'order-001',
          stationId: '苏州工业园光伏电站',
          type: 'sell',
          power: 1000,
          price: 0.85,
          quantity: 5000,
          totalAmount: 4250,
          status: 'completed',
          timestamp: '2024-01-15 10:00:00',
        },
      ],
    });
  },
  createOrder: (req: Request, res: Response) => {
    const order = { id: `order-${Date.now()}`, ...req.body };
    res.json({ success: true, data: order });
  },
  cancelOrder: (req: Request, res: Response) => {
    res.json({ success: true });
  },
  getPrices: (req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        { timestamp: '2024-01-15 00:00', peakPrice: 0.65, valleyPrice: 0.36, flatPrice: 0.52, region: '华东电网' },
        { timestamp: '2024-01-15 08:00', peakPrice: 1.28, valleyPrice: 0.45, flatPrice: 0.78, region: '华东电网' },
        { timestamp: '2024-01-15 12:00', peakPrice: 1.28, valleyPrice: 0.68, flatPrice: 0.92, region: '华东电网' },
        { timestamp: '2024-01-15 20:00', peakPrice: 1.28, valleyPrice: 0.75, flatPrice: 0.95, region: '华东电网' },
      ],
    });
  },
};
