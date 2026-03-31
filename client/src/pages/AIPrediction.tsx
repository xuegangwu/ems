import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Tag, Space, Table, Progress } from 'antd';
import ReactECharts from 'echarts-for-react';

interface ForecastPoint {
  timestamp: string;
  hour: string;
  load: number;
  loadUpper: number;
  loadLower: number;
  price: number;
  priceUpper: number;
  priceLower: number;
  confidence: number;
  recommendation: 'charge' | 'discharge' | 'hold';
  reason: string;
}

const RECOMMENDATIONS = {
  charge: { color: '#00D4AA', bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.25)', text: '⚡ 建议储能充电', icon: '🔋' },
  discharge: { color: '#FF4D4F', bg: 'rgba(255,77,79,0.1)', border: 'rgba(255,77,79,0.25)', text: '💰 建议储能放电', icon: '⚡' },
  hold: { color: '#667EEA', bg: 'rgba(102,126,234,0.1)', border: 'rgba(102,126,234,0.25)', text: '📊 正常待机', icon: '⏸' },
};

function generateForecast(): ForecastPoint[] {
  const now = new Date();
  const points: ForecastPoint[] = [];

  for (let i = 1; i <= 48; i++) {
    const t = new Date(now.getTime() + i * 3600000);
    const hour = t.getHours();
    const isPeak = [8,9,10,14,15,16,18,19,20].includes(hour);
    const isValley = [0,1,2,3,4,5,6,22,23].includes(hour);

    // Load forecast: business hours higher
    const baseLoad = isPeak ? 2800 + Math.random() * 800 : isValley ? 800 + Math.random() * 400 : 1500 + Math.random() * 1000;
    const confidence = 0.70 + Math.random() * 0.25;

    // Price forecast
    const basePrice = isPeak ? 1.05 + Math.random() * 0.25 : isValley ? 0.30 + Math.random() * 0.15 : 0.60 + Math.random() * 0.30;

    // Auto recommendation
    let recommendation: ForecastPoint['recommendation'] = 'hold';
    let reason = '电价平稳，可灵活调度';
    if (isValley && basePrice < 0.40) { recommendation = 'charge'; reason = '谷时低价，储能充电'; }
    else if (isPeak && basePrice > 1.10) { recommendation = 'discharge'; reason = '峰时高价，储能放电'; }

    points.push({
      timestamp: t.toISOString(),
      hour: `${String(hour).padStart(2,'0')}:00`,
      load: Math.round(baseLoad),
      loadUpper: Math.round(baseLoad * 1.12),
      loadLower: Math.round(baseLoad * 0.88),
      price: parseFloat(basePrice.toFixed(4)),
      priceUpper: parseFloat((basePrice * 1.18).toFixed(4)),
      priceLower: parseFloat((basePrice * 0.82).toFixed(4)),
      confidence: parseFloat(confidence.toFixed(2)),
      recommendation,
      reason,
    });
  }
  return points;
}

