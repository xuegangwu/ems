import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Select, DatePicker, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { alerts } from '../services/mockData';
import type { Alert } from '../types';

const { RangePicker } = DatePicker;

const levelOptions = [
  { value: 'all', label: '全部级别' },
  { value: 'critical', label: '严重' },
  { value: 'major', label: '重要' },
  { value: 'minor', label: '一般' },
];

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'fault', label: '故障' },
  { value: 'warning', label: '告警' },
  { value: 'info', label: '信息' },
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'acknowledged', label: '已确认' },
  { value: 'unacknowledged', label: '未确认' },
];

const columns: ColumnsType<Alert> = [
  { title: '告警时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
  { title: '电站', dataIndex: 'stationId', key: 'stationId' },
  { title: '类型', dataIndex: 'type', key: 'type', render: (type) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      fault: { color: 'red', text: '故障' },
      warning: { color: 'orange', text: '告警' },
      info: { color: 'blue', text: '信息' },
    };
    const t = typeMap[type] || { color: 'default', text: type };
    return <Tag color={t.color}>{t.text}</Tag>;
  }},
  { title: '级别', dataIndex: 'level', key: 'level', render: (level) => {
    const levelMap: Record<string, { color: string; text: string }> = {
      critical: { color: 'red', text: '严重' },
      major: { color: 'orange', text: '重要' },
      minor: { color: 'yellow', text: '一般' },
    };
    const l = levelMap[level] || { color: 'default', text: level };
    return <Tag color={l.color}>{l.text}</Tag>;
  }},
  { title: '告警代码', dataIndex: 'code', key: 'code' },
  { title: '告警内容', dataIndex: 'message', key: 'message' },
  { title: '状态', dataIndex: 'acknowledged', key: 'acknowledged', render: (ack) => (
    <Tag color={ack ? 'green' : 'red'}>{ack ? '已确认' : '未确认'}</Tag>
  )},
  { title: '操作', key: 'action', render: (_, record) => (
    <Space>
      {!record.acknowledged && (
        <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => message.success('已确认')}>
          确认
        </Button>
      )}
      <Button type="link" size="small" icon={<DeleteOutlined />} danger>
        删除
      </Button>
    </Space>
  )},
];

export default function AlertManagement() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleBatchAcknowledge = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要确认的告警');
      return;
    }
    message.success(`已确认 ${selectedRowKeys.length} 条告警`);
    setSelectedRowKeys([]);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500 }}>告警管理</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Select options={typeOptions} defaultValue="all" style={{ width: 150 }} />
          <Select options={levelOptions} defaultValue="all" style={{ width: 150 }} />
          <Select options={statusOptions} defaultValue="all" style={{ width: 150 }} />
          <RangePicker />
          <Button type="primary" onClick={handleBatchAcknowledge} disabled={selectedRowKeys.length === 0}>
            批量确认
          </Button>
          <Button danger disabled={selectedRowKeys.length === 0}>批量删除</Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowSelection={rowSelection}
          dataSource={alerts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
