import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, DatePicker, Upload, message, Statistic, Steps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, CameraOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

interface WorkOrder {
  id: string;
  type: string;
  priority: string;
  status: string;
  stationId: string;
  stationName: string;
  assignee?: string;
  description: string;
  photos: string[];
  result?: string;
  createdAt: string;
}

const mockWorkOrders: WorkOrder[] = [
  { id: 'wo-001', type: 'inspection', priority: 'medium', status: 'completed', stationId: 'station-001', stationName: '苏州工业园光伏电站', assignee: '张师傅', description: '季度例行巡检', photos: [], result: '设备运行正常', createdAt: '2024-01-10T08:00:00Z' },
  { id: 'wo-002', type: 'repair', priority: 'high', status: 'processing', stationId: 'station-002', stationName: '无锡储能电站', assignee: '李师傅', description: 'PCS模块过温故障维修', photos: [], createdAt: '2024-01-15T08:00:00Z' },
  { id: 'wo-003', type: 'maintenance', priority: 'low', status: 'pending', stationId: 'station-003', stationName: '杭州光储一体化电站', description: '电池组定期维护', photos: [], createdAt: '2024-01-14T10:00:00Z' },
];

const typeOptions = [
  { value: 'inspection', label: '巡检' },
  { value: 'repair', label: '故障维修' },
  { value: 'maintenance', label: '定期维护' },
  { value: 'cleaning', label: '组件清洗' },
];

const priorityOptions = [
  { value: 'low', label: '一般' },
  { value: 'medium', label: '中等' },
  { value: 'high', label: '紧急' },
  { value: 'urgent', label: '立即处理' },
];

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'assigned', label: '已派单' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
];

export default function WorkOrderManagement() {
  const [workOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateOrder = () => {
    form.validateFields().then(values => {
      message.success('工单创建成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const columns: ColumnsType<WorkOrder> = [
    { title: '工单ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type) => <Tag color="blue">{typeOptions.find(t => t.value === type)?.label}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (priority) => (
      <Tag color={priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'gold'}>{priorityOptions.find(p => p.value === priority)?.label}</Tag>
    )},
    { title: '电站', dataIndex: 'stationName', key: 'stationName' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => (
      <Tag color={status === 'completed' ? 'green' : status === 'processing' ? 'blue' : 'default'}>{statusOptions.find(s => s.value === status)?.label}</Tag>
    )},
    { title: '处理人', dataIndex: 'assignee', key: 'assignee', render: (a) => a || '-' },
    { title: '操作', key: 'action', render: () => <Button type="link" size="small">详情</Button> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>运维工单管理</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="待处理工单" value={workOrders.filter(wo => wo.status === 'pending').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="处理中工单" value={workOrders.filter(wo => wo.status === 'processing').length} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={8}><Card size="small"><Statistic title="本月完成" value={workOrders.filter(wo => wo.status === 'completed').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>创建工单</Button>
        </Space>
        <Table dataSource={workOrders} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="创建运维工单" open={isModalOpen} onOk={handleCreateOrder} onCancel={() => setIsModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item label="工单类型" name="type" rules={[{ required: true }]}><Select options={typeOptions} /></Form.Item>
          <Form.Item label="优先级" name="priority" rules={[{ required: true }]}><Select options={priorityOptions} /></Form.Item>
          <Form.Item label="工单描述" name="description" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
