import { Router } from 'express';
import { monitoringController } from '../controllers/monitoringController.js';

export const monitoringRoutes = Router();

monitoringRoutes.get('/:stationId/realtime', monitoringController.getRealTimeData);
monitoringRoutes.get('/:stationId/history', monitoringController.getHistoricalData);

// ── Energy News ──────────────────────────────────────
monitoringRoutes.get('/news/energy', async (_req, res) => {
  try {
    // Realistic energy news — in production, connect to newsdata.io or similar free API
    const news = [
      {
        id: '1',
        category: 'policy',
        tag: '政策',
        title: '国家发改委发布2026年新型储能试点示范项目名单，光之涟漪EnOS平台入选',
        source: '国家发改委',
        publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        url: '#',
      },
      {
        id: '2',
        category: 'market',
        tag: '市场',
        title: '浙江电力现货市场清明假期运行平稳，日前均价¥0.62/kWh，谷时价格创年内新低',
        source: '浙江电力交易中心',
        publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        url: '#',
      },
      {
        id: '3',
        category: 'carbon',
        tag: '碳市',
        title: '全国碳市场CEA配额价格突破¥80/吨，机构预测Q2有望触及¥100',
        source: '上海环境能源交易所',
        publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        url: '#',
      },
      {
        id: '4',
        category: 'news',
        tag: '行业',
        title: '虚拟电厂（VPP）聚合容量突破50GW，电网调度侧市场化交易规模持续扩大',
        source: '电力头条',
        publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
        url: '#',
      },
      {
        id: '5',
        category: 'policy',
        tag: '政策',
        title: '五部委联合印发《关于促进新型储能并网调度运行的若干意见》，明确2026年全面接入AGC',
        source: '国家能源局',
        publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        url: '#',
      },
      {
        id: '6',
        category: 'market',
        tag: '市场',
        title: '华东电网日前出清均价¥0.573/kWh，光伏大发时段负电价现象引关注',
        source: '华东电力交易中心',
        publishedAt: new Date(Date.now() - 30 * 3600000).toISOString(),
        url: '#',
      },
      {
        id: '7',
        category: 'carbon',
        tag: '碳市',
        title: 'CCER项目重启后首批备案，光伏治沙项目获批100万吨减排量',
        source: '生态环境部',
        publishedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
        url: '#',
      },
      {
        id: '8',
        category: 'news',
        tag: '行业',
        title: '工商业储能投资回收期缩短至5年，峰谷价差扩大成核心驱动力',
        source: '能源观察报',
        publishedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        url: '#',
      },
    ];
    res.json({ success: true, data: news, total: news.length, updatedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});
