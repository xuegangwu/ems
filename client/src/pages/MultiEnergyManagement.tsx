import { Card, Row, Col, Statistic, Table, Tabs, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { ThunderboltOutlined, FireOutlined, WindOutlined } from '@ant-design/icons';

const energyData = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['光伏', '储能', '燃气轮机', '电网', '负载'], bottom: 0 },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value', name: '功率 (kW)' },
  series: [
    { name: '光伏', type: 'bar', stack: 'generation', data: [0, 0, 120, 380, 420, 280, 0] },
    { name: '燃气轮机', type: 'bar', stack: 'generation', data: [200, 200, 150, 100, 150, 200, 200] },
    { name: '储能', type: 'bar', stack: 'storage', data: [-50, -80, 60, 40, 20, -30, -40] },
    { name: '电网', type: 'bar', data: [80, 100, -30, -80, -50, 30, 60] },
    { name: '负载', type: 'line', data: [280, 260, 300, 480, 520, 420, 300] },
  ],
};

export default function MultiEnergyManagement() {
  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>多能互补管理</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card><Statistic title="光伏装机" value={4800} suffix="kW" prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="储能容量" value={2000} suffix="kWh" prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="燃气轮机" value={1500} suffix="kW" prefix={<FireOutlined style={{ color: '#f5222d' }} />} /></Card></Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="monitoring" items={[
          { key: 'monitoring', label: '实时监控', children: <ReactECharts option={energyData} style={{ height: 350 }} /> },
          { key: 'dispatch', label: '调度策略', children: <div style={{ textAlign: 'center', padding: 40 }}>调度策略配置面板</div> },
        ]} />
      </Card>
    </div>
  );
}
