/**
 * 上海电力交易中心爬虫
 *
 * 数据来源：上海电力交易中心官网
 * URL: https://www.shatdr.com/
 *
 * 公开数据：
 * - 分时电价公示（工商业用户）
 * - 日前现货市场出清价格（公开版）
 * - 每日电网运行信息
 *
 * 上海电力交易中心公开数据页面：
 * - 分时电价：http://www.shatdr.com/col/col12139/index.html
 * - 现货市场：http://www.shatdr.com/col/col13831/index.html
 */

import { BaseScraper, MarketPriceDoc } from './baseScraper.js';

const SH_TOU_CONFIG = {
  sharpHours: [{ start: 10, end: 11 }, { start: 14, end: 16 }, { start: 19, end: 21 }],
  peakHours: [{ start: 8, end: 10 }, { start: 11, end: 14 }, { start: 16, end: 19 }, { start: 21, end: 22 }],
  flatHours: [{ start: 6, end: 8 }, { start: 10, end: 11 }, { start: 14, end: 16 }, { start: 19, end: 21 }],
  valleyHours: [{ start: 22, end: 24 }, { start: 0, end: 6 }],
};

const SH_PRICES = {
  sharp: 1.161,
  peak: 0.931,
  flat: 0.623,
  valley: 0.265,
};

export class ShanghaiScraper extends BaseScraper {
  name = 'shanghai-dayahead';
  province = 'SH' as const;
  provinceName = '上海';
  source = '上海电力交易中心';
  sourceUrl = 'https://www.shatdr.com';

  async fetchData(dateStr: string): Promise<any> {
    try {
      // 上海电力交易中心 - 日前现货市场数据
      // NOTE: 以下URL为推测，实际URL需从官网确认
      const spotUrl = `https://www.shatdr.com/api/spot/dayahead?date=${dateStr}`;
      const spotRes = await fetch(spotUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (spotRes.ok) return await spotRes.json();
    } catch {}

    try {
      // 上海发改委电价公示
      const priceUrl = `https://fgw.shanghai.gov.cn/wsjj/`;
      const res = await fetch(priceUrl, {
        headers: { 'Accept': 'text/html' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return { html: await res.text() };
    } catch {}

    // 国家电网上海公司公开电价页面
    try {
      const url = `https://www.sgcc.com.cn/shanghai/`;
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
        // 标准化API数据
        if (d.priceSegments && Array.isArray(d.priceSegments)) {
          return this.buildFromSegments(d.priceSegments, dateStr);
        }
        if (d.periods && Array.isArray(d.periods)) {
          return this.buildFromPeriods(d.periods, dateStr);
        }
      }

      if (data.html) {
        return this.parseHtmlFallback(data.html, dateStr);
      }
    } catch {
      try {
        const data = JSON.parse(raw);
        if (data.html) return this.parseHtmlFallback(data.html, dateStr);
      } catch {}
    }
    return null;
  }

  private buildFromSegments(segments: number[], dateStr: string): MarketPriceDoc {
    // 96个15分钟时段（单位：元/MWh）
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

  private buildFromPeriods(periods: Array<{ start: number; end: number; price: number }>, dateStr: string): MarketPriceDoc {
    const hourPrices: number[] = [];
    for (let h = 0; h < 24; h++) {
      const matched = periods.find(p => h >= p.start && h < p.end);
      hourPrices.push(matched?.price ?? SH_PRICES.valley);
    }
    const month = new Date(dateStr).getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    return this.buildDoc(hourPrices, dateStr, isSharpSeason);
  }

  private parseHtmlFallback(html: string, dateStr: string): MarketPriceDoc | null {
    // 从HTML提取分时电价
    const patterns = [
      /尖峰[：:]\s*(\d+\.?\d*)\s*[元/kWh|元\/kWh|元\/千瓦时]/,
      /高峰[：:]\s*(\d+\.?\d*)\s*[元/kWh|元\/kWh|元\/千瓦时]/,
      /平段[：:]\s*(\d+\.?\d*)\s*[元/kWh|元\/kWh|元\/千瓦时]/,
      /低谷[：:]\s*(\d+\.?\d*)\s*[元/kWh|元\/kWh|元\/千瓦时]/,
    ];

    const prices: Record<string, number> = {};
    const labels = ['sharp', 'peak', 'flat', 'valley'];
    for (let i = 0; i < patterns.length; i++) {
      const match = html.match(patterns[i]);
      if (match) prices[labels[i]] = parseFloat(match[1]);
    }

    if (Object.keys(prices).length >= 2) {
      const { sharp, peak, flat, valley } = { ...SH_PRICES, ...prices };
      const month = new Date(dateStr).getMonth() + 1;
      const isSharpSeason = [1, 7, 8, 12].includes(month);
      const hourPrices = this.buildHourPrices(sharp, peak, flat, valley, isSharpSeason);
      return this.buildDoc(hourPrices, dateStr, isSharpSeason);
    }
    return null;
  }

  private buildHourPrices(
    sharp: number, peak: number, flat: number, valley: number, isSharpSeason: boolean
  ): number[] {
    const hourPrices: number[] = [];
    for (let h = 0; h < 24; h++) {
      const inSharp = [10, 14, 15, 19, 20].includes(h);
      const inPeak = [8, 9, 11, 12, 13, 16, 17, 18, 21].includes(h);
      const inFlat = [6, 7, 10, 14, 15, 19, 20, 22].includes(h);
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
      const inSharp = [10, 14, 15, 19, 20].includes(hour);
      const inPeak = [8, 9, 11, 12, 13, 16, 17, 18, 21].includes(hour);
      const inFlat = [6, 7, 10, 14, 15, 19, 20, 22].includes(hour);
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

  // Fallback：返回配置好的上海分时电价
  static getFallbackPrice(dateStr: string): MarketPriceDoc {
    const month = new Date(dateStr).getMonth() + 1;
    const isSharpSeason = [1, 7, 8, 12].includes(month);
    const { sharp, peak, flat, valley } = SH_PRICES;
    const scraper = new ShanghaiScraper();
    const hourPrices = scraper.buildHourPrices(sharp, peak, flat, valley, isSharpSeason);
    return scraper.buildDoc(hourPrices, dateStr, isSharpSeason);
  }
}
