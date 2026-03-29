import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Select, Input, Modal, Form, InputNumber, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { powerStations } from '../services/mockData';
import type { PowerStation } from '../types';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'online', label: '在线' },
  { value: 'offline', label: '离线' },
  { value: 'maintenance', label: '维护中' },
];

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'solar', label: '光伏' },
  { value: 'storage', label: '储能' },
  { value: 'solar_storage', label: '光储一体化' },
];

const columns: ColumnsType<PowerStation> = [
  { title: '电站名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', render: (type) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      solar: { color: 'gold', text: '光伏' },
      storage: { color: 'blue', text: '储能' },
      solar_storage: { color: 'green', text: '光储一体化' },
    };
    const t = typeMap[type] || { color: 'default', text: type };
    return <Tag color={t.color}>{t.text}</Tag>;
  }},
  { title: '装机容量', dataIndex: 'installedCapacity', key: 'installedCapacity', render: (v) => `${v} kW` },
  { title: '峰值功率', dataIndex: 'peakPower', key: 'peakPower', render: (v) => `${v} kW` },
  { title: '位置', dataIndex: 'location', key: 'location' },
  { title: '状态', dataIndex: 'status', key: 'status', render: (status) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      online: { color: 'green', text: '在线' },
      offline: { color: 'red', text: '离线' },
      maintenance: { color: 'orange', text: '维护中' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  }},
  { title: '并网日期', dataIndex: 'gridConnectionDate', key: 'gridConnectionDate' },
  { title: '联系人', dataIndex: 'contact', key: 'contact' },
  { title: '操作', key: 'action', render: () => (
    <Space>
      <Button type="link" size="small">详情</Button>
      <Button type="link" size="small">编辑</Button>
    </Space>
  )},
];

export default function StationManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const handleAddStation = () => {
    form.validateFields().then(values => {
      console.log(values);
      message.success('电站添加成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const filteredStations = powerStations.filter(s =>
    s.name.toLowerCase().includes(searchText.toLowerCase()) ||
    s.location.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>电站管理</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Input
            placeholder="搜索电站名称或位置"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select options={typeOptions} defaultValue="all" style={{ width: 150 }} />
          <Select options={statusOptions} defaultValue="all" style={{ width: 150 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            添加电站
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          dataSource={filteredStations}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="添加电站"
        open={isModalOpen}
        onOk={handleAddStation}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="电站名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="电站类型" name="type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'solar', label: '光伏' },
                { value: 'storage', label: '储能' },
                { value: 'solar_storage', label: '光储一体化' },
              ]}
            />
          </Form.Item>
          <Form.Item label="装机容量 (kW)" name="installedCapacity" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="峰值功率 (kW)" name="peakPower" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="位置" name="location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="联系人" name="contact">
            <Input />
          </Form.Item>
          <Form.Item label="联系电话" name="phone">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
