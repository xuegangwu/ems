import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, InputNumber, Select, message, Progress, Statistic, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import type { DistributedResource, DispatchOrder, VPP聚合 } from '../types';

const resourceColumns: ColumnsType<DistributedResource> = [
  { title: '资源名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', render: (t) => {
    const map: Record<string, { color: string; text: string }> = {
      battery: { color: 'blue', text: '储能' },
      ev_charger: { color: 'green', text: '充电桩' },
      heat_pump: { color: 'orange', text: '热泵' },
      flexible_load: { color: 'purple', text: '可调负荷' },
    };
    return <Tag color={map[t]?.color}>{map[t]?.text || t}</Tag>;
  }},
  { title: '容量 (kW)', dataIndex: 'capacity', key: 'capacity' },
  { title: '当前功率 (kW)', dataIndex: 'currentPower', key: 'currentPower' },
  { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
    const map: Record<string, { color: string; text: string }> = {
      online: { color: 'success', text: '在线' },
      offline: { color: 'default', text: '离线' },
      dispatching: { color: 'processing', text: '调度中' },
      standby: { color: 'warning', text: '待机' },
    };
    return <Badge status={map[s]?.color as any} text={map[s]?.text || s} />;
  }},
  { title: '可调度', dataIndex: 'dispatchable', key: 'dispatchable', render: (d) => d ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag> },
  { title: '响应时间', dataIndex: 'responseTime', key: 'responseTime', render: (t) => `${t}s` },
  {
    title: '操作',
    key: 'action',
    render: (_, r) => r.dispatchable ? (
      <Button size="small" type="link" onClick={() => handleDispatch(r)}>调度</Button>
    ) : null,
  },
];

const orderColumns: ColumnsType<DispatchOrder> = [
  { title: '订单ID', dataIndex: 'id', key: 'id', width: 200 },
  { title: 'VPP', dataIndex: 'vppId', key: 'vppId' },
  { title: '方向', dataIndex: 'direction', key: 'direction', render: (d) => <Tag color={d === 'charge' ? 'blue' : 'green'}>{d === 'charge' ? '充电' : '放电'}</Tag> },
  { title: '功率 (kW)', dataIndex: 'power', key: 'power' },
  { title: '时长 (min)', dataIndex: 'duration', key: 'duration' },
  { title: '原因', dataIndex: 'reason', key: 'reason' },
  { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待执行' },
      executing: { color: 'processing', text: '执行中' },
      completed: { color: 'green', text: '已完成' },
      failed: { color: 'red', text: '失败' },
    };
    return <Tag color={map[s]?.color}>{map[s]?.text || s}</Tag>;
  }},
  { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 160 },
];

// Mock VPP data
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

// Mock resources
const mockResources: DistributedResource[] = [
  { id: 'r-001', name: '苏州工业园储能', type: 'battery', capacity: 1000, currentPower: 320, status: 'online', stationId: 's-001', location: '苏州工业园', dispatchable: true, responseTime: 5 },
  { id: 'r-002', name: '杭州光储储能', type: 'battery', capacity: 500, currentPower: 180, status: 'dispatching', stationId: 's-003', location: '杭州', dispatchable: true, responseTime: 8 },
  { id: 'r-003', name: '上海EV充电站#1', type: 'ev_charger', capacity: 240, currentPower: 156, status: 'online', stationId: 's-004', location: '上海', dispatchable: true, responseTime: 3 },
  { id: 'r-004', name: '无锡工厂热泵', type: 'heat_pump', capacity: 350, currentPower: 210, status: 'standby', stationId: 's-005', location: '无锡', dispatchable: true, responseTime: 15 },
  { id: 'r-005', name: '苏州可调负荷#2', type: 'flexible_load', capacity: 600, currentPower: 420, status: 'online', stationId: 's-006', location: '苏州', dispatchable: false, responseTime: 30 },
];

