import { useState } from 'react'
import {
  Card, Table, Tag, Button, Space, Input, Select,
  Row, Col, Progress, Avatar, Tooltip, Popconfirm, Drawer, Badge
} from 'antd'
import {
  SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, ThunderboltOutlined, MoneyCollectOutlined,
  AlertOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, BankOutlined
} from '@ant-design/icons'

// ── Types ──────────────────────────────────────────────────────────────────
interface Customer {
  id: string; name: string; type: 'enterprise' | 'smb' | 'residential' | 'key-account';
  contact: string; phone: string; email: string;
  stations: number; capacityKw: number; annualRevenue: number;
  healthScore: number; // 0-100
  healthLevel: 'excellent' | 'good' | 'warning' | 'critical';
  region: string; industry: string;
  contractStart: string; contractEnd: string;
  lastActive: string; outstanding: number; // 欠费
  tags: string[];
  rating: 1 | 2 | 3 | 4 | 5; // internal rating
}

// ── Mock data ────────────────────────────────────────────────────────────────
const mockCustomers: Customer[] = [
  { id: 'C001', name: '苏州工业园光储站', type: 'key-account', contact: '张总', phone: '138-0000-0001', email: 'zhang@solaripple.com', stations: 1, capacityKw: 500, annualRevenue: 480000, healthScore: 85, healthLevel: 'excellent', region: '华东', industry: '工业制造', contractStart: '2024-01-01', contractEnd: '2027-12-31', lastActive: '2026-04-02', outstanding: 0, tags: ['重点客户', '年签'], rating: 5 },
  { id: 'C002', name: '杭州光伏基地', type: 'enterprise', contact: '李总', phone: '139-0000-0002', email: 'li@hzep.com', stations: 1, capacityKw: 350, annualRevenue: 320000, healthScore: 72, healthLevel: 'good', region: '华东', industry: '数据中心', contractStart: '2024-06-01', contractEnd: '2026-05-31', lastActive: '2026-04-01', outstanding: 12000, tags: ['续约待谈'], rating: 4 },
  { id: 'C003', name: '上海工商业光储站', type: 'enterprise', contact: '王经理', phone: '136-0000-0003', email: 'wang@shanghai-neng.com', stations: 1, capacityKw: 200, annualRevenue: 180000, healthScore: 58, healthLevel: 'warning', region: '华东', industry: '商业楼宇', contractStart: '2023-09-01', contractEnd: '2026-08-31', lastActive: '2026-03-28', outstanding: 45000, tags: ['高欠费', '预警'], rating: 2 },
  { id: 'C004', name: '南京储能项目', type: 'key-account', contact: '陈总', phone: '137-0000-0004', email: 'chen@nj-storage.com', stations: 2, capacityKw: 800, annualRevenue: 720000, healthScore: 91, healthLevel: 'excellent', region: '华东', industry: '新能源', contractStart: '2025-01-01', contractEnd: '2029-12-31', lastActive: '2026-04-02', outstanding: 0, tags: ['战略客户', '长期合同'], rating: 5 },
  { id: 'C005', name: '宁波小微光储', type: 'smb', contact: '刘总', phone: '135-0000-0005', email: 'liu@nb-smb.com', stations: 1, capacityKw: 50, annualRevenue: 38000, healthScore: 35, healthLevel: 'critical', region: '华东', industry: '制造业', contractStart: '2025-03-01', contractEnd: '2026-02-28', lastActive: '2026-02-15', outstanding: 88000, tags: ['高欠费', '流失风险', '续约待谈'], rating: 1 },
  { id: 'C006', name: '无锡工厂光储', type: 'enterprise', contact: '周工', phone: '134-0000-0006', email: 'zhou@wx-factory.com', stations: 1, capacityKw: 280, annualRevenue: 250000, healthScore: 78, healthLevel: 'good', region: '华东', industry: '纺织', contractStart: '2024-04-01', contractEnd: '2027-03-31', lastActive: '2026-04-02', outstanding: 0, tags: ['正常'], rating: 4 },
  { id: 'C007', name: '嘉兴园区分布式', type: 'smb', contact: '马总', phone: '133-0000-0007', email: 'ma@jx-park.com', stations: 3, capacityKw: 120, annualRevenue: 95000, healthScore: 65, healthLevel: 'good', region: '华东', industry: '园区', contractStart: '2024-08-01', contractEnd: '2026-07-31', lastActive: '2026-04-01', outstanding: 0, tags: ['分布式'], rating: 3 },
  { id: 'C008', name: '武汉光储项目', type: 'key-account', contact: '赵总', phone: '132-0000-0008', email: 'zhao@wh-project.com', stations: 1, capacityKw: 600, annualRevenue: 560000, healthScore: 44, healthLevel: 'warning', region: '华中', industry: '工业制造', contractStart: '2024-11-01', contractEnd: '2025-10-31', lastActive: '2026-03-25', outstanding: 220000, tags: ['大客户', '合同到期预警'], rating: 3 },
];

