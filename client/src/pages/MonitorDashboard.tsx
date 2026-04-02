/**
 * MonitorDashboard — 增强版监控首页
 * 真实设备数据 + 高级 KPI 卡片 + 收益分析 + 告警面板
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Tag, Button, Badge, Progress, Spin, Alert } from 'antd';
import { AlertOutlined, CheckCircleOutlined, WarningOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const API = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '';


interface RealtimeData {
  stationId: string;
  name: string;
  capacityKw: number;
  batteryKwh: number;
  latest: {
    timestamp: string;
    solarPowerKw: number;
    batterySoc: number;
    batteryPowerKw: number;
    loadPowerKw: number;
    gridPowerKw: number;
    meterKwh: number;
    priceCny: number;
  };
}

interface Alert {
  id: string; timestamp: string; stationId: string;
  level: string; code: string; message: string; acknowledged: boolean;
}

interface DailySummary {
  date: string; solarKwh: number; loadKwh: number;
  gridImportKwh: number; gridExportKwh: number;
  batteryChargeKwh: number; batteryDischargeKwh: number;
  peakPowerKw: number; avgSoc: number;
  revenue: number; cost: number; savings: number; selfSufficiency: number;
}

interface Stats {
  today: { solarKwh: number; loadKwh: number; peakPowerKw: number; avgSoc: number; selfSufficiency: number; revenue: number; savings: number; gridImportKwh: number; gridExportKwh: number };
  compareYesterday: { solarKwh: string; loadKwh: string };
  month: { revenue: number; cost: number; savings: number };
  total: { solarKwh: number; loadKwh: number; revenue: number; savings: number };
  stations: Array<{ id: string; name: string; capacityKw: number; batteryKwh: number; today: DailySummary | null }>;
}

function useInterval(cb: () => void, ms: number) {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => { if (ms <= 0) return; const id = setInterval(() => ref.current(), ms); return () => clearInterval(id); }, [ms]);
}

export default function MonitorDashboard() {
  const [realtime, setRealtime] = useState<RealtimeData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);


  const loadAll = useCallback(async () => {
    try {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token') || ''}` };
      const [rt, st, al, sm] = await Promise.all([
        fetch(`${API}/api/mqtt/realtime`).then(r => r.json()).catch(() => ({ success: true, stations: [] })),
        fetch(`${API}/api/history/stats`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(`${API}/api/history/alerts?days=1&limit=10`, { headers }).then(r => r.json()).catch(() => ({ success: true, alerts: [] })),
        fetch(`${API}/api/history/summaries?days=7`, { headers }).then(r => r.json()).catch(() => ({ success: true, summaries: [] })),
      ]);
      if (rt.success) setRealtime(rt.stations || []);
      if (st.success) setStats(st);
      if (al.success) setAlerts(al.alerts || []);
      if (sm.success) setSummaries(sm.summaries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useInterval(loadAll, 15000);

  // ─── Energy pie chart ─────────────────────────────────────────────────────
  const today = stats?.today;
  const pieOption = today ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}: {c} kWh ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      center: ['35%', '50%'],
      label: { show: false },
      data: [
        { value: today.solarKwh, name: '光伏发电', itemStyle: { color: '#00D4AA' } },
        { value: today.gridImportKwh, name: '电网购电', itemStyle: { color: '#667EEA' } },
        { value: today.gridExportKwh, name: '余电上网', itemStyle: { color: '#FF9500' } },
      ],
    }],
  } : {};

  // ─── 7-day bar chart ─────────────────────────────────────────────────────
  const barOption = summaries.length > 0 ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,15,35,0.95)', borderColor: 'rgba(0,212,170,0.3)', textStyle: { color: '#fff' } },
    legend: { top: 0, textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 }, data: ['光伏', '用电', '收益(×10)'] },
    grid: { top: 28, right: 12, bottom: 28, left: 44 },
    xAxis: { type: 'category', data: summaries.map(s => s.date.slice(5)), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 }, axisTick: { show: false } },
    yAxis: [
      { type: 'value', name: 'kWh', axisLine: { show: false }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.2)', fontSize: 9 } },
      { type: 'value', name: '¥', axisLine: { show: false }, axisLabel: { show: false }, splitLine: { show: false }, nameTextStyle: { color: 'rgba(255,255,255,0.2)', fontSize: 9 } },
    ],
    series: [
      { name: '光伏', type: 'bar', data: summaries.map(s => s.solarKwh.toFixed(0)), itemStyle: { color: 'rgba(0,212,170,0.6)', borderRadius: [2, 2, 0, 0] } },
      { name: '用电', type: 'bar', data: summaries.map(s => s.loadKwh.toFixed(0)), itemStyle: { color: 'rgba(102,126,234,0.5)', borderRadius: [2, 2, 0, 0] } },
      { name: '收益(×10)', type: 'bar', yAxisIndex: 1, data: summaries.map(s => (s.revenue * 10).toFixed(0)), itemStyle: { color: 'rgba(255,149,0,0.5)', borderRadius: [2, 2, 0, 0] } },
    ],
  } : {};


  // ─── Realtime gauge for SoC ───────────────────────────────────────────────
  const socGauge = (soc: number) => ({
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge' as const,
      startAngle: 200,
      endAngle: -20,
      radius: '90%',
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLine: { lineStyle: { width: 10, color: [[1, 'rgba(255,255,255,0.06)']] } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, distance: 15 },
      splitLine: { show: false },
      pointer: { show: false },
      detail: { valueAnimation: true, formatter: '{value}%', color: '#fff', fontSize: 14, fontWeight: 600, offsetCenter: [0, '70%'] as any },
      data: [{ value: soc }],
      itemStyle: { color: soc > 60 ? '#00D4AA' : soc > 30 ? '#FF9500' : '#FF4D4F' },
      progress: { show: true, width: 10, itemStyle: { color: soc > 60 ? '#00D4AA' : soc > 30 ? '#FF9500' : '#FF4D4F' } },
    }],
  });

  // ─── Alert level ──────────────────────────────────────────────────────────
  const alertLevelTag = (level: string) => {
    const map: Record<string, { color: string; icon: JSX.Element }> = {
      info: { color: 'blue', icon: <CheckCircleOutlined /> },
      warning: { color: 'orange', icon: <WarningOutlined /> },
      error: { color: 'red', icon: <AlertOutlined /> },
      critical: { color: 'purple', icon: <AlertOutlined /> },
    };
    const c = map[level] || map.info;
    return <Tag color={c.color} icon={c.icon} style={{ fontSize: 10 }}>{level}</Tag>;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /><div style={{ color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>加载监控数据...</div></div>;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>📊 监控中心</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>实时数据 · 收益分析 · 告警监控</p>
      </div>

      {/* ─── Stats row ─────────────────────────────────────────────────── */}
      {stats && (
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          {[
            { label: '今日光伏', value: `${stats.today.solarKwh.toFixed(0)}kWh`, icon: '☀️', color: '#00D4AA', sub: `${stats.compareYesterday.solarKwh}%`, up: parseFloat(stats.compareYesterday.solarKwh) >= 0 },
            { label: '今日用电', value: `${stats.today.loadKwh.toFixed(0)}kWh`, icon: '🏭', color: '#667EEA', sub: `${stats.compareYesterday.loadKwh}%`, up: parseFloat(stats.compareYesterday.loadKwh) >= 0 },
            { label: '今日收益', value: `¥${stats.today.revenue.toFixed(0)}`, icon: '💰', color: '#FF9500', sub: `本月¥${stats.month.revenue.toFixed(0)}` },
            { label: '自给率', value: `${stats.today.selfSufficiency.toFixed(0)}%`, icon: '⚡', color: '#00D4AA', sub: `节省¥${stats.today.savings.toFixed(0)}` },
            { label: '峰值功率', value: `${stats.today.peakPowerKw.toFixed(0)}kW`, icon: '📈', color: '#FF4D4F', sub: `当前SOC ${stats.today.avgSoc.toFixed(0)}%` },
            { label: '本月节省', value: `¥${stats.month.savings.toFixed(0)}`, icon: '🏦', color: '#00D4AA', sub: `成本¥${stats.month.cost.toFixed(0)}` },
          ].map(s => (
            <Col xs={8} sm={8} md={4} key={s.label}>
              <Card size="small" bodyStyle={{ padding: '10px 8px' }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}18`, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.icon} {s.label}</div>
                <div style={{ fontSize: 9, color: parseFloat((s as any).sub) >= 0 ? '#00D4AA' : '#FF4D4F' }}>{(s as any).up !== undefined ? ((s as any).up ? <RiseOutlined /> : <FallOutlined />) : ''}{(s as any).sub || ''}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ─── Charts row ───────────────────────────────────────────────── */}
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        <Col xs={24} lg={16}>
          <Card size="small" title={<span style={{ fontSize: 13 }}>📊 7日发用电与收益</span>} bodyStyle={{ padding: '10px 10px 4px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}>
            <ReactECharts option={barOption} style={{ height: 200 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card size="small" title={<span style={{ fontSize: 13 }}>💡 今日能量构成</span>} bodyStyle={{ padding: '10px 10px 4px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}>
            <ReactECharts option={pieOption} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      {/* ─── Station realtime cards ────────────────────────────────────── */}
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        {realtime.map(station => {
          const d = station.latest;
          const maxSolar = station.capacityKw;
          return (
            <Col xs={24} md={12} lg={8} key={station.stationId}>
              <Card
                size="small"
                title={<span style={{ fontSize: 13 }}>{station.name}</span>}
                extra={<Tag style={{ fontSize: 9 }}>实时</Tag>}
                bodyStyle={{ padding: '10px 12px' }}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}
              >
                <Row gutter={[4, 4]}>
                  {/* Solar */}
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>{d.solarPowerKw.toFixed(0)}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}> kW</span></div>
                      <Progress percent={Math.round(d.solarPowerKw / maxSolar * 100)} size="small" showInfo={false} strokeColor="#00D4AA" trailColor="rgba(0,212,170,0.15)" />
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>☀️ 光伏</div>
                    </div>
                  </Col>
                  {/* SoC gauge */}
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <ReactECharts option={socGauge(d.batterySoc)} style={{ height: 90, width: '100%' }} />
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: -8 }}>🔋 电池</div>
                    </div>
                  </Col>
                  {/* Load */}
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#667EEA' }}>{d.loadPowerKw.toFixed(0)}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}> kW</span></div>
                      <div style={{ height: 8, marginTop: 4 }} />
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>🏭 用电</div>
                    </div>
                  </Col>
                  {/* Grid */}
                  <Col span={12} style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: d.gridPowerKw > 0 ? '#00D4AA' : '#FF4D4F' }}>
                      <span>⚡ 电网</span><span>{d.gridPowerKw > 0 ? `输出${d.gridPowerKw.toFixed(1)}kW` : `输入${Math.abs(d.gridPowerKw).toFixed(1)}kW`}</span>
                    </div>
                  </Col>
                  <Col span={12} style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#FF9500' }}>
                      <span>💰 电价</span><span>¥{d.priceCny.toFixed(3)}/kWh</span>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* ─── Alerts + work orders ───────────────────────────────────────── */}
      <Row gutter={[8, 8]}>
        <Col xs={24} lg={14}>
          <Card size="small" title={<span style={{ fontSize: 13 }}>🚨 实时告警</span>} extra={<Badge count={alerts.filter(a => !a.acknowledged).length} style={{ fontSize: 9 }}><Button size="small" style={{ fontSize: 10, height: 20, padding: '0 8px' }} onClick={loadAll}>刷新</Button></Badge>} bodyStyle={{ padding: 0 }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,77,79,0.12)' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)' }}>暂无告警</div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {alerts.slice(0, 8).map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: a.acknowledged ? 0.5 : 1 }}>
                    {alertLevelTag(a.level)}
                    <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginLeft: 6 }}>{a.message}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{new Date(a.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Badge dot status={a.acknowledged ? 'default' : 'error'} style={{ marginLeft: 6 }} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" title={<span style={{ fontSize: 13 }}>💰 今日经济指标</span>} bodyStyle={{ padding: '10px 12px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,149,0,0.12)' }}>
            {today && (
              <Row gutter={[8, 8]}>
                {[
                  { label: '今日售电收入', value: `¥${today.revenue.toFixed(2)}`, color: '#00D4AA' },
                  { label: '购电成本', value: `¥${(today.gridImportKwh * 0.65).toFixed(2)}`, color: '#FF4D4F' },
                  { label: '峰谷套利节省', value: `¥${today.savings.toFixed(2)}`, color: '#FF9500' },
                  { label: '自给率', value: `${today.selfSufficiency.toFixed(1)}%`, color: '#667EEA' },
                  { label: '余电上网量', value: `${today.gridExportKwh.toFixed(1)} kWh`, color: '#00D4AA' },
                  { label: '电池充放电', value: `${today.gridImportKwh > 0 ? '充电中' : '放电中'}`, color: '#667EEA' },
                ].map(item => (
                  <Col span={12} key={item.label}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
