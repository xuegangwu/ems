/**
 * Dynamic Price Market Controller
 * 分时电价数据 - 浙江/广东/上海
 *
 * 参考政策（2024年）：
 * - 浙江：浙价商〔2023〕222号
 * - 广东：粤发改价格〔2023〕158号
 *
 * 注意：尖峰电价仅在夏季（7-8月）和冬季（1月、12月）执行
 */

import express from 'express';
import { MarketScraperScheduler } from '../services/scrapers/index.js';
import { MarketPrice } from '../models/marketPrice.js';

const scraper = new MarketScraperScheduler();

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TOUPeriod {
  name: string;        // 时段名称
  nameEn: string;
  start: number;       // 开始小时 (0-23)
  end: number;         // 结束小时 (0-23)
  price: number;       // 元/kWh
  type: 'peak' | 'flat' | 'valley' | 'sharp';
}

export interface ProvincePricing {
  province: string;
  provinceCode: string;
  description: string;
  periods: TOUPeriod[];
  voltageSurcharge: number;  // 基本电费元/kVA·月
  demandSurcharge: number;   // 最大需量 元/kW·月
}

// ─── 浙江分时电价（10kV一般工商业用户）────────────────────────────────────
// 峰谷分时：尖峰 → 高峰 → 平段 → 低谷
const ZHEJIANG_10KV: ProvincePricing = {
  province: '浙江',
  provinceCode: 'ZJ',
  description: '浙江10kV一般工商业用户（2024年参考）',
  voltageSurcharge: 0,
  demandSurcharge: 0,
  periods: [
    // 尖峰（夏季7-8月，冬季1/12月）
    { name: '尖峰', nameEn: 'Sharp Peak', start: 11, end: 13, price: 1.341, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 19, end: 21, price: 1.341, type: 'sharp' },
    // 高峰（8:00-11:00，13:00-19:00，21:00-23:00）
    { name: '高峰', nameEn: 'Peak', start: 8, end: 11, price: 0.991, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 13, end: 19, price: 0.991, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 21, end: 23, price: 0.991, type: 'peak' },
    // 平段（7:00-8:00，11:00-13:00）
    { name: '平段', nameEn: 'Flat', start: 7, end: 8, price: 0.696, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 11, end: 13, price: 0.696, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 23, end: 24, price: 0.696, type: 'flat' },
    // 低谷（0:00-7:00）
    { name: '低谷', nameEn: 'Valley', start: 0, end: 7, price: 0.312, type: 'valley' },
  ],
};

// 浙江大工业用户（需量计费）
const ZHEJIANG_LARGE_INDUSTRIAL: ProvincePricing = {
  province: '浙江',
  provinceCode: 'ZJ',
  description: '浙江大工业用户（10kV，需量计费）',
  voltageSurcharge: 40, // 元/kVA·月
  demandSurcharge: 0,
  periods: [
    { name: '尖峰', nameEn: 'Sharp Peak', start: 11, end: 13, price: 1.260, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 19, end: 21, price: 1.260, type: 'sharp' },
    { name: '高峰', nameEn: 'Peak', start: 8, end: 11, price: 0.928, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 13, end: 19, price: 0.928, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 21, end: 23, price: 0.928, type: 'peak' },
    { name: '平段', nameEn: 'Flat', start: 7, end: 8, price: 0.608, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 11, end: 13, price: 0.608, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 23, end: 24, price: 0.608, type: 'flat' },
    { name: '低谷', nameEn: 'Valley', start: 0, end: 7, price: 0.268, type: 'valley' },
  ],
};

// ─── 广东分时电价（10kV一般工商业）────────────────────────────────────────
// 广东分时：尖峰 → 高峰 → 平段 → 低谷
const GUANGDONG_10KV: ProvincePricing = {
  province: '广东',
  provinceCode: 'GD',
  description: '广东10kV一般工商业用户（2024年参考）',
  voltageSurcharge: 0,
  demandSurcharge: 0,
  periods: [
    // 尖峰（夏季7-8月，冬季1/12月）
    { name: '尖峰', nameEn: 'Sharp Peak', start: 10, end: 12, price: 1.356, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 19, end: 21, price: 1.356, type: 'sharp' },
    // 高峰（9:00-10:00，12:00-19:00，21:00-22:00）
    { name: '高峰', nameEn: 'Peak', start: 9, end: 10, price: 0.942, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 12, end: 19, price: 0.942, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 21, end: 22, price: 0.942, type: 'peak' },
    // 平段（8:00-9:00，10:00-12:00，19:00-21:00，22:00-23:00）
    { name: '平段', nameEn: 'Flat', start: 8, end: 9, price: 0.642, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 10, end: 12, price: 0.642, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 19, end: 21, price: 0.642, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 22, end: 23, price: 0.642, type: 'flat' },
    // 低谷（23:00-24:00，0:00-8:00）
    { name: '低谷', nameEn: 'Valley', start: 23, end: 24, price: 0.264, type: 'valley' },
    { name: '低谷', nameEn: 'Valley', start: 0, end: 8, price: 0.264, type: 'valley' },
  ],
};

