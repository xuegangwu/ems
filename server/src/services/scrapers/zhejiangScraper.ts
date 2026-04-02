/**
 * 浙江电力交易中心爬虫
 *
 * 数据来源：浙江电力交易中心官网 - 日前现货市场行情
 * URL: https://zjpx.sgcc.com.cn（需验证）
 *
 * 公开数据：
 * - 日前出清价格（每15分钟96个时段）
 * - 日前/实时市场出清价格
 *
 * 注意事项：
 * - 部分数据需要登录后查看
 * - 建议每日固定时间爬取（如 16:00 前后，日前市场出清后）
 * - 爬取频率建议 ≤ 1次/小时
 */

import { BaseScraper, MarketPriceDoc } from './baseScraper.js';

// 浙江分时电价配置（官方公开的参考电价，非实时）
// 当爬虫失败时作为 fallback 数据源
const ZJ_TOU_CONFIG = {
  sharpHours: [{ start: 11, end: 13 }, { start: 19, end: 21 }],
  peakHours: [{ start: 8, end: 11 }, { start: 13, end: 19 }, { start: 21, end: 23 }],
  flatHours: [{ start: 7, end: 8 }, { start: 11, end: 13 }, { start: 23, end: 24 }],
  valleyHours: [{ start: 0, end: 7 }],
};

const ZJ_PRICES = {
  sharp: 1.341,
  peak: 0.991,
  flat: 0.696,
  valley: 0.312,
};

export class ZhejiangScraper extends BaseScraper {
  name = 'zhejiang-dayahead';
  province = 'ZJ' as const;
  provinceName = '浙江';
  source = '浙江电力交易中心';
  sourceUrl = 'https://zjpx.sgcc.com.cn';

  // 爬取浙江电力交易中心的日前市场数据
  async fetchData(dateStr: string): Promise<any> {
    try {
      // 方式1：尝试从公开API获取（如果交易中心提供）
      // NOTE: 此URL需要验证，实际使用时请替换为真实端点
      const apiUrl = `https://zjpx.sgcc.com.cn/api/market/clearing/dayahead?date=${dateStr}`;
      const res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return await res.json();
    } catch {}

    try {
      // 方式2：从浙江省发改委价格公示页面爬取
      const url = `https://zjpaws.zj.gov.cn/`;
      const res = await fetch(url, {
        headers: { 'Accept': 'text/html' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return { html: await res.text() };
    } catch {}

    // 方式3：使用备用公开数据源
    // 中华电力网、浙江能源局等会有季度电价公示
    try {
      const url = `https://tzsb.zjtmn.com/`;
      const res = await fetch(url, {
        headers: { 'Accept': 'text/html' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return { html: await res.text() };
    } catch {}

    return null;
  }

  async parse(raw: string, dateStr: string): Promise<MarketPriceDoc | null> {
    try {
      const data = JSON.parse(raw);

      // 如果是API返回的标准化数据
      if (data.success && data.data?.segments) {
        return this.buildFromSegments(data.data, dateStr);
      }

      // HTML解析（备用方式，从页面提取价格）
      if (data.html) {
        return this.parseHtmlFallback(data.html, dateStr);
      }
    } catch {
      // JSON parse failed, try HTML fallback
      try {
        const data = JSON.parse(raw);
        if (data.html) return this.parseHtmlFallback(data.html, dateStr);
      } catch {}
    }
    return null;
  }

  private buildFromSegments(segments: number[], dateStr: string): MarketPriceDoc {
    // segments 是96个15分钟时段的价格（单位：元/MWh）
    const hourPrices: number[] = [];
    for (let h = 0; h < 24; h++) {
      // 取该小时4个时段的平均（换算成元/kWh = 元/MWh / 1000）
      const s = h * 4;
      const avg = (segments[s] + segments[s + 1] + segments[s + 2] + segments[s + 3]) / 4 / 1000;
      hourPrices.push(Math.round(avg * 1000) / 1000);
    }
    const month = new Date(dateStr).getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    return this.buildDoc(hourPrices, dateStr, isSharpSeason);
  }

  private parseHtmlFallback(html: string, dateStr: string): MarketPriceDoc | null {
    // 从HTML中提取价格数据（正则匹配）
    const priceRegex = /(\d+\.?\d*)\s*[元/kWh|元\/kWh|元\/千瓦时]/g;
    const matches = [...html.matchAll(priceRegex)];
    if (matches.length >= 4) {
      const prices = matches.map(m => parseFloat(m[1]));
      const month = new Date(dateStr).getMonth() + 1;
      const isSharpSeason = [1, 7, 8, 12].includes(month);
      // 取前24个有效价格
      const hourPrices = prices.slice(0, 24).map(p => p > 0 ? p : ZJ_PRICES.valley);
      return this.buildDoc(hourPrices, dateStr, isSharpSeason);
    }
    return null;
  }

  private buildDoc(hourPrices: number[], dateStr: string, isSharpSeason: boolean): MarketPriceDoc {
    const { sharp, peak, flat, valley } = ZJ_PRICES;
    const getType = (hour: number, price: number): { type: string; period: string } => {
      const inSharp = [11, 12, 19, 20].includes(hour);
      const inPeak = [8, 9, 10, 13, 14, 15, 16, 17, 18, 21, 22].includes(hour);
      const inFlat = [7, 23].includes(hour);
      if (isSharpSeason && inSharp) return { type: 'sharp', period: '尖峰' };
      if (inPeak) return { type: 'peak', period: '高峰' };
      if (inFlat) return { type: 'flat', period: '平段' };
      return { type: 'valley', period: '低谷' };
    };

    const periods = hourPrices.map((price, hour) => {
      const { type, period } = getType(hour, price);
      return { hour, price, type, period };
    });

    return {
      province: this.province,
      provinceName: this.provinceName,
      date: dateStr,
      periods,
      isSharpSeason,
      source: this.source,
      sourceUrl: this.sourceUrl,
      fetchedAt: new Date(),
      verified: false,
    } as MarketPriceDoc;
  }

  // Fallback：返回配置好的分时电价（爬虫失败时使用）
  static getFallbackPrice(dateStr: string): MarketPriceDoc {
    const month = new Date(dateStr).getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    const scraper = new ZhejiangScraper();
    const { sharp, peak, flat, valley } = ZJ_PRICES;
    const hourPrices: number[] = [];

    for (let h = 0; h < 24; h++) {
      const inSharp = [11, 12, 19, 20].includes(h);
      const inPeak = [8, 9, 10, 13, 14, 15, 16, 17, 18, 21, 22].includes(h);
      const inFlat = [7, 23].includes(h);
      let price = valley;
      if (isSharpSeason && inSharp) price = sharp;
      else if (inPeak) price = peak;
      else if (inFlat) price = flat;
      hourPrices.push(price);
    }
    return scraper.buildDoc(hourPrices, dateStr, isSharpSeason);
  }
}
