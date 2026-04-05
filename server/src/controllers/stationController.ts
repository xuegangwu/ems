import { Request, Response } from 'express';
import http from 'http';

const STATIONS = [
  {
    id: 'station-001',
    name: '苏州工业园光伏电站',
    type: 'solar',
    capacity: 5000,
    installedCapacity: 4800,
    peakPower: 4200,
    location: '江苏省苏州市工业园区星湖街328号',
    status: 'online',
    gridConnectionDate: '2022-06-15',
    owner: '苏州新能源有限公司',
    contact: '张经理 138-8888-8888',
  },
  {
    id: 'station-002',
    name: '无锡储能电站',
    type: 'storage',
    capacity: 2000,
    installedCapacity: 1800,
    peakPower: 1600,
    location: '江苏省无锡市新吴区太湖大道888号',
    status: 'online',
    gridConnectionDate: '2023-01-20',
    owner: '无锡储能科技有限公司',
    contact: '李经理 139-9999-9999',
  },
  {
    id: 'station-003',
    name: '杭州光储一体化电站',
    type: 'solar_storage',
    capacity: 8000,
    installedCapacity: 7500,
    peakPower: 6800,
    location: '浙江省杭州市滨江区江南大道1000号',
    status: 'online',
    gridConnectionDate: '2022-09-01',
    owner: '杭州光储有限公司',
    contact: '王经理 137-7777-7777',
  },
];

function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve) => {
    http.get(url, (r) => {
      let d = '';
      r.on('data', c => { d += c; });
      r.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

export const stationController = {
  getAll: async (req: Request, res: Response) => {
    // Merge static info with real-time InfluxDB data
    const realtime = await fetchJSON('http://localhost:8080/api/realtime');
    const rtMap: Record<string, any> = {};
    if (realtime?.data) {
      for (const s of realtime.data) {
        rtMap[s.station_id] = s;
      }
    }
    const data = STATIONS.map(s => ({
      ...s,
      realtime: rtMap[s.id] || null,
    }));
    res.json({ success: true, data });
  },
  getById: (req: Request, res: Response) => {
    const station = STATIONS.find((s: any) => s.id === req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    res.json({ success: true, data: station });
  },
  create: (req: Request, res: Response) => {
    const newStation = { id: `station-${Date.now()}`, ...req.body };
    STATIONS.push(newStation);
    res.json({ success: true, data: newStation });
  },
  update: (req: Request, res: Response) => {
    const index = STATIONS.findIndex((s: any) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    STATIONS[index] = { ...STATIONS[index], ...req.body };
    res.json({ success: true, data: STATIONS[index] });
  },
  delete: (req: Request, res: Response) => {
    const index = STATIONS.findIndex((s: any) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    STATIONS.splice(index, 1);
    res.json({ success: true });
  },
};
