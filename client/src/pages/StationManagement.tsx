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

const typeMap: Record<string, { color: string; text: string }> = {
  solar: { color: 'gold', text: '光伏' },
  storage: { color: 'blue', text: '储能' },
  solar_storage: { color: 'green', text: '光储一体化' },
};
const statusMap: Record<string, { color: string; text: string }> = {
  online: { color: 'green', text: '在线' },
  offline: { color: 'red', text: '离线' },
  maintenance: { color: 'orange', text: '维护中' },
};

export default function StationManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStation, setDetailStation] = useState<PowerStation | null>(null);
  const [editStation, setEditStation] = useState<PowerStation | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const columns: ColumnsType<PowerStation> = [
    { title: '电站名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type) => <Tag color={typeMap[type]?.color}>{typeMap[type]?.text}</Tag> },
    { title: '装机容量', dataIndex: 'installedCapacity', key: 'installedCapacity', render: (v) => `${v} kW` },
    { title: '峰值功率', dataIndex: 'peakPower', key: 'peakPower', render: (v) => `${v} kW` },
    { title: '位置', dataIndex: 'location', key: 'location', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag> },
    { title: '联系人', dataIndex: 'contact', key: 'contact', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: PowerStation) => (
        <Space>
          <Button type="link" size="small" onClick={() => { setDetailStation(record); setDetailOpen(true); }}>详情</Button>
          <Button type="link" size="small" onClick={() => { setEditStation(record); setIsModalOpen(true); }}>编辑</Button>
        </Space>
      ),
    },
  ];

  const handleAddStation = () => {
    form.validateFields().then(values => {
      console.log(values);
      message.success(editStation ? '电站更新成功' : '电站添加成功');
      setIsModalOpen(false);
      form.resetFields();
      setEditStation(null);
    });
  };

  const filteredStations = powerStations.filter(s =>
    s.name.toLowerCase().includes(searchText.toLowerCase()) ||
    s.location.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>电站管理</h2>

      <Card style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <Space size="middle" wrap>
          <Input
            placeholder="搜索电站名称或位置"
            prefix={<SearchOutlined />}
            style={{ minWidth: 180, width: '100%' }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="middle"
          />
          <Select options={typeOptions} defaultValue="all" style={{ minWidth: 120 }} size="middle" />
          <Select options={statusOptions} defaultValue="all" style={{ minWidth: 120 }} size="middle" />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} size="middle">
            添加电站
          </Button>
        </Space>
      </Card>

      <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={filteredStations}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 900 }}
          />
        </div>
      </Card>

      <Modal
        title={editStation ? '编辑电站' : '添加电站'}
        open={isModalOpen}
        onOk={handleAddStation}
        onCancel={() => { setIsModalOpen(false); setEditStation(null); form.resetFields(); }}
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={editStation || undefined}>
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

      {/* Station Detail Modal */}
      <Modal
        title="电站详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={
          <Button type="primary" onClick={() => { setDetailOpen(false); setEditStation(detailStation || null); setIsModalOpen(true); }}>
            编辑电站
          </Button>
        }
        width={560}
      >
        {detailStation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: '电站名称', value: detailStation.name },
              { label: '电站类型', value: <Tag color={typeMap[detailStation.type]?.color}>{typeMap[detailStation.type]?.text}</Tag> },
              { label: '装机容量', value: `${detailStation.installedCapacity} kW` },
              { label: '峰值功率', value: `${detailStation.peakPower} kW` },
              { label: '地理位置', value: detailStation.location },
              { label: '运营状态', value: <Tag color={statusMap[detailStation.status]?.color}>{statusMap[detailStation.status]?.text}</Tag> },
              { label: '并网日期', value: detailStation.gridConnectionDate },
              { label: '运营方', value: detailStation.owner },
              { label: '联系方式', value: detailStation.contact },
            ].map(row => (
              <div key={row.label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{row.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