// Mock dispatch orders
const mockOrders: DispatchOrder[] = [
  { id: 'do-001', vppId: '华东虚拟电厂', direction: 'discharge', power: 500, duration: 30, reason: '高峰电价套利', status: 'completed', timestamp: '2026-03-31 08:30:00' },
  { id: 'do-002', vppId: '华东虚拟电厂', direction: 'charge', power: 300, duration: 60, reason: '谷时储电', status: 'completed', timestamp: '2026-03-31 02:00:00' },
  { id: 'do-003', vppId: '华东虚拟电厂', direction: 'discharge', power: 200, duration: 20, reason: '需求响应', status: 'executing', timestamp: '2026-03-31 09:00:00' },
];

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

  // Dispatch capability chart
  const dispatchCapabilityOption = {
    title: { text: '调度能力分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 3200, name: '储能', itemStyle: { color: '#0066FF' } },
        { value: 240, name: '充电桩', itemStyle: { color: '#00D4AA' } },
        { value: 350, name: '热泵', itemStyle: { color: '#FF9500' } },
        { value: 410, name: '可调负荷', itemStyle: { color: '#9B59B6' } },
      ],
    }],
  };

  // Capacity timeline
  const capacityTimelineOption = {
    title: { text: '可用容量趋势 (24h)', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
    yAxis: { type: 'value', name: 'kWh', min: 0 },
    series: [{
      name: '可用容量',
      type: 'bar',
      data: [4100, 4200, 3800, 3600, 3500, 3700, 3800],
      itemStyle: { color: '#0066FF', borderRadius: [4, 4, 0, 0] },
    }],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>🔗 虚拟电厂 (VPP)</h2>

      {/* VPP Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="聚合总容量"
              value={mockVPP.totalCapacity}
              suffix="kW"
              valueStyle={{ color: '#0066FF' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="可调度容量"
              value={mockVPP.availableCapacity}
              suffix="kW"
              valueStyle={{ color: '#00D4AA' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic
              title="当前调度中"
              value={mockVPP.dispatchingCapacity}
              suffix="kW"
              valueStyle={{ color: '#FF9500' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="接入资源数" value={mockVPP.resourceCount} suffix="个" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card><ReactECharts option={dispatchCapabilityOption} style={{ height: 260 }} /></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card><ReactECharts option={capacityTimelineOption} style={{ height: 260 }} /></Card>
        </Col>
      </Row>

      {/* Resource List */}
      <Card style={{ marginTop: 16 }} title="分布式资源">
        <Space style={{ marginBottom: 12 }}>
          <Select defaultValue="all" style={{ width: 120 }}>
            <Select.Option value="all">全部类型</Select.Option>
            <Select.Option value="battery">储能</Select.Option>
            <Select.Option value="ev_charger">充电桩</Select.Option>
            <Select.Option value="heat_pump">热泵</Select.Option>
            <Select.Option value="flexible_load">可调负荷</Select.Option>
          </Select>
          <Select defaultValue="all" style={{ width: 100 }}>
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="online">在线</Select.Option>
            <Select.Option value="dispatching">调度中</Select.Option>
            <Select.Option value="standby">待机</Select.Option>
          </Select>
        </Space>
        <Table dataSource={mockResources} columns={resourceColumns} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>

      {/* Dispatch Orders */}
      <Card style={{ marginTop: 16 }} title="调度记录">
        <Table dataSource={mockOrders} columns={orderColumns} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>

      {/* Dispatch Modal */}
      <Modal
        title={`调度指令 - ${selectedResource?.name || ''}`}
        open={isModalOpen}
        onOk={handleSubmitDispatch}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="调度方向" name="direction" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'charge', label: '充电 (储电)' },
                { value: 'discharge', label: '放电 (售电)' },
              ]}
            />
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
            <Select
              options={[
                { value: 'peak_arbitrage', label: '峰时电价套利' },
                { value: 'valley_charge', label: '谷时储电' },
                { value: 'demand_response', label: '需求响应' },
                { value: 'grid_ancillary', label: '电网调频辅助' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
