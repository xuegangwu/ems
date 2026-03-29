import { useState } from 'react';
import { Card, Row, Col, Select, Table, Tag, Button, Space, Tabs, Modal, Form, InputNumber, DatePicker, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { stationTrades } from '../services/mockData';
import type { StationTrade } from '../types';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const columns: ColumnsType<StationTrade> = [
  { title: '交易ID', dataIndex: 'id', key: 'id', width: 120 },
  { title: '电站', dataIndex: 'stationId', key: 'stationId' },
  { title: '交易类型', dataIndex: 'tradeType', key: 'tradeType', render: (type) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      capacity_auction: { color: 'blue', text: '容量拍卖' },
      ancillary_service: { color: 'purple', text: '辅助服务' },
      capacity_contract: { color: 'cyan', text: '容量合约' },
    };
    const t = typeMap[type] || { color: 'default', text: type };
    return <Tag color={t.color}>{t.text}</Tag>;
  }},
  { title: '容量 (kW)', dataIndex: 'capacity', key: 'capacity' },
  { title: '价格 (元/kW)', dataIndex: 'price', key: 'price' },
  { title: '总金额 (元)', dataIndex: 'totalAmount', key: 'totalAmount' },
  { title: '状态', dataIndex: 'status', key: 'status', render: (status) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '生效中' },
      expired: { color: 'gray', text: '已过期' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  }},
  { title: '有效期', key: 'validity', render: (_, record) => (
    <span>{record.startDate} ~ {record.endDate}</span>
  )},
  { title: '操作', key: 'action', render: () => (
    <Button type="link" size="small">详情</Button>
  )},
];

export default function StationTrade() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then(values => {
      console.log(values);
      message.success('交易创建成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const tradeAmountOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['容量拍卖', '辅助服务', '容量合约'], bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value', name: '金额 (万元)' },
    series: [
      { name: '容量拍卖', type: 'bar', stack: 'total', data: [120, 150, 180, 200, 220, 250] },
      { name: '辅助服务', type: 'bar', stack: 'total', data: [80, 90, 100, 110, 130, 150] },
      { name: '容量合约', type: 'bar', stack: 'total', data: [60, 70, 85, 95, 110, 130] },
    ],
  };

  const capacityOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['可用容量', '已交易容量'], bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: ['苏州工业园', '无锡储能', '杭州光储', '常州工业园', '宁波储能'] },
    yAxis: { type: 'value', name: '容量 (kW)' },
    series: [
      { name: '可用容量', type: 'bar', data: [1200, 800, 1500, 600, 900] },
      { name: '已交易容量', type: 'bar', data: [800, 500, 1000, 400, 600] },
    ],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>电站交易</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <span style={{ color: '#666' }}>本月交易总额</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>¥2,850,000</span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <span style={{ color: '#666' }}>生效中的交易</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>28</span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <span style={{ color: '#666' }}>总交易容量</span>
              <span style={{ fontSize: 24, fontWeight: 'bold' }}>8,500 kW</span>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <span style={{ color: '#666' }}>平均单价</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>¥320/kW</span>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="交易金额统计">
            <ReactECharts option={tradeAmountOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="电站容量交易情况">
            <ReactECharts option={capacityOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="trades">
          <TabPane tab="交易记录" key="trades">
            <Space size="large" style={{ marginBottom: 16 }} wrap>
              <Space>
                <Select defaultValue="all" style={{ width: 150 }}>
                  <Select.Option value="all">全部类型</Select.Option>
                  <Select.Option value="capacity_auction">容量拍卖</Select.Option>
                  <Select.Option value="ancillary_service">辅助服务</Select.Option>
                  <Select.Option value="capacity_contract">容量合约</Select.Option>
                </Select>
              </Space>
              <RangePicker />
              <Button type="primary" onClick={() => setIsModalOpen(true)}>创建交易</Button>
            </Space>
            <Table dataSource={stationTrades} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
          </TabPane>
          <TabPane tab="我的持仓" key="positions">
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无持仓数据</div>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="创建电站交易"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="交易类型" name="tradeType" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'capacity_auction', label: '容量拍卖' },
                { value: 'ancillary_service', label: '辅助服务' },
                { value: 'capacity_contract', label: '容量合约' },
              ]}
            />
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
          <Form.Item label="交易容量 (kW)" name="capacity" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="单价 (元/kW)" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="交易有效期" name="validity" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
