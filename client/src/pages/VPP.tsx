import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, InputNumber, Select, message, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import type { DistributedResource, DispatchOrder, VPP聚合 } from '../types';

const mockVPP: VPP聚合 = {
  id: 'vpp-001',
  name: '华东虚拟电厂',
  totalCapacity: 5200,
  availableCapacity: 3800,
  dispatchingCapacity: 1200,
  resourceCount: 47,
  regions: ['上海', '苏州', '无锡', '杭州'],
  status: 'active',
};

const mockResources: DistributedResource[] = [
  { id: 'r-001', name: '苏州工业园储能', type: 'battery', capacity: 1000, currentPower: 320, status: 'online', stationId: 's-001', location: '苏州工业园', dispatchable: true, responseTime: 5 },
  { id: 'r-002', name: '杭州光储储能', type: 'battery', capacity: 500, currentPower: 180, status: 'dispatching', stationId: 's-003', location: '杭州', dispatchable: true, responseTime: 8 },
  { id: 'r-003', name: '上海EV充电站#1', type: 'ev_charger', capacity: 240, currentPower: 156, status: 'online', stationId: 's-004', location: '上海', dispatchable: true, responseTime: 3 },
  { id: 'r-004', name: '无锡工厂热泵', type: 'heat_pump', capacity: 350, currentPower: 210, status: 'standby', stationId: 's-005', location: '无锡', dispatchable: true, responseTime: 15 },
  { id: 'r-005', name: '苏州可调负荷#2', type: 'flexible_load', capacity: 600, currentPower: 420, status: 'online', stationId: 's-006', location: '苏州', dispatchable: false, responseTime: 30 },
];

const mockOrders: DispatchOrder[] = [
  { id: 'do-001', vppId: '华东虚拟电厂', direction: 'discharge', power: 500, duration: 30, reason: '高峰电价套利', status: 'completed', timestamp: '2026-03-31 08:30:00' },
  { id: 'do-002', vppId: '华东虚拟电厂', direction: 'charge', power: 300, duration: 60, reason: '谷时储电', status: 'completed', timestamp: '2026-03-31 02:00:00' },
  { id: 'do-003', vppId: '华东虚拟电厂', direction: 'discharge', power: 200, duration: 20, reason: '需求响应', status: 'executing', timestamp: '2026-03-31 09:00:00' },
];

const typeMap: Record<string, { color: string; text: string }> = {
  battery: { color: 'blue', text: '储能' },
  ev_charger: { color: 'green', text: '充电桩' },
  heat_pump: { color: 'orange', text: '热泵' },
  flexible_load: { color: 'purple', text: '可调负荷' },
};

const statusMap: Record<string, { color: string; text: string }> = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  dispatching: { color: 'processing', text: '调度中' },
  standby: { color: 'warning', text: '待机' },
};

const orderStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待执行' },
  executing: { color: 'processing', text: '执行中' },
  completed: { color: 'green', text: '已完成' },
  failed: { color: 'red', text: '失败' },
};

