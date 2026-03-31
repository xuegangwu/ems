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
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>运维管理</h2>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={8}>
          <Card title="运维统计" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '本月巡检', value: '45 次', color: 'rgba(255,255,255,0.9)' },
                { label: '本月故障处理', value: '12 次', color: 'rgba(255,255,255,0.9)' },
                { label: '待处理工单', value: '8 个', color: '#faad14' },
                { label: '平均响应时间', value: '2.5 小时', color: '#52c41a' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item.label}</span>
                  <span style={{ fontWeight: 'bold', color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="设备维护" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '逆变器维护', value: '已完成 28 台', color: '#52c41a' },
                { label: '组件清洗', value: '已完成 15 站', color: '#52c41a' },
                { label: '储能维护', value: '进行中 3 站', color: '#faad14' },
                { label: '定期检修', value: '待执行 5 站', color: '#1890ff' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item.label}</span>
                  <span style={{ fontWeight: 'bold', color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="备件库存" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'IGBT模块', value: '15 个' },
                { label: '光伏组件', value: '120 块' },
                { label: '储能电池', value: '8 块' },
                { label: '熔断器', value: '200 个' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item.label}</span>
                  <span style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.9)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <Space size="middle" style={{ marginBottom: 16 }} wrap>
          <Select options={statusOptions} defaultValue="all" style={{ minWidth: 120 }} size="middle" />
          <RangePicker size="middle" />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} size="middle">
            创建工单
          </Button>
        </Space>
        <div style={{ overflowX: 'auto' }}>
          <Table dataSource={operationLogs} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
        </div>
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
                { value: 'cleaning', label: '组件清洗' },
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
