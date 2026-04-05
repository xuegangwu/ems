/**
 * VPP Dashboard — 虚拟电厂聚合视图
 * Real-time aggregation of all VPP resources, AGC signals, and market performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Badge,
  Progress, Spin, Divider, Tooltip
} from 'antd';
import { ReloadOutlined, ThunderboltOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

interface VPPResource {
  station_id: string;
  name: string;
  type: string;
  capacity_kwh: number;
  max_power_kw: number;
  current_soc: number;
  status: string;
  dispatchable: boolean;
  last_command: string | null;
  last_result: string | null;
}

interface MarketStatus {
  market_status: string;
  dispatch_signal: string;
  soc_pct: number;
  target_mw: number;
  current_price: number;
  agreed_capacity_kw: number;
  signed_capacity_kw: number;
  is_vpp_enabled: boolean;
  dispatch_count: number;
  dispatch_success_rate: number;
}

interface DailyReport {
  summary: {
    daily_revenue_yuan: number;
    monthly_projected_yuan: number;
    annual_projected_yuan: number;
    total_discharge_kwh: number;
    total_charge_kwh: number;
    peak_shaving_events: number;
    response_rate_pct: number;
    agreed_capacity_kw: number;
  };
  iec104_types_used: Record<string, string>;
}

function useInterval(cb: () => void, ms: number) {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; }, [cb]);
  useEffect(() => {
    if (ms <= 0) return;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export default function VPP() {
  const [market, setMarket] = useState<MarketStatus | null>(null);
  const [resources, setResources] = useState<VPPResource[]>([]);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [m, r, rp] = await Promise.all([
        fetch('/api/vpp/market/status').then(j => j.json()),
        fetch('/api/vpp/resources').then(j => j.json()),
        fetch('/api/vpp/report/daily').then(j => j.json()),
      ]);
      if (m.success) setMarket(m);
      if (r.success) setResources(r.resources || []);
      if (rp.success) setReport(rp);
    } catch (e) {
      console.error('[VPP] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useInterval(loadAll, 5000);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.4)' }}>加载VPP数据...</div>
      </div>
    );
  }

  // Aggregate from resources
  const totalPower = resources.reduce((s, r) => s + r.max_power_kw, 0);
  const avgSoc = resources.length > 0
    ? resources.reduce((s, r) => s + r.current_soc, 0) / resources.length
    : 0;
  const onlineCount = resources.filter(r => r.status === 'online').length;

  const signalColor = (s: string) =>
    s === 'DISCHARGE' ? '#FF4D4F' : s === 'CHARGE' ? '#00D4AA' : '#667EEA';
  const signalIcon = (s: string) =>
    s === 'DISCHARGE' ? <ArrowUpOutlined /> : s === 'CHARGE' ? <ArrowDownOutlined /> : <ThunderboltOutlined />;
  const signalText = (s: string) =>
    s === 'DISCHARGE' ? '放电' : s === 'CHARGE' ? '充电' : '待机';

  const resourceColumns = [
    { title: '电站', dataIndex: 'station_id', key: 'station_id', width: 130, render: (id: string) => <Tag style={{ fontSize: 11 }}>{id}</Tag> },
    { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
    {
      title: 'SOC', dataIndex: 'current_soc', key: 'current_soc', width: 130,
      render: (soc: number) => {
        const color = soc > 70 ? '#00D4AA' : soc > 40 ? '#FFB400' : '#FF4D4F';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={soc}
              size="small"
              strokeColor={color}
              trailColor="rgba(255,255,255,0.08)"
              style={{ width: 80, margin: 0 }}
            />
            <span style={{ color, fontSize: 11, fontWeight: 600, minWidth: 32 }}>{soc}%</span>
          </div>
        );
      }
    },
    { title: '容量(kWh)', dataIndex: 'capacity_kwh', key: 'capacity_kwh', width: 100,
      render: (v: number) => `${v.toLocaleString()}` },
    { title: '最大功率(kW)', dataIndex: 'max_power_kw', key: 'max_power_kw', width: 110 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => <Badge status={s === 'online' ? 'success' : 'error'} text={<span style={{ fontSize: 11 }}>{s === 'online' ? '在线' : '离线'}</span>} />
    },
    {
      title: '最近指令', dataIndex: 'last_command', key: 'last_command', width: 90,
      render: (cmd: string | null) => {
        if (!cmd) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>—</span>;
        const color = cmd === 'STOP' ? '#667EEA' : cmd === 'CHARGE' ? '#00D4AA' : '#FF4D4F';
        const text = cmd === 'CHARGE' ? '充电' : cmd === 'DISCHARGE' ? '放电' : '停止';
        return <Tag color={color} style={{ fontSize: 10 }}>{text}</Tag>;
      }
    },
    {
      title: '结果', dataIndex: 'last_result', key: 'last_result', width: 70,
      render: (result: string | null) => {
        if (!result) return '—';
        return result === 'OK'
          ? <Tag color="green" style={{ fontSize: 10 }}>成功</Tag>
          : <Tag color="red" style={{ fontSize: 10 }}>失败</Tag>;
      }
    },
  ];

  // SOC Bar Chart per station
  const socChartOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255,255,255,0.95)',
      textStyle: { color: '#333' },
      formatter: (params: any[]) => {
        const d = params[0];
        return `<b>${d.name}</b><br/>SOC: <b>${d.value}%</b>`;
      }
    },
    grid: { top: 8, right: 16, bottom: 24, left: 52 },
    xAxis: {
      type: 'category' as const,
      data: resources.map(r => r.name),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, rotate: 15 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      name: 'SOC %',
      min: 0, max: 100,
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 9 },
    },
    series: [{
      name: 'SOC',
      type: 'bar' as const,
      data: resources.map(r => ({
        value: r.current_soc,
        itemStyle: {
          color: r.current_soc > 70 ? '#00D4AA' : r.current_soc > 40 ? '#FFB400' : '#FF4D4F',
          borderRadius: [4, 4, 0, 0],
        }
      })),
      barMaxWidth: 48,
    }],
  };

  // Revenue bar chart (daily, monthly, annual)
  const revenueChartOption = report ? {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255,255,255,0.95)',
      textStyle: { color: '#333' },
      formatter: (params: any[]) => params.map(p =>
        `<b>${p.name}</b>: ¥${Number(p.value).toLocaleString()}`
      ).join('<br/>')
    },
    grid: { top: 8, right: 16, bottom: 24, left: 72 },
    xAxis: {
      type: 'category' as const,
      data: ['日收益', '月预估', '年化'],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      name: '¥',
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, formatter: (v: number) => `¥${(v/1000).toFixed(0)}k` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 9 },
    },
    series: [{
      name: '收益',
      type: 'bar' as const,
      data: [
        { value: report.summary.daily_revenue_yuan, itemStyle: { color: '#FFB400', borderRadius: [4, 4, 0, 0] } },
        { value: report.summary.monthly_projected_yuan / 1000, itemStyle: { color: '#00D4AA', borderRadius: [4, 4, 0, 0] } },
        { value: report.summary.annual_projected_yuan / 10000, itemStyle: { color: '#FF9500', borderRadius: [4, 4, 0, 0] } },
      ],
      barMaxWidth: 60,
    }],
  } : {};

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>🔗 VPP 虚拟电厂</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            虚拟电厂聚合视图 · 三电站储能 · 实时调度 · IEC 104协议
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadAll}
          style={{ background: 'rgba(102,126,234,0.12)', color: '#667EEA', border: '1px solid rgba(102,126,234,0.2)' }}>
          刷新
        </Button>
      </div>

      {/* AGC Signal + Key Stats Row */}
      {market && (
        <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
          {/* AGC Signal Highlight */}
          <Col xs={24} sm={8} md={6}>
            <Card style={{
              background: `rgba(${market.dispatch_signal === 'DISCHARGE' ? '255,77,79,0.1)' : market.dispatch_signal === 'CHARGE' ? '0,212,170,0.1)' : '102,126,234,0.1)'}`,
              border: `1px solid ${signalColor(market.dispatch_signal)}33`,
              textAlign: 'center'
            }} bodyStyle={{ padding: '16px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>⚡ AGC调度信号</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: signalColor(market.dispatch_signal), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {signalIcon(market.dispatch_signal)} {signalText(market.dispatch_signal)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                目标 {(market.target_mw * 1000).toFixed(0)} kW
              </div>
            </Card>
          </Col>

          {[
            { label: 'VPP总容量', value: `${totalPower.toLocaleString()} kW`, color: '#FFB400', tip: '三站最大放电功率总和' },
            { label: '签约容量', value: `${market.signed_capacity_kw} kW`, color: '#38A169', tip: '已签约VPP容量' },
            { label: '平均SOC', value: `${avgSoc.toFixed(1)}%`, color: avgSoc > 70 ? '#00D4AA' : avgSoc > 40 ? '#FFB400' : '#FF4D4F', tip: '三站平均储能SOC' },
            { label: '在线资源', value: `${onlineCount}/${resources.length}`, color: '#667EEA', tip: '在线储能电站数' },
            { label: '调度成功率', value: `${market.dispatch_success_rate}%`, color: '#00D4AA', tip: 'BMS指令执行成功率' },
            { label: '当前电价', value: `¥${market.current_price.toFixed(3)}`, color: '#FF9500', tip: '实时市场电价' },
          ].map(s => (
            <Col xs={12} sm={8} md={3} key={s.label}>
              <Tooltip title={s.tip}>
                <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}22`, textAlign: 'center' }} bodyStyle={{ padding: '12px 6px' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
                </Card>
              </Tooltip>
            </Col>
          ))}
        </Row>
      )}

      {/* Charts Row */}
      <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
        <Col xs={24} lg={12}>
          <Card size="small" title={<span style={{ fontSize: 12 }}>🔋 各站SOC分布</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            bodyStyle={{ padding: '12px' }}>
            <ReactECharts option={socChartOption} style={{ height: 200 }} />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card size="small" title={<span style={{ fontSize: 12 }}>💰 收益预估</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            bodyStyle={{ padding: '12px' }}>
            {report && (
              <>
                <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
                  {[
                    { label: '日收益', value: `¥${report.summary.daily_revenue_yuan.toFixed(2)}`, color: '#FFB400' },
                    { label: '月预估', value: `¥${(report.summary.monthly_projected_yuan / 1000).toFixed(1)}k`, color: '#00D4AA' },
                    { label: '年化', value: `¥${(report.summary.annual_projected_yuan / 10000).toFixed(1)}万`, color: '#FF9500' },
                  ].map(s => (
                    <Col span={8} key={s.label}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <ReactECharts option={revenueChartOption} style={{ height: 120 }} />
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Station Table + Daily Stats */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={14}>
          <Card size="small" title={<span style={{ fontSize: 12 }}>📋 储能资源详情</span>}
            extra={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{resources.length} 个电站</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            bodyStyle={{ padding: '0 12px 12px' }}>
            <Table
              dataSource={resources}
              columns={resourceColumns}
              rowKey="station_id"
              size="small"
              pagination={false}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card size="small" title={<span style={{ fontSize: 12 }}>📊 日市场报告</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            bodyStyle={{ padding: 12 }}>
            {report && (
              <div>
                <Row gutter={[8, 8]}>
                  {[
                    { label: '放电量', value: `${report.summary.total_discharge_kwh.toFixed(0)} kWh`, color: '#FF4D4F' },
                    { label: '充电量', value: `${report.summary.total_charge_kwh.toFixed(0)} kWh`, color: '#38A169' },
                    { label: '净能量', value: `${(report.summary.total_discharge_kwh - report.summary.total_charge_kwh).toFixed(0)} kWh`, color: '#667EEA' },
                    { label: '削峰事件', value: `${report.summary.peak_shaving_events} 次`, color: '#FFB400' },
                    { label: '响应率', value: `${report.summary.response_rate_pct}%`, color: '#00D4AA' },
                    { label: '参与时段', value: `20h`, color: '#FF9500' },
                  ].map(s => (
                    <Col xs={12} key={s.label}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>

                <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.06)' }} />

                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>📡 IEC 104 协议类型</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(report.iec104_types_used || {}).map(([type]) => (
                    <Tag key={type} style={{ fontSize: 10, background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', color: '#667EEA' }}>
                      {type}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
