/**
 * VPP Trading — 电力交易市场交易界面
 * Real-time market data, order book, portfolio, order entry
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Table, Tag, Button, Form, InputNumber, Select, message, Badge, Spin } from 'antd';
import { DeleteOutlined, ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const API = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '';

interface MarketTick { timestamp: string; price: number; volume: number; direction: 'up' | 'down'; open: number; high: number; low: number; close: number; bid: number; ask: number; market: string; }
interface MarketOrder { id: string; timestamp: string; direction: 'buy' | 'sell'; price: number; quantity: number; remainingQty: number; status: string; filledQty: number; avgFillPrice: number; market: string; }
interface Portfolio { totalEnergyKwh: number; avgCost: number; realizedPnl: number; unrealizedPnl: number; totalOrders: number; filledOrders: number; cancelledOrders: number; currentPrice: number; }
interface OrderBook { bids: { price: number; quantity: number; orders: number }[]; asks: { price: number; quantity: number; orders: number }[]; spread: number; midPrice: number; marketPrice: number; }
interface MarketStats { dayAheadPrice: number; spotPrice: number; spread: number; spreadPct: number; totalVolume: number; marketTrend: string; marketStatus: string; nextSettlement: string; }

// ─── Auto-refresh hook ────────────────────────────────────────────────────────
function useInterval(callback: () => void, ms: number) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (ms <= 0) return;
    const id = setInterval(() => savedCallback.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function fetchMarket() {
  const r = await fetch(`${API}/api/vpp/trading/market`);
  return r.json();
}
async function fetchStats() {
  const r = await fetch(`${API}/api/vpp/trading/stats`);
  return r.json();
}
async function fetchPortfolio() {
  const r = await fetch(`${API}/api/vpp/trading/portfolio`);
  return r.json();
}
async function fetchOrders() {
  const r = await fetch(`${API}/api/vpp/trading/orders`);
  return r.json();
}
async function fetchOrderBook() {
  const r = await fetch(`${API}/api/vpp/trading/orderbook`);
  return r.json();
}
async function submitOrderApi(data: { direction: string; price: number; quantity: number; market: string }) {
  const r = await fetch(`${API}/api/vpp/trading/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
async function cancelOrderApi(id: string) {
  const r = await fetch(`${API}/api/vpp/trading/orders/${id}`, { method: 'DELETE' });
  return r.json();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VPPTrading() {
  const [market, setMarket] = useState<{ ticks: MarketTick[]; currentPrice: number; dayAheadPrice: number; spread: number } | null>(null);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadAll = useCallback(async () => {
    try {
      const [m, s, p, o, ob] = await Promise.all([fetchMarket(), fetchStats(), fetchPortfolio(), fetchOrders(), fetchOrderBook()]);
      if (m.success) setMarket(m);
      if (s.success) setStats(s.stats);
      if (p.success) setPortfolio(p.portfolio);
      if (o.success) setOrders(o.orders);
      if (ob.success) setOrderBook(ob.orderBook);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useInterval(loadAll, 10000); // refresh every 10s

  // ─── Market chart ─────────────────────────────────────────────────────────
  const chartOption = market ? {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,212,170,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const d = params[0];
        const tick = market.ticks[d.dataIndex];
        if (!tick) return '';
        return `<b>${new Date(tick.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</b><br/>价格: ¥${tick.price.toFixed(3)}<br/>成交量: ${tick.volume.toLocaleString()} kWh<br/>开: ¥${tick.open.toFixed(3)} 高: ¥${tick.high.toFixed(3)} 低: ¥${tick.low.toFixed(3)}`;
      },
    },
    grid: { top: 12, right: 16, bottom: 36, left: 52 },
    xAxis: {
      type: 'category',
      data: market.ticks.map(t => new Date(t.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 9, interval: Math.floor(market.ticks.length / 6) },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '¥/kWh',
      min: (market.ticks.length > 0 ? Math.min(...market.ticks.map(t => t.low)) * 0.95 : 0.2),
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, formatter: (v: number) => `¥${v.toFixed(2)}` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
    },
    series: [{
      name: '电价',
      type: 'line',
      data: market.ticks.map(t => ({ value: t.price, itemStyle: { color: t.direction === 'up' ? '#FF4D4F' : '#00D4AA' } })),
      smooth: 0.3,
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0,212,170,0.2)' },
            { offset: 1, color: 'rgba(0,212,170,0.0)' },
          ],
        },
      },
      symbol: 'circle', symbolSize: 3,
    }],
  } : {};

  // ─── Submit order ─────────────────────────────────────────────────────────
  const handleSubmit = async (values: { direction: string; price: number; quantity: number; market: string }) => {
    setSubmitting(true);
    try {
      const res = await submitOrderApi(values);
      if (res.success) {
        message.success({ content: `订单已提交: ${values.direction === 'buy' ? '买入' : '卖出'} ${values.quantity}kWh @ ¥${values.price}`, duration: 3 });
        if (res.portfolio) setPortfolio(res.portfolio);
        if (res.order) setOrders(prev => [res.order, ...prev]);
        form.resetFields();
      } else {
        message.error(res.error || '下单失败');
      }
    } catch {
      message.error('网络错误');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    const r = await cancelOrderApi(id);
    if (r.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled', remainingQty: 0 } : o));
      message.success('订单已撤销');
    } else {
      message.error(r.error || '撤销失败');
    }
  };

  // ─── Order columns ─────────────────────────────────────────────────────────
  const orderColumns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 80, render: (t: string) => new Date(t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
    { title: '方向', dataIndex: 'direction', key: 'direction', width: 60, render: (d: string) => <Tag color={d === 'buy' ? 'blue' : 'red'}>{d === 'buy' ? '买入' : '卖出'}</Tag> },
    { title: '价格', dataIndex: 'price', key: 'price', width: 80, render: (p: number) => <span style={{ color: '#FF9500' }}>¥{p.toFixed(3)}</span> },
    { title: '数量(kWh)', dataIndex: 'quantity', key: 'quantity', width: 90 },
    { title: '已成交', dataIndex: 'filledQty', key: 'filledQty', width: 80, render: (f: number) => f > 0 ? <span style={{ color: '#00D4AA' }}>{f}kWh</span> : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (s: string) => {
      const map: Record<string, { color: string; text: string }> = { open: { color: 'orange', text: '挂单' }, filled: { color: 'green', text: '成交' }, cancelled: { color: 'default', text: '撤销' }, partial: { color: 'processing', text: '部分' } };
      return <Badge status={map[s]?.color as any} text={<span style={{ fontSize: 11 }}>{map[s]?.text || s}</span>} />;
    }},
    { title: '市场', dataIndex: 'market', key: 'market', width: 80, render: (m: string) => <Tag style={{ fontSize: 10 }}>{m === 'day-ahead' ? '日前' : '实时'}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 70,
      render: (_: unknown, o: MarketOrder) => o.status === 'open'
        ? <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleCancel(o.id)}>撤销</Button>
        : null,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.4)' }}>加载市场数据...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>⚡ VPP 电力交易</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>虚拟电厂 · 日前市场 + 实时现货 · 智能交易</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadAll} style={{ background: 'rgba(102,126,234,0.12)', color: '#667EEA', border: '1px solid rgba(102,126,234,0.2)' }}>
          刷新
        </Button>
      </div>

      {/* Market stats row */}
      {stats && (
        <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
          {[
            { label: '实时价格', value: `¥${stats.spotPrice.toFixed(3)}`, sub: `日前 ¥${stats.dayAheadPrice.toFixed(3)}`, color: '#00D4AA', icon: '⚡' },
            { label: '价差', value: `${stats.spreadPct > 0 ? '+' : ''}${stats.spreadPct.toFixed(1)}%`, sub: `¥${Math.abs(stats.spread).toFixed(3)}`, color: stats.spreadPct > 0 ? '#FF4D4F' : '#00D4AA', icon: '📊' },
            { label: '日交易量', value: `${(stats.totalVolume / 1000).toFixed(1)}M`, sub: 'kWh', color: '#FF9500', icon: '📦' },
            { label: '市场趋势', value: stats.marketTrend === 'rising' ? '📈 上涨' : stats.marketTrend === 'falling' ? '📉 下跌' : '➡️ 震荡', sub: stats.marketStatus === 'open' ? '市场开放中' : '已休市', color: '#667EEA', icon: stats.marketTrend === 'rising' ? '📈' : stats.marketTrend === 'falling' ? '📉' : '➡️' },
          ].map(s => (
            <Col xs={12} sm={6} key={s.label}>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}22`, textAlign: 'center' }} bodyStyle={{ padding: '10px 6px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.icon} {s.label}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Portfolio + chart row */}
      <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
        {/* Portfolio card */}
        <Col xs={24} md={8} lg={6}>
          <Card size="small" title={<span style={{ fontSize: 13 }}>💼 交易账户</span>} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }} bodyStyle={{ padding: '10px 14px' }}>
            {portfolio ? (
              <Row gutter={[8, 8]}>
                {[
                  { label: '持仓能量', value: `${portfolio.totalEnergyKwh.toFixed(0)}kWh`, color: '#667EEA' },
                  { label: '持仓均价', value: `¥${portfolio.avgCost.toFixed(3)}`, color: '#FF9500' },
                  { label: '浮动盈亏', value: `${portfolio.unrealizedPnl >= 0 ? '+' : ''}¥${portfolio.unrealizedPnl.toFixed(0)}`, color: portfolio.unrealizedPnl >= 0 ? '#00D4AA' : '#FF4D4F' },
                  { label: '已实现盈亏', value: `${portfolio.realizedPnl >= 0 ? '+' : ''}¥${portfolio.realizedPnl.toFixed(0)}`, color: portfolio.realizedPnl >= 0 ? '#00D4AA' : '#FF4D4F' },
                  { label: '总订单', value: `${portfolio.filledOrders}/${portfolio.totalOrders}`, color: 'rgba(255,255,255,0.6)' },
                  { label: '当前市价', value: `¥${portfolio.currentPrice?.toFixed(3) || '-'}`, color: '#FF9500' },
                ].map(item => (
                  <Col span={12} key={item.label}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </Col>
                ))}
              </Row>
            ) : <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>加载中...</div>}
          </Card>
        </Col>

        {/* Market price chart */}
        <Col xs={24} md={16} lg={18}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}>📈 电价走势（24小时）</span>}
            extra={<span style={{ fontSize: 10, color: market?.ticks[market.ticks.length - 1]?.direction === 'up' ? '#FF4D4F' : '#00D4AA' }}>
              当前 ¥{market?.ticks[market.ticks.length - 1]?.price.toFixed(3) || '-'}
            </span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}
            bodyStyle={{ padding: '10px 10px 4px' }}
          >
            <ReactECharts option={chartOption} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      {/* Order form + order book */}
      <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
        {/* Order entry */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}>📝 下单</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
            bodyStyle={{ padding: '12px 14px' }}
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ market: 'spot', direction: 'buy', price: stats?.spotPrice.toFixed(3) }}>
              <Row gutter={10}>
                <Col span={12}>
                  <Form.Item name="direction" label="方向" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 'buy', label: '📈 买入（充电/储电）' },
                        { value: 'sell', label: '📉 卖出（放电/售电）' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="market" label="市场" rules={[{ required: true }]}>
                    <Select
                      options={[
                        { value: 'spot', label: '实时现货' },
                        { value: 'day-ahead', label: '日前市场' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="price" label="限价 (¥/kWh)" rules={[{ required: true }]}>
                    <InputNumber
                      min={0.10}
                      max={3.00}
                      step={0.001}
                      precision={3}
                      style={{ width: '100%' }}
                      placeholder={stats?.spotPrice.toFixed(3)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="quantity" label="数量 (kWh)" rules={[{ required: true }]}>
                    <InputNumber min={10} max={10000} step={10} style={{ width: '100%' }} placeholder="100" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  block
                  style={{
                    height: 38,
                    background: form.getFieldValue('direction') === 'sell' ? 'rgba(255,77,79,0.8)' : 'rgba(0,212,170,0.8)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                  icon={form.getFieldValue('direction') === 'sell' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                >
                  {form.getFieldValue('direction') === 'sell' ? '卖出（放电）' : '买入（储电）'} — {form.getFieldValue('quantity') || 0}kWh
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Order book */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}>📚 订单簿</span>}
            extra={<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>实时撮合</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,149,0,0.12)' }}
            bodyStyle={{ padding: '10px 14px' }}
          >
            {orderBook ? (
              <Row gutter={[8, 0]}>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#00D4AA', fontWeight: 600, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span>买单</span><span>数量(kWh)</span>
                  </div>
                  {orderBook.bids.slice(0, 6).map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#00D4AA', marginBottom: 3 }}>
                      <span>¥{b.price.toFixed(3)}</span><span>{b.quantity}</span>
                    </div>
                  ))}
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 11, color: '#FF4D4F', fontWeight: 600, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span>卖单</span><span>数量(kWh)</span>
                  </div>
                  {orderBook.asks.slice(0, 6).map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#FF4D4F', marginBottom: 3 }}>
                      <span>¥{a.price.toFixed(3)}</span><span>{a.quantity}</span>
                    </div>
                  ))}
                </Col>
                <Col span={24}>
                  <div style={{ textAlign: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>价差: </span>
                    <span style={{ fontSize: 11, color: '#FF9500' }}>¥{Math.abs(orderBook.spread).toFixed(3)}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}> | 中价: </span>
                    <span style={{ fontSize: 11, color: '#667EEA' }}>¥{orderBook.midPrice.toFixed(3)}</span>
                  </div>
                </Col>
              </Row>
            ) : <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>加载中...</div>}
          </Card>
        </Col>
      </Row>

      {/* Open orders */}
      <Card
        size="small"
        title={<span style={{ fontSize: 13 }}>📋 交易订单（{orders.length}）</span>}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={orders}
          columns={orderColumns}
          rowKey="id"
          pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
          scroll={{ x: 700 }}
          size="small"
          locale={{ emptyText: '暂无订单' }}
        />
      </Card>
    </div>
  );
}