// 广东大工业用户
const GUANGDONG_LARGE_INDUSTRIAL: ProvincePricing = {
  province: '广东',
  provinceCode: 'GD',
  description: '广东大工业用户（10kV，两部制电价）',
  voltageSurcharge: 40,
  demandSurcharge: 45,
  periods: [
    { name: '尖峰', nameEn: 'Sharp Peak', start: 10, end: 12, price: 1.082, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 19, end: 21, price: 1.082, type: 'sharp' },
    { name: '高峰', nameEn: 'Peak', start: 9, end: 10, price: 0.762, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 12, end: 19, price: 0.762, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 21, end: 22, price: 0.762, type: 'peak' },
    { name: '平段', nameEn: 'Flat', start: 8, end: 9, price: 0.502, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 10, end: 12, price: 0.502, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 19, end: 21, price: 0.502, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 22, end: 23, price: 0.502, type: 'flat' },
    { name: '低谷', nameEn: 'Valley', start: 23, end: 24, price: 0.234, type: 'valley' },
    { name: '低谷', nameEn: 'Valley', start: 0, end: 8, price: 0.234, type: 'valley' },
  ],
};

// ─── 上海分时电价（10kV一般工商业）────────────────────────────────────────
// 上海分时：尖峰 → 高峰 → 平段 → 低谷
// 参考：沪发改价管〔2023〕489号
const SHANGHAI_10KV: ProvincePricing = {
  province: '上海',
  provinceCode: 'SH',
  description: '上海10kV一般工商业用户（2024年参考）',
  voltageSurcharge: 0,
  demandSurcharge: 0,
  periods: [
    // 尖峰（夏季7-8月，冬季1/12月）
    { name: '尖峰', nameEn: 'Sharp Peak', start: 10, end: 11, price: 1.161, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 14, end: 16, price: 1.161, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 19, end: 21, price: 1.161, type: 'sharp' },
    // 高峰（8:00-10:00, 11:00-14:00, 16:00-19:00, 21:00-22:00）
    { name: '高峰', nameEn: 'Peak', start: 8, end: 10, price: 0.931, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 11, end: 14, price: 0.931, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 16, end: 19, price: 0.931, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 21, end: 22, price: 0.931, type: 'peak' },
    // 平段（6:00-8:00, 10:00-11:00, 14:00-16:00, 19:00-21:00）
    { name: '平段', nameEn: 'Flat', start: 6, end: 8, price: 0.623, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 10, end: 11, price: 0.623, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 14, end: 16, price: 0.623, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 19, end: 21, price: 0.623, type: 'flat' },
    // 低谷（22:00-次日6:00）
    { name: '低谷', nameEn: 'Valley', start: 22, end: 24, price: 0.265, type: 'valley' },
    { name: '低谷', nameEn: 'Valley', start: 0, end: 6, price: 0.265, type: 'valley' },
  ],
};

// 上海大工业用户（两部制）
const SHANGHAI_LARGE_INDUSTRIAL: ProvincePricing = {
  province: '上海',
  provinceCode: 'SH',
  description: '上海大工业用户（10kV，两部制电价）',
  voltageSurcharge: 42,
  demandSurcharge: 0,
  periods: [
    { name: '尖峰', nameEn: 'Sharp Peak', start: 10, end: 11, price: 1.044, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 14, end: 16, price: 1.044, type: 'sharp' },
    { name: '尖峰', nameEn: 'Sharp Peak', start: 19, end: 21, price: 1.044, type: 'sharp' },
    { name: '高峰', nameEn: 'Peak', start: 8, end: 10, price: 0.837, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 11, end: 14, price: 0.837, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 16, end: 19, price: 0.837, type: 'peak' },
    { name: '高峰', nameEn: 'Peak', start: 21, end: 22, price: 0.837, type: 'peak' },
    { name: '平段', nameEn: 'Flat', start: 6, end: 8, price: 0.555, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 10, end: 11, price: 0.555, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 14, end: 16, price: 0.555, type: 'flat' },
    { name: '平段', nameEn: 'Flat', start: 19, end: 21, price: 0.555, type: 'flat' },
    { name: '低谷', nameEn: 'Valley', start: 22, end: 24, price: 0.207, type: 'valley' },
    { name: '低谷', nameEn: 'Valley', start: 0, end: 6, price: 0.207, type: 'valley' },
  ],
};

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

