import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Select, InputNumber, Switch, message, Tabs, Progress, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

interface Strategy {
  id: string;
  name: string;
  type: string;
  stationId: string;
  enabled: boolean;
  effectReport?: { totalSavings: number; efficiency: number };
}

const mockStrategies: Strategy[] = [
  { id: 'strategy-001', name: '峰谷套利策略', type: 'peak_valley', stationId: 'station-002', enabled: true, effectReport: { totalSavings: 125000, efficiency: 89.5 } },
  { id: 'strategy-002', name: '需量控制策略', type: 'demand_control', stationId: 'station-003', enabled: true, effectReport: { totalSavings: 45000, efficiency: 92.3 } },
  { id: 'strategy-003', name: '备电保护策略', type: 'backup', stationId: 'station-001', enabled: false },
];

const effectChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['峰谷套利', '需量节省', '备电保护'], bottom: 0 },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', name: '金额 (元)' },
  series: [
    { name: '峰谷套利', type: 'bar', stack: 'total', data: [85000, 92000, 88000, 95000, 102000, 110000] },
    { name: '需量节省', type: 'bar', stack: 'total', data: [25000, 28000, 26000, 30000, 32000, 35000] },
    { name: '备电保护', type: 'bar', stack: 'total', data: [15000, 12000, 18000, 14000, 16000, 20000] },
  ],
};

export default function StrategyManagement() {
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);

  const handleToggleStrategy = (id: string) => {
    setStrategies(strategies.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    message.success('策略状态已更新');
  };

  const columns: ColumnsType<Strategy> = [
    { title: '策略名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type) => <Tag color={type === 'peak_valley' ? 'gold' : 'blue'}>{type}</Tag> },
    { title: '状态', dataIndex: 'enabled', key: 'enabled', render: (enabled) => <Tag color={enabled ? 'green' : 'default'}>{enabled ? '运行中' : '已停止'}</Tag> },
    { title: '策略效果', key: 'effect', render: (_, record) => record.effectReport ? <span style={{ color: '#52c41a' }}>¥{record.effectReport.totalSavings.toLocaleString()}</span> : '-' },
    { title: '操作', key: 'action', render: (_, record) => <Switch checked={record.enabled} onChange={() => handleToggleStrategy(record.id)} /> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>储能策略管理</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="本月策略收益" value={125000} prefix="¥" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="峰谷套利收益" value={85000} prefix="¥" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="需量控制节省" value={28000} prefix="¥" valueStyle={{ color: '#1890ff' }} /></Card></Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="list" items={[
          { key: 'list', label: '策略列表', children: (
            <>
              <Space style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />}>创建策略</Button></Space>
              <Table dataSource={strategies} columns={columns} rowKey="id" pagination={false} />
            </>
          )},
          { key: 'effect', label: '策略效果', children: <ReactECharts option={effectChartOption} style={{ height: 300 }} /> },
        ]} />
      </Card>
    </div>
  );
}
