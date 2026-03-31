import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Table, Tag, Button, Space, Modal, Form, InputNumber, message, Alert, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import api from '../services/api';

interface HalfHourSlot {
  timestamp: string;
  time: string;
  price: number;
  zone: 'peak' | 'normal' | 'valley';
  zoneText: string;
  isPast: boolean;
  region: string;
}

interface OptimalWindows {
  bestCharge: HalfHourSlot[];
  bestDischarge: HalfHourSlot[];
  action: { text: string; reason: string; color: string };
}

interface RealtimeData {
  region: string;
  currentPrice: number;
  unit: string;
  zone: string;
  zones: Record<string, { label: string; range: string; price: number }>;
  updatedAt: string;
}

const ZONE_COLORS = {
  peak: { color: '#FF4D4F', bg: 'rgba(255,77,79,0.12)', border: 'rgba(255,77,79,0.25)', text: '尖峰' },
  normal: { color: '#667EEA', bg: 'rgba(102,126,234,0.12)', border: 'rgba(102,126,234,0.25)', text: '平段' },
  valley: { color: '#00D4AA', bg: 'rgba(0,212,170,0.12)', border: 'rgba(0,212,170,0.25)', text: '谷时' },
};

export default function ElectricityTrade() {
  const [region, setRegion] = useState('华东电网');
  const [prices, setPrices] = useState<HalfHourSlot[]>([]);
  const [optimal, setOptimal] = useState<OptimalWindows | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHalfHourly = async () => {
    try {
      const res = await api.get(`/electricity/prices/half-hourly?region=${region}`);
      if (res.data.success) {
        setPrices(res.data.data.prices);
        setOptimal(res.data.data.optimal);
      }
    } catch (e) {
      console.error('Failed to fetch prices', e);
    }
  };

  const fetchRealtime = async () => {
    try {
      const res = await api.get(`/electricity/prices/realtime?region=${region}`);
      if (res.data.success) setRealtime(res.data.data);
    } catch (e) {
      console.error('Failed to fetch realtime price', e);
    }
  };

  useEffect(() => {
    fetchHalfHourly();
    fetchRealtime();
    const interval = setInterval(() => {
      fetchRealtime();
    }, 60000);
    return () => clearInterval(interval);
  }, [region]);

  // Build heatmap data: 48 slots x-axis time, color = price
  const heatmapOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,15,35,0.95)',
      borderColor: 'rgba(102,126,234,0.3)',
      textStyle: { color: 'white', fontSize: 12 },
      formatter: (params: { data: HalfHourSlot }) => {
        const p = params.data;
        return `<div style="padding:4px">
          <div style="font-weight:bold;margin-bottom:4px">${p.time} - ${p.zoneText}</div>
          <div style="color:${ZONE_COLORS[p.zone]?.color}">¥${p.price.toFixed(4)}/kWh</div>
          <div style="color:rgba(255,255,255,0.5);font-size:11px">${p.isPast ? '历史' : '预测'}</div>
        </div>`;
      },
    },
    grid: { top: 10, right: 10, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: prices.map(p => p.time),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        interval: 3,
        rotate: 45,
      },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: ['价格'],
      show: false,
    },
    visualMap: {
      min: 0.2,
      max: 1.5,
      calculable: false,
      orient: 'horizontal',
      left: 50,
      bottom: 0,
      inRange: {
        color: ['#00D4AA', '#667EEA', '#FF9500', '#FF4D4F'],
      },
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      formatter: (v: number) => `¥${v.toFixed(2)}`,
    },
    series: [{
      type: 'heatmap',
      data: prices.map((p, i) => [i, 0, p.price]),
      itemStyle: {
        borderRadius: 3,
        borderWidth: 2,
        borderColor: 'rgba(10,14,26,0.8)',
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  };

  // Prediction chart with confidence band
  const predictionOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,15,35,0.95)',
      borderColor: 'rgba(102,126,234,0.3)',
      textStyle: { color: 'white' },
    },
    legend: { data: ['预测电价', '置信上界', '置信下界'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 } },
    grid: { top: 20, right: 20, bottom: 50, left: 50 },
    xAxis: {
      type: 'category',
      data: prices.filter(p => !p.isPast).slice(0, 24).map(p => p.time),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '元/kWh',
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', formatter: (v: number) => `¥${v.toFixed(2)}` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
    },
    series: [
      {
        name: '预测电价',
        type: 'line',
        data: prices.filter(p => !p.isPast).slice(0, 24).map(p => ({ value: p.price, itemStyle: { color: ZONE_COLORS[p.zone]?.color } })),
        smooth: true,
        lineStyle: { color: '#667EEA', width: 2 },
        areaStyle: { color: 'rgba(102,126,234,0.15)' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };

  const columns: ColumnsType<HalfHourSlot> = [
    { title: '时段', dataIndex: 'time', key: 'time', width: 70 },
    { title: '区间', dataIndex: 'zoneText', key: 'zoneText', width: 70, render: (t: string, r: HalfHourSlot) => (
      <Tag style={{ background: ZONE_COLORS[r.zone]?.bg, color: ZONE_COLORS[r.zone]?.color, border: `1px solid ${ZONE_COLORS[r.zone]?.border}` }}>{t}</Tag>
    )},
    { title: '价格', dataIndex: 'price', key: 'price', render: (p: number) => <span style={{ fontWeight: 600, color: ZONE_COLORS[prices.find(x=>x.price===p)?.zone || 'normal']?.color }}>¥{p.toFixed(4)}</span> },
    { title: '性质', key: 'isPast', render: (_: unknown, r: HalfHourSlot) => r.isPast ? <Tag>历史</Tag> : <Tag color="purple">预测</Tag> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>⚡ 电力交易</h2>

      {/* Optimal Action Alert */}
      {optimal && (
        <Alert
          message={optimal.action.text}
          description={
            <div>
              <div style={{ color: optimal.action.color }}>{optimal.action.reason}</div>
              {optimal.bestCharge.length > 0 && (
                <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  💡 最佳充电时段：{optimal.bestCharge.map(s => s.time).join('、')}
                </div>
              )}
              {optimal.bestDischarge.length > 0 && (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                  💰 最佳放电时段：{optimal.bestDischarge.map(s => s.time).join('、')}
                </div>
              )}
            </div>
          }
          type="info"
          showIcon
          icon={<span style={{ fontSize: 20 }}>⚡</span>}
          style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', border: `1px solid ${optimal.action.color}33` }}
        />
      )}

      {/* Realtime Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>当前电价</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: realtime ? ZONE_COLORS[realtime.zone as keyof typeof ZONE_COLORS]?.color : '#667EEA' }}>
                  ¥{realtime ? realtime.currentPrice.toFixed(4) : '--'}
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/kWh</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{realtime ? new Date(realtime.updatedAt).toLocaleTimeString('zh-CN') : '--'}</div>
                <Badge status="processing" text={<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>实时</span>} />
              </div>
            </div>
          </Card>
        </Col>
        {realtime && Object.entries(realtime.zones).map(([key, z]) => (
          <Col xs={12} lg={6} key={key}>
            <Card size="small" style={{ background: ZONE_COLORS[key as keyof typeof ZONE_COLORS]?.bg, border: `1px solid ${ZONE_COLORS[key as keyof typeof ZONE_COLORS]?.border}` }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{z.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: ZONE_COLORS[key as keyof typeof ZONE_COLORS]?.color }}>¥{z.price.toFixed(4)}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{z.range}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="📊 48小时电价热力图（半小时粒度）"
            extra={<Space><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>← 历史 | 预测 →</span></Space>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
          >
            <ReactECharts option={heatmapOption} style={{ height: 'calc(100vw < 768 ? 200px : 280px)' }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="📈 明日电价预测"
            extra={<Select value={region} onChange={setRegion} size="small" style={{ width: 130 }} options={[
              { value: '华东电网', label: '华东电网' },
              { value: '华北电网', label: '华北电网' },
              { value: '华南电网', label: '华南电网' },
            ]} />}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
          >
            <ReactECharts option={predictionOption} style={{ height: 'calc(100vw < 768 ? 200px : 280px)' }} />
          </Card>
        </Col>
      </Row>

      {/* Trade Orders Table */}
      <Card
        title="📋 历史电价记录"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
        extra={<Button type="primary" size="small" onClick={() => setIsModalOpen(true)}>+ 下单</Button>}
      >
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={prices.slice(0, 24)}
            columns={columns}
            rowKey="timestamp"
            pagination={{ pageSize: 12, size: 'small' }}
            scroll={{ x: 600 }}
            size="small"
          />
        </div>
      </Card>

      <Modal title="⚡ 提交交易订单" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={440}>
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(102,126,234,0.1)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          当前电价参考：<span style={{ color: '#667EEA', fontWeight: 600 }}>¥{realtime?.currentPrice.toFixed(4) || '--'}/kWh</span>
        </div>
        <Form layout="vertical" size="middle">
          <Form.Item label="订单类型">
            <Select placeholder="选择类型" options={[{ value: 'buy', label: '购电（充电）' }, { value: 'sell', label: '售电（放电）' }]} />
          </Form.Item>
          <Form.Item label="目标电量 (kWh)">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="例如：1000" />
          </Form.Item>
          <Form.Item label="期望价格 (元/kWh)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="例如：0.65" />
          </Form.Item>
          <Form.Item label="执行时间">
            <Select placeholder="选择时间" options={[
              { value: 'now', label: '立即执行' },
              { value: 'valley', label: '谷时执行（00:00-07:00）' },
              { value: 'peak', label: '峰时执行（08:00-21:00）' },
            ]} />
          </Form.Item>
          <Button type="primary" block onClick={() => { message.success('订单已提交'); setIsModalOpen(false); }}>提交订单</Button>
        </Form>
      </Modal>
    </div>
  );
}
