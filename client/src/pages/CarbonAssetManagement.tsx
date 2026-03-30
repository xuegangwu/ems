import { Card, Row, Col, Statistic, Table, Tabs, Tag, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { useState } from 'react';

const carbonData = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['碳排放量', '碳减排量'], bottom: 0 },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', name: '碳量 (吨)' },
  series: [
    { name: '碳排放量', type: 'bar', stack: 'net', data: [120, 115, 108, 95, 88, 82] },
    { name: '碳减排量', type: 'bar', stack: 'net', data: [-280, -320, -380, -420, -480, -520] },
  ],
};

interface CarbonAsset {
  id: string;
  type: string;
  quantity: number;
  price: number;
  status: string;
}

const mockAssets: CarbonAsset[] = [
  { id: 'ca-001', type: 'CCER', quantity: 1200, price: 80, status: 'available' },
  { id: 'ca-002', type: '绿证', quantity: 2800, price: 50, status: 'available' },
];

const columns: ColumnsType<CarbonAsset> = [
  { title: '资产类型', dataIndex: 'type', key: 'type', render: (type) => <Tag color="green">{type}</Tag> },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '单价 (元)', dataIndex: 'price', key: 'price' },
  { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'available' ? 'green' : 'orange'}>{s}</Tag> },
  { title: '操作', key: 'action', render: () => <Button type="link" size="small">交易</Button> },
];

export default function CarbonAssetManagement() {
  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>碳资产管理</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="碳资产总值" value={836000} suffix="元" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="本月碳减排量" value={2850} suffix="吨" valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="绿电交易量" value={3200} suffix="MWh" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="绿证数量" value={320} suffix="个" /></Card></Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="emission" items={[
          { key: 'emission', label: '碳排放统计', children: <ReactECharts option={carbonData} style={{ height: 300 }} /> },
          { key: 'assets', label: '碳资产列表', children: <Table dataSource={mockAssets} columns={columns} rowKey="id" pagination={false} /> },
        ]} />
      </Card>
    </div>
  );
}
