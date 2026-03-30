import { Card, Row, Col, Statistic, Table, Tabs, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';

const roiData = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['投资成本', '累计收益'], bottom: 0 },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'] },
  yAxis: { type: 'value', name: '金额 (万元)' },
  series: [
    { name: '投资成本', type: 'bar', data: [280, 0, 0, 0, 0, 0] },
    { name: '累计收益', type: 'line', data: [5.2, 12.8, 22.5, 35.2, 50.8, 68.5] },
  ],
};

const costData = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['设备折旧', '运维成本', '电费支出', '收益'], bottom: 0 },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value', name: '金额 (万元)' },
  series: [
    { name: '设备折旧', type: 'bar', stack: 'cost', data: [4.2, 4.2, 4.2, 4.2, 4.2, 4.2] },
    { name: '运维成本', type: 'bar', stack: 'cost', data: [1.5, 1.2, 1.8, 1.3, 1.6, 1.4] },
    { name: '电费支出', type: 'bar', stack: 'cost', data: [2.8, 2.5, 3.2, 2.9, 3.1, 2.7] },
    { name: '收益', type: 'bar', data: [12.5, 14.2, 16.8, 18.5, 20.2, 22.8] },
  ],
};

export default function EconomyAnalysis() {
  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>经济性分析</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="总投资成本" value={280} suffix="万元" valueStyle={{ color: '#f5222d' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="累计收益" value={68.5} suffix="万元" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="当前ROI" value={23.8} suffix="%" valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={12} lg={6}><Card><Statistic title="预计回本周期" value={3.2} suffix="年" /></Card></Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="roi" items={[
          { key: 'roi', label: '投资回报分析', children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}><ReactECharts option={roiData} style={{ height: 300 }} /></Col>
              <Col xs={24} lg={12}><ReactECharts option={costData} style={{ height: 300 }} /></Col>
            </Row>
          )},
        ]} />
      </Card>
    </div>
  );
}
