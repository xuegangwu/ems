import { Row, Col, Card, Statistic, Progress } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const powerData = {
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value', name: '功率 (kW)' },
  series: [
    {
      name: '光伏',
      type: 'line',
      smooth: true,
      data: [0, 0, 120, 380, 420, 280, 50],
      areaStyle: { color: 'rgba(255, 193, 7, 0.3)' },
      lineStyle: { color: '#ffc107' },
    },
    {
      name: '储能',
      type: 'line',
      smooth: true,
      data: [-50, -80, -30, 60, 100, 80, 40],
      areaStyle: { color: 'rgba(24, 144, 255, 0.3)' },
      lineStyle: { color: '#1890ff' },
    },
    {
      name: '电网',
      type: 'line',
      smooth: true,
      data: [80, 120, 60, -20, -60, 20, 100],
      areaStyle: { color: 'rgba(245, 34, 45, 0.3)' },
      lineStyle: { color: '#f5222d' },
    },
  ],
  legend: { data: ['光伏', '储能', '电网'], bottom: 0 },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
};

const energyData = {
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', name: '发电量 (MWh)' },
  series: [
    {
      type: 'bar',
      data: [120, 145, 180, 220, 280, 320],
      itemStyle: { color: '#1890ff' },
    },
  ],
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
};

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>首页概览</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总装机容量"
              value={12.8}
              suffix="MW"
              prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
            />
            <Progress percent={85} showInfo={false} status="active" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日发电量"
              value={45600}
              suffix="kWh"
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="当前功率"
              value={3280}
              suffix="kW"
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日收益"
              value={28500}
              suffix="元"
              prefix={<FallOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="实时功率">
            <ReactECharts option={powerData} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="月度发电量统计">
            <ReactECharts option={energyData} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="电站状态统计">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>在线电站</span>
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>28</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>离线电站</span>
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>2</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>维护中</span>
                <span style={{ color: '#faad14', fontWeight: 'bold' }}>3</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="储能状态">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>总储能容量</span>
                <span style={{ fontWeight: 'bold' }}>15 MWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>当前SOC</span>
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>68%</span>
              </div>
              <Progress percent={68} status="active" />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="交易行情">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>尖时电价</span>
                <span style={{ fontWeight: 'bold', color: '#f5222d' }}>¥1.28/kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>谷时电价</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>¥0.36/kWh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>平段电价</span>
                <span style={{ fontWeight: 'bold' }}>¥0.68/kWh</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
