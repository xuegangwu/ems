/**
 * VPP Trading Engine — Market simulation + order matching
 *
 * Models a day-ahead market + real-time spot market
 * Simulates realistic electricity price dynamics
 */

import express from 'express';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketOrder {
  id: string;
  timestamp: string;
  direction: 'buy' | 'sell';
  price: number;        // CNY/kWh
  quantity: number;     // kWh
  remainingQty: number; // kWh (for partial fills)
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  filledQty: number;
  avgFillPrice: number;
  market: 'day-ahead' | 'spot';
  userId?: string;
}

interface MarketTick {
  timestamp: string;
  price: number;        // current market price CNY/kWh
  volume: number;       // total volume kWh
  direction: 'up' | 'down';
  open: number;
  high: number;
  low: number;
  close: number;
  bid: number;          // best bid
  ask: number;          // best ask
  market: 'day-ahead' | 'spot';
}

interface Portfolio {
  totalEnergyKwh: number;    // net energy position
  avgCost: number;           // average cost of position
  realizedPnl: number;       // realized profit/loss
  unrealizedPnl: number;     // mark-to-market PnL
  totalOrders: number;
  filledOrders: number;
  cancelledOrders: number;
}

interface MarketStats {
  dayAheadPrice: number;
  spotPrice: number;
  spread: number;
  totalVolume: number;
  marketTrend: 'rising' | 'falling' | 'neutral';
  nextSettlement: string;    // ISO time
  marketStatus: 'open' | 'closed' | 'auction';
}

// ─── In-memory state ──────────────────────────────────────────────────────────
const marketOrders: MarketOrder[] = [];
let portfolio: Portfolio = {
  totalEnergyKwh: 0,
  avgCost: 0,
  realizedPnl: 0,
  unrealizedPnl: 0,
  totalOrders: 0,
  filledOrders: 0,
  cancelledOrders: 0,
};

// ─── Market simulation ─────────────────────────────────────────────────────────
function getCurrentPrice(): { dayAhead: number; spot: number } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Day-ahead price (published at 14:00 previous day, follows schedule)
  const isPeak = [8, 9, 10, 14, 15, 16, 18, 19, 20].includes(hour);
  const isValley = [0, 1, 2, 3, 4, 5, 6, 22, 23].includes(hour);
  const baseDA = isPeak ? 0.95 + Math.random() * 0.35 : isValley ? 0.28 + Math.random() * 0.10 : 0.55 + Math.random() * 0.20;

  // Spot price (real-time, more volatile)
  const spotVolatility = Math.sin(hour * Math.PI / 12) * 0.3;
  const baseSpot = baseDA * (1 + spotVolatility) + (Math.random() - 0.5) * 0.15;

  return {
    dayAhead: Math.max(0.15, baseDA),
    spot: Math.max(0.10, baseSpot),
  };
}

function generateMarketTicks(hours = 24): MarketTick[] {
  const ticks: MarketTick[] = [];
  const now = Date.now();

  for (let h = hours; h >= 0; h--) {
    const t = new Date(now - h * 3600000);
    const hour = t.getHours();
    const isPeak = [8, 9, 10, 14, 15, 16, 18, 19, 20].includes(hour);
    const isValley = [0, 1, 2, 3, 4, 5, 6, 22, 23].includes(hour);

    const basePrice = isPeak ? 1.05 : isValley ? 0.30 : 0.62;
    const price = basePrice + (Math.random() - 0.5) * 0.20;
    const open = price + (Math.random() - 0.5) * 0.05;
    const close = price + (Math.random() - 0.5) * 0.05;
    const high = Math.max(open, close, price) + Math.random() * 0.05;
    const low = Math.min(open, close, price) - Math.random() * 0.05;
    const spread = price * 0.005;

    ticks.push({
      timestamp: t.toISOString(),
      price: parseFloat(price.toFixed(4)),
      volume: Math.round(5000 + Math.random() * 15000),
      direction: close > open ? 'up' : close < open ? 'down' : 'up',
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      bid: parseFloat((price - spread).toFixed(4)),
      ask: parseFloat((price + spread).toFixed(4)),
      market: h < 1 ? 'spot' : 'day-ahead',
    });
  }

  return ticks;
}