export default function VPP() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedResource, setSelectedResource] = useState<DistributedResource | null>(null);

  const handleDispatch = (resource: DistributedResource) => {
    setSelectedResource(resource);
    setIsModalOpen(true);
  };

  const handleSubmitDispatch = () => {
    form.validateFields().then(values => {
      console.log({ ...values, resourceId: selectedResource?.id });
      message.success('调度指令已下发');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const resourceColumns: ColumnsType<DistributedResource> = [
    { title: '资源名称', dataIndex: 'name', key: 'name', width: 140 },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={typeMap[t]?.color}>{typeMap[t]?.text || t}</Tag> },
    { title: '容量 (kW)', dataIndex: 'capacity', key: 'capacity' },
    { title: '当前功率', dataIndex: 'currentPower', key: 'currentPower' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text || s}</Tag> },
    { title: '可调度', dataIndex: 'dispatchable', key: 'dispatchable', render: (d: boolean) => d ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag> },
    { title: '响应', dataIndex: 'responseTime', key: 'responseTime', render: (t: number) => `${t}s` },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, r: DistributedResource) => r.dispatchable ? (
        <Button size="small" type="link" onClick={() => handleDispatch(r)}>调度</Button>
      ) : null,
    },
  ];

  const orderColumns: ColumnsType<DispatchOrder> = [
    { title: '订单ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '方向', dataIndex: 'direction', key: 'direction', render: (d: string) => <Tag color={d === 'charge' ? 'blue' : 'green'}>{d === 'charge' ? '充电' : '放电'}</Tag> },
    { title: '功率 (kW)', dataIndex: 'power', key: 'power' },
    { title: '时长', dataIndex: 'duration', key: 'duration', render: (t: number) => `${t}min` },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={orderStatusMap[s]?.color}>{orderStatusMap[s]?.text || s}</Tag> },
  ];

  const dispatchCapabilityOption = {
    title: { text: '调度能力分布', left: 'center', textStyle: { fontSize: 14, color: 'rgba(255,255,255,0.7)' } },
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)' } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#0A0E1A', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 3200, name: '储能', itemStyle: { color: '#0066FF' } },
        { value: 240, name: '充电桩', itemStyle: { color: '#00D4AA' } },
        { value: 350, name: '热泵', itemStyle: { color: '#FF9500' } },
        { value: 410, name: '可调负荷', itemStyle: { color: '#9B59B6' } },
      ],
    }],
  };

  const capacityTimelineOption = {
    title: { text: '可用容量趋势 (24h)', left: 'center', textStyle: { fontSize: 14, color: 'rgba(255,255,255,0.7)' } },
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { type: 'category' as const, data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'], axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' } },
    yAxis: { type: 'value' as const, name: 'kWh', min: 0, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.4)' } },
    series: [{
      name: '可用容量',
      type: 'bar' as const,
      data: [4100, 4200, 3800, 3600, 3500, 3700, 3800],
      itemStyle: { color: '#0066FF', borderRadius: [4, 4, 0, 0] },
    }],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>🔗 虚拟电厂 (VPP)</h2>

      <Row gutter={[12, 12]}>
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title="聚合总容量" value={mockVPP.totalCapacity} suffix="kW" valueStyle={{ color: '#0066FF', fontSize: 20 }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title="可调度容量" value={mockVPP.availableCapacity} suffix="kW" valueStyle={{ color: '#00D4AA', fontSize: 20 }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title="当前调度中" value={mockVPP.dispatchingCapacity} suffix="kW" valueStyle={{ color: '#FF9500', fontSize: 20 }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title="接入资源数" value={mockVPP.resourceCount} suffix="个" valueStyle={{ fontSize: 20 }} /></Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><ReactECharts option={dispatchCapabilityOption} style={{ height: 'calc(100vw < 768 ? 220px : 260px)' }} /></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><ReactECharts option={capacityTimelineOption} style={{ height: 'calc(100vw < 768 ? 220px : 260px)' }} /></Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }} title="分布式资源">
        <Space style={{ marginBottom: 12 }} wrap>
          <Select defaultValue="all" style={{ minWidth: 110 }}>
            <Select.Option value="all">全部类型</Select.Option>
            <Select.Option value="battery">储能</Select.Option>
            <Select.Option value="ev_charger">充电桩</Select.Option>
            <Select.Option value="heat_pump">热泵</Select.Option>
            <Select.Option value="flexible_load">可调负荷</Select.Option>
          </Select>
          <Select defaultValue="all" style={{ minWidth: 100 }}>
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="online">在线</Select.Option>
            <Select.Option value="dispatching">调度中</Select.Option>
            <Select.Option value="standby">待机</Select.Option>
          </Select>
        </Space>
        <div style={{ overflowX: 'auto' }}>
          <Table dataSource={mockResources} columns={resourceColumns} rowKey="id" pagination={{ pageSize: 5 }} scroll={{ x: 900 }} />
        </div>
      </Card>

      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }} title="调度记录">
        <div style={{ overflowX: 'auto' }}>
          <Table dataSource={mockOrders} columns={orderColumns} rowKey="id" pagination={{ pageSize: 5 }} scroll={{ x: 700 }} />
        </div>
      </Card>

      <Modal title={`调度指令 - ${selectedResource?.name || ''}`} open={isModalOpen} onOk={handleSubmitDispatch} onCancel={() => setIsModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="调度方向" name="direction" rules={[{ required: true }]}>
            <Select options={[{ value: 'charge', label: '充电 (储电)' }, { value: 'discharge', label: '放电 (售电)' }]} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="功率 (kW)" name="power" rules={[{ required: true }]}>
                <InputNumber min={0} max={selectedResource?.capacity || 0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="时长 (分钟)" name="duration" rules={[{ required: true }]}>
                <InputNumber min={1} max={480} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="调度原因" name="reason" rules={[{ required: true }]}>
            <Select options={[
              { value: 'peak_arbitrage', label: '峰时电价套利' },
              { value: 'valley_charge', label: '谷时储电' },
              { value: 'demand_response', label: '需求响应' },
              { value: 'grid_ancillary', label: '电网调频辅助' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
