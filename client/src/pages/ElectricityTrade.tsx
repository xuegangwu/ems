import { useState } from 'react';
import { Card, Row, Col, Select, DatePicker, Table, Tag, Button, Space, Tabs, Modal, Form, InputNumber, message, Statistic, Alert, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { tradeOrders, electricityPrices } from '../services/mockData';
import type { TradeOrder, ElectricityPrice, PricePrediction } from '../types';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const orderColumns: ColumnsType<TradeOrder> = [
  { title: '订单时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  { title: '电站', dataIndex: 'stationId', key: 'stationId' },
  { title: '类型', dataIndex: 'type', key: 'type', render: (type) => (
    <Tag color={type === 'buy' ? 'blue' : 'green'}>{type === 'buy' ? '购电' : '售电'}</Tag>
  )},
  { title: '功率 (kW)', dataIndex: 'power', key: 'power' },
  { title: '价格 (元/kWh)', dataIndex: 'price', key: 'price', render: (p) => `¥${p.toFixed(3)}` },
  { title: '电量 (kWh)', dataIndex: 'quantity', key: 'quantity' },
  { title: '总金额 (元)', dataIndex: 'totalAmount', key: 'totalAmount', render: (a) => `¥${a.toFixed(2)}` },
  { title: '状态', dataIndex: 'status', key: 'status', render: (status) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待成交' },
      matched: { color: 'blue', text: '已匹配' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  }},
];

const priceColumns: ColumnsType<ElectricityPrice> = [
  { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 120 },
  { title: '区域', dataIndex: 'region', key: 'region', width: 100 },
  { title: '当前价', dataIndex: 'currentPrice', key: 'currentPrice', render: (p) => p ? `¥${p.toFixed(3)}` : '-' },
  { title: '趋势', dataIndex: 'priceTrend', key: 'priceTrend', render: (t) => {
    const map: Record<string, { color: string; text: string }> = {
      rising: { color: 'red', text: '↑ 上涨' },
      falling: { color: 'green', text: '↓ 下跌' },
      stable: { color: 'default', text: '→ 平稳' },
    };
    const m = map[t || 'stable'] || map.stable;
    return <Tag color={m.color}>{m.text}</Tag>;
  }},
  { title: '尖时电价', dataIndex: 'peakPrice', key: 'peakPrice', render: (p) => `¥${p.toFixed(3)}` },
  { title: '平段电价', dataIndex: 'flatPrice', key: 'flatPrice', render: (p) => `¥${p.toFixed(3)}` },
  { title: '谷时电价', dataIndex: 'valleyPrice', key: 'valleyPrice', render: (p) => `¥${p.toFixed(3)}` },
  { title: '套利建议', dataIndex: 'arbitrageSuggestion', key: 'arbitrageSuggestion', render: (s) => s || '-' },
];

// Generate 24h price heatmap data
const generateHeatmapData = () => {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const prices = [
    0.36, 0.32, 0.30, 0.28, 0.30, 0.45,  // 00-05 谷时
    0.78, 1.15, 1.28, 1.22, 1.18, 1.25,  // 06-11 峰时
    1.28, 1.20, 1.15, 1.22, 1.30, 1.28,  // 12-17 峰时
    1.18, 0.95, 0.75, 0.62, 0.48, 0.42,  // 18-23 平/谷
  ];
  return { hours, prices };
};

// Generate price prediction data
const generatePredictionData = (): PricePrediction[] => {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date(now.getTime() + i * 3600000);
    const hour = t.getHours();
    const basePrice = hour >= 6 && hour <= 21 ? 0.9 + Math.random() * 0.4 : 0.35 + Math.random() * 0.15;
    return {
      timestamp: t.toISOString(),
      predictedPrice: parseFloat(basePrice.toFixed(3)),
      confidence: 0.75 + Math.random() * 0.2,
      reason: hour >= 6 && hour <= 9 ? '早高峰预期' : hour >= 17 && hour <= 20 ? '晚高峰预期' : '正常负荷',
    };
  });
};

