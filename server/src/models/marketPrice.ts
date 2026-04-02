import mongoose from 'mongoose';

// ── Market Price Log Schema ───────────────────────────────────────────────────
// 存储从各省市电力交易中心爬取的真实分时/现货电价
const marketPriceSchema = new mongoose.Schema({
  province: { type: String, enum: ['ZJ', 'GD', 'SH'], index: true },
  provinceName: String,
  date: { type: String, index: true }, // YYYY-MM-DD
  // 24小时各时段价格
  periods: [{
    hour: Number,        // 0-23
    price: Number,      // 元/kWh
    type: String,       // 'valley' | 'flat' | 'peak' | 'sharp'
    period: String,     // '低谷' | '平段' | '高峰' | '尖峰'
  }],
  // 是否为尖峰季节（夏季7-8月/冬季1,12月）
  isSharpSeason: Boolean,
  // 数据来源
  source: String,       // e.g., '浙江电力交易中心', '上海电力交易中心'
  sourceUrl: String,
  // 爬取时间
  fetchedAt: { type: Date, default: Date.now },
  // 是否已确认（人工审核后标记）
  verified: { type: Boolean, default: false },
});
marketPriceSchema.index({ province: 1, date: -1 });
export const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

// ── Spot Price Schema ─────────────────────────────────────────────────────────
// 现货市场日前/实时出清价格（15分钟分段，更细粒度）
const spotPriceSchema = new mongoose.Schema({
  province: { type: String, enum: ['ZJ', 'GD', 'SH'], index: true },
  provinceName: String,
  date: { type: String, index: true },   // YYYY-MM-DD
  marketType: { type: String, enum: ['day-ahead', 'real-time'] },
  // 96个时段（每15分钟一个）
  segments: [{
    segment: Number,   // 0-95
    price: Number,     // 元/MWh（或折算成 元/kWh）
    time: String,      // HH:MM
  }],
  // 日均价
  avgPrice: Number,
  // 最高/最低
  maxPrice: Number,
  minPrice: Number,
  source: String,
  sourceUrl: String,
  fetchedAt: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
});
spotPriceSchema.index({ province: 1, date: -1, marketType: 1 });
export const SpotPrice = mongoose.model('SpotPrice', spotPriceSchema);

// ── Scraper Job Log ───────────────────────────────────────────────────────────
const scraperLogSchema = new mongoose.Schema({
  province: String,
  jobName: String,       // e.g., 'zhejiang-dayahead', 'shanghai-spot'
  status: { type: String, enum: ['success', 'failed', 'partial'] },
  recordsFetched: Number,
  errorMessage: String,
  ranAt: { type: Date, default: Date.now },
});
export const ScraperLog = mongoose.model('ScraperLog', scraperLogSchema);
