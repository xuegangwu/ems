import { useState } from 'react';
import { Card, Row, Col, Select, DatePicker, Table, Tag, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { monitoringData, recentAlerts } from '../services/mockData';
import type { MonitoringData, Alert } from '../types';

const { RangePicker } = DatePicker;

const stationOptions = [
  { value: 'all', label: '全部电站' },
  { value: 'station-001', label: '苏州工业园光伏电站' },
  { value: 'station-002', label: '无锡储能电站' },
  { value: 'station-003', label: '杭州光储一体化电站' },
];

const alertColumns: ColumnsType<Alert> = [
  { title: '告警时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  { title: '电站', dataIndex: 'stationId', key: 'stationId' },
  { title: '告警类型', dataIndex: 'type', key: 'type', render: (type) => (
    <Tag color={type === 'fault' ? 'red' : type === 'warning' ? 'orange' : 'blue'}>
      {type === 'fault' ? '故障' : type === 'warning' ? '告警' : '信息'}
    </Tag>
  )},
  { title: '告警内容', dataIndex: 'message', key: 'message' },
  { title: '状态', dataIndex: 'acknowledged', key: 'acknowledged', render: (ack) => (
    <Tag color={ack ? 'green' : 'red'}>{ack ? '已确认' : '未确认'}</Tag>
  )},
  { title: '操作', key: 'action', render: () => (
    <Space>
      <Button size="small">确认</Button>
      <Button size="small">处理</Button>
    </Space>
  )},
];

export default function Monitoring() {
  const [selectedStation, setSelectedStation] = useState('all');
  const data = monitoringData;

  const powerOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['光伏功率', '储能功率', '电网功率', '负载功率'], bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    },
    yAxis: { type: 'value', name: '功率 (kW)' },
    series: [
      { name: '光伏功率', type: 'line', smooth: true, data: [0, 0, 0, 20, 120, 280, 380, 350, 250, 100, 20, 0] },
      { name: '储能功率', type: 'line', smooth: true, data: [-30, -50, -40, 20, 50, 80, 60, 40, 20, -20, -40, -30] },
      { name: '电网功率', type: 'line', smooth: true, data: [60, 80, 70, 40, -20, -60, -80, -60, -30, 40, 80, 70] },
      { name: '负载功率', type: 'line', smooth: true, data: [30, 30, 30, 60, 100, 200, 260, 250, 200, 120, 60, 40] },
    ],
  };

  const energyOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['发电量', '储能充放电量', '电网交易量'], bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value', name: '电量 (MWh)' },
    series: [
      { name: '发电量', type: 'bar', data: [120, 145, 180, 220, 280, 320] },
      { name: '储能充放电量', type: 'bar', data: [45, 52, 48, 60, 72, 80] },
      { name: '电网交易量', type: 'bar', data: [30, 35, 40, 45, 55, 60] },
    ],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>监控中心</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <span>选择电站:</span>
            <Select options={stationOptions} value={selectedStation} onChange={setSelectedStation} style={{ width: 200 }} />
          </Space>
          <RangePicker />
          <Button type="primary">查询</Button>
          <Button>导出</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="功率曲线">
            <ReactECharts option={powerOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="能量统计">
            <ReactECharts option={energyOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="关键指标">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>今日发电量</span>
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>45,600 kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>系统效率</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>86.5%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>平均辐照度</span>
                <span style={{ fontWeight: 'bold' }}>4.2 kWh/m²</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>逆变器利用率</span>
                <span style={{ fontWeight: 'bold', color: '#722ed1' }}>94.8%</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="设备状态">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>逆变器</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>在线 28/30</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>汇流箱</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>在线 120/120</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>储能PCS</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>在线 15/15</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>电表</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>在线 45/45</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="告警信息">
            <Table
              dataSource={recentAlerts}
              columns={alertColumns}
              size="small"
              pagination={false}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
