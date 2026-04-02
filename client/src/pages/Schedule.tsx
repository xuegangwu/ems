/**
 * Schedule — AI 调度中心（削峰填谷）
 * Fetches from /api/schedule/day and /api/schedule/realtime
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Tag, Button, Spin, Alert, Progress } from 'antd';
import { ThunderboltOutlined, SwapOutlined, ClockCircleOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '';

interface ScheduleItem {
  hour: string;
  action: 'charge' | 'discharge' | 'hold';
  soc: number;
  powerKw: number;
  loadKwh: number;
  price: number;
  savings: number;
  reason: string;
}

interface DaySchedule {
  date: string;
  totalChargeKwh: number;
  totalDischargeKwh: number;
  totalSavings: number;
  peakShaveKw: number;
  valleyFillKw: number;
  items: ScheduleItem[];
  summary: {
    chargeHours: number;
    dischargeHours: number;
    holdHours: number;
    avgSoC: number;
    bestChargeWindow: string;
    bestDischargeWindow: string;
  };
}

interface ScheduleResponse {
  success: boolean;
  schedule: DaySchedule;
  projections: {
    dailySavings: number;
    monthlySavings: number;
    yearlySavings: number;
    monthlyPeakReductionKw: number;
  };
  batteryConfig: {
    capacityKwh: number;
    ratedPowerKw: number;
    roundTripEfficiency: number;
  };
}

interface RealtimeDispatch {
  currentTime: string;
  action: 'charge' | 'discharge' | 'hold';
  powerKw: number;
  batterySoC: number;
  currentPrice: number;
  reason: string;
  nextAction: string;
}

const ACTION_STYLE = {
  charge: { color: '#00D4AA', bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.25)', text: '充电' },
  discharge: { color: '#FF4D4F', bg: 'rgba(255,77,79,0.1)', border: 'rgba(255,77,79,0.25)', text: '放电' },
  hold: { color: '#667EEA', bg: 'rgba(102,126,234,0.1)', border: 'rgba(102,126,234,0.25)', text: '待机' },
};

export default function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [realtime, setRealtime] = useState<RealtimeDispatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schedRes, rtRes] = await Promise.all([
        fetch(`${API_BASE}/api/schedule/day`),
        fetch(`${API_BASE}/api/schedule/realtime`),
      ]);
      const schedData = await schedRes.json();
      const rtData = await rtRes.json();
      if (!schedData.success) throw new Error(schedData.error || '调度计算失败');
      setSchedule(schedData);
      if (rtData.success) setRealtime(rtData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.4)' }}>AI 调度引擎计算中...</div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div style={{ padding: 16 }}>
        <Alert message={`加载失败: ${error}`} type="error" showIcon closable />
        <Button onClick={fetchSchedule} style={{ marginTop: 12 }}>重试</Button>
      </div>
    );
  }

  const { schedule: s, projections: p, batteryConfig: bc } = schedule;
  const items = s.items.slice(0, 24);

  // ─── SoC chart ──────────────────────────────────────────────────────────────
  const socOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,212,170,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const d = s.items[params[0].dataIndex];
        return `<b>${d.hour}</b><br/>SoC: ${(d.soc * 100).toFixed(0)}%<br/>功率: ${d.powerKw > 0 ? '+' : ''}${d.powerKw}kW<br/>电价: ¥${d.price.toFixed(3)}`;
      },
    },
    grid: { top: 16, right: 16, bottom: 36, left: 48 },
    xAxis: {
      type: 'category',
      data: items.map(i => i.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value', name: 'SoC %',
      min: 0, max: 100,
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
    },
    series: [
      {
        name: '电池 SoC',
        type: 'line',
        data: items.map(i => ({ value: (i.soc * 100).toFixed(1), itemStyle: { color: i.action === 'charge' ? '#00D4AA' : i.action === 'discharge' ? '#FF4D4F' : '#667EEA' } })),
        smooth: 0.4, lineStyle: { width: 2.5 },
        areaStyle: { color: 'rgba(0,212,170,0.08)' },
        symbol: 'circle', symbolSize: 5,
        markLine: {
          silent: true,
          data: [
            { yAxis: 95, lineStyle: { color: 'rgba(255,77,79,0.4)', type: 'dashed' }, name: '上限' },
            { yAxis: 15, lineStyle: { color: 'rgba(255,77,79,0.4)', type: 'dashed' }, name: '下限' },
          ],
          label: { formatter: '{b}', color: 'rgba(255,255,255,0.3)', fontSize: 9 },
        },
      },
    ],
  };

  // ─── Power dispatch chart ───────────────────────────────────────────────────
  const powerOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(102,126,234,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const d = s.items[params[0].dataIndex];
        return `<b>${d.hour}</b><br/>功率: ${d.powerKw > 0 ? '+' : ''}${d.powerKw}kW<br/>负荷: ${d.loadKwh}kW<br/>电价: ¥${d.price.toFixed(3)}`;
      },
    },
    legend: {
      data: ['电池功率', '电价(右轴)'],
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
    },
    grid: { top: 16, right: 48, bottom: 36, left: 48 },
    xAxis: {
      type: 'category',
      data: items.map(i => i.hour),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value', name: 'kW',
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
      },
      {
        type: 'value', name: '¥/kWh',
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, formatter: (v: number) => `¥${v.toFixed(2)}` },
        splitLine: { show: false },
        nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
      },
    ],
    series: [
      {
        name: '电池功率',
        type: 'bar',
        data: items.map(i => ({
          value: i.powerKw,
          itemStyle: {
            color: i.powerKw > 0 ? 'rgba(0,212,170,0.7)' : i.powerKw < 0 ? 'rgba(255,77,79,0.7)' : 'rgba(102,126,234,0.3)',
          },
        })),
        barWidth: '60%',
      },
      {
        name: '电价(右轴)',
        type: 'line',
        yAxisIndex: 1,
        data: items.map(i => ({ value: i.price, itemStyle: { color: '#FF9500' } })),
        smooth: 0.4, lineStyle: { width: 1.5, color: '#FF9500' },
        symbol: 'none',
      },
    ],
  };

  const columns = [
    {
      title: '时段',
      dataIndex: 'hour',
      key: 'hour',
      width: 70,
      render: (h: string) => <span style={{ color: '#fff', fontWeight: 500 }}>{h}</span>,
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (a: 'charge' | 'discharge' | 'hold') => {
        const s = ACTION_STYLE[a];
        return <Tag style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11 }}>{s.text}</Tag>;
      },
    },
    {
      title: `SoC`,
      dataIndex: 'soc',
      key: 'soc',
      width: 120,
      render: (soc: number) => (
        <Progress
          percent={Math.round(soc * 100)}
          size="small"
          strokeColor={soc > 0.8 ? '#FF4D4F' : soc > 0.2 ? '#00D4AA' : '#FF9500'}
          trailColor="rgba(255,255,255,0.06)"
          showInfo={false}
        />
      ),
    },
    {
      title: '功率 (kW)',
      dataIndex: 'powerKw',
      key: 'powerKw',
      width: 90,
      render: (p: number) => (
        <span style={{ color: p > 0 ? '#00D4AA' : p < 0 ? '#FF4D4F' : 'rgba(255,255,255,0.4)' }}>
          {p > 0 ? `+${p}` : p < 0 ? `${p}` : '0'}
        </span>
      ),
    },
    {
      title: '电价',
      dataIndex: 'price',
      key: 'price',
      width: 85,
      render: (p: number) => (
        <span style={{ color: p > 1 ? '#FF4D4F' : p < 0.4 ? '#00D4AA' : '#FF9500' }}>
          ¥{p.toFixed(3)}
        </span>
      ),
    },
    {
      title: '本时节省',
      dataIndex: 'savings',
      key: 'savings',
      width: 90,
      render: (s: number) => (
        <span style={{ color: s > 0 ? '#00D4AA' : 'rgba(255,255,255,0.3)' }}>
          {s >= 0 ? `+¥${s.toFixed(2)}` : `-¥${Math.abs(s).toFixed(2)}`}
        </span>
      ),
    },
    {
      title: '调度依据',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (r: string) => <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{r}</span>,
    },
  ];

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>⚡ AI 调度中心</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            削峰填谷 · 储能最优调度 · 实时功率分配
          </p>
        </div>
        <Button
          icon={<SwapOutlined />}
          onClick={fetchSchedule}
          style={{ background: 'rgba(0,212,170,0.12)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}
        >
          重新调度
        </Button>
      </div>

      {/* Real-time dispatch card */}
      {realtime && (
        <Card
          size="small"
          style={{ marginBottom: 14, background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}
          bodyStyle={{ padding: '10px 14px' }}
        >
          <Row gutter={[12, 8]} align="middle">
            <Col>
              <ClockCircleOutlined style={{ color: '#00D4AA', fontSize: 18 }} />
            </Col>
            <Col>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>当前决策 </span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                {realtime.action === 'charge' ? '⚡ 充电中' : realtime.action === 'discharge' ? '💰 放电中' : '⏸ 待机'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 8 }}>
                {realtime.powerKw > 0 ? `+${realtime.powerKw}kW` : `${realtime.powerKw}kW`}
              </span>
            </Col>
            <Col>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>实时电价 </span>
              <span style={{ color: '#FF9500', fontWeight: 600 }}>¥{realtime.currentPrice}/kWh</span>
            </Col>
            <Col>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>电池 SoC </span>
              <span style={{ color: '#00D4AA', fontWeight: 600 }}>{(realtime.batterySoC * 100).toFixed(0)}%</span>
            </Col>
            <Col xs={24} md={8}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{realtime.reason}</span>
            </Col>
          </Row>
        </Card>
      )}

      {/* Stats row */}
      <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
        {[
          { label: '日节省', value: `¥${p.dailySavings.toFixed(0)}`, sub: `月 ¥${(p.monthlySavings / 10000).toFixed(1)}万`, color: '#00D4AA', icon: <MoneyCollectOutlined /> },
          { label: '日充电', value: `${s.totalChargeKwh}kWh`, sub: `${s.summary.chargeHours}次充电`, color: '#667EEA', icon: <ThunderboltOutlined /> },
          { label: '日放电', value: `${s.totalDischargeKwh}kWh`, sub: `${s.summary.dischargeHours}次放电`, color: '#FF4D4F', icon: <ThunderboltOutlined /> },
          { label: '削峰', value: `${s.peakShaveKw}kW`, sub: `填谷 ${s.valleyFillKw}kW`, color: '#FF9500', icon: <SwapOutlined /> },
          { label: '电池容量', value: `${bc.capacityKwh}kWh`, sub: `功率 ${bc.ratedPowerKw}kW`, color: '#667EEA', icon: null },
          { label: '平均 SoC', value: `${(s.summary.avgSoC * 100).toFixed(0)}%`, sub: s.summary.bestDischargeWindow !== '无' ? `最佳放电: ${s.summary.bestDischargeWindow}` : '', color: '#00D4AA', icon: null },
        ].map(stat => (
          <Col xs={12} sm={8} md={4} key={stat.label}>
            <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${stat.color}22`, textAlign: 'center' }} bodyStyle={{ padding: '10px 6px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{stat.icon} {stat.label}</div>
              {stat.sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{stat.sub}</div>}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontSize: 14 }}>🔋 24小时电池 SoC 轨迹</span>}
            extra={<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>95% 上限 / 15% 下限</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}
            bodyStyle={{ padding: '10px 10px 6px' }}
          >
            <ReactECharts option={socOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontSize: 14 }}>⚡ 24小时功率调度（柱状=电池功率，线=电价）</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,149,0,0.12)' }}
            bodyStyle={{ padding: '10px 10px 6px' }}
          >
            <ReactECharts option={powerOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      {/* Schedule table */}
      <Card
        title="📋 24小时调度明细"
        extra={
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            共 {s.summary.chargeHours} 次充电 / {s.summary.dischargeHours} 次放电 / {s.summary.holdHours} 次待机
          </span>
        }
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={items}
          columns={columns}
          rowKey="hour"
          pagination={{ pageSize: 12, size: 'small', showSizeChanger: false }}
          scroll={{ x: 750 }}
          size="small"
        />
      </Card>
    </div>
  );
}
