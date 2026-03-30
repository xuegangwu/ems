import { Card, Row, Col, Statistic, Table, Tabs, Tag, Button, Space, Progress, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { useState } from 'react';

const faultTrendData = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['故障次数', '预测故障'], bottom: 0 },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', name: '次数' },
  series: [
    { name: '故障次数', type: 'bar', data: [12, 8, 15, 6, 10, 5] },
    { name: '预测故障', type: 'line', data: [14, 10, 18, 8, 12, 7] },
  ],
};

interface FaultRecord {
  id: string;
  stationName: string;
  device: string;
  faultType: string;
  level: string;
  confidence: number;
  status: string;
}

const mockFaults: FaultRecord[] = [
  { id: 'f-001', stationName: '苏州工业园光伏电站', device: '逆变器 INV-01', faultType: '通讯中断', level: 'major', confidence: 92, status: 'confirmed' },
  { id: 'f-002', stationName: '无锡储能电站', device: '电池管理系统 BMS-02', faultType: 'SOC异常', level: 'minor', confidence: 88, status: 'pending' },
];

const columns: ColumnsType<FaultRecord> = [
  { title: '电站', dataIndex: 'stationName', key: 'stationName' },
  { title: '设备', dataIndex: 'device', key: 'device' },
  { title: '故障类型', dataIndex: 'faultType', key: 'faultType' },
  { title: '级别', dataIndex: 'level', key: 'level', render: (l) => <Tag color={l === 'major' ? 'orange' : 'blue'}>{l}</Tag> },
  { title: '诊断置信度', dataIndex: 'confidence', key: 'confidence', render: (c) => <Progress percent={c} size="small" /> },
  { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'confirmed' ? 'blue' : 'orange'}>{s}</Tag> },
  { title: '操作', key: 'action', render: () => <Button type="link" size="small" onClick={() => message.info('AI诊断详情')}>诊断详情</Button> },
];

export default function AIFaultDiagnosis() {
  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>AI故障诊断</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="AI诊断准确率" value={94.5} suffix="%" valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="本月故障预测" value={65} suffix="次" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="平均MTBF" value={8760} suffix="小时" /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="平均MTTR" value={5.4} suffix="小时" valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary">AI自检</Button>
        </Space>
        <ReactECharts option={faultTrendData} style={{ height: 250, marginBottom: 16 }} />
        <Table dataSource={mockFaults} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
