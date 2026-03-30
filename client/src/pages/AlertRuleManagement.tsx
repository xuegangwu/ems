import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useWebSocket } from '../hooks/useWebSocket';
import { PlusOutlined } from '@ant-design/icons';

interface AlertRule {
  id: string;
  name: string;
  stationId: string;
  metric: string;
  condition: string;
  threshold: number;
  level: string;
  actions: string[];
  enabled: boolean;
}

const stationOptions = [
  { value: 'station-001', label: '苏州工业园光伏电站' },
  { value: 'station-002', label: '无锡储能电站' },
  { value: 'station-003', label: '杭州光储一体化电站' },
  { value: 'all', label: '全部电站' },
];

const metricOptions = [
  { value: 'pvPower', label: '光伏功率' },
  { value: 'batteryPower', label: '储能功率' },
  { value: 'batterySoc', label: '电池SOC' },
  { value: 'gridPower', label: '电网功率' },
  { value: 'loadPower', label: '负载功率' },
  { value: 'efficiency', label: '系统效率' },
];

const conditionOptions = [
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' },
];

const levelOptions = [
  { value: 'critical', label: '严重' },
  { value: 'major', label: '重要' },
  { value: 'minor', label: '一般' },
];

const actionOptions = [
  { value: 'sms', label: '短信' },
  { value: 'email', label: '邮件' },
  { value: 'dingtalk', label: '钉钉' },
];

const mockRules: AlertRule[] = [
  { id: 'rule-001', name: '光伏功率过高告警', stationId: 'station-001', metric: 'pvPower', condition: 'gt', threshold: 4500, level: 'major', actions: ['dingtalk'], enabled: true },
  { id: 'rule-002', name: '电池SOC过低告警', stationId: 'station-002', metric: 'batterySoc', condition: 'lt', threshold: 20, level: 'critical', actions: ['sms', 'email', 'dingtalk'], enabled: true },
];

export default function AlertRuleManagement() {
  const [rules, setRules] = useState<AlertRule[]>(mockRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [wsConnected, setWsConnected] = useState(false);

  const { isConnected, subscribe } = useWebSocket('ws://localhost:8080/ws', {
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
    onMessage: (msg) => {
      if (msg.type === 'realtime' && msg.data) {
        console.log('Received realtime data:', msg.data);
      }
    },
  });

  const handleCreateRule = () => {
    form.validateFields().then(values => {
      const newRule: AlertRule = {
        id: `rule-${Date.now()}`,
        ...values,
        enabled: false,
      };
      setRules([...rules, newRule]);
      message.success('告警规则创建成功');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    message.success('规则状态已更新');
  };

  const columns: ColumnsType<AlertRule> = [
    { title: '规则名称', dataIndex: 'name', key: 'name' },
    { title: '电站', dataIndex: 'stationId', key: 'stationId', render: (id) => stationOptions.find(s => s.value === id)?.label || id },
    { title: '指标', dataIndex: 'metric', key: 'metric', render: (m) => metricOptions.find(opt => opt.value === m)?.label || m },
    { title: '条件', key: 'condition', render: (_, record) => `${conditionOptions.find(c => c.value === record.condition)?.label} ${record.threshold}` },
    { title: '级别', dataIndex: 'level', key: 'level', render: (level) => (
      <Tag color={level === 'critical' ? 'red' : level === 'major' ? 'orange' : 'blue'}>{levelOptions.find(l => l.value === level)?.label}</Tag>
    )},
    { title: '通知方式', dataIndex: 'actions', key: 'actions', render: (actions) => actions.map((a: string) => (
      <Tag key={a} color="cyan">{actionOptions.find(opt => opt.value === a)?.label}</Tag>
    ))},
    { title: '状态', dataIndex: 'enabled', key: 'enabled', render: (enabled) => (
      <Tag color={enabled ? 'green' : 'default'}>{enabled ? '已启用' : '已禁用'}</Tag>
    )},
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" size="small" onClick={() => handleToggleRule(record.id)}>{record.enabled ? '禁用' : '启用'}</Button>
        <Button type="link" size="small" danger>删除</Button>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>告警规则配置</h2>
        <Space>
          <Tag color={wsConnected ? 'green' : 'red'}>{wsConnected ? '实时连接' : '离线'}</Tag>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>创建规则</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small"><Statistic title="规则总数" value={rules.length} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small"><Statistic title="已启用" value={rules.filter(r => r.enabled).length} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small"><Statistic title="已禁用" value={rules.filter(r => !r.enabled).length} valueStyle={{ color: '#999' }} /></Card>
        </Col>
      </Row>

      <Card>
        <Table dataSource={rules} columns={columns} rowKey="id" pagination={false} />
      </Card>

      <Modal title="创建告警规则" open={isModalOpen} onOk={handleCreateRule} onCancel={() => setIsModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item label="规则名称" name="name" rules={[{ required: true }]}><Input placeholder="请输入规则名称" /></Form.Item>
          <Form.Item label="电站" name="stationId" rules={[{ required: true }]}><Select options={stationOptions} /></Form.Item>
          <Form.Item label="监控指标" name="metric" rules={[{ required: true }]}><Select options={metricOptions} /></Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item label="条件" name="condition" rules={[{ required: true }]} style={{ flex: 1 }}><Select options={conditionOptions} /></Form.Item>
            <Form.Item label="阈值" name="threshold" rules={[{ required: true }]} style={{ flex: 1 }}><InputNumber style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item label="告警级别" name="level" rules={[{ required: true }]}><Select options={levelOptions} /></Form.Item>
          <Form.Item label="通知方式" name="actions" rules={[{ required: true }]}><Select mode="multiple" options={actionOptions} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