// ─── Order matching engine ─────────────────────────────────────────────────────
function matchOrder(order: MarketOrder): MarketOrder {
  const prices = getCurrentPrice();
  const currentPrice = order.market === 'day-ahead' ? prices.dayAhead : prices.spot;
  const direction = order.direction;

  if (direction === 'sell' && currentPrice >= order.price) {
    // Order fills at current market price
    order.status = 'filled';
    order.filledQty = order.quantity;
    order.avgFillPrice = currentPrice;
    order.remainingQty = 0;

    // Update portfolio
    if (order.market === 'spot') {
      portfolio.totalEnergyKwh -= order.filledQty;
      const pnl = order.filledQty * (order.avgFillPrice - portfolio.avgCost);
      portfolio.realizedPnl += pnl;
    }
    portfolio.filledOrders++;
  } else if (direction === 'buy' && currentPrice <= order.price) {
    order.status = 'filled';
    order.filledQty = order.quantity;
    order.avgFillPrice = currentPrice;
    order.remainingQty = 0;

    if (order.market === 'spot') {
      const totalCost = portfolio.totalEnergyKwh * portfolio.avgCost + order.filledQty * order.avgFillPrice;
      portfolio.totalEnergyKwh += order.filledQty;
      portfolio.avgCost = portfolio.totalEnergyKwh > 0 ? totalCost / portfolio.totalEnergyKwh : 0;
    }
    portfolio.filledOrders++;
  } else {
    // No fill yet
    order.status = 'open';
  }

  return order;
}

// ─── API Handlers ──────────────────────────────────────────────────────────────
export function getMarketData(req: express.Request, res: express.Response) {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const ticks = generateMarketTicks(hours);
    const prices = getCurrentPrice();

    res.json({
      success: true,
      market: 'spot',
      currentPrice: prices.spot,
      dayAheadPrice: prices.dayAhead,
      spread: parseFloat((prices.spot - prices.dayAhead).toFixed(4)),
      marketStatus: 'open',
      nextSettlement: new Date(Date.now() + 300000).toISOString(), // 5 min
      ticks,
    });
  } catch (err) {
    console.error('[Trading] getMarketData error:', err);
    res.status(500).json({ success: false, error: 'Market data failed' });
  }
}

export function getMarketStats(req: express.Request, res: express.Response) {
  try {
    const prices = getCurrentPrice();
    const ticks = generateMarketTicks(24);
    const todayVolume = ticks.reduce((s, t) => s + t.volume, 0);
    const trend = ticks.length >= 2 ? (ticks[ticks.length - 1].price > ticks[ticks.length - 2].price ? 'rising' : ticks[ticks.length - 1].price < ticks[ticks.length - 2].price ? 'falling' : 'neutral') : 'neutral';

    res.json({
      success: true,
      stats: {
        dayAheadPrice: parseFloat(prices.dayAhead.toFixed(4)),
        spotPrice: parseFloat(prices.spot.toFixed(4)),
        spread: parseFloat((prices.spot - prices.dayAhead).toFixed(4)),
        spreadPct: parseFloat(((prices.spot - prices.dayAhead) / prices.dayAhead * 100).toFixed(2)),
        totalVolume: todayVolume,
        marketTrend: trend,
        marketStatus: 'open' as const,
        nextSettlement: new Date(Date.now() + 300000).toISOString(),
      },
    });
  } catch (err) {
    console.error('[Trading] getMarketStats error:', err);
    res.status(500).json({ success: false, error: 'Stats failed' });
  }
}

