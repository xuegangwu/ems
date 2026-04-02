/**
 * History — 历史数据、告警、工单查询
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Tag, Button, Select, Badge, Spin, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const API = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '';

const STATIONS = [
  { id: 'station-001', name: '苏州工业园光储站' },
  { id: 'station-002', name: '杭州光伏基地' },
  { id: 'station-003', name: '上海工商业光储' },
];

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stationId, setStationId] = useState<string>('all');
  const [days, setDays] = useState<number>(7);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = stationId !== 'all' ? `?stationId=${stationId}&days=${days}` : `?days=${days}`;
      const headers = { Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` };
      const [sm, al, wo, st] = await Promise.all([
        fetch(`${API}/api/history/summaries${params}`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/api/history/alerts?days=${days}&limit=50${stationId !== 'all' ? `&stationId=${stationId}` : ''}`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/api/history/work-orders?days=${days}&limit=50${stationId !== 'all' ? `&stationId=${stationId}` : ''}`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/api/history/stats?${stationId !== 'all' ? `stationId=${stationId}` : ''}`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
      ]);
      if (sm.success) setSummaries(sm.summaries || []);
      if (al.success) setAlerts(al.alerts || []);
      if (wo.success) setWorkOrders(wo.workOrders || []);
      if (st.success) setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [stationId, days]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const acknowledgeAlert = async (id: string) => {
    try {
      const r = await fetch(`${API}/api/history/alerts/${id}/ack`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: JSON.parse(sessionStorage.getItem('user') || '{}').username }),
      });
      const d = await r.json();
      if (d.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
        message.success('已确认');
      }
    } catch { message.error('确认失败'); }
  };

  // ─── Energy chart ──────────────────────────────────────────────────────────
  const chartOption = summaries.length > 0 ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,15,35,0.95)', borderColor: 'rgba(0,212,170,0.3)', textStyle: { color: '#fff' } },
    legend: { top: 0, textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 }, data: ['光伏kWh', '用电kWh', '收益¥'] },
    grid: { top: 28, right: 12, bottom: 32, left: 48 },
    xAxis: { type: 'category', data: summaries.map(s => s.date.slice(5)), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 }, axisTick: { show: false } },
    yAxis: [
      { type: 'value', name: 'kWh', axisLine: { show: false }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.2)', fontSize: 9 } },
      { type: 'value', name: '¥', axisLine: { show: false }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 }, splitLine: { show: false }, nameTextStyle: { color: 'rgba(255,255,255,0.2)', fontSize: 9 } },
    ],
    series: [
      { name: '光伏kWh', type: 'line', data: summaries.map(s => s.solarKwh), smooth: 0.4, lineStyle: { width: 2, color: '#00D4AA' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0,212,170,0.25)' }, { offset: 1, color: 'rgba(0,212,170,0)' }] } }, symbol: 'circle', symbolSize: 3 },
      { name: '用电kWh', type: 'line', data: summaries.map(s => s.loadKwh), smooth: 0.4, lineStyle: { width: 2, color: '#667EEA' }, symbol: 'circle', symbolSize: 3 },
      { name: '收益¥', type: 'line', yAxisIndex: 1, data: summaries.map(s => s.revenue), smooth: 0.4, lineStyle: { width: 2, color: '#FF9500' }, symbol: 'circle', symbolSize: 3 },
    ],
  } : {};

  const alertColumns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 90, render: (t: string) => new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) },
    { title: '级别', dataIndex: 'level', key: 'level', width: 80, render: (l: string) => {
      const m: Record<string, string> = { info: 'blue', warning: 'orange', error: 'red', critical: 'purple' };
      return <Tag color={m[l] || 'default'} style={{ fontSize: 10 }}>{l}</Tag>;
    }},
    { title: '消息', dataIndex: 'message', key: 'message', render: (t: string) => <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{t}</span> },
    { title: '状态', dataIndex: 'acknowledged', key: 'acknowledged', width: 70, render: (a: boolean) => a ? <Badge status="default" text={<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>已确认</span>} /> : <Badge status="error" text={<span style={{ fontSize: 10, color: '#FF4D4F' }}>未处理</span>} /> },
    { title: '操作', key: 'action', width: 70, render: (_: unknown, r: any) => r.acknowledged ? null : <Button size="small" onClick={() => acknowledgeAlert(r.id)} style={{ fontSize: 10 }}>确认</Button> },
  ];

  const woColumns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 90, render: (t: string) => new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) },
    { title: '类型', dataIndex: 'type', key: 'type', width: 80, render: (t: string) => <Tag style={{ fontSize: 10 }}>{t === 'inspect' ? '巡检' : t === 'repair' ? '维修' : t === 'maintenance' ? '保养' : '告警'}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 70, render: (p: string) => { const m: Record<string, string> = { low: 'green', medium: 'blue', high: 'orange', urgent: 'red' }; return <Tag color={m[p]} style={{ fontSize: 10 }}>{p}</Tag>; }},
    { title: '工单标题', dataIndex: 'title', key: 'title', render: (t: string) => <span style={{ fontSize: 12 }}>{t}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => { const m: Record<string, string> = { open: 'orange', assigned: 'blue', in_progress: 'processing', completed: 'green', cancelled: 'default' }; return <Badge status={m[s] as any} text={<span style={{ fontSize: 10 }}>{s === 'open' ? '待处理' : s === 'assigned' ? '已派单' : s === 'in_progress' ? '处理中' : s === 'completed' ? '已完成' : '已取消'}</span>} />; }},
    { title: '处理人', dataIndex: 'assignee', key: 'assignee', width: 80, render: (a: string) => <span style={{ fontSize: 11 }}>{a || '-'}</span> },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0' }}><Spin size="large" /><div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>加载历史数据...</div></div>;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>📈 历史数据</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>发用电记录 · 告警日志 · 工单历史</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select value={stationId} onChange={v => setStationId(v)} style={{ width: 140 }} size="small"
            options={[{ value: 'all', label: '全部电站' }, ...STATIONS.map(s => ({ value: s.id, label: s.name }))]}
          />
          <Select value={days} onChange={v => setDays(v)} style={{ width: 90 }} size="small"
            options={[{ value: 7, label: '近7天' }, { value: 14, label: '近14天' }, { value: 30, label: '近30天' }]}
          />
          <Button icon={<ReloadOutlined />} onClick={loadAll} size="small" style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)', color: '#00D4AA' }} />
        </div>
      </div>

      {/* KPI cards */}
      {stats && (
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          {[
            { label: '累计光伏', value: `${(stats.total?.solarKwh || 0).toFixed(0)} kWh`, color: '#00D4AA' },
            { label: '累计用电', value: `${(stats.total?.loadKwh || 0).toFixed(0)} kWh`, color: '#667EEA' },
            { label: '累计收益', value: `¥${(stats.total?.revenue || 0).toFixed(0)}`, color: '#FF9500' },
            { label: '累计节省', value: `¥${(stats.total?.savings || 0).toFixed(0)}`, color: '#00D4AA' },
            { label: '本月收益', value: `¥${(stats.month?.revenue || 0).toFixed(0)}`, color: '#FF9500' },
            { label: '本月成本', value: `¥${(stats.month?.cost || 0).toFixed(0)}`, color: '#FF4D4F' },
          ].map(k => (
            <Col xs={8} sm={8} md={4} key={k.label}>
              <Card size="small" bodyStyle={{ padding: '8px 6px', textAlign: 'center' }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${k.color}18` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{k.label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Energy chart */}
      <Card size="small" title={<span style={{ fontSize: 13 }}>📊 发用电与收益趋势</span>} bodyStyle={{ padding: '10px 10px 4px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)', marginBottom: 12 }}>
        <ReactECharts option={chartOption} style={{ height: 220 }} />
      </Card>

      {/* Alerts */}
      <Card size="small" title={<span style={{ fontSize: 13 }}>🚨 告警记录（{alerts.length}）</span>} bodyStyle={{ padding: 0 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,77,79,0.12)', marginBottom: 12 }}>
        <Table dataSource={alerts} columns={alertColumns} rowKey="id" pagination={{ pageSize: 6, size: 'small', showSizeChanger: false }} scroll={{ x: 600 }} size="small" locale={{ emptyText: '暂无告警' }} />
      </Card>

      {/* Work orders */}
      <Card size="small" title={<span style={{ fontSize: 13 }}>🛠️ 工单记录（{workOrders.length}）</span>} bodyStyle={{ padding: 0 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <Table dataSource={workOrders} columns={woColumns} rowKey="id" pagination={{ pageSize: 6, size: 'small', showSizeChanger: false }} scroll={{ x: 700 }} size="small" locale={{ emptyText: '暂无工单' }} />
      </Card>
    </div>
  );
}
