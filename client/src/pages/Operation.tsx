import { Card, Table, Tag, Button, Space, Select, DatePicker, Row, Col, Form, Modal, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { operationLogs } from '../services/mockData';
import type { OperationLog } from '../types';

const { RangePicker } = DatePicker;

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
];

const columns: ColumnsType<OperationLog> = [
  { title: '操作时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  { title: '电站', dataIndex: 'stationId', key: 'stationId' },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '操作类型', dataIndex: 'action', key: 'action' },
  { title: '操作前值', dataIndex: 'beforeValue', key: 'beforeValue' },
  { title: '操作后值', dataIndex: 'afterValue', key: 'afterValue' },
  { title: '结果', dataIndex: 'result', key: 'result', render: (result) => (
    <Tag color={result === 'success' ? 'green' : 'red'}>
      {result === 'success' ? '成功' : '失败'}
    </Tag>
  )},
  { title: '操作', key: 'action', render: () => (
    <Button type="link" size="small">详情</Button>
  )},
];

export default function Operation() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddTask = () => {
    form.validateFields().then(values => {
      console.log(values);
      message.success('工单创建成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>运维管理</h2>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="运维统计">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>本月巡检</span>
                <span style={{ fontWeight: 'bold' }}>45 次</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>本月故障处理</span>
                <span style={{ fontWeight: 'bold' }}>12 次</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>待处理工单</span>
                <span style={{ fontWeight: 'bold', color: '#faad14' }}>8 个</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>平均响应时间</span>
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>2.5 小时</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="设备维护">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>逆变器维护</span>
                <span style={{ fontWeight: 'bold' }}>已完成 28 台</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>组件清洗</span>
                <span style={{ fontWeight: 'bold' }}>已完成 15 站</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>储能维护</span>
                <span style={{ fontWeight: 'bold' }}>进行中 3 站</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>定期检修</span>
                <span style={{ fontWeight: 'bold' }}>待执行 5 站</span>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="备件库存">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>IGBT模块</span>
                <span style={{ fontWeight: 'bold' }}>15 个</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>光伏组件</span>
                <span style={{ fontWeight: 'bold' }}>120 块</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>储能电池</span>
                <span style={{ fontWeight: 'bold' }}>8 块</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>熔断器</span>
                <span style={{ fontWeight: 'bold' }}>200 个</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Space size="large" style={{ marginBottom: 16 }} wrap>
          <Space>
            <Select options={statusOptions} defaultValue="all" style={{ width: 150 }} />
          </Space>
          <RangePicker />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            创建工单
          </Button>
        </Space>
        <Table dataSource={operationLogs} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="创建运维工单"
        open={isModalOpen}
        onOk={handleAddTask}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="工单类型" name="type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'inspection', label: '巡检' },
                { value: 'repair', label: '故障维修' },
                { value: 'maintenance', label: '定期维护' },
                { value: '清洗', label: '组件清洗' },
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
          <Form.Item label="优先级" name="priority">
            <Select
              options={[
                { value: 'low', label: '低' },
                { value: 'medium', label: '中' },
                { value: 'high', label: '高' },
              ]}
            />
          </Form.Item>
          <Form.Item label="描述" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