// 获取当前时段
function getCurrentPeriod(pricing: ProvincePricing): TOUPeriod | null {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth() + 1; // 1-12

  // 尖峰仅在夏季(7-8月)或冬季(1月、12月)执行
  const isSharpSeason = [1, 7, 8, 12].includes(month);

  for (const period of pricing.periods) {
    if (!isSharpSeason && period.type === 'sharp') continue;
    if (hour >= period.start && hour < period.end) {
      return period;
    }
  }
  return null;
}

// 获取24小时电价曲线
function get24HourCurve(pricing: ProvincePricing, isSharpSeason: boolean): Array<{ hour: number; price: number; period: string; type: string }> {
  const curve: Array<{ hour: number; price: number; period: string; type: string }> = [];

  for (let hour = 0; hour < 24; hour++) {
    let matchedPeriod: TOUPeriod | null = null;
    for (const period of pricing.periods) {
      if (!isSharpSeason && period.type === 'sharp') continue;
      if (hour >= period.start && hour < period.end) {
        matchedPeriod = period;
        break;
      }
    }
    curve.push({
      hour,
      price: matchedPeriod?.price ?? 0,
      period: matchedPeriod?.name ?? 'Unknown',
      type: matchedPeriod?.type ?? 'unknown',
    });
  }

  return curve;
}

// 找最优充放电策略
function getOptimalStrategy(pricing: ProvincePricing, batteryCapacity: number = 100): {
  chargeHours: number[];    // 推荐充电时刻（谷电）
  dischargeHours: number[]; // 推荐放电时刻（峰电）
  peakPrice: number;
  valleyPrice: number;
  spread: number;
  arbitrageProfit: number; // 元/kWh（理论最大，不含损耗）
  monthlySavingEstimate: number; // 每月估算节省
} {
  const curve = get24HourCurve(pricing, true);

  let valleyHours: number[] = [];
  let peakHours: number[] = [];

  for (const slot of curve) {
    if (slot.type === 'valley') valleyHours.push(slot.hour);
    if (slot.type === 'peak' || slot.type === 'sharp') peakHours.push(slot.hour);
  }

  const peakPrice = Math.max(...curve.filter(s => s.type === 'peak' || s.type === 'sharp').map(s => s.price));
  const valleyPrice = Math.min(...curve.filter(s => s.type === 'valley').map(s => s.price));
  const spread = peakPrice - valleyPrice;

  // 理论套利收益（谷充峰放，不含效率损耗）
  // 假设每天充放一次，每次效率85%
  const efficiency = 0.85;
  const arbitrageProfit = spread * efficiency;

  // 每月估算节省：每天峰谷套利收益 × 30天
  const monthlySavingEstimate = arbitrageProfit * batteryCapacity * 0.8 * 30;

  return {
    chargeHours: valleyHours,
    dischargeHours: peakHours,
    peakPrice,
    valleyPrice,
    spread,
    arbitrageProfit,
    monthlySavingEstimate,
  };
}

// ─── API Handlers ─────────────────────────────────────────────────────────────

export const marketController = express.Router();

// GET /api/market/provinces - 支持的省份列表
/**
 * @swagger
 * /api/market/provinces:
 *   get:
 *     summary: 支持的省份列表
 *     tags: [市场数据]
 *     description: 返回支持的省市分时电价省份及其分类
 *     responses:
 *       200:
 *         description: 省份列表
 */
marketController.get('/provinces', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        province: '浙江',
        code: 'ZJ',
        categories: ['一般工商业', '大工业'],
        notes: '尖峰仅夏季(7-8月)和冬季(1/12月)执行',
      },
      {
        province: '广东',
        code: 'GD',
        categories: ['一般工商业', '大工业'],
        notes: '尖峰仅夏季(7-8月)和冬季(1/12月)执行',
      },
      {
        province: '上海',
        code: 'SH',
        categories: ['一般工商业', '大工业'],
        notes: '尖峰仅夏季(7-8月)和冬季(1/12月)执行',
      },
    ],
  });
});

