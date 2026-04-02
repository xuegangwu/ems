/**
 * Base scraper utilities for electricity market data
 * 电力市场数据爬虫基础工具
 */
import { MarketPrice, SpotPrice, ScraperLog } from '../../models/marketPrice.js';

export interface ScrapeResult {
  success: boolean;
  recordsFetched: number;
  error?: string;
}

// ─── 统一爬取入口 ─────────────────────────────────────────────────────────────
export abstract class BaseScraper {
  abstract name: string;
  abstract province: 'ZJ' | 'GD' | 'SH';
  abstract provinceName: string;
  abstract source: string;
  abstract sourceUrl: string;

  protected abstract fetchData(dateStr: string): Promise<any>;
  protected abstract parse(html: string, dateStr: string): Promise<MarketPriceDoc | null>;

  async run(dateStr?: string): Promise<ScrapeResult> {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const log = new ScraperLog({ province: this.province, jobName: this.name, status: 'failed', recordsFetched: 0 });
    try {
      const data = await this.fetchData(date);
      if (!data) {
        log.errorMessage = 'No data returned';
        await log.save();
        return { success: false, recordsFetched: 0, error: 'No data returned' };
      }
      const docData = await this.parse(JSON.stringify(data), date);
      if (docData) {
        await MarketPrice.deleteOne({ province: this.province, date });
        const doc = new MarketPrice(docData);
        await doc.save();
        log.status = 'success';
        log.recordsFetched = 1;
        await log.save();
        return { success: true, recordsFetched: 1 };
      } else {
        log.errorMessage = 'Parse returned null';
        await log.save();
        return { success: false, recordsFetched: 0, error: 'Parse returned null' };
      }
    } catch (e: any) {
      log.errorMessage = e.message || String(e);
      await log.save();
      return { success: false, recordsFetched: 0, error: e.message || String(e) };
    }
  }
}

export interface MarketPriceDoc {
  province: string;
  provinceName: string;
  date: string;
  periods: Array<{ hour: number; price: number; type: string; period: string }>;
  isSharpSeason: boolean;
  source: string;
  sourceUrl: string;
  fetchedAt: Date;
  verified: boolean;
}
