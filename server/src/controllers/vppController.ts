import { Request, Response } from 'express';

// In-memory store (replace with DB later)
const resources: any[] = [
  { id: 'r-001', name: '苏州工业园储能', type: 'battery', capacity: 1000, currentPower: 320, status: 'online', stationId: 's-001', location: '苏州工业园', dispatchable: true, responseTime: 5 },
  { id: 'r-002', name: '杭州光储储能', type: 'battery', capacity: 500, currentPower: 180, status: 'dispatching', stationId: 's-003', location: '杭州', dispatchable: true, responseTime: 8 },
  { id: 'r-003', name: '上海EV充电站#1', type: 'ev_charger', capacity: 240, currentPower: 156, status: 'online', stationId: 's-004', location: '上海', dispatchable: true, responseTime: 3 },
  { id: 'r-004', name: '无锡工厂热泵', type: 'heat_pump', capacity: 350, currentPower: 210, status: 'standby', stationId: 's-005', location: '无锡', dispatchable: true, responseTime: 15 },
  { id: 'r-005', name: '苏州可调负荷#2', type: 'flexible_load', capacity: 600, currentPower: 420, status: 'online', stationId: 's-006', location: '苏州', dispatchable: false, responseTime: 30 },
];

const dispatchOrders: any[] = [
  { id: 'do-001', vppId: 'vpp-001', vppName: '华东虚拟电厂', direction: 'discharge', power: 500, duration: 30, reason: '高峰电价套利', status: 'completed', timestamp: '2026-03-31 08:30:00' },
  { id: 'do-002', vppId: 'vpp-001', vppName: '华东虚拟电厂', direction: 'charge', power: 300, duration: 60, reason: '谷时储电', status: 'completed', timestamp: '2026-03-31 02:00:00' },
  { id: 'do-003', vppId: 'vpp-001', vppName: '华东虚拟电厂', direction: 'discharge', power: 200, duration: 20, reason: '需求响应', status: 'executing', timestamp: '2026-03-31 09:00:00' },
];

export const vppController = {
  getOverview: (req: Request, res: Response) => {
    const totalCapacity = resources.reduce((sum, r) => sum + r.capacity, 0);
    const availableCapacity = resources.filter(r => r.dispatchable && r.status === 'online').reduce((sum, r) => sum + r.capacity, 0);
    const dispatchingCapacity = resources.filter(r => r.status === 'dispatching').reduce((sum, r) => sum + r.currentPower, 0);

    res.json({
      success: true,
      data: {
        id: 'vpp-001',
        name: '华东虚拟电厂',
        totalCapacity,
        availableCapacity,
        dispatchingCapacity,
        resourceCount: resources.length,
        regions: ['上海', '苏州', '无锡', '杭州'],
        status: 'active',
      },
    });
  },

  getResources: (req: Request, res: Response) => {
    const { type, status } = req.query;
    let filtered = [...resources];
    if (type) filtered = filtered.filter(r => r.type === type);
    if (status) filtered = filtered.filter(r => r.status === status);
    res.json({ success: true, data: filtered });
  },

  registerResource: (req: Request, res: Response) => {
    const resource = { id: `r-${Date.now()}`, ...req.body, status: 'online' };
    resources.push(resource);
    res.json({ success: true, data: resource });
  },

  removeResource: (req: Request, res: Response) => {
    const idx = resources.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: '资源不存在' });
    resources.splice(idx, 1);
    res.json({ success: true });
  },

  createDispatch: (req: Request, res: Response) => {
    const { resourceId, direction, power, duration, reason } = req.body;
    const order = {
      id: `do-${Date.now()}`,
      vppId: 'vpp-001',
      vppName: '华东虚拟电厂',
      resourceId,
      direction,
      power,
      duration,
      reason,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    dispatchOrders.unshift(order);

    // Update resource status
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
      resource.status = 'dispatching';
      resource.currentPower = direction === 'discharge' ? power : -power;
    }

    res.json({ success: true, data: order });
  },

  getOrders: (req: Request, res: Response) => {
    res.json({ success: true, data: dispatchOrders });
  },
};