// ── Health Score color ────────────────────────────────────────────────────────
function healthColor(score: number): string {
  if (score >= 80) return '#00D4AA';
  if (score >= 60) return '#34D399';
  if (score >= 40) return '#FBBF24';
  return '#F87171';
}

function healthLabel(level: Customer['healthLevel']): string {
  return { excellent: '优秀', good: '良好', warning: '预警', critical: '危险' }[level];
}

function typeLabel(type: Customer['type']): string {
  return { 'key-account': '战略KA', enterprise: '企业', smb: '中小企业', residential: '居民' }[type];
}

function typeColor(type: Customer['type']): string {
  return { 'key-account': '#667EEA', enterprise: '#00D4AA', smb: '#FBBF24', residential: '#60A5FA' }[type];
}

// ── Stats ────────────────────────────────────────────────────────────────────
function CustomerStats({ customers }: { customers: Customer[] }) {
  const total = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.annualRevenue, 0);
  const totalCapacity = customers.reduce((s, c) => s + c.capacityKw, 0);
  const outstanding = customers.reduce((s, c) => s + c.outstanding, 0);
  const healthDist = customers.reduce((acc, c) => {
    acc[c.healthLevel] = (acc[c.healthLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      {[
        { label: '客户总数', value: total, suffix: '家', icon: <UserOutlined />, color: '#667EEA' },
        { label: '年合同额', value: (totalRevenue / 10000).toFixed(0), suffix: '万', icon: <MoneyCollectOutlined />, color: '#00D4AA' },
        { label: '总装机容量', value: (totalCapacity / 1000).toFixed(1), suffix: 'MW', icon: <ThunderboltOutlined />, color: '#FBBF24' },
        { label: '欠费总额', value: (outstanding / 10000).toFixed(0), suffix: '万', icon: <AlertOutlined />, color: outstanding > 0 ? '#F87171' : '#9CA3AF' },
        { label: '优秀', value: healthDist['excellent'] || 0, suffix: '家', color: '#00D4AA' },
        { label: '良好', value: healthDist['good'] || 0, suffix: '家', color: '#34D399' },
        { label: '预警', value: healthDist['warning'] || 0, suffix: '家', color: '#FBBF24' },
        { label: '危险', value: healthDist['critical'] || 0, suffix: '家', color: '#F87171' },
      ].map((s) => (
        <Col span={3} key={s.label}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(102,126,234,0.12)`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {s.icon && <span style={{ fontSize: 14, color: s.color }}>{s.icon}</span>}
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.suffix}</span>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// ── Customer Detail Drawer ────────────────────────────────────────────────────
function CustomerDrawer({ customer, open, onClose }: { customer: Customer | null; open: boolean; onClose: () => void }) {
  if (!customer) return null;
  return (
    <Drawer
      title={<span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>{customer.name}</span>}
      placement="right" width={520} open={open} onClose={onClose}
      styles={{ body: { padding: 0, background: '#0A0E1A' }, header: { background: '#0F1A2E', borderBottom: '1px solid rgba(102,126,234,0.12)' } }}
    >
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar size={56} style={{ background: typeColor(customer.type), fontSize: 22, fontWeight: 700 }}>
            {customer.name.slice(0, 2)}
          </Avatar>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{customer.name}</div>
            <Space size={4} wrap>
              <Tag style={{ background: typeColor(customer.type) + '22', border: 'none', color: typeColor(customer.type), fontSize: 11 }}>{typeLabel(customer.type)}</Tag>
              {customer.tags.map(t => (
                <Tag key={t} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{t}</Tag>
              ))}
            </Space>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <Progress
              type="circle"
              percent={customer.healthScore}
              strokeColor={healthColor(customer.healthScore)}
              trailColor="rgba(255,255,255,0.06)"
              strokeWidth={10} size={56}
              format={() => <span style={{ color: '#fff', fontSize: 12 }}>{customer.healthScore}</span>}
            />
          </div>
        </div>

        {/* Health assessment */}
        <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${healthColor(customer.healthScore)}33`, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {customer.healthLevel === 'excellent' || customer.healthLevel === 'good'
              ? <CheckCircleOutlined style={{ fontSize: 22, color: healthColor(customer.healthScore) }} />
              : <ExclamationCircleOutlined style={{ fontSize: 22, color: healthColor(customer.healthScore) }} />}
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: healthColor(customer.healthScore) }}>
                {healthLabel(customer.healthLevel)} · 健康度 {customer.healthScore}分
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {customer.healthLevel === 'excellent' ? '客户资产运行良好，收益稳定，建议保持' :
                 customer.healthLevel === 'good' ? '整体健康，关注欠费风险' :
                 customer.healthLevel === 'warning' ? '⚠️ 需关注欠费及设备状态，建议主动联系' :
                 '🚨 高风险客户，欠费严重，设备状态差，需立即跟进'}
              </div>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card size="small" title={<span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>联系方式</span>}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            {[
              { label: '联系人', value: customer.contact },
              { label: '联系电话', value: customer.phone },
              { label: '邮箱', value: customer.email },
              { label: '所在地区', value: customer.region },
              { label: '所属行业', value: customer.industry },
              { label: '合同等级', value: '★'.repeat(customer.rating) },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{row.label}</div>
                <div style={{ color: '#fff', fontWeight: 500 }}>{row.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Asset summary */}
        <Card size="small" title={<span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>资产概况</span>}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', marginBottom: 16 }}>
          <Row gutter={[12, 12]}>
            {[
              { label: '关联电站', value: customer.stations + '座', color: '#fff' },
              { label: '总装机容量', value: customer.capacityKw + 'kW', color: '#FFB020' },
              { label: '年合同额', value: '¥' + (customer.annualRevenue / 10000).toFixed(0) + '万', color: '#00D4AA' },
              { label: '合同剩余', value: Math.max(0, Math.round((new Date(customer.contractEnd).getTime() - Date.now()) / 86400000)) + '天', color: new Date(customer.contractEnd) < new Date(Date.now() + 90*8640000) ? '#F87171' : '#34D399' },
              { label: '当前欠费', value: customer.outstanding > 0 ? '¥' + (customer.outstanding / 10000).toFixed(0) + '万' : '无', color: customer.outstanding > 0 ? '#F87171' : '#00D4AA' },
              { label: '最近活跃', value: customer.lastActive, color: '#9CA3AF' },
            ].map(s => (
              <Col span={4} key={s.label}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Actions */}
        <Space style={{ width: '100%' }} size={8}>
          <Button icon={<EditOutlined />} style={{ flex: 1 }}>编辑信息</Button>
          <Button icon={<MoneyCollectOutlined />} style={{ flex: 1 }}>账单管理</Button>
          <Button icon={<ThunderboltOutlined />} style={{ flex: 1 }}>资产管理</Button>
        </Space>
      </div>
    </Drawer>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function CustomerManagement() {
  const [customers] = useState<Customer[]>(mockCustomers);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.includes(search) || c.contact.includes(search) || c.id.includes(search);
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const matchHealth = healthFilter === 'all' || c.healthLevel === healthFilter;
    return matchSearch && matchType && matchHealth;
  });

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: '客户名称', dataIndex: 'name', key: 'name', fixed: 'left' as const, width: 180,
      render: (name: string, r: Customer) => (
        <div>
          <div style={{ fontWeight: 600, color: '#fff', cursor: 'pointer' }} onClick={() => handleView(r)}>{name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{r.id}</div>
        </div>
      )
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 90,
      render: (type: Customer['type']) => (
        <Tag style={{ background: typeColor(type) + '22', border: 'none', color: typeColor(type), fontSize: 11 }}>
          {typeLabel(type)}
        </Tag>
      )
    },
    {
      title: '联系人', key: 'contact', width: 120,
      render: (_: any, r: Customer) => (
        <div>
          <div style={{ color: '#fff' }}>{r.contact}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{r.phone}</div>
        </div>
      )
    },
    {
      title: '健康度', dataIndex: 'healthScore', key: 'healthScore', width: 130,
      render: (score: number, r: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={score} size="small"
            strokeColor={healthColor(score)}
            trailColor="rgba(255,255,255,0.06)"
            style={{ flex: 1, minWidth: 60 }}
            format={() => <span style={{ fontSize: 10, color: healthColor(score) }}>{healthLabel(r.healthLevel)}</span>}
          />
        </div>
      )
    },
    {
      title: '装机容量', dataIndex: 'capacityKw', key: 'capacityKw', width: 100,
      render: (v: number) => <span style={{ color: '#FFB020', fontWeight: 600 }}>{v}kW</span>
    },
    {
      title: '年合同额', dataIndex: 'annualRevenue', key: 'annualRevenue', width: 110,
      render: (v: number) => <span style={{ color: '#00D4AA', fontWeight: 600 }}>¥{(v/10000).toFixed(0)}万</span>
    },
    {
      title: '欠费', dataIndex: 'outstanding', key: 'outstanding', width: 90,
      render: (v: number) => v > 0
        ? <Badge count={v} style={{ backgroundColor: '#F87171' }}><span style={{ color: '#F87171', fontWeight: 600 }}>¥{(v/10000).toFixed(0)}万</span></Badge>
        : <span style={{ color: '#00D4AA' }}>✅ 无欠费</span>
    },
    {
      title: '电站', dataIndex: 'stations', key: 'stations', width: 70,
      render: (v: number) => <span style={{ color: '#fff' }}>{v}座</span>
    },
    {
      title: '合同到期', dataIndex: 'contractEnd', key: 'contractEnd', width: 100,
      render: (end: string) => {
        const days = Math.round((new Date(end).getTime() - Date.now()) / 86400000);
        return (
          <div>
            <div style={{ color: days < 90 ? '#F87171' : '#fff' }}>{end}</div>
            <div style={{ fontSize: 10, color: days < 90 ? '#F87171' : 'rgba(255,255,255,0.35)' }}>
              {days < 0 ? '已到期' : `剩${days}天`}
            </div>
          </div>
        );
      }
    },
    {
      title: '标签', key: 'tags', width: 140,
      render: (_: any, r: Customer) => (
        <Space size={2} wrap>
          {r.tags.map(t => (
            <Tag key={t} style={{
              background: t.includes('欠费') ? 'rgba(248,113,113,0.15)' : 'rgba(102,126,234,0.1)',
              border: 'none', fontSize: 10,
              color: t.includes('欠费') ? '#F87171' : 'rgba(255,255,255,0.5)'
            }}>{t}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '操作', key: 'action', width: 100, fixed: 'right' as const,
      render: (_: any, r: Customer) => (
        <Space size={4}>
          <Tooltip title="查看详情">
            <Button size="small" icon={<InfoCircleOutlined />} onClick={() => handleView(r)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} />
          </Tooltip>
          <Popconfirm title="确认删除此客户？" okText="删除" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>👥 客户管理</h2>
          <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 13 }}>
            客户健康度追踪 · 欠费预警 · 合同到期提醒
          </p>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} style={{ background: '#667EEA' }}>
            新建客户
          </Button>
          <Button icon={<BankOutlined />}>批量导入</Button>
        </Space>
      </div>

      {/* Stats */}
      <CustomerStats customers={filtered} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />}
          placeholder="搜索客户名称 / 联系人 / ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260, background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(102,126,234,0.2)' }}
          allowClear
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部类型' },
            { value: 'key-account', label: '战略KA' },
            { value: 'enterprise', label: '企业' },
            { value: 'smb', label: '中小企业' },
            { value: 'residential', label: '居民' },
          ]}
        />
        <Select
          value={healthFilter}
          onChange={setHealthFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '全部健康度' },
            { value: 'excellent', label: '优秀' },
            { value: 'good', label: '良好' },
            { value: 'warning', label: '预警' },
            { value: 'critical', label: '危险' },
          ]}
        />
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>
          共 {filtered.length} 家客户 · 高风险 <span style={{ color: '#F87171', fontWeight: 600 }}>{filtered.filter(c => c.healthLevel === 'critical' || c.healthLevel === 'warning').length}</span> 家
        </div>
      </div>

      {/* Table */}
      <Card size="small" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(102,126,234,0.1)' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          size="small"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>共 {total} 家</span>,
          }}
          rowClassName={(_: any, idx: number) => idx % 2 === 0 ? '' : 'table-row-stripe'}
          style={{ background: 'transparent' }}
        />
      </Card>

      {/* Detail Drawer */}
      <CustomerDrawer customer={selectedCustomer} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
