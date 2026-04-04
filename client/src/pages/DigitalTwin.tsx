import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Select, Tag, Statistic, Space, Table, Badge, Spin } from 'antd';
import type { PowerStation } from '@/types';


export interface IoTDevice {
  id: string; name: string;
  type: 'meter' | 'inverter' | 'battery_bms' | 'sensor' | 'gateway' | 'ev_charger';
  status: 'online' | 'offline' | 'warning' | 'charging' | 'idle';
  value: number; unit: string; lastUpdate: string;
}
interface VPPStatus {
  totalCapacity: number; bessCapacity: number; evCapacity: number; loadCapacity: number;
  marketStatus: 'idle' | 'responding' | 'bidding'; currentPrice: number;
  responseWindow: string; signedCapacity: number; monthlyRevenue: number; isVPPEnabled: boolean;
}
export interface StationDigitalTwin {
  station: PowerStation; devices: IoTDevice[];
  realTime: { generation: number; consumption: number; storage: number; storageSoc: number; gridExport: number; gridImport: number; efficiency: number; temperature: number; evCharging: number; };
  vpp?: VPPStatus;
}

const mockTwinData: Record<string, StationDigitalTwin> = {
  'station-001': {
    station: { id: 'station-001', name: '苏州工业园光储充一体化', type: 'solar_storage', capacity: 5000, installedCapacity: 4800, peakPower: 4200, location: '江苏省苏州市', status: 'online', gridConnectionDate: '2022-06-15', owner: '苏州新能源有限公司', contact: '张经理' },
    devices: [
      { id: 'd-001', name: '光伏逆变器#1', type: 'inverter', status: 'online', value: 2156, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-002', name: '光伏逆变器#2', type: 'inverter', status: 'online', value: 1876, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-003', name: 'BMS储能系统', type: 'battery_bms', status: 'online', value: 78, unit: '%', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-004', name: '并网电表', type: 'meter', status: 'online', value: 4032, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-005', name: '充电桩#1', type: 'ev_charger', status: 'charging', value: 60, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-006', name: '充电桩#2', type: 'ev_charger', status: 'idle', value: 0, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-007', name: '辐照传感器', type: 'sensor', status: 'online', value: 892, unit: 'W/m²', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-008', name: '环境监测站', type: 'sensor', status: 'online', value: 28.5, unit: '°C', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
    ],
    realTime: { generation: 4032, consumption: 2800, storage: 3840, storageSoc: 78, gridExport: 1232, gridImport: 0, efficiency: 94.2, temperature: 28.5, evCharging: 60 },
    vpp: { totalCapacity: 1280, bessCapacity: 800, evCapacity: 380, loadCapacity: 100, marketStatus: 'idle', currentPrice: 0.85, responseWindow: '14:00-16:00', signedCapacity: 500, monthlyRevenue: 12800, isVPPEnabled: true },
  },
  'station-002': {
    station: { id: 'station-002', name: '无锡储能电站', type: 'storage', capacity: 2000, installedCapacity: 1800, peakPower: 1600, location: '江苏省无锡市', status: 'online', gridConnectionDate: '2023-01-20', owner: '无锡储能科技', contact: '李经理' },
    devices: [
      { id: 'd-101', name: 'BMS#1', type: 'battery_bms', status: 'online', value: 72, unit: '%', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-102', name: 'BMS#2', type: 'battery_bms', status: 'online', value: 68, unit: '%', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-103', name: 'PCS变流器', type: 'inverter', status: 'online', value: -850, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-104', name: '并网电表', type: 'meter', status: 'online', value: 850, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-105', name: '功率传感器', type: 'sensor', status: 'warning', value: 850, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
    ],
    realTime: { generation: 0, consumption: 850, storage: 1440, storageSoc: 70, gridExport: 0, gridImport: 850, efficiency: 91.5, temperature: 35.2, evCharging: 0 },
    vpp: { totalCapacity: 720, bessCapacity: 600, evCapacity: 0, loadCapacity: 120, marketStatus: 'responding', currentPrice: 1.12, responseWindow: '10:00-12:00', signedCapacity: 400, monthlyRevenue: 8500, isVPPEnabled: true },
  },
  'station-003': {
    station: { id: 'station-003', name: '杭州光储一体化电站', type: 'solar_storage', capacity: 8000, installedCapacity: 7500, peakPower: 6800, location: '浙江省杭州市', status: 'online', gridConnectionDate: '2022-09-01', owner: '杭州光储', contact: '王经理' },
    devices: [
      { id: 'd-201', name: '光伏逆变器#1', type: 'inverter', status: 'online', value: 3200, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-202', name: '光伏逆变器#2', type: 'inverter', status: 'online', value: 2800, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-203', name: '储能PCS', type: 'inverter', status: 'online', value: -1200, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-204', name: '储能BMS', type: 'battery_bms', status: 'online', value: 75, unit: '%', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-205', name: '并网总表', type: 'meter', status: 'online', value: 4800, unit: 'kW', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-206', name: '辐照传感器', type: 'sensor', status: 'online', value: 945, unit: 'W/m²', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
      { id: 'd-207', name: '环境监测站', type: 'sensor', status: 'online', value: 26.8, unit: '°C', lastUpdate: new Date().toLocaleTimeString('zh-CN') },
    ],
    realTime: { generation: 6000, consumption: 1200, storage: 4800, storageSoc: 75, gridExport: 3600, gridImport: 0, efficiency: 93.8, temperature: 26.8, evCharging: 0 },
    vpp: { totalCapacity: 2000, bessCapacity: 1500, evCapacity: 300, loadCapacity: 200, marketStatus: 'bidding', currentPrice: 0.92, responseWindow: '15:00-17:00', signedCapacity: 800, monthlyRevenue: 22000, isVPPEnabled: true },
  },
};

const deviceTypeMap: Record<string, { color: string; label: string; icon: string }> = {
  meter: { color: '#0066FF', label: '电表', icon: '⚡' },
  inverter: { color: '#FF9500', label: '逆变器', icon: '🔄' },
  battery_bms: { color: '#00D4AA', label: 'BMS', icon: '🔋' },
  sensor: { color: '#9B59B6', label: '传感器', icon: '📡' },
  gateway: { color: '#666666', label: '网关', icon: '📶' },
  ev_charger: { color: '#38A169', label: '充电桩', icon: '🚗' },
};
const deviceStatusMap = { online: '在线', offline: '离线', warning: '告警', charging: '充电中', idle: '待机' };
const deviceColumns = [
  { title: '设备', dataIndex: 'name', key: 'name', render: (n: string, r: IoTDevice) => <Space><span>{deviceTypeMap[r.type]?.icon}</span>{n}</Space> },
  { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={deviceTypeMap[t]?.color}>{deviceTypeMap[t]?.label}</Tag> },
  { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={s === 'online' || s === 'charging' ? 'success' : s === 'warning' ? 'warning' : 'default'} text={deviceStatusMap[s as keyof typeof deviceStatusMap] || s} /> },
  { title: '当前值', dataIndex: 'value', key: 'value', render: (v: number, r: IoTDevice) => <span style={{ fontWeight: 600 }}>{v} {r.unit}</span> },
  { title: '更新时间', dataIndex: 'lastUpdate', key: 'lastUpdate', render: (t: string) => <span style={{ color: '#888', fontSize: 12 }}>{t}</span> },
];


// ─── Energy Flow CSS Animation Diagram ─────────────────────────────────────────────────────────
function EnergyFlowDiagram({ twin }: { twin: StationDigitalTwin }) {
  const { station, realTime } = twin;
  const isSolar = station.type === 'solar' || station.type === 'solar_storage';
  const hasStorage = station.type === 'storage' || station.type === 'solar_storage';
  const hasEV = twin.devices.some(d => d.type === 'ev_charger');
  const netExport = realTime.generation - realTime.consumption - realTime.evCharging;

  const nodes = [
    { id: 'solar', x: 90, y: 120, show: isSolar, icon: '☀️', label: '光伏阵列', value: `${realTime.generation.toFixed(0)} kW`, color: '#FFD700' },
    { id: 'inverter', x: 280, y: 120, show: true, icon: '🔄', label: '双向逆变器', value: `${realTime.generation.toFixed(0)} kW`, color: '#FF9500' },
    { id: 'battery', x: 280, y: 280, show: hasStorage, icon: '🔋', label: '储能电池', value: `${realTime.storageSoc.toFixed(0)}% | ${Math.abs(netExport * 0.5).toFixed(0)}kW`, color: '#00D4AA' },
    { id: 'ev', x: 480, y: 280, show: hasEV, icon: '🚗', label: '充电桩', value: `${realTime.evCharging.toFixed(0)} kW`, color: '#38A169' },
    { id: 'meter', x: 480, y: 120, show: true, icon: '⚡', label: '并网关口', value: netExport >= 0 ? `送出 ${netExport.toFixed(0)}kW` : `受电 ${Math.abs(netExport).toFixed(0)}kW`, color: '#0066FF' },
    { id: 'load', x: 660, y: 120, show: true, icon: '🏭', label: '负载消耗', value: `${realTime.consumption.toFixed(0)} kW`, color: '#9B59B6' },
  ].filter(n => n.show);

  const connections: { x1: number; y1: number; x2: number; y2: number; color: string; dur: number }[] = [];
  const flowDefs = [
    { from: 'solar', to: 'inverter', color: '#FFD700', show: isSolar && realTime.generation > 0 },
    { from: 'inverter', to: 'meter', color: '#FF9500', show: true },
    { from: 'meter', to: 'load', color: '#9B59B6', show: true },
    { from: 'meter', to: 'ev', color: '#38A169', show: hasEV && realTime.evCharging > 0 },
    { from: 'meter', to: 'grid', color: '#27AE60', show: netExport > 0 },
  ].filter(f => f.show);
  flowDefs.forEach((f, i) => {
    const fn = nodes.find(n => n.id === f.from);
    const tn = nodes.find(n => n.id === f.to);
    if (fn && tn) connections.push({ x1: fn.x + 50, y1: fn.y, x2: tn.x - 50, y2: tn.y, color: f.color, dur: 1.2 + i * 0.3 });
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: 420, background: '#0f1629', borderRadius: 12, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 780 420" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <style>{`
            @keyframes flowRight { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
            @keyframes flowPulse { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.2; } }
            .ef-line { stroke-dasharray: 6 6; animation: flowRight linear infinite; transform-origin: center; }
            .ef-glow { animation: flowPulse 2s ease-in-out infinite; }
          `}</style>
          <pattern id="efgrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#efgrid)" />
        {connections.map((c, i) => (
          <g key={i}>
            <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={c.color} strokeWidth={5} opacity={0.1} className="ef-glow" />
            <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={c.color} strokeWidth={2.5} opacity={0.55} className="ef-line" style={{ animationDuration: `${c.dur}s` }} />
          </g>
        ))}
        {nodes.map(node => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle r="50" fill={node.color} opacity={0.07} />
            <circle r="42" fill="rgba(10,15,30,0.92)" stroke={node.color} strokeWidth={2} opacity={0.95} />
            <text x="0" y="6" textAnchor="middle" fontSize="26">{node.icon}</text>
            <text x="0" y="-52" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="12" fontWeight="600">{node.label}</text>
            <text x="0" y="75" textAnchor="middle" fill={node.color} fontSize="11" fontWeight="700">{node.value}</text>
          </g>
        ))}
      </svg>
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '6px 12px', display: 'flex', gap: 16, fontSize: 11 }}>
        <span style={{ color: '#FFD700' }}>☀️ {realTime.generation.toFixed(0)}kW</span>
        <span style={{ color: '#9B59B6' }}>🏭 {realTime.consumption.toFixed(0)}kW</span>
        <span style={{ color: '#00D4AA' }}>🔋 {realTime.storageSoc.toFixed(0)}%</span>
        <span style={{ color: netExport >= 0 ? '#27AE60' : '#E53E3E' }}>⚡ {netExport >= 0 ? '送出' : '受电'} {Math.abs(netExport).toFixed(0)}kW</span>
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'white' }}>
        {station.type === 'solar' ? '☀️ 纯光伏' : station.type === 'storage' ? '🔋 储能' : '☀️🔋 充储一体'}
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 14, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
        <span>━ 光伏</span><span>━ 负载</span><span>━ 充电</span>
        <span style={{ color: '#00D4AA' }}>━━ CSS动画流</span>
      </div>
    </div>
  );
}


// ─── VPP Panel ────────────────────────────────────────────────────────────────────────────────
function VVPPStatusPanel({ vpp }: { vpp: NonNullable<VPPStatus> }) {
  const [dispatchActive, setDispatchActive] = useState(false);
  const [dispatchData, setDispatchData] = useState<any[]>([]);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const loadDispatch = useCallback(async () => {
    if (dispatchData.length > 0) return;
    setDispatchLoading(true);
    try {
      const res = await fetch('/api/predict/dispatch');
      const json = await res.json();
      if (json.success) setDispatchData(json.data ?? []);
    } catch (_) {}
    setDispatchLoading(false);
  }, [dispatchData.length]);

  const loadMarket = useCallback(async () => {
    if (marketData) return;
    setMarketLoading(true);
    try {
      const [statusRes, bidRes] = await Promise.all([
        fetch('/api/vpp/market/status'),
        fetch('/api/vpp/report/daily'),
      ]);
      const status = await statusRes.json();
      const report = await bidRes.json();
      setMarketData({ status, report });
    } catch (_) {}
    setMarketLoading(false);
  }, [marketData]);

  const tabItems = [
    {
      key: 'vpp-status',
      label: <><span>🏭</span> VPP状态</>,
      children: (
        <>
          <Row gutter={[12, 12]}>
            <Col xs={12} lg={6}><div style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>⚡ 总可调容量</div><div style={{ fontSize: 26, fontWeight: 700, color: '#FFB400' }}>{vpp.totalCapacity.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 400 }}>kW</span></div></div></Col>
            <Col xs={12} lg={6}><div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>💰 本月收益</div><div style={{ fontSize: 26, fontWeight: 700, color: '#00D4AA' }}>¥{vpp.monthlyRevenue.toLocaleString()}</div></div></Col>
            <Col xs={12} lg={6}><div style={{ background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>📊 当前电价</div><div style={{ fontSize: 26, fontWeight: 700, color: '#667EEA' }}>¥{vpp.currentPrice.toFixed(2)}<span style={{ fontSize: 13, fontWeight: 400 }}>/kWh</span></div></div></Col>
            <Col xs={12} lg={6}><div style={{ background: 'rgba(255,77,79,0.06)', border: '1px solid rgba(255,77,79,0.15)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>📝 已签约容量</div><div style={{ fontSize: 26, fontWeight: 700, color: '#FF4D4F' }}>{vpp.signedCapacity.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400 }}> kW</span></div></div></Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>📊 可调资源构成</div>
            <Row gutter={[8, 8]}>
              <Col xs={8}><div style={{ background: 'rgba(0,212,170,0.08)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>🔋 储能</div><div style={{ fontSize: 18, fontWeight: 700, color: '#00D4AA' }}>{vpp.bessCapacity}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>kW · {((vpp.bessCapacity / vpp.totalCapacity) * 100).toFixed(0)}%</div></div></Col>
              <Col xs={8}><div style={{ background: 'rgba(56,161,105,0.08)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>🚗 充电桩</div><div style={{ fontSize: 18, fontWeight: 700, color: '#38A169' }}>{vpp.evCapacity}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>kW · {vpp.totalCapacity > 0 ? ((vpp.evCapacity / vpp.totalCapacity) * 100).toFixed(0) : 0}%</div></div></Col>
              <Col xs={8}><div style={{ background: 'rgba(155,89,182,0.08)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>🏭 可中断负荷</div><div style={{ fontSize: 18, fontWeight: 700, color: '#9B59B6' }}>{vpp.loadCapacity}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>kW · {vpp.totalCapacity > 0 ? ((vpp.loadCapacity / vpp.totalCapacity) * 100).toFixed(0) : 0}%</div></div></Col>
            </Row>
          </div>
          {vpp.marketStatus !== 'idle' && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: vpp.marketStatus === 'responding' ? 'rgba(56,161,105,0.1)' : 'rgba(255,149,0,0.1)', border: `1px solid ${vpp.marketStatus === 'responding' ? '#38A169' : '#FF9500'}30`, borderRadius: 8 }}>
              <Space><span style={{ fontSize: 14 }}>{vpp.marketStatus === 'responding' ? '⚡' : '📊'}</span><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{vpp.marketStatus === 'responding' ? '当前响应时段' : '申报进行中'}：{vpp.responseWindow}</span></Space>
            </div>
          )}
        </>
      ),
    },
    {
      key: 'vpp-market',
      label: <><span>📊</span> 市场</>,
      children: (
        <div style={{ padding: '8px 0' }}>
          {marketLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
          ) : marketData ? (
            <>
              <Row gutter={[10, 10]}>
                {[
                  { label: '市场状态', value: marketData.status.market_status === 'responding' ? '⚡ 响应中' : marketData.status.market_status === 'bidding' ? '📊 申报中' : '✓ 待机', color: marketData.status.market_status === 'responding' ? '#00D4AA' : marketData.status.market_status === 'bidding' ? '#FF9500' : '#667EEA' },
                  { label: 'AGC信号', value: marketData.status.dispatch_signal === 'DISCHARGE' ? '⚡ 放电' : marketData.status.dispatch_signal === 'CHARGE' ? '🔋 充电' : '⏸ 待机', color: marketData.status.dispatch_signal === 'DISCHARGE' ? '#FF4D4F' : marketData.status.dispatch_signal === 'CHARGE' ? '#00D4AA' : '#667EEA' },
                  { label: '目标功率', value: `${(marketData.status.target_mw * 1000).toFixed(0)} kW`, color: '#FFD700' },
                  { label: '当前SOC', value: `${marketData.status.soc_pct}%`, color: '#667EEA' },
                  { label: '签约容量', value: `${marketData.status.signed_capacity_kw} kW`, color: '#38A169' },
                  { label: '响应电价', value: `¥${marketData.status.current_price.toFixed(3)}/kWh`, color: '#FF9500' },
                ].map(s => (
                  <Col xs={12} sm={8} md={4} key={s.label}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              {marketData.report?.summary && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>📈 日市场报告</div>
                  <Row gutter={[8, 8]}>
                    {[
                      { label: '日收益', value: `¥${marketData.report.summary.daily_revenue_yuan.toFixed(0)}`, color: '#FFD700' },
                      { label: '月度预估', value: `¥${(marketData.report.summary.daily_revenue_yuan * 30).toFixed(0)}`, color: '#00D4AA' },
                      { label: '年化收益', value: `¥${(marketData.report.summary.daily_revenue_yuan * 365).toFixed(0)}`, color: '#FF9500' },
                      { label: '放电量', value: `${marketData.report.summary.total_discharge_kwh.toFixed(0)} kWh`, color: '#FF4D4F' },
                      { label: '响应率', value: `${marketData.report.summary.response_rate_pct}%`, color: '#667EEA' },
                      { label: 'AGC类型', value: marketData.status.asdu_type || 'C_SE_TF_1 (49)', color: '#9B59B6' },
                    ].map(s => (
                      <Col xs={12} sm={8} md={4} key={s.label}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>加载市场数据...</div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'ai-dispatch',
      label: <><span>🤖</span> AI调度建议</>,
      children: (
        <div style={{ padding: '4px 0' }}>
          {dispatchLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
          ) : (
            <>
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                {[
                  { label: '充电时段', count: dispatchData.filter((d: any) => d.recommendation === 'charge').length, color: '#00D4AA', bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.2)' },
                  { label: '放电时段', count: dispatchData.filter((d: any) => d.recommendation === 'discharge').length, color: '#FF4D4F', bg: 'rgba(255,77,79,0.1)', border: 'rgba(255,77,79,0.2)' },
                  { label: '待机时段', count: dispatchData.filter((d: any) => d.recommendation === 'hold').length, color: '#667EEA', bg: 'rgba(102,126,234,0.1)', border: 'rgba(102,126,234,0.2)' },
                ].map(s => (
                  <Col xs={8} key={s.label}>
                    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}次</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {dispatchData.map((d: any, i: number) => {
                  const rec = d.recommendation;
                  const r = REC_MAP[rec] ?? REC_MAP.hold;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', minWidth: 48 }}>{d.hour}</span>
                      <Tag style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}`, fontSize: 11 }}>{r.text}</Tag>
                      <span style={{ fontSize: 12, color: '#FF9500' }}>¥{d.price?.toFixed(3)}</span>
                      <span style={{ fontSize: 12, color: '#667EEA' }}>{d.load}kW</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flex: 1 }}>{d.reason}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      style={{ marginTop: 16, background: 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,180,0,0.2)' }}
      title={<Space><span style={{ fontSize: 18 }}>🏭</span><span style={{ fontWeight: 600 }}>虚拟电厂 (VPP)</span><Tag color={vpp.marketStatus === 'responding' ? 'green' : vpp.marketStatus === 'bidding' ? 'orange' : 'default'}>{vpp.marketStatus === 'responding' ? '⚡ 响应中' : vpp.marketStatus === 'bidding' ? '📊 申报中' : '✓ 待机'}</Tag></Space>}
      extra={<Tag color={vpp.isVPPEnabled ? 'green' : 'red'}>{vpp.isVPPEnabled ? 'VPP已接入' : 'VPP未接入'}</Tag>}
      tabList={tabItems}
      activeTabKey={dispatchActive ? 'ai-dispatch' : 'vpp-status'}
      onTabChange={(key) => {
        const isAi = key === 'ai-dispatch';
        const isMarket = key === 'vpp-market';
        setDispatchActive(isAi);
        if (isAi) { setDispatchData([]); loadDispatch(); }
        if (isMarket) { setMarketData(null); loadMarket(); }
      }}
      bodyStyle={{ padding: dispatchActive ? 0 : undefined }}
    />
  );
}

const REC_MAP: Record<string, { color: string; bg: string; border: string; text: string }> = {
  charge: { color: '#00D4AA', bg: 'rgba(0,212,170,0.1)', border: 'rgba(0,212,170,0.25)', text: '🔋 充电' },
  discharge: { color: '#FF4D4F', bg: 'rgba(255,77,79,0.1)', border: 'rgba(255,77,79,0.25)', text: '⚡ 放电' },
  hold: { color: '#667EEA', bg: 'rgba(102,126,234,0.1)', border: 'rgba(102,126,234,0.25)', text: '⏸ 待机' },
};

// ─── Main ─────────────────────────────────────────────────────────────────────────────────────
export default function DigitalTwin() {
  const [selected, setSelected] = useState('station-001');
  const [twin, setTwin] = useState<StationDigitalTwin>(mockTwinData['station-001']);

  useEffect(() => {
    setTwin(mockTwinData[selected] || mockTwinData['station-001']);
  }, [selected]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTwin(prev => {
        const newGen = Math.max(0, prev.realTime.generation + (Math.random() - 0.5) * 80);
        const newCons = Math.max(0, prev.realTime.consumption + (Math.random() - 0.5) * 40);
        const newSoc = Math.max(20, Math.min(95, prev.realTime.storageSoc + (Math.random() - 0.5) * 2));
        const newEv = prev.realTime.evCharging > 0 ? Math.max(0, prev.realTime.evCharging + (Math.random() - 0.5) * 10) : (Math.random() > 0.7 ? Math.random() * 80 : 0);
        return {
          ...prev,
          realTime: { ...prev.realTime, generation: newGen, consumption: newCons, storageSoc: newSoc, temperature: Math.max(20, Math.min(45, prev.realTime.temperature + (Math.random() - 0.5) * 1)), evCharging: newEv },
          vpp: prev.vpp ? { ...prev.vpp, totalCapacity: Math.round(newSoc * 12 + newEv * 3), bessCapacity: Math.round(newSoc * 10), evCapacity: Math.round(newEv * 3), currentPrice: Math.max(0.5, Math.min(1.5, prev.vpp.currentPrice + (Math.random() - 0.5) * 0.05)), monthlyRevenue: Math.round(prev.vpp.monthlyRevenue + (Math.random() - 0.5) * 50) } : undefined,
          devices: prev.devices.map(d => ({ ...d, value: d.type === 'sensor' && d.unit === '°C' ? parseFloat((prev.realTime.temperature + (Math.random() - 0.5)).toFixed(1)) : d.type === 'battery_bms' ? parseFloat(newSoc.toFixed(1)) : d.type === 'inverter' ? parseFloat((newGen * (0.4 + Math.random() * 0.2)).toFixed(0)) : d.type === 'ev_charger' ? parseFloat(newEv.toFixed(0)) : d.value, lastUpdate: new Date().toLocaleTimeString('zh-CN') })),
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stationOptions = Object.values(mockTwinData).map(t => ({ value: t.station.id, label: t.station.name }));

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>🪩 数字孪生</h2>
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <Space wrap size="middle">
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>选择电站：</span>
              <Select value={selected} onChange={setSelected} options={stationOptions} style={{ minWidth: 220 }} />
              <Tag color={twin.station.status === 'online' ? 'green' : 'red'}>{twin.station.status === 'online' ? '在线运行' : '离线'}</Tag>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>🟢 实时数据每3秒刷新</span>
            </Space>
          </Card>
        </Col>
        <Col xs={12} lg={4}><Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title={<span style={{ color: 'rgba(255,255,255,0.6)' }}>当前发电</span>} value={twin.realTime.generation} precision={0} suffix="kW" valueStyle={{ color: '#FFD700', fontSize: 18 }} /></Card></Col>
        <Col xs={12} lg={4}><Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title={<span style={{ color: 'rgba(255,255,255,0.6)' }}>负载消耗</span>} value={twin.realTime.consumption} precision={0} suffix="kW" valueStyle={{ color: '#9B59B6', fontSize: 18 }} /></Card></Col>
        <Col xs={12} lg={4}><Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title={<span style={{ color: 'rgba(255,255,255,0.6)' }}>储能SOC</span>} value={twin.realTime.storageSoc} precision={0} suffix="%" valueStyle={{ color: '#00D4AA', fontSize: 18 }} /></Card></Col>
        <Col xs={12} lg={4}><Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title={<span style={{ color: 'rgba(255,255,255,0.6)' }}>充电桩</span>} value={twin.realTime.evCharging} precision={0} suffix="kW" valueStyle={{ color: '#38A169', fontSize: 18 }} /></Card></Col>
        <Col xs={12} lg={4}><Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title={<span style={{ color: 'rgba(255,255,255,0.6)' }}>系统效率</span>} value={twin.realTime.efficiency} precision={0} suffix="%" valueStyle={{ color: '#0066FF', fontSize: 18 }} /></Card></Col>
        <Col xs={12} lg={4}><Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title={<span style={{ color: 'rgba(255,255,255,0.6)' }}>上网/下网</span>} value={twin.realTime.gridExport > 0 ? twin.realTime.gridExport : -twin.realTime.gridImport} precision={0} suffix={twin.realTime.gridExport > 0 ? '上网' : '受电'} valueStyle={{ color: twin.realTime.gridExport > 0 ? '#27AE60' : '#E53E3E', fontSize: 18 }} /></Card></Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
            ⚡ 能量流向图
          </span>
        </div>
        <EnergyFlowDiagram twin={twin} />
      </div>

      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }} title="📡 IoT 设备状态">
        <Row gutter={[12, 12]}>
          {twin.devices.map(device => (
            <Col xs={12} lg={6} key={device.id}>
              <div style={{ background: device.status === 'warning' ? 'rgba(255,149,0,0.1)' : device.status === 'charging' ? 'rgba(56,161,105,0.08)' : 'rgba(0,102,255,0.05)', border: `1px solid ${device.status === 'warning' ? '#FF9500' : device.status === 'charging' ? '#38A169' : 'rgba(0,102,255,0.2)'}`, borderRadius: 8, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Space size="small"><span style={{ fontSize: 16 }}>{deviceTypeMap[device.type]?.icon}</span><span style={{ fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{device.name}</span></Space>
                  <Badge status={device.status === 'online' || device.status === 'charging' ? 'success' : device.status === 'warning' ? 'warning' : 'error'} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: deviceTypeMap[device.type]?.color }}>{device.value} <span style={{ fontSize: 11, fontWeight: 400 }}>{device.unit}</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>更新: {device.lastUpdate}</div>
              </div>
            </Col>
          ))}
        </Row>
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <Table dataSource={twin.devices} columns={deviceColumns} rowKey="id" pagination={false} size="small" scroll={{ x: 700 }} />
        </div>
      </Card>

      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }} title="🏭 电站基本信息">
        <Row gutter={[12, 12]}>
          <Col xs={12} lg={6}><Statistic title="装机容量" value={twin.station.capacity} precision={0} suffix="kW" valueStyle={{ fontSize: 18 }} /></Col>
          <Col xs={12} lg={6}><Statistic title="当前功率" value={twin.station.peakPower} precision={0} suffix="kW" valueStyle={{ color: '#FF9500', fontSize: 18 }} /></Col>
          <Col xs={12} lg={6}><Statistic title="并网日期" value={twin.station.gridConnectionDate} valueStyle={{ fontSize: 18 }} /></Col>
          <Col xs={12} lg={6}><Statistic title="运营方" value={twin.station.owner} valueStyle={{ fontSize: 18 }} /></Col>
        </Row>
      </Card>

      {twin.vpp && <VVPPStatusPanel vpp={twin.vpp} />}
    </div>
  );
}
