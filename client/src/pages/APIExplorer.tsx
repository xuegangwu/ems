import { useState } from 'react';
import { Card, Row, Col, Tag, Space, Table, Input, Button, message } from 'antd';
import { SearchOutlined, CopyOutlined } from '@ant-design/icons';
import api from '../services/api';

const API_MODULES = [
  {
    name: '⚡ 实时电价',
    description: '半小时粒度电价数据，含预测和历史',
    endpoints: [
      { method: 'GET', path: '/api/electricity/prices/half-hourly', desc: '48小时电价（半小时粒度）含最优窗口', params: '?region=华东电网', response: '{ prices: [...], optimal: { bestCharge, bestDischarge, action } }' },
      { method: 'GET', path: '/api/electricity/prices/realtime', desc: '当前实时电价和分区', params: '?region=华东电网', response: '{ currentPrice, zone, zones: { peak, normal, valley } }' },
      { method: 'GET', path: '/api/electricity/prices/prediction', desc: '未来24小时电价预测', params: '?region=华东电网', response: '[{ timestamp, predictedPrice, confidence, upperBound, lowerBound }]' },
      { method: 'GET', path: '/api/electricity/prices/regions', desc: '支持的电网区域列表', params: '', response: '[{ id, name, code }]' },
    ],
  },
  {
    name: '📊 电站监控',
    description: '实时功率、能量、设备状态数据',
    endpoints: [
      { method: 'GET', path: '/api/monitoring/:stationId/realtime', desc: '电站实时运行数据', params: ':stationId', response: '{ pvPower, batterySoc, gridPower, efficiency, temperature }' },
      { method: 'GET', path: '/api/monitoring/:stationId/history', desc: '历史监测数据', params: '?startDate=&endDate=', response: '[{ timestamp, pvPower, batteryPower, loadPower }]' },
    ],
  },
  {
    name: '🔗 虚拟电厂 (VPP)',
    description: '分布式资源聚合与调度指令',
    endpoints: [
      { method: 'GET', path: '/api/vpp/status', desc: 'VPP聚合状态和资源列表', params: '', response: '{ totalCapacity, availableCapacity, resourceCount, regions }' },
      { method: 'GET', path: '/api/vpp/resources', desc: '所有分布式资源详情', params: '?type=&status=', response: '[{ id, name, type, capacity, status, dispatchable }]' },
      { method: 'POST', path: '/api/vpp/dispatch', desc: '下发储能调度指令', params: '', response: '{ orderId, status: pending }' },
      { method: 'GET', path: '/api/vpp/orders', desc: '调度指令记录', params: '?status=', response: '[{ id, direction, power, duration, status }]' },
    ],
  },
  {
    name: '🏭 电站管理',
    description: '电站 CRUD 和账户管理',
    endpoints: [
      { method: 'GET', path: '/api/stations', desc: '所有电站列表', params: '?type=&status=', response: '[{ id, name, type, capacity, location, status }]' },
      { method: 'GET', path: '/api/stations/:id', desc: '电站详情', params: ':id', response: '{ id, name, owner, contact, gridConnectionDate }' },
      { method: 'POST', path: '/api/stations', desc: '添加新电站', params: '', response: '{ id, success: true }' },
      { method: 'PUT', path: '/api/stations/:id', desc: '更新电站信息', params: ':id', response: '{ success: true }' },
    ],
  },
  {
    name: '🚨 告警管理',
    description: '告警查询、确认和处理',
    endpoints: [
      { method: 'GET', path: '/api/alerts', desc: '告警列表', params: '?level=&type=&acknowledged=', response: '[{ id, stationId, type, level, message, timestamp }]' },
      { method: 'POST', path: '/api/alerts/:id/acknowledge', desc: '确认告警', params: ':id', response: '{ success: true }' },
      { method: 'DELETE', path: '/api/alerts/:id', desc: '删除告警', params: ':id', response: '{ success: true }' },
    ],
  },
  {
    name: '💰 交易记录',
    description: '电力交易订单和持仓',
    endpoints: [
      { method: 'GET', path: '/api/trades/orders', desc: '交易订单列表', params: '?status=&type=', response: '[{ id, type, power, price, status }]' },
      { method: 'POST', path: '/api/trades/orders', desc: '创建交易订单', params: '', response: '{ orderId, status: pending }' },
      { method: 'GET', path: '/api/trades/positions', desc: '当前持仓', params: '', response: '[{ stationId, capacity, locked }]' },
    ],
  },
  {
    name: '🔐 认证',
    description: '用户登录和 Token 管理',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', desc: '用户登录', params: '', response: '{ token, user: { id, name, role } }' },
      { method: 'POST', path: '/api/auth/logout', desc: '登出', params: '', response: '{ success: true }' },
      { method: 'GET', path: '/api/auth/profile', desc: '获取用户资料', params: '', response: '{ id, name, email, role, stations }' },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: '#00D4AA',
  POST: '#667EEA',
  PUT: '#FF9500',
  DELETE: '#FF4D4F',
  PATCH: '#9B59B6',
};

export default function APIExplorer() {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const filteredModules = API_MODULES.filter(m =>
    m.name.includes(search) ||
    m.endpoints.some(e => e.path.includes(search) || e.desc.includes(search))
  );

  const handleTest = async (endpoint: typeof API_MODULES[0]['endpoints'][0]) => {
    if (endpoint.method !== 'GET') {
      message.info('演示模式：仅支持 GET 请求测试');
      return;
    }
    setTesting(true);
    setTestResult('');
    try {
      const path = endpoint.path.replace('/api', '');
      const res = await api.get(path);
      setTestResult(JSON.stringify(res.data, null, 2));
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown }; message?: string };
      setTestResult(`❌ 请求失败: ${err?.response?.data || err?.message || 'Unknown error'}`);
    }
    setTesting(false);
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path).then(() => message.success('路径已复制'));
  };

  const allEndpoints = filteredModules.flatMap(m => m.endpoints);

  const columns = [
    { title: '方法', key: 'method', width: 80, render: (_: unknown, r: typeof allEndpoints[0]) => (
      <Tag style={{ background: `${METHOD_COLORS[r.method]}20`, color: METHOD_COLORS[r.method], border: `1px solid ${METHOD_COLORS[r.method]}50`, fontWeight: 700, fontSize: 11 }}>
        {r.method}
      </Tag>
    )},
    { title: '路径', key: 'path', width: 320, render: (_: unknown, r: typeof allEndpoints[0]) => (
      <code style={{ fontSize: 12, color: '#667EEA', cursor: 'pointer' }} onClick={() => copyPath(r.path)}>{r.path}</code>
    )},
    { title: '描述', dataIndex: 'desc', key: 'desc', ellipsis: true },
    { title: '参数', dataIndex: 'params', key: 'params', width: 160, render: (p: string) => p ? <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p}</code> : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>—</span> },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, r: typeof allEndpoints[0]) => (
        <Button size="small" type="primary" loading={testing} onClick={() => handleTest(r)}>
          测试
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>🔌 API Explorer</h2>

      {/* Header */}
      <Card style={{ marginBottom: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <Row gutter={16} align="middle">
          <Col flex="1">
            <Input
              placeholder="搜索 API 路径或描述..."
              prefix={<SearchOutlined style={{ color: 'rgba(102,126,234,0.5)' }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Space>
              <Tag style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA', border: 'none' }}>GET</Tag>
              <Tag style={{ background: 'rgba(102,126,234,0.15)', color: '#667EEA', border: 'none' }}>POST</Tag>
              <Tag style={{ background: 'rgba(255,149,0,0.15)', color: '#FF9500', border: 'none' }}>PUT</Tag>
              <Tag style={{ background: 'rgba(255,77,79,0.15)', color: '#FF4D4F', border: 'none' }}>DELETE</Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Module List */}
        <Col xs={24} lg={8}>
          <Card
            title="📦 API 模块"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
            styles={{ body: { padding: 0 } }}
          >
            {filteredModules.map((mod, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedModule(selectedModule === mod.name ? null : mod.name)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: selectedModule === mod.name ? 'rgba(102,126,234,0.12)' : 'transparent',
                  borderBottom: idx < filteredModules.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderLeft: selectedModule === mod.name ? '3px solid #667EEA' : '3px solid transparent',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: selectedModule === mod.name ? 'white' : 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
                  {mod.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{mod.description}</div>
                <div style={{ fontSize: 11, color: '#667EEA' }}>{mod.endpoints.length} 个接口</div>
              </div>
            ))}
          </Card>
        </Col>

        {/* Endpoint Table */}
        <Col xs={24} lg={16}>
          <Card
            title="🔀 接口列表"
            extra={<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{allEndpoints.length} 个接口</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table
                dataSource={selectedModule ? filteredModules.find(m => m.name === selectedModule)?.endpoints.map((e, i) => ({ ...e, key: i })) : allEndpoints.map((e, i) => ({ ...e, key: i }))}
                columns={columns}
                pagination={false}
                size="small"
                scroll={{ x: 700 }}
              />
            </div>
          </Card>

          {/* Test Result */}
          {testResult && (
            <Card
              title="📤 响应结果"
              extra={<Button icon={<CopyOutlined />} size="small" onClick={() => { navigator.clipboard.writeText(testResult); message.success('已复制'); }}>复制</Button>}
              style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
            >
              <pre style={{ fontSize: 11, color: '#00D4AA', overflowX: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {testResult}
              </pre>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