/**
 * @swagger
 * /api/market/pricing/{province}:
 *   get:
 *     summary: 获取指定省份分时电价
 *     tags: [市场数据]
 *     description: |
 *       返回指定省份的24小时分时电价曲线及最优充放电策略。
 *       优先返回真实爬取数据（如已接入），否则返回政策参考电价。
 *       使用 triggerScrape=true 可触发实时数据更新。
 *     parameters:
 *       - in: path
 *         name: province
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ZJ, GD, SH]
 *         description: 省份代码（ZJ=浙江, GD=广东, SH=上海）
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, industrial]
 *         description: 用户类别（general=一般工商业, industrial=大工业）
 *       - in: query
 *         name: triggerScrape
 *         schema:
 *           type: boolean
 *         description: 是否触发实时数据爬取（需网络可达各省交易中心）
 *     responses:
 *       200:
 *         description: 分时电价数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     province:
 *                       type: string
 *                       example: 浙江
 *                     provinceCode:
 *                       type: string
 *                       example: ZJ
 *                     currentPeriod:
 *                       type: object
 *                       description: 当前时段电价
 *                     curve24h:
 *                       type: array
 *                       description: 24小时电价曲线（每小时一条）
 *                     strategy:
 *                       type: object
 *                       description: 最优充放电策略
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         dataSource:
 *                           type: string
 *                           enum: [real, real-unverified, synthetic]
 *                           description: 数据来源标识
 *                         source:
 *                           type: string
 *                           description: 实际数据源名称
 *       404:
 *         description: 省份不存在
 */
 // GET /api/market/pricing/:province - 获取指定省份电价
 // Query: category=general|industrial
 // Query: triggerScrape=true 强制触发爬虫更新（如有权限）
