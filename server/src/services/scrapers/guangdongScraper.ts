/**
 * 广东电力交易中心爬虫
 *
 * 数据来源：广东电力交易中心（广东电力交易中心）
 * URL: https://www.gzpec.com.cn/
 *
 * 公开数据：
 * - 广东现货市场结算价格（日前/实时）
 * - 分时电价公示
 *
 * 注意事项：
 * - 广东有独立的现货市场（南方区域现货市场）
 * - 数据来源也可能为广州电力交易中心
 */

import { BaseScraper, MarketPriceDoc } from './baseScraper.js';

const GD_PRICES = {
  sharp: 1.356,
  peak: 0.942,
  flat: 0.642,
  valley: 0.264,
};

export class GuangdongScraper extends BaseScraper {
  name = 'guangdong-dayahead';
  province = 'GD' as const;
  provinceName = '广东';
  source = '广东电力交易中心';
  sourceUrl = 'https://www.gzpec.com.cn';

  async fetchData(dateStr: string): Promise<any> {
    try {
      // 广东电力交易中心现货市场数据API
      // NOTE: 需验证实际端点
      const spotUrl = `https://www.gzpec.com.cn/api/spot/clearing?date=${dateStr}`;
      const res = await fetch(spotUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return await res.json();
    } catch {}

    try {
      // 南方电网公开数据
      const url = `https://www.csg.cn/`;
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
      if (data.success && data.data) {
        const d = data.data;
        if (d.periods && Array.isArray(d.periods)) {
          return this.buildFromPeriods(d.periods, dateStr);
        }
        if (d.segments && Array.isArray(d.segments)) {
          return this.buildFromSegments(d.segments, dateStr);
        }
      }
      if (data.html) return this.parseHtmlFallback(data.html, dateStr);
    } catch {
      try {
        const data = JSON.parse(raw);
        if (data.html) return this.parseHtmlFallback(data.html, dateStr);
      } catch {}
    }
    return null;
  }

  private buildFromPeriods(periods: Array<{ start: number; end: number; price: number }>, dateStr: string): MarketPriceDoc {
    const hourPrices: number[] = [];
    for (let h = 0; h < 24; h++) {
      const matched = periods.find(p => h >= p.start && h < p.end);
      hourPrices.push(matched?.price ?? GD_PRICES.valley);
    }
    const month = new Date(dateStr).getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    return this.buildDoc(hourPrices, dateStr, isSharpSeason);
  }

  private buildFromSegments(segments: number[], dateStr: string): MarketPriceDoc {
    const hourPrices: number[] = [];
    for (let h = 0; h < 24; h++) {
      const s = h * 4;
      const avg = (segments[s] + segments[s + 1] + segments[s + 2] + segments[s + 3]) / 4 / 1000;
      hourPrices.push(Math.round(avg * 1000) / 1000);
    }
    const month = new Date(dateStr).getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    return this.buildDoc(hourPrices, dateStr, isSharpSeason);
  }

  private parseHtmlFallback(html: string, dateStr: string): MarketPriceDoc | null {
    const patterns = [
      /尖峰[：:]\s*(\d+\.?\d*)\s*[元\/kWh|元\/千瓦时]/,
      /高峰[：:]\s*(\d+\.?\d*)\s*[元\/kWh|元\/千瓦时]/,
      /平段[：:]\s*(\d+\.?\d*)\s*[元\/kWh|元\/千瓦时]/,
      /低谷[：:]\s*(\d+\.?\d*)\s*[元\/kWh|元\/千瓦时]/,
    ];
    const prices: Record<string, number> = {};
    const labels = ['sharp', 'peak', 'flat', 'valley'];
    for (let i = 0; i < patterns.length; i++) {
      const match = html.match(patterns[i]);
      if (match) prices[labels[i]] = parseFloat(match[1]);
    }
    if (Object.keys(prices).length >= 2) {
      const { sharp, peak, flat, valley } = { ...GD_PRICES, ...prices };
      const month = new Date(dateStr).getMonth() + 1;
      const isSharpSeason = [1, 7, 8, 12].includes(month);
      return this.buildDoc(this.buildHourPrices(sharp, peak, flat, valley, isSharpSeason), dateStr, isSharpSeason);
    }
    return null;
  }

  private buildHourPrices(sharp: number, peak: number, flat: number, valley: number, isSharpSeason: boolean): number[] {
    const hourPrices: number[] = [];
    for (let h = 0; h < 24; h++) {
      const inSharp = [10, 11, 19, 20].includes(h);
      const inPeak = [9, 12, 13, 14, 15, 16, 17, 18, 21].includes(h);
      const inFlat = [8, 10, 22, 23].includes(h);
      let price = valley;
      if (isSharpSeason && inSharp) price = sharp;
      else if (inPeak) price = peak;
      else if (inFlat) price = flat;
      hourPrices.push(price);
    }
    return hourPrices;
  }

  private buildDoc(hourPrices: number[], dateStr: string, isSharpSeason: boolean): MarketPriceDoc {
    const getType = (hour: number): { type: string; period: string } => {
      const inSharp = [10, 11, 19, 20].includes(hour);
      const inPeak = [9, 12, 13, 14, 15, 16, 17, 18, 21].includes(hour);
      const inFlat = [8, 10, 22, 23].includes(hour);
      if (isSharpSeason && inSharp) return { type: 'sharp', period: '尖峰' };
      if (inPeak) return { type: 'peak', period: '高峰' };
      if (inFlat) return { type: 'flat', period: '平段' };
      return { type: 'valley', period: '低谷' };
    };
    const periods = hourPrices.map((price, hour) => {
      const { type, period } = getType(hour);
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

  static getFallbackPrice(dateStr: string): MarketPriceDoc {
    const month = new Date(dateStr).getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    const scraper = new GuangdongScraper();
    return scraper.buildDoc(scraper.buildHourPrices(GD_PRICES.sharp, GD_PRICES.peak, GD_PRICES.flat, GD_PRICES.valley, isSharpSeason), dateStr, isSharpSeason);
  }
}
