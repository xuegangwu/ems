import { Request, Response } from 'express';

export const alertController = {
  getAll: (req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        { id: 'alert-001', stationId: '苏州工业园光伏电站', type: 'fault', level: 'major', code: 'PV-001', message: '逆变器通讯中断', timestamp: '2024-01-15 14:32:15', acknowledged: false },
        { id: 'alert-002', stationId: '无锡储能电站', type: 'warning', level: 'minor', code: 'BAT-012', message: '电池SOC低于20%', timestamp: '2024-01-15 13:20:00', acknowledged: true },
      ],
    });
  },
  acknowledge: (req: Request, res: Response) => {
    res.json({ success: true });
  },
  acknowledgeBatch: (req: Request, res: Response) => {
    res.json({ success: true });
  },
  delete: (req: Request, res: Response) => {
    res.json({ success: true });
  },
};