marketController.get('/pricing/:province', async (req, res) => {
  const { province } = req.params;
  const category = (req.query.category as string) || 'general';
  const triggerScrape = req.query.triggerScrape === 'true';

  let pricing: ProvincePricing | null = null;
  const provCode = province.toUpperCase();

  if (province.toUpperCase() === 'ZJ' || province === '浙江') {
    pricing = category === 'industrial' ? ZHEJIANG_LARGE_INDUSTRIAL : ZHEJIANG_10KV;
  } else if (province.toUpperCase() === 'GD' || province === '广东') {
    pricing = category === 'industrial' ? GUANGDONG_LARGE_INDUSTRIAL : GUANGDONG_10KV;
  } else if (province.toUpperCase() === 'SH' || province === '上海') {
    pricing = category === 'industrial' ? SHANGHAI_LARGE_INDUSTRIAL : SHANGHAI_10KV;
  }

  if (!pricing) {
    return res.status(404).json({ success: false, error: 'Province not found' });
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // 尝试从 MongoDB 获取真实爬取数据
  let dataSource: 'real' | 'real-unverified' | 'synthetic' = 'synthetic';
  let realData: any = null;

  try {
    const mongoPrice = await scraper.getTodayPrice(provCode as 'ZJ' | 'GD' | 'SH');
    if (mongoPrice && mongoPrice.periods && mongoPrice.periods.length === 24) {
      realData = mongoPrice;
      dataSource = realData.verified ? 'real' : 'real-unverified';
    }
  } catch {}

  // 如果触发爬虫且无真实数据，尝试爬取
  if (triggerScrape && !realData) {
    try {
      const scraperMap: Record<string, any> = {
        ZJ: (await import('../services/scrapers/zhejiangScraper.js')).ZhejiangScraper,
        GD: (await import('../services/scrapers/guangdongScraper.js')).GuangdongScraper,
        SH: (await import('../services/scrapers/shanghaiScraper.js')).ShanghaiScraper,
      };
      const ScraperClass = scraperMap[provCode];
      if (ScraperClass) {
        const s = new ScraperClass();
        await s.run(today);
      }
    } catch (e: any) {
      console.warn('[Market] Scrape trigger failed:', e.message);
    }
    // 重新尝试获取
    try {
      const mongoPrice = await scraper.getTodayPrice(provCode as 'ZJ' | 'GD' | 'SH');
      if (mongoPrice?.periods?.length === 24) {
        realData = mongoPrice;
        dataSource = 'real-unverified';
      }
    } catch {}
  }

  const month = now.getMonth() + 1;
  const isSharpSeason = [1, 7, 8, 12].includes(month);

  // 使用真实数据或合成数据
  if (realData) {
    const curve24h = realData.periods.map((p: any) => ({
      hour: p.hour,
      price: p.price,
      period: p.period,
      type: p.type,
    }));

    // 计算策略（从真实数据）
    const peakPrice = Math.max(...curve24h.filter((s: any) => s.type === 'peak' || s.type === 'sharp').map((s: any) => s.price));
    const valleyPrice = Math.min(...curve24h.filter((s: any) => s.type === 'valley').map((s: any) => s.price));
    const spread = peakPrice - valleyPrice;
    const arbitrageProfit = spread * 0.85;
    const monthlySavingEstimate = arbitrageProfit * 100 * 0.8 * 30;

    const currentPeriod = curve24h[now.getHours()] || null;

    return res.json({
      success: true,
      data: {
        province: realData.provinceName || pricing!.province,
        provinceCode: provCode,
        description: `数据来源：${realData.source || '各省发改委'}`,
        currentTime: now.toISOString(),
        isSharpSeason,
        currentPeriod: currentPeriod ? {
          name: currentPeriod.period,
          nameEn: currentPeriod.type.charAt(0).toUpperCase() + currentPeriod.type.slice(1),
          price: currentPeriod.price,
          type: currentPeriod.type,
        } : null,
        curve24h,
        strategy: {
          chargeHours: curve24h.filter((s: any) => s.type === 'valley').map((s: any) => s.hour),
          dischargeHours: curve24h.filter((s: any) => s.type === 'peak' || s.type === 'sharp').map((s: any) => s.hour),
          peakPrice,
          valleyPrice,
          spread,
          arbitrageProfit,
          monthlySavingEstimate,
        },
        demandSurcharge: pricing!.demandSurcharge,
        voltageSurcharge: pricing!.voltageSurcharge,
        metadata: {
          dataSource,
          source: realData.source || '各省发改委分时电价文件',
          sourceUrl: realData.sourceUrl || null,
          disclaimer: '实际电价以当地电网公司最新公示为准',
          verified: realData.verified || false,
          lastUpdated: realData.fetchedAt || null,
        },
      },
    });
  }

  // Fallback: 合成数据
  const currentPeriod = getCurrentPeriod(pricing!);
  const curve = get24HourCurve(pricing!, isSharpSeason);
  const strategy = getOptimalStrategy(pricing!);

  res.json({
    success: true,
    data: {
      province: pricing!.province,
      provinceCode: pricing!.provinceCode,
      description: pricing!.description,
      currentTime: now.toISOString(),
      isSharpSeason,
      currentPeriod: currentPeriod ? {
        name: currentPeriod.name,
        nameEn: currentPeriod.nameEn,
        price: currentPeriod.price,
        type: currentPeriod.type,
      } : null,
      curve24h: curve,
      strategy,
      demandSurcharge: pricing!.demandSurcharge,
      voltageSurcharge: pricing!.voltageSurcharge,
      metadata: {
        dataSource,
        source: '参考2024年各省发改委分时电价文件（合成数据）',
        disclaimer: '实际电价以当地电网公司最新公示为准',
        updateNote: '每日16:00自动从各省电力交易中心更新数据',
      },
    },
  });
});

/**
 * @swagger
 * /api/market/compare:
 *   get:
 *     summary: 省间电价对比
 *     tags: [市场数据]
 *     description: 对比两个省份的分时电价差异
 *     parameters:
 *       - in: query
 *         name: p1
 *         schema:
 *           type: string
 *           enum: [ZJ, GD, SH]
 *         description: 第一个省份代码
 *       - in: query
 *         name: p2
 *         schema:
 *           type: string
 *           enum: [ZJ, GD, SH]
 *         description: 第二个省份代码
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, industrial]
 *         description: 用户类别
 *     responses:
 *       200:
 *         description: 两省电价对比数据
 */
 // GET /api/market/compare - 对比两个省份的电价
marketController.get('/compare', (req, res) => {
  const { p1, p2, category } = req.query as { p1?: string; p2?: string; category?: string };
  const cat = category || 'general';

  const getPricing = (code: string): ProvincePricing | null => {
    if (code === 'ZJ' || code === '浙江') return cat === 'industrial' ? ZHEJIANG_LARGE_INDUSTRIAL : ZHEJIANG_10KV;
    if (code === 'GD' || code === '广东') return cat === 'industrial' ? GUANGDONG_LARGE_INDUSTRIAL : GUANGDONG_10KV;
    if (code === 'SH' || code === '上海') return cat === 'industrial' ? SHANGHAI_LARGE_INDUSTRIAL : SHANGHAI_10KV;
    return null;
  };

  const provinces = [p1, p2].filter(Boolean);
  const results = provinces.map(p => {
    const pricing = getPricing(p as string);
    if (!pricing) return { code: p, error: 'Not found' };

    const now = new Date();
    const month = now.getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    const curve = get24HourCurve(pricing, isSharpSeason);
    const strategy = getOptimalStrategy(pricing);

    return {
      province: pricing.province,
      provinceCode: pricing.provinceCode,
      currentPrice: curve[now.getHours()].price,
      curve24h: curve,
      strategy,
    };
  });

  res.json({ success: true, data: results });
});

/**
 * @swagger
 * /api/market/solar-overlap:
 *   get:
 *     summary: 光伏发电与电价重叠分析
 *     tags: [市场数据]
 *     description: 分析光伏发电曲线与电网电价叠加的最佳自用/套利窗口
 *     parameters:
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *           enum: [ZJ, GD, SH]
 *         description: 省份代码
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [general, industrial]
 *         description: 用户类别
 *     responses:
 *       200:
 *         description: 光伏-电价叠加分析结果
 */
 // GET /api/market/solar-overlap - 光伏发电与电价重叠分析
// 光伏发电曲线：6:00-18:00，峰值10:00-14:00
marketController.get('/solar-overlap', (req, res) => {
  const { province, category } = req.query as { province?: string; category?: string };
  const cat = category || 'general';
  const prov = (province as string) || 'ZJ';

  const pricing = (prov === 'GD' || prov === '广东')
    ? (cat === 'industrial' ? GUANGDONG_LARGE_INDUSTRIAL : GUANGDONG_10KV)
    : (prov === 'SH' || prov === '上海')
    ? (cat === 'industrial' ? SHANGHAI_LARGE_INDUSTRIAL : SHANGHAI_10KV)
    : (cat === 'industrial' ? ZHEJIANG_LARGE_INDUSTRIAL : ZHEJIANG_10KV);

  const now = new Date();
  const month = now.getMonth() + 1;
  const isSharpSeason = [1, 7, 8, 12].includes(month);
  const curve = get24HourCurve(pricing, isSharpSeason);

  // 标准光伏出力曲线（归一化，0-1）
  // 6:00-18:00，正弦曲线，峰值1.0 at 12:00
  const solarCurve = curve.map((slot) => {
    let solarOutput = 0;
    if (slot.hour >= 6 && slot.hour < 18) {
      const normalized = (slot.hour - 6) / 12; // 0 to 1
      solarOutput = Math.sin(normalized * Math.PI);
    }
    return { ...slot, solarOutput: Math.round(solarOutput * 100) / 100 };
  });

  // 分析：光伏覆盖时间段内的平均电价
  const solarHours = solarCurve.filter(s => s.solarOutput > 0.1);
  const avgPriceDuringSolar = solarHours.reduce((sum, s) => sum + s.price, 0) / solarHours.length;
  const peakSolarHour = solarCurve.reduce((max, s) => s.solarOutput > max.solarOutput ? s : max);

  // 最佳套利时刻：光伏峰值 vs 电网峰值对比
  const gridPeakPrice = Math.max(...curve.map(s => s.price));
  const solarSelfUseProfit = avgPriceDuringSolar * 0.85; // 光伏自用收益（85%效率）

  res.json({
    success: true,
    data: {
      province: pricing.province,
      provinceCode: pricing.provinceCode,
      solarCurve,
      analysis: {
        avgPriceDuringSolar: Math.round(avgPriceDuringSolar * 1000) / 1000,
        peakSolarHour: {
          hour: peakSolarHour.hour,
          solarOutput: peakSolarHour.solarOutput,
          gridPrice: peakSolarHour.price,
        },
        gridPeakPrice,
        solarSelfUseProfit,
        conclusion: solarSelfUseProfit > 0
          ? `光伏自用模式可行：白天平均电价¥${avgPriceDuringSolar.toFixed(3)}/kWh，扣除效率损耗后净收益约¥${solarSelfUseProfit.toFixed(3)}/kWh`
          : '光伏自用需结合储能才能实现正收益',
      },
    },
  });
});