export function submitOrder(req: express.Request, res: express.Response) {
  try {
    const { direction, price, quantity, market = 'spot' } = req.body;

    if (!direction || !price || !quantity) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    if (direction !== 'buy' && direction !== 'sell') {
      res.status(400).json({ success: false, error: 'Direction must be buy or sell' });
      return;
    }

    const order: MarketOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      direction,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      remainingQty: parseInt(quantity),
      status: 'open',
      filledQty: 0,
      avgFillPrice: 0,
      market,
    };

    // Try to match immediately
    const matched = matchOrder(order);
    marketOrders.unshift(matched);
    portfolio.totalOrders++;

    // Calculate unrealized PnL
    const prices = getCurrentPrice();
    const currentPrice = market === 'day-ahead' ? prices.dayAhead : prices.spot;
    portfolio.unrealizedPnl = portfolio.totalEnergyKwh * (currentPrice - portfolio.avgCost);

    res.json({
      success: true,
      order: matched,
      portfolio: {
        ...portfolio,
        unrealizedPnl: parseFloat(portfolio.unrealizedPnl.toFixed(2)),
        realizedPnl: parseFloat(portfolio.realizedPnl.toFixed(2)),
        avgCost: parseFloat(portfolio.avgCost.toFixed(4)),
      },
    });
  } catch (err) {
    console.error('[Trading] submitOrder error:', err);
    res.status(500).json({ success: false, error: 'Order submission failed' });
  }
}

export function getOrders(req: express.Request, res: express.Response) {
  try {
    const { status, market, limit = 50 } = req.query;
    let filtered = [...marketOrders];

    if (status) filtered = filtered.filter(o => o.status === status);
    if (market) filtered = filtered.filter(o => o.market === market);

    res.json({
      success: true,
      orders: filtered.slice(0, parseInt(limit as string)),
      total: filtered.length,
    });
  } catch (err) {
    console.error('[Trading] getOrders error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
}

export function cancelOrder(req: express.Request, res: express.Response) {
  try {
    const { id } = req.params;
    const order = marketOrders.find(o => o.id === id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    if (order.status !== 'open') {
      res.status(400).json({ success: false, error: `Cannot cancel order with status: ${order.status}` });
      return;
    }

    order.status = 'cancelled';
    order.remainingQty = 0;
    portfolio.cancelledOrders++;

    res.json({ success: true, order });
  } catch (err) {
    console.error('[Trading] cancelOrder error:', err);
    res.status(500).json({ success: false, error: 'Cancel failed' });
  }
}

export function getPortfolio(req: express.Request, res: express.Response) {
  try {
    const prices = getCurrentPrice();
    const updated = {
      ...portfolio,
      unrealizedPnl: parseFloat((portfolio.totalEnergyKwh * (prices.spot - portfolio.avgCost)).toFixed(2)),
      realizedPnl: parseFloat(portfolio.realizedPnl.toFixed(2)),
      avgCost: parseFloat(portfolio.avgCost.toFixed(4)),
      currentPrice: prices.spot,
    };

    res.json({ success: true, portfolio: updated });
  } catch (err) {
    console.error('[Trading] getPortfolio error:', err);
    res.status(500).json({ success: false, error: 'Portfolio fetch failed' });
  }
}

export function getOrderBook(req: express.Request, res: express.Response) {
  try {
    const openOrders = marketOrders.filter(o => o.status === 'open');
    const buyOrders = openOrders.filter(o => o.direction === 'buy').sort((a, b) => b.price - a.price);
    const sellOrders = openOrders.filter(o => o.direction === 'sell').sort((a, b) => a.price - b.price);

    // Aggregate by price level
    const prices = getCurrentPrice();

    res.json({
      success: true,
      orderBook: {
        bids: buyOrders.slice(0, 10).map(o => ({
          price: o.price,
          quantity: o.remainingQty,
          orders: 1,
        })),
        asks: sellOrders.slice(0, 10).map(o => ({
          price: o.price,
          quantity: o.remainingQty,
          orders: 1,
        })),
        spread: parseFloat((prices.dayAhead - prices.spot).toFixed(4)),
        midPrice: parseFloat(((prices.dayAhead + prices.spot) / 2).toFixed(4)),
        marketPrice: prices.spot,
      },
    });
  } catch (err) {
    console.error('[Trading] getOrderBook error:', err);
    res.status(500).json({ success: false, error: 'Order book failed' });
  }
}