export default function ElectricityTrade() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [region, setRegion] = useState('华东电网');
  const { hours, prices } = generateHeatmapData();
  const predictions = generatePredictionData();

  // Find current best action
  const currentHour = new Date().getHours();
  const currentPrice = prices[currentHour];
  const isLowPrice = currentHour >= 0 && currentHour <= 5;
  const isHighPrice = currentHour >= 8 && currentHour <= 21;

  const handleSubmitOrder = () => {
    form.validateFields().then(values => {
      console.log(values);
      message.success('订单提交成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  // 24h heatmap chart
  const heatmapOption = {
    tooltip: {
      formatter: (p: any) => `${p.data[0]}:00<br/>电价: ¥${p.data[1].toFixed(3)}`
    },
    grid: { top: 10, right: 20, bottom: 30, left: 50 },
    xAxis: { type: 'category', data: hours, axisLabel: { interval: 3, rotate: 45 } },
    yAxis: { type: 'category', data: ['电价(元/kWh)'], show: false },
    visualMap: {
      min: 0.2, max: 1.4,
      inRange: { color: ['#00D4AA', '#7FFF00', '#FFD700', '#FF4500'] },
      text: ['高', '低'],
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
    },
    series: [{
      type: 'heatmap',
      data: hours.map((_, i) => [i, 0, prices[i]]),
      label: { show: false },
      itemStyle: { borderRadius: [4, 4, 4, 4], borderWidth: 2, borderColor: 'white' },
    }],
  };

  // Price trend + prediction chart
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['今日电价', '预测电价'], bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: hours },
    yAxis: { type: 'value', name: '元/kWh', min: 0, max: 1.5 },
    series: [
      {
        name: '今日电价',
        type: 'line',
        data: prices,
        smooth: true,
        lineStyle: { color: '#0066FF', width: 2 },
        areaStyle: { color: 'rgba(0,102,255,0.1)' },
        itemStyle: { color: '#0066FF' },
      },
      {
        name: '预测电价',
        type: 'line',
        data: [...prices.slice(0, currentHour + 1), ...predictions.slice(currentHour + 1).map(p => p.predictedPrice)],
        smooth: true,
        lineStyle: { color: '#FF9500', width: 2, type: 'dashed' },
        itemStyle: { color: '#FF9500' },
      },
    ],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>⚡ 电力交易</h2>

      {/* Strategy Alert */}
      <Alert
        message={isLowPrice ? '💡 谷时低价 - 建议：储能充电' : isHighPrice ? '⚡ 峰时高价 - 建议：储能放电' : '📊 平段运行 - 建议：正常调度'}
        description={isLowPrice ? '当前电价偏低（¥' + currentPrice.toFixed(3) + '/kWh），适合储能设备充电存储能量。' :
                     isHighPrice ? '当前电价偏高（¥' + currentPrice.toFixed(3) + '/kWh），储能设备可放电套利。' :
                     '电价平稳，可根据次日预测灵活调整调度策略。'}
        type={isLowPrice ? 'info' : isHighPrice ? 'warning' : 'info'}
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="24小时电价热力图" extra={<Badge status="processing" text="实时更新" />}>
            <ReactECharts option={heatmapOption} style={{ height: 200 }} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: '#666' }}>
              <span>🟢 谷时 00:00-06:00</span>
              <span>🔴 峰时 08:00-21:00</span>
              <span>🟡 平段 其余时段</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="电价走势与预测" extra={<Select value={region} onChange={setRegion} style={{ width: 120 }} size="small" />}>
            <ReactECharts option={trendOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} lg={6}>
          <Card><Statistic title="当前电价" value={currentPrice} precision={3} prefix="¥" suffix="/kWh" /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card><Statistic title="预测峰值" value={1.28} precision={3} prefix="¥" suffix="/kWh" valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card><Statistic title="预测谷值" value={0.28} precision={3} prefix="¥" suffix="/kWh" valueStyle={{ color: '#00D4AA' }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card><Statistic title="峰谷差" value={1.00} precision={2} prefix="¥" suffix="/kWh" /></Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="orders">
          <TabPane tab="交易订单" key="orders">
            <Space size="large" style={{ marginBottom: 16 }} wrap>
              <Select defaultValue="all" style={{ width: 150 }}>
                <Select.Option value="all">全部订单</Select.Option>
                <Select.Option value="buy">购电订单</Select.Option>
                <Select.Option value="sell">售电订单</Select.Option>
              </Select>
              <RangePicker />
              <Button type="primary" onClick={() => setIsModalOpen(true)}>+ 提交订单</Button>
            </Space>
            <Table dataSource={tradeOrders} columns={orderColumns} rowKey="id" pagination={{ pageSize: 10 }} />
          </TabPane>
          <TabPane tab="实时电价" key="prices">
            <Space style={{ marginBottom: 12 }}>
              <Select value={region} onChange={setRegion} style={{ width: 140 }}>
                <Select.Option value="华东电网">华东电网</Select.Option>
                <Select.Option value="华北电网">华北电网</Select.Option>
                <Select.Option value="华南电网">华南电网</Select.Option>
                <Select.Option value="华中电网">华中电网</Select.Option>
              </Select>
              <span style={{ color: '#666', fontSize: 12 }}>数据每15分钟刷新</span>
            </Space>
            <Table dataSource={electricityPrices} columns={priceColumns} rowKey="id" pagination={{ pageSize: 10 }} />
          </TabPane>
          <TabPane tab="明日预测" key="forecast">
            <Table
              dataSource={predictions}
              columns={[
                { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (t) => new Date(t).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) },
                { title: '预测电价', dataIndex: 'predictedPrice', key: 'predictedPrice', render: (p) => `¥${p.toFixed(3)}` },
                { title: '置信度', dataIndex: 'confidence', key: 'confidence', render: (c) => `${(c * 100).toFixed(0)}%` },
                { title: '预测依据', dataIndex: 'reason', key: 'reason' },
              ]}
              rowKey="id"
              pagination={{ pageSize: 8 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal title="提交交易订单" open={isModalOpen} onOk={handleSubmitOrder} onCancel={() => setIsModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item label="订单类型" name="type" rules={[{ required: true }]}>
            <Select options={[{ value: 'buy', label: '购电' }, { value: 'sell', label: '售电' }]} />
          </Form.Item>
          <Form.Item label="电站" name="station" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'station-001', label: '苏州工业园光伏电站' },
                { value: 'station-002', label: '无锡储能电站' },
                { value: 'station-003', label: '杭州光储一体化电站' },
              ]}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="功率 (kW)" name="power" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="电量 (kWh)" name="quantity" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="期望价格 (元/kWh)" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.001} precision={3} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
