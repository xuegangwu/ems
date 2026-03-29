import { Request, Response } from 'express';

export const monitoringController = {
  getRealTimeData: (req: Request, res: Response) => {
    const { stationId } = req.params;
    const data = {
      stationId,
      timestamp: new Date().toISOString(),
      pvPower: Math.random() * 4000,
      pvEnergy: Math.random() * 50000,
      batteryPower: Math.random() * 1000,
      batterySoc: Math.random() * 100,
      batteryEnergy: Math.random() * 15000,
      gridPower: Math.random() * 2000,
      loadPower: Math.random() * 3000,
      gridEnergy: Math.random() * 30000,
      loadEnergy: Math.random() * 40000,
      efficiency: 80 + Math.random() * 15,
      temperature: 30 + Math.random() * 20,
    };
    res.json({ success: true, data });
  },
  getHistoricalData: (req: Request, res: Response) => {
    const { stationId } = req.params;
    const { startDate, endDate } = req.query;
    const data = [];
    for (let i = 0; i < 24; i++) {
      data.push({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        pvPower: Math.random() * 4000,
        batteryPower: Math.random() * 1000 - 500,
        gridPower: Math.random() * 2000 - 1000,
        loadPower: Math.random() * 3000,
      });
    }
    res.json({ success: true, data });
  },
};
