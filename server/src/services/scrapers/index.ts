/**
 * 市场数据爬虫调度器
 *
 * 使用方式：
 * - 每日 16:00 运行（日前市场出清后）
 * - 每小时增量更新现货价格
 *
 * import { MarketScraperScheduler } from './services/scrapers';
 * const scheduler = new MarketScraperScheduler();
 * scheduler.runDaily();     // 每日一次
 * scheduler.runHourly();    // 每小时一次
 */

import { ZhejiangScraper } from './zhejiangScraper.js';
import { ShanghaiScraper } from './shanghaiScraper.js';
import { GuangdongScraper } from './guangdongScraper.js';
import { MarketPrice, ScraperLog } from '../../models/marketPrice.js';

export interface ScrapeReport {
  province: string;
  jobName: string;
  status: 'success' | 'failed' | 'partial';
  recordsFetched: number;
  errorMessage?: string;
  ranAt: Date;
}

export class MarketScraperScheduler {
  private scrapers = [new ZhejiangScraper(), new ShanghaiScraper(), new GuangdongScraper()];

  // 每日一次：爬取各省分时电价（推荐 16:00 运行，日前市场出清后）
  async runDaily(): Promise<ScrapeReport[]> {
    const dateStr = new Date().toISOString().split('T')[0];
    const results: ScrapeReport[] = [];

    for (const scraper of this.scrapers) {
      const r = await scraper.run(dateStr);
      results.push({
        province: scraper.province,
        jobName: scraper.name,
        status: r.success ? 'success' : 'failed',
        recordsFetched: r.recordsFetched,
        errorMessage: r.error,
        ranAt: new Date(),
      });
      // 爬虫间隔3秒，避免被封
      await new Promise(r => setTimeout(r, 3000));
    }

    console.log('[MarketScraper] Daily run completed:', results);
    return results;
  }

  // 每小时一次：更新现货价格（可选，仅当有现货数据接口时）
  async runHourly(): Promise<ScrapeReport[]> {
    // 目前各省交易中心现货API未公开，暂时跳过
    // 后续当有真实接口时在此扩展
    console.log('[MarketScraper] Hourly run skipped (no public spot API)');
    return [];
  }

  // 获取最新一条真实数据（用于替换合成数据）
  async getLatestRealPrice(province: 'ZJ' | 'GD' | 'SH') {
    return MarketPrice.findOne({ province, verified: true })
      .sort({ date: -1 })
      .exec();
  }

  // 获取今日数据（真实 > 合成）
  async getTodayPrice(province: 'ZJ' | 'GD' | 'SH'): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    // 优先取真实已审核数据
    const real = await MarketPrice.findOne({ province, date: today, verified: true }).exec();
    if (real) return real;

    // 其次取真实未审核数据
    const unverified = await MarketPrice.findOne({ province, date: today, verified: false }).exec();
    if (unverified) return unverified;

    // 最后用合成数据
    const scraper = this.scrapers.find(s => s.province === province);
    if (!scraper) return null;

    const FallbackMap: Record<string, any> = {
      ZJ: () => ZhejiangScraper.getFallbackPrice(today),
      GD: () => GuangdongScraper.getFallbackPrice(today),
      SH: () => ShanghaiScraper.getFallbackPrice(today),
    };
    return FallbackMap[province]?.() || null;
  }
}