export default function AIPrediction() {
  const [stationId, setStationId] = useState('station-001');
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Simulate AI computing delay
    setTimeout(() => {
      setForecast(generateForecast());
      setLoading(false);
    }, 600);
  }, [stationId]);

  const futureForecast = forecast.filter(() => true).slice(0, 24);

  const loadOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,15,35,0.95)',
      borderColor: 'rgba(102,126,234,0.3)',
      textStyle: { color: 'white' },
    },
    legend: { data: ['预测负荷', '置信上界', '置信下界'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 } },
    grid: { top: 20, right: 20, bottom: 45, left: 55 },
    xAxis: {
      type: 'category',
      data: futureForecast.map(f => f.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value', name: 'kW',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', formatter: (v: number) => `${(v/1000).toFixed(1)}MW`, fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
    },
    series: [
      {
        name: '预测负荷',
        type: 'line',
        data: futureForecast.map(f => ({ value: f.load, itemStyle: { color: '#667EEA' } })),
        smooth: true, lineStyle: { width: 2, color: '#667EEA' },
        areaStyle: { color: 'rgba(102,126,234,0.12)' },
        symbol: 'circle', symbolSize: 4,
      },
      {
        name: '置信上界',
        type: 'line', data: futureForecast.map(f => f.loadUpper),
        smooth: true, lineStyle: { width: 1, color: '#667EEA', type: 'dashed', opacity: 0.4 }, symbol: 'none',
      },
      {
        name: '置信下界',
        type: 'line', data: futureForecast.map(f => f.loadLower),
        smooth: true, lineStyle: { width: 1, color: '#667EEA', type: 'dashed', opacity: 0.4 }, symbol: 'none',
      },
    ],
  };

  const priceOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,15,35,0.95)',
      borderColor: 'rgba(102,126,234,0.3)',
      textStyle: { color: 'white' },
    },
    legend: { data: ['预测电价', '上界', '下界'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 } },
    grid: { top: 20, right: 20, bottom: 45, left: 55 },
    xAxis: {
      type: 'category',
      data: futureForecast.map(f => f.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value', name: '元/kWh',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', formatter: (v: number) => `¥${v.toFixed(2)}`, fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
    },
    series: [
      {
        name: '预测电价',
        type: 'line',
        data: futureForecast.map(f => ({ value: f.price, itemStyle: { color: '#FF9500' } })),
        smooth: true, lineStyle: { width: 2, color: '#FF9500' },
        areaStyle: { color: 'rgba(255,149,0,0.1)' },
        symbol: 'circle', symbolSize: 4,
      },
      {
        name: '上界',
        type: 'line', data: futureForecast.map(f => f.priceUpper),
        smooth: true, lineStyle: { width: 1, color: '#FF9500', type: 'dashed', opacity: 0.3 }, symbol: 'none',
      },
      {
        name: '下界',
        type: 'line', data: futureForecast.map(f => f.priceLower),
        smooth: true, lineStyle: { width: 1, color: '#FF9500', type: 'dashed', opacity: 0.3 }, symbol: 'none',
      },
    ],
  };

  const confidenceAvg = futureForecast.length > 0
    ? Math.round(futureForecast.reduce((s, f) => s + f.confidence, 0) / futureForecast.length * 100)
    : 0;
  const chargeCount = futureForecast.filter(f => f.recommendation === 'charge').length;
  const dischargeCount = futureForecast.filter(f => f.recommendation === 'discharge').length;

  const columns = [
    { title: '时段', dataIndex: 'hour', key: 'hour', width: 70 },
    { title: '推荐动作', key: 'rec', width: 130, render: (_: unknown, r: ForecastPoint) => {
      const rec = RECOMMENDATIONS[r.recommendation];
      return <Tag style={{ background: rec.bg, color: rec.color, border: `1px solid ${rec.border}`, fontSize: 11 }}>{rec.text}</Tag>;
    }},
    { title: '电价(元)', dataIndex: 'price', key: 'price', render: (p: number) => `¥${p.toFixed(4)}` },
    { title: '预测负荷', dataIndex: 'load', key: 'load', render: (l: number) => `${(l/1000).toFixed(1)} MW` },
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', render: (c: number) => <Progress percent={Math.round(c*100)} size="small" strokeColor="#667EEA" showInfo={false} /> },
    { title: '决策依据', dataIndex: 'reason', key: 'reason', ellipsis: true },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>🤖 AI 预测中心</h2>

      {/* Station Selector + Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <Space wrap>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>选择电站：</span>
              <Select value={stationId} onChange={setStationId} style={{ width: 200 }}
                options={[
                  { value: 'station-001', label: '苏州工业园光伏电站' },
                  { value: 'station-002', label: '无锡储能电站' },
                  { value: 'station-003', label: '杭州光储一体化' },
                ]}
              />
              <Tag icon="🔄" style={{ background: 'rgba(102,126,234,0.15)', color: '#667EEA', border: 'none' }}>
                模型: LightGBM v2.1 · 更新于 {new Date().toLocaleTimeString('zh-CN')}
              </Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={12} lg={2}>
          <Card size="small" style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#667EEA' }}>{confidenceAvg}%</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>平均置信度</div>
          </Card>
        </Col>
        <Col xs={12} lg={3}>
          <Card size="small" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>{chargeCount}次</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>建议充电</div>
          </Card>
        </Col>
        <Col xs={12} lg={3}>
          <Card size="small" style={{ background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#FF4D4F' }}>{dischargeCount}次</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>建议放电</div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="⚡ 48小时负荷预测"
            extra={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>置信区间 ±12%</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
          >
            <ReactECharts option={loadOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="💰 48小时电价预测"
            extra={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>置信区间 ±18%</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
          >
            <ReactECharts option={priceOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* Dispatch Recommendations Table */}
      <Card
        title="📋 智能调度建议（未来24小时）"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={futureForecast}
            columns={columns}
            rowKey="timestamp"
            pagination={{ pageSize: 12, size: 'small' }}
            scroll={{ x: 800 }}
            size="small"
            loading={loading}
          />
        </div>
      </Card>
    </div>
  );
}
