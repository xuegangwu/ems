/**
 * VPP Trading — 虚拟电厂资源管理与调度界面
 * Real VPP resource registry, BMS dispatch, market status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, InputNumber,
  Slider, Tag, message, Badge, Space, Divider, Spin, Select
} from 'antd';
import {
  ReloadOutlined, DeleteOutlined, ThunderboltOutlined,
  PlusOutlined, StopOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';

interface VPPResource {
  station_id: string;
  name: string;
  type: string;
  capacity_kwh: number;
  max_power_kw: number;
  current_soc: number;
  status: string;
  dispatchable: boolean;
  bms_host: string;
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

interface DispatchStation {
  station_id: string;
  name: string;
  current_soc: number;
  last_command: string | null;
  last_result: string | null;
  dispatchable: boolean;
}

interface DispatchStatus {
  current_signal: string;
  target_mw: number;
  market_status: string;
  is_vpp_enabled: boolean;
  stations: DispatchStation[];
}

function useInterval(callback: () => void, ms: number) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (ms <= 0) return;
    const id = setInterval(() => savedCallback.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export default function VPPTrading() {
  const [market, setMarket] = useState<MarketStatus | null>(null);
  const [resources, setResources] = useState<VPPResource[]>([]);
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [dispatchPower, setDispatchPower] = useState<Record<string, number>>({});
  const [form] = Form.useForm();

  const loadAll = useCallback(async () => {
    try {
      const [m, r, d, rp] = await Promise.all([
        fetch('/api/vpp/market/status').then(j => j.json()),
        fetch('/api/vpp/resources').then(j => j.json()),
        fetch('/api/vpp/dispatch/status').then(j => j.json()),
        fetch('/api/vpp/report/daily').then(j => j.json()),
      ]);
      if (m.success) setMarket(m);
      if (r.success) {
        setResources(r.resources || []);
        // Initialize power sliders
        const powerMap: Record<string, number> = {};
        (r.resources || []).forEach((res: VPPResource) => {
          powerMap[res.station_id] = res.max_power_kw;
        });
        setDispatchPower(prev => ({ ...prev, ...powerMap }));
      }
      if (d.success) setDispatchStatus(d);
      if (rp.success) setReport(rp);
    } catch (e) {
      console.error('[VPP] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useInterval(loadAll, 5000);

  const handleDispatch = async (stationId: string, command: string) => {
    setDispatching(stationId + command);
    try {
      const power = dispatchPower[stationId] || 0;
      const res = await fetch('/api/vpp/dispatch/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_id: stationId, command, power_kw: power }),
      }).then(j => j.json());
      if (res.success) {
        message.success({ content: `${command} 指令已下发 → ${stationId}`, duration: 2 });
        setTimeout(loadAll, 1000);
      } else {
        message.error({ content: res.error || '下发失败', duration: 3 });
      }
    } catch {
      message.error('网络错误');
    } finally {
      setDispatching(null);
    }
  };

  const handleRegister = async (values: any) => {
    try {
      const res = await fetch('/api/vpp/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      }).then(j => j.json());
      if (res.success) {
        message.success('资源注册成功');
        setRegisterVisible(false);
        form.resetFields();
        loadAll();
      } else {
        message.error(res.error || '注册失败');
      }
    } catch {
      message.error('网络错误');
    }
  };

  const handleUnregister = async (stationId: string) => {
    try {
      const res = await fetch(`/api/vpp/resources/${encodeURIComponent(stationId)}`, {
        method: 'DELETE',
      }).then(j => j.json());
      if (res.success) {
        message.success('已注销');
        loadAll();
      } else {
        message.error(res.error || '注销失败');
      }
    } catch {
      message.error('网络错误');
    }
  };

  const resourceColumns = [
    { title: '电站', dataIndex: 'station_id', key: 'station_id', width: 130, render: (id: string) => <Tag style={{ fontSize: 11 }}>{id}</Tag> },
    { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
    {
      title: 'SOC', dataIndex: 'current_soc', key: 'current_soc', width: 80,
      render: (soc: number) => {
        const color = soc > 70 ? '#00D4AA' : soc > 40 ? '#FFB400' : '#FF4D4F';
        return <span style={{ color, fontWeight: 600 }}>{soc}%</span>;
      }
    },
    { title: '容量(kWh)', dataIndex: 'capacity_kwh', key: 'capacity_kwh', width: 100 },
    { title: '最大功率(kW)', dataIndex: 'max_power_kw', key: 'max_power_kw', width: 110 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => <Badge status={s === 'online' ? 'success' : 'error'} text={<span style={{ fontSize: 11 }}>{s === 'online' ? '在线' : '离线'}</span>} />
    },
    {
      title: '最近指令', dataIndex: 'last_command', key: 'last_command', width: 90,
      render: (cmd: string | null) => {
        if (!cmd) return <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>;
        const color = cmd === 'STOP' ? '#667EEA' : cmd === 'CHARGE' ? '#00D4AA' : '#FF9500';
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
    {
      title: '操作', key: 'action', width: 70,
      render: (_: unknown, r: VPPResource) =>
        r.dispatchable
          ? <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleUnregister(r.station_id)}>注销</Button>
          : null,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.4)' }}>加载VPP数据...</div>
      </div>
    );
  }

  const statusColor = (s: string) =>
    s === 'responding' ? '#00D4AA' : s === 'bidding' ? '#FF9500' : '#667EEA';
  const signalColor = (s: string) =>
    s === 'DISCHARGE' ? '#FF4D4F' : s === 'CHARGE' ? '#00D4AA' : '#667EEA';
  const signalIcon = (s: string) =>
    s === 'DISCHARGE' ? '⚡' : s === 'CHARGE' ? '🔋' : '⏸';

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>⚡ VPP 虚拟电厂</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            虚拟电厂 · 储能资源注册 · BMS调度控制 · IEC 104协议
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadAll} style={{ background: 'rgba(102,126,234,0.12)', color: '#667EEA', border: '1px solid rgba(102,126,234,0.2)' }}>
            刷新
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setRegisterVisible(true)} style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)' }}>
            注册储能
          </Button>
        </Space>
      </div>

      {/* Market Status Row */}
      {market && (
        <Row gutter={[10, 10]} style={{ marginBottom: 14 }}>
          {[
            { label: '市场状态', value: market.market_status === 'responding' ? '⚡ 响应中' : market.market_status === 'bidding' ? '📊 申报中' : '✓ 待机', color: statusColor(market.market_status) },
            { label: 'AGC信号', value: `${signalIcon(market.dispatch_signal)} ${market.dispatch_signal}`, color: signalColor(market.dispatch_signal) },
            { label: '目标功率', value: `${(market.target_mw * 1000).toFixed(0)} kW`, color: '#FFD700' },
            { label: 'VPP总SOC', value: `${market.soc_pct}%`, color: '#667EEA' },
            { label: '当前电价', value: `¥${market.current_price.toFixed(3)}/kWh`, color: '#FF9500' },
            { label: '签约容量', value: `${market.signed_capacity_kw} kW`, color: '#38A169' },
            { label: '调度成功率', value: `${market.dispatch_success_rate}%`, color: '#00D4AA' },
            { label: 'VPP启用', value: market.is_vpp_enabled ? '是' : '否', color: market.is_vpp_enabled ? '#00D4AA' : '#FF4D4F' },
          ].map(s => (
            <Col xs={12} sm={8} md={6} lg={3} key={s.label}>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}22`, textAlign: 'center' }} bodyStyle={{ padding: '10px 6px' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Resource Registry + Dispatch Control */}
      <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
        {/* Left: Resource Table */}
        <Col xs={24} lg={14}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}>📋 储能资源注册表</span>}
            extra={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{resources.length} 个资源</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            bodyStyle={{ padding: '0 12px 12px' }}
          >
            <Table
              dataSource={resources}
              columns={resourceColumns}
              rowKey="station_id"
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
              style={{ background: 'transparent' }}
            />
          </Card>
        </Col>

        {/* Right: Dispatch Control */}
        <Col xs={24} lg={10}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}>🎯 BMS调度控制台</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            bodyStyle={{ padding: '12px' }}
          >
            {dispatchStatus && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <Tag icon={<ThunderboltOutlined />} color={signalColor(dispatchStatus.current_signal)} style={{ fontSize: 12 }}>
                    {dispatchStatus.current_signal} · {(dispatchStatus.target_mw * 1000).toFixed(0)}kW
                  </Tag>
                  <Tag color={dispatchStatus.market_status === 'idle' ? 'default' : 'processing'} style={{ fontSize: 11 }}>
                    市场: {dispatchStatus.market_status}
                  </Tag>
                  <Tag color={dispatchStatus.is_vpp_enabled ? 'green' : 'red'} style={{ fontSize: 11 }}>
                    VPP {dispatchStatus.is_vpp_enabled ? '在线' : '离线'}
                  </Tag>
                </div>

                <Divider style={{ margin: '10px 0', borderColor: 'rgba(255,255,255,0.06)' }} />

                {dispatchStatus.stations.map(station => (
                  <div key={station.station_id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{station.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>SOC {station.current_soc}%</span>
                      </div>
                      {station.last_command && (
                        <Tag style={{ fontSize: 10 }} color={station.last_result === 'OK' ? 'green' : 'red'}>
                          {station.last_command} {station.last_result === 'OK' ? '✓' : '✗'}
                        </Tag>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Slider
                        min={0}
                        max={resources.find(r => r.station_id === station.station_id)?.max_power_kw || 1200}
                        value={dispatchPower[station.station_id] || 0}
                        onChange={v => setDispatchPower(prev => ({ ...prev, [station.station_id]: v }))}
                        style={{ flex: 1, marginBottom: 0 }}
                        disabled={dispatching?.startsWith(station.station_id) || !station.dispatchable}
                      />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', minWidth: 40 }}>
                        {dispatchPower[station.station_id] || 0}kW
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        onClick={() => handleDispatch(station.station_id, 'CHARGE')}
                        loading={dispatching === station.station_id + 'CHARGE'}
                        disabled={!station.dispatchable || dispatching !== null}
                        style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)', fontSize: 11 }}
                      >
                        充电
                      </Button>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        onClick={() => handleDispatch(station.station_id, 'DISCHARGE')}
                        loading={dispatching === station.station_id + 'DISCHARGE'}
                        disabled={!station.dispatchable || dispatching !== null}
                        style={{ background: 'rgba(255,77,79,0.1)', color: '#FF4D4F', border: '1px solid rgba(255,77,79,0.2)', fontSize: 11 }}
                      >
                        放电
                      </Button>
                      <Button
                        size="small"
                        icon={<StopOutlined />}
                        onClick={() => handleDispatch(station.station_id, 'STOP')}
                        loading={dispatching === station.station_id + 'STOP'}
                        disabled={!station.dispatchable || dispatching !== null}
                        style={{ background: 'rgba(102,126,234,0.1)', color: '#667EEA', border: '1px solid rgba(102,126,234,0.2)', fontSize: 11 }}
                      >
                        停止
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Daily Report */}
      {report && report.summary && (
        <Row gutter={[10, 10]}>
          <Col span={24}>
            <Card
              size="small"
              title={<span style={{ fontSize: 13 }}>📊 日市场报告 — {report.summary.agreed_capacity_kw} kW签约容量</span>}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              <Row gutter={[10, 10]}>
                {[
                  { label: '日收益', value: `¥${report.summary.daily_revenue_yuan.toFixed(2)}`, color: '#FFD700' },
                  { label: '月度预估', value: `¥${(report.summary.monthly_projected_yuan / 1000).toFixed(1)}k`, color: '#00D4AA' },
                  { label: '年化预估', value: `¥${(report.summary.annual_projected_yuan / 10000).toFixed(1)}万`, color: '#FF9500' },
                  { label: '放电量', value: `${report.summary.total_discharge_kwh.toFixed(0)} kWh`, color: '#FF4D4F' },
                  { label: '充电量', value: `${report.summary.total_charge_kwh.toFixed(0)} kWh`, color: '#38A169' },
                  { label: '削峰事件', value: `${report.summary.peak_shaving_events} 次`, color: '#667EEA' },
                  { label: '响应率', value: `${report.summary.response_rate_pct}%`, color: '#00D4AA' },
                ].map(s => (
                  <Col xs={12} sm={8} md={4} lg={3} key={s.label}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.06)' }} />

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(report.iec104_types_used || {}).map(([type, desc]) => (
                  <Tag key={type} style={{ fontSize: 11, background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', color: '#667EEA' }}>
                    {type} → {desc}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Register Modal */}
      <Modal
        title="注册储能资源"
        open={registerVisible}
        onCancel={() => { setRegisterVisible(false); form.resetFields(); }}
        footer={null}
        bodyStyle={{ background: '#0A0E1A' }}
      >
        <Form form={form} layout="vertical" onFinish={handleRegister}>
          <Form.Item name="station_id" label="Station ID" rules={[{ required: true }]}>
            <Select placeholder="选择电站">
              {['station-001', 'station-002', 'station-003'].map(id => (
                <Select.Option key={id} value={id}>{id}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Select placeholder="选择名称">
              {[
                { id: 'station-001', name: '苏州工业园储能' },
                { id: 'station-002', name: '杭州未来科技城储能' },
                { id: 'station-003', name: '南京江北新区储能' },
              ].map(s => (
                <Select.Option key={s.id} value={s.name}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="bms_host" label="BMS Host" rules={[{ required: true }]}>
            <Select placeholder="选择BMS地址">
              {[
                { id: 'station-001', host: '192.168.1.101' },
                { id: 'station-002', host: '192.168.1.102' },
                { id: 'station-003', host: '192.168.1.103' },
              ].map(s => (
                <Select.Option key={s.id} value={s.host}>{s.host}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="capacity_kwh" label="容量(kWh)" rules={[{ required: true }]}>
            <InputNumber min={100} step={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="max_power_kw" label="最大功率(kW)" rules={[{ required: true }]}>
            <InputNumber min={50} step={50} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ background: '#00D4AA', borderColor: '#00D4AA' }}>
            注册
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
