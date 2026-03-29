import { useState } from 'react';
import { Card, Row, Col, Select, DatePicker, Table, Tag, Button, Space, Tabs, Modal, Form, InputNumber, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { tradeOrders, electricityPrices } from '../services/mockData';
import type { TradeOrder, ElectricityPrice } from '../types';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const orderColumns: ColumnsType<TradeOrder> = [
  { title: '订单时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  { title: '电站', dataIndex: 'stationId', key: 'stationId' },
  { title: '类型', dataIndex: 'type', key: 'type', render: (type) => (
    <Tag color={type === 'buy' ? 'blue' : 'green'}>{type === 'buy' ? '购电' : '售电'}</Tag>
  )},
  { title: '功率 (kW)', dataIndex: 'power', key: 'power' },
  { title: '价格 (元/kWh)', dataIndex: 'price', key: 'price' },
  { title: '电量 (kWh)', dataIndex: 'quantity', key: 'quantity' },
  { title: '总金额 (元)', dataIndex: 'totalAmount', key: 'totalAmount' },
  { title: '状态', dataIndex: 'status', key: 'status', render: (status) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待成交' },
      matched: { color: 'blue', text: '已匹配' },
      completed: { color: 'green', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  }},
];

const priceColumns: ColumnsType<ElectricityPrice> = [
  { title: '时间', dataIndex: 'timestamp', key: 'timestamp' },
  { title: '区域', dataIndex: 'region', key: 'region' },
  { title: '尖时电价', dataIndex: 'peakPrice', key: 'peakPrice', render: (p) => `¥${p.toFixed(2)}` },
  { title: '谷时电价', dataIndex: 'valleyPrice', key: 'valleyPrice', render: (p) => `¥${p.toFixed(2)}` },
  { title: '平段电价', dataIndex: 'flatPrice', key: 'flatPrice', render: (p) => `¥${p.toFixed(2)}` },
];

export default function ElectricityTrade() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleSubmitOrder = () => {
    form.validateFields().then(values => {
      console.log(values);
      message.success('订单提交成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const priceTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['尖时电价', '谷时电价', '平段电价'], bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
    yAxis: { type: 'value', name: '电价 (元/kWh)' },
    series: [
      { name: '尖时电价', type: 'line', data: [0.65, 0.55, 1.28, 1.28, 1.15, 1.28, 0.85] },
      { name: '谷时电价', type: 'line', data: [0.36, 0.32, 0.45, 0.68, 0.52, 0.75, 0.42] },
      { name: '平段电价', type: 'line', data: [0.52, 0.48, 0.78, 0.92, 0.82, 0.95, 0.62] },
    ],
  };

  const tradingVolumeOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['购电量', '售电量'], bottom: 0 },
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value', name: '电量 (MWh)' },
    series: [
      { name: '购电量', type: 'bar', data: [1200, 1350, 1100, 980, 850, 920] },
      { name: '售电量', type: 'bar', data: [2800, 3200, 3500, 3800, 4200, 4500] },
    ],
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>电力交易</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="实时电价走势">
            <ReactECharts option={priceTrendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="月度交易电量">
            <ReactECharts option={tradingVolumeOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="orders">
          <TabPane tab="交易订单" key="orders">
            <Space size="large" style={{ marginBottom: 16 }} wrap>
              <Space>
                <Select defaultValue="all" style={{ width: 150 }}>
                  <Select.Option value="all">全部订单</Select.Option>
                  <Select.Option value="buy">购电订单</Select.Option>
                  <Select.Option value="sell">售电订单</Select.Option>
                </Select>
              </Space>
              <RangePicker />
              <Button type="primary" onClick={() => setIsModalOpen(true)}>提交订单</Button>
            </Space>
            <Table dataSource={tradeOrders} columns={orderColumns} rowKey="id" pagination={{ pageSize: 10 }} />
          </TabPane>
          <TabPane tab="电价行情" key="prices">
            <Table dataSource={electricityPrices} columns={priceColumns} rowKey="id" pagination={false} />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="提交交易订单"
        open={isModalOpen}
        onOk={handleSubmitOrder}
        onCancel={() => setIsModalOpen(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="订单类型" name="type" rules={[{ required: true }]}>
            <Select options={[{ value: 'buy', label: '购电' }, { value: 'sell', label: '售电' }]} />
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
          <Form.Item label="功率 (kW)" name="power" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="电量 (kWh)" name="quantity" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="期望价格 (元/kWh)" name="price" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
