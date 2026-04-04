/**
 * AIPrediction — Real LSTM-powered forecasting page
 * Fetches from /api/predict/three-in-one (solar + load + price + dispatch)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Tag, Table, Progress, Spin, Alert, Button } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, PauseCircleOutlined, ExperimentOutlined, SunOutlined, RadarChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '';

interface ForecastPoint {
  timestamp: string;
  hour: string;
  load: number;
  loadUpper: number;
  loadLower: number;
  solar: number;
  solarUpper: number;
  solarLower: number;
  price: number;
  priceUpper: number;
  priceLower: number;
  efficiency: number;
  confidence: number;
  recommendation: 'charge' | 'discharge' | 'hold';
  reason: string;
}

interface ForecastSummary {
  peakSolar: { hour: string; power: number };
  peakLoad: { hour: string; load: number };
  chargeCount: number;
  dischargeCount: number;
  avgConfidence: number;
}

interface ForecastResponse {
  success: boolean;
  horizon: number;
  modelVersion: string;
  summary: ForecastSummary;
  data: ForecastPoint[];
}

const REC = {
  charge: {
    color: '#00D4AA', bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.25)',
    text: '建议储能充电', icon: <ExperimentOutlined />,
  },
  discharge: {
    color: '#FF4D4F', bg: 'rgba(255,77,79,0.1)', border: 'rgba(255,77,79,0.25)',
    text: '建议储能放电', icon: <ThunderboltOutlined />,
  },
  hold: {
    color: '#667EEA', bg: 'rgba(102,126,234,0.1)', border: 'rgba(102,126,234,0.25)',
    text: '正常待机', icon: <PauseCircleOutlined />,
  },
};

async function fetchForecast(): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE}/api/predict/three-in-one`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

export default function AIPrediction() {
  const [resp, setResp] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchForecast();
      setResp(result);
      setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '预测失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const display = (resp?.data ?? []).slice(0, 24);

  const avgConfidence = display.length
    ? Math.round(display.reduce((s, d) => s + d.confidence, 0) / display.length * 100)
    : 0;
  const chargeCount = resp?.summary?.chargeCount ?? display.filter(d => d.recommendation === 'charge').length;
  const dischargeCount = resp?.summary?.dischargeCount ?? display.filter(d => d.recommendation === 'discharge').length;
  const avgLoad = display.length
    ? Math.round(display.reduce((s, d) => s + d.load, 0) / display.length)
    : 0;
  const avgPrice = display.length
    ? display.reduce((s, d) => s + d.price, 0) / display.length
    : 0;

  // ─── ECharts options ───────────────────────────────────────────────────────
  const loadOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(102,126,234,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const p = params[0];
        const d = display[p.dataIndex];
        return `<b>${d.hour}</b><br/>负荷: ${(d.load / 1000).toFixed(2)} MW<br/>置信度: ${(d.confidence * 100).toFixed(0)}%`;
      },
    },
    legend: {
      data: ['预测负荷', '上界', '下界'],
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    },
    grid: { top: 16, right: 20, bottom: 44, left: 55 },
    xAxis: {
      type: 'category',
      data: display.map(d => d.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value', name: 'MW',
      axisLine: { show: false },
      axisLabel: {
        color: 'rgba(255,255,255,0.4)', fontSize: 10,
        formatter: (v: number) => `${(v / 1000).toFixed(1)}`,
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
    },
    series: [
      {
        name: '预测负荷',
        type: 'line',
        data: display.map(d => ({ value: d.load, itemStyle: { color: '#667EEA' } })),
        smooth: 0.4, lineStyle: { width: 2.5, color: '#667EEA' },
        areaStyle: { color: 'rgba(102,126,234,0.12)' },
        symbol: 'circle', symbolSize: 5,
      },
      {
        name: '上界',
        type: 'line', data: display.map(d => d.loadUpper),
        smooth: 0.4, lineStyle: { width: 1, color: '#667EEA', type: 'dashed', opacity: 0.35 }, symbol: 'none',
      },
      {
        name: '下界',
        type: 'line', data: display.map(d => d.loadLower),
        smooth: 0.4, lineStyle: { width: 1, color: '#667EEA', type: 'dashed', opacity: 0.35 }, symbol: 'none',
      },
    ],
  };

  const priceOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(255,149,0,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const d = display[params[0].dataIndex];
        return `<b>${d.hour}</b><br/>电价: ¥${d.price.toFixed(3)}/kWh<br/>区间: [¥${d.priceLower.toFixed(3)}, ¥${d.priceUpper.toFixed(3)}]`;
      },
    },
    legend: {
      data: ['预测电价', '上界', '下界'],
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    },
    grid: { top: 16, right: 20, bottom: 44, left: 55 },
    xAxis: {
      type: 'category',
      data: display.map(d => d.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value', name: '元/kWh',
      axisLine: { show: false },
      axisLabel: {
        color: 'rgba(255,255,255,0.4)', fontSize: 10,
        formatter: (v: number) => `¥${v.toFixed(2)}`,
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
    },
    series: [
      {
        name: '预测电价',
        type: 'line',
        data: display.map(d => ({ value: d.price, itemStyle: { color: '#FF9500' } })),
        smooth: 0.4, lineStyle: { width: 2.5, color: '#FF9500' },
        areaStyle: { color: 'rgba(255,149,0,0.1)' },
        symbol: 'circle', symbolSize: 5,
      },
      {
        name: '上界',
        type: 'line', data: display.map(d => d.priceUpper),
        smooth: 0.4, lineStyle: { width: 1, color: '#FF9500', type: 'dashed', opacity: 0.3 }, symbol: 'none',
      },
      {
        name: '下界',
        type: 'line', data: display.map(d => d.priceLower),
        smooth: 0.4, lineStyle: { width: 1, color: '#FF9500', type: 'dashed', opacity: 0.3 }, symbol: 'none',
      },
    ],
  };

  // ─── Solar forecast chart ─────────────────────────────────────────────────
  const solarOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(255,200,0,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const d = display[params[0].dataIndex];
        return `<b>${d.hour}</b><br/>发电: ${(d.solar / 1000).toFixed(2)} MW<br/>效率: ${d.efficiency}%`;
      },
    },
    legend: {
      data: ['光伏发电', '上界', '下界'],
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    },
    grid: { top: 16, right: 20, bottom: 44, left: 55 },
    xAxis: {
      type: 'category',
      data: display.map(d => d.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value', name: 'kW',
      axisLine: { show: false },
      axisLabel: {
        color: 'rgba(255,255,255,0.4)', fontSize: 10,
        formatter: (v: number) => `${(v / 1000).toFixed(1)}kW`,
      },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
    },
    series: [
      {
        name: '光伏发电',
        type: 'bar',
        data: display.map(d => ({ value: d.solar, itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#FFD700' }, { offset: 1, color: '#FF8C00' }] } } })),
        smooth: 0.4, lineStyle: { width: 2.5, color: '#FFD700' },
        symbol: 'circle', symbolSize: 5,
      },
      {
        name: '上界',
        type: 'line', data: display.map(d => d.solarUpper),
        smooth: 0.4, lineStyle: { width: 1, color: '#FFD700', type: 'dashed', opacity: 0.35 }, symbol: 'none',
      },
      {
        name: '下界',
        type: 'line', data: display.map(d => d.solarLower),
        smooth: 0.4, lineStyle: { width: 1, color: '#FFD700', type: 'dashed', opacity: 0.35 }, symbol: 'none',
      },
    ],
  };

  // ─── Three-in-one combined chart ──────────────────────────────────────────
  const threeInOneOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,15,30,0.95)',
      borderColor: 'rgba(102,126,234,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const d = display[params[0].dataIndex];
        return `<b>${d.hour}</b><br/><span style="color:#FFD700">☀️ 光伏: ${(d.solar / 1000).toFixed(2)} MW</span><br/><span style="color:#667EEA">⚡ 负荷: ${(d.load / 1000).toFixed(2)} MW</span><br/><span style="color:#FF9500">💰 电价: ¥${d.price.toFixed(3)}</span>`;
      },
    },
    legend: {
      data: ['光伏发电', '预测负荷', '分时电价'],
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    },
    grid: { top: 16, right: 55, bottom: 44, left: 55 },
    xAxis: {
      type: 'category',
      data: display.map(d => d.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value', name: 'MW/kW',
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(1)}` },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
      },
      {
        type: 'value', name: '元/kWh',
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, formatter: (v: number) => `¥${v.toFixed(2)}` },
        splitLine: { show: false },
        nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
      },
    ],
    series: [
      {
        name: '光伏发电',
        type: 'bar',
        yAxisIndex: 0,
        data: display.map(d => ({ value: d.solar, itemStyle: { color: 'rgba(255,215,0,0.7)' } })),
        smooth: 0.4,
      },
      {
        name: '预测负荷',
        type: 'line',
        yAxisIndex: 0,
        data: display.map(d => ({ value: d.load, itemStyle: { color: '#667EEA' } })),
        smooth: 0.4, lineStyle: { width: 2.5, color: '#667EEA' },
        areaStyle: { color: 'rgba(102,126,234,0.1)' },
        symbol: 'circle', symbolSize: 4,
      },
      {
        name: '分时电价',
        type: 'line',
        yAxisIndex: 1,
        data: display.map(d => ({ value: d.price, itemStyle: { color: '#FF9500' } })),
        smooth: 0.4, lineStyle: { width: 2.5, color: '#FF9500' },
        symbol: 'circle', symbolSize: 4,
      },
    ],
  };

  // ─── Dispatch summary by hour ─────────────────────────────────────────────
  const dispatchSummary = [
    {
      key: 'charge',
      label: '充电时段',
      count: chargeCount,
      color: '#00D4AA',
      bg: 'rgba(0,212,170,0.1)',
      border: 'rgba(0,212,170,0.2)',
      icon: <ExperimentOutlined />,
    },
    {
      key: 'discharge',
      label: '放电时段',
      count: dischargeCount,
      color: '#FF4D4F',
      bg: 'rgba(255,77,79,0.1)',
      border: 'rgba(255,77,79,0.2)',
      icon: <ThunderboltOutlined />,
    },
    {
      key: 'hold',
      label: '待机时段',
      count: 24 - chargeCount - dischargeCount,
      color: '#667EEA',
      bg: 'rgba(102,126,234,0.1)',
      border: 'rgba(102,126,234,0.2)',
      icon: <PauseCircleOutlined />,
    },
  ];

  // ─── Table columns ─────────────────────────────────────────────────────────
  const tableColumns = [
    {
      title: '时段',
      dataIndex: 'hour',
      key: 'hour',
      width: 70,
      render: (h: string) => <span style={{ color: '#fff', fontWeight: 500 }}>{h}</span>,
    },
    {
      title: '推荐动作',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 130,
      render: (rec: 'charge' | 'discharge' | 'hold') => {
        const r = REC[rec];
        return (
          <Tag
            style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}`, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}
          >
            {r.icon} {r.text}
          </Tag>
        );
      },
    },
    {
      title: '电价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (p: number) => (
        <span style={{ color: parseFloat(String(p)) > 1 ? '#FF4D4F' : parseFloat(String(p)) < 0.4 ? '#00D4AA' : '#FF9500' }}>
          ¥{parseFloat(String(p)).toFixed(3)}
        </span>
      ),
    },
    {
      title: '预测负荷',
      dataIndex: 'load',
      key: 'load',
      width: 100,
      render: (l: number) => `${(l / 1000).toFixed(2)} MW`,
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 110,
      render: (c: number) => (
        <Progress
          percent={Math.round(c * 100)}
          size="small"
          strokeColor={c > 0.85 ? '#00D4AA' : c > 0.75 ? '#FF9500' : '#FF4D4F'}
          trailColor="rgba(255,255,255,0.06)"
          showInfo={false}
        />
      ),
    },
    {
      title: '决策依据',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (r: string) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{r}</span>,
    },
  ];

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>🤖 AI 预测中心</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            LSTM 神经网络 · 48小时滚动预测 · 模型自学习优化
          </p>
        </div>
        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={loadData}
          loading={loading}
          style={{ background: 'rgba(102,126,234,0.15)', color: '#667EEA', border: '1px solid rgba(102,126,234,0.25)' }}
        >
          重新预测
        </Button>
      </div>

      {error && (
        <Alert
          message={`预测失败: ${error}`}
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* ─── Stats row ─────────────────────────────────────────────────────── */}
      <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
        {[
          { label: '平均置信度', value: `${avgConfidence}%`, color: '#667EEA', icon: '🎯' },
          { label: '平均负荷', value: `${(avgLoad / 1000).toFixed(1)} MW`, color: '#667EEA', icon: '⚡' },
          { label: '平均电价', value: `¥${avgPrice.toFixed(3)}`, color: '#FF9500', icon: '💰' },
          { label: '建议充电', value: `${chargeCount}次`, color: '#00D4AA', icon: '🔋' },
          { label: '建议放电', value: `${dischargeCount}次`, color: '#FF4D4F', icon: '⚡' },
        ].map(stat => (
          <Col xs={12} sm={8} md={5} key={stat.label}>
            <Card
              size="small"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${stat.color}22`, textAlign: 'center' }}
              bodyStyle={{ padding: '12px 8px' }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {stat.icon} {stat.label}
              </div>
            </Card>
          </Col>
        ))}
        <Col xs={24} sm={8} md={4}>
          <Card
            size="small"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', textAlign: 'center' }}
            bodyStyle={{ padding: '12px 8px' }}
          >
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{lastUpdated || '--:--:--'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>上次更新</div>
          </Card>
        </Col>
      </Row>

      {/* ─── Charts ───────────────────────────────────────────────────────── */}
      {loading && display.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            LSTM 模型推理中，首次请求约需 10 秒...
          </div>
        </div>
      ) : (
        <>
          {/* ─── 三合一联合预测 ─────────────────────────────────────────── */}
          <Card
            title={<><RadarChartOutlined style={{ marginRight: 6 }} /><span style={{ fontSize: 14 }}>☀️⚡💰 三合一联合预测</span><Tag style={{ marginLeft: 8, background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: 'none', fontSize: 10 }}>光伏+负荷+电价</Tag></>}
            extra={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>模型: {resp?.modelVersion ?? 'LSTM-v2.0'}</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.12)', marginBottom: 14 }}
            bodyStyle={{ padding: '12px 12px 8px' }}
          >
            <ReactECharts option={threeInOneOption} style={{ height: 300 }} />
          </Card>

          <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
            <Col xs={24} lg={8}>
              <Card
                title={<><SunOutlined style={{ marginRight: 4 }} /><span style={{ fontSize: 13 }}>☀️ 光伏预测</span></>}
                extra={<Tag style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: 'none', fontSize: 10 }}>LSTM</Tag>}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.12)' }}
                bodyStyle={{ padding: '12px 12px 8px' }}
              >
                <ReactECharts option={solarOption} style={{ height: 220 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={<><span style={{ fontSize: 13 }}>⚡ 负荷预测</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 8 }}>置信区间 ±12%</span></>}
                extra={<Tag style={{ background: 'rgba(102,126,234,0.15)', color: '#667EEA', border: 'none', fontSize: 10 }}>LSTM</Tag>}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
                bodyStyle={{ padding: '12px 12px 8px' }}
              >
                <ReactECharts option={loadOption} style={{ height: 220 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={<><span style={{ fontSize: 13 }}>💰 电价预测</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 8 }}>置信区间 ±18%</span></>}
                extra={<Tag style={{ background: 'rgba(255,149,0,0.15)', color: '#FF9500', border: 'none', fontSize: 10 }}>LSTM</Tag>}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,149,0,0.12)' }}
                bodyStyle={{ padding: '12px 12px 8px' }}
              >
                <ReactECharts option={priceOption} style={{ height: 220 }} />
              </Card>
            </Col>
          </Row>

          {/* ─── Dispatch summary cards ────────────────────────────────────── */}
          <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
            {dispatchSummary.map(s => (
              <Col xs={8} key={s.key}>
                <Card
                  size="small"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, textAlign: 'center' }}
                  bodyStyle={{ padding: '10px 8px' }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}次</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {s.icon} {s.label}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* ─── Dispatch table ────────────────────────────────────────────── */}
          <Card
            title="📋 智能调度建议（未来24小时）"
            extra={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>基于负荷 + 电价联合预测</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={display}
              columns={tableColumns}
              rowKey="timestamp"
              pagination={{ pageSize: 12, size: 'small', showSizeChanger: false }}
              scroll={{ x: 800 }}
              size="small"
              loading={loading}
              rowClassName={(_, index) => index % 2 === 0 ? 'table-row-even' : ''}
            />
          </Card>
        </>
      )}
    </div>
  );
}
