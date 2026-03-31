import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Tag, Statistic, Space, Table, Badge, Progress } from 'antd';
import ReactECharts from 'echarts-for-react';
import type { PowerStation } from '@/types';

interface IoTDevice {
  id: string;
  name: string;
  type: 'meter' | 'inverter' | 'battery_bms' | 'sensor' | 'gateway';
  status: 'online' | 'offline' | 'warning';
  value: number;
  unit: string;
  lastUpdate: string;
}

interface StationDigitalTwin {
  station: PowerStation;
  devices: IoTDevice[];
  realTime: {
    generation: number;
    consumption: number;
    storage: number;
    gridExport: number;
    gridImport: number;
    efficiency: number;
    temperature: number;
  };
}

// Mock station data with digital twin info
const mockTwinData: Record<string, StationDigitalTwin> = {
  'station-001': {
    station: { id: 'station-001', name: '苏州工业园光伏电站', type: 'solar', capacity: 5000, installedCapacity: 4800, peakPower: 4200, location: '江苏省苏州市', status: 'online', gridConnectionDate: '2022-06-15', owner: '苏州新能源有限公司', contact: '张经理' },
    devices: [
      { id: 'd-001', name: '逆变器#1', type: 'inverter', status: 'online', value: 2156, unit: 'kW', lastUpdate: '2026-03-31 12:20:01' },
      { id: 'd-002', name: '逆变器#2', type: 'inverter', status: 'online', value: 1876, unit: 'kW', lastUpdate: '2026-03-31 12:20:03' },
      { id: 'd-003', name: '并网电表', type: 'meter', status: 'online', value: 4032, unit: 'kW', lastUpdate: '2026-03-31 12:20:00' },
      { id: 'd-004', name: '辐照传感器', type: 'sensor', status: 'online', value: 892, unit: 'W/m²', lastUpdate: '2026-03-31 12:20:02' },
      { id: 'd-005', name: '温度传感器', type: 'sensor', status: 'online', value: 28.5, unit: '°C', lastUpdate: '2026-03-31 12:20:01' },
      { id: 'd-006', name: '通讯网关', type: 'gateway', status: 'online', value: 1, unit: '', lastUpdate: '2026-03-31 12:20:00' },
    ],
    realTime: { generation: 4032, consumption: 2800, storage: 0, gridExport: 1232, gridImport: 0, efficiency: 94.2, temperature: 28.5 },
  },
  'station-002': {
    station: { id: 'station-002', name: '无锡储能电站', type: 'storage', capacity: 2000, installedCapacity: 1800, peakPower: 1600, location: '江苏省无锡市', status: 'online', gridConnectionDate: '2023-01-20', owner: '无锡储能科技', contact: '李经理' },
    devices: [
      { id: 'd-101', name: 'BMS#1', type: 'battery_bms', status: 'online', value: 72, unit: '%', lastUpdate: '2026-03-31 12:20:00' },
      { id: 'd-102', name: 'BMS#2', type: 'battery_bms', status: 'online', value: 68, unit: '%', lastUpdate: '2026-03-31 12:20:01' },
      { id: 'd-103', name: 'PCS#1', type: 'inverter', status: 'online', value: -850, unit: 'kW', lastUpdate: '2026-03-31 12:20:02' },
      { id: 'd-104', name: '并网电表', type: 'meter', status: 'online', value: 850, unit: 'kW', lastUpdate: '2026-03-31 12:20:00' },
      { id: 'd-105', name: '功率传感器', type: 'sensor', status: 'warning', value: 850, unit: 'kW', lastUpdate: '2026-03-31 12:20:03' },
    ],
    realTime: { generation: 0, consumption: 850, storage: 1440, gridExport: 0, gridImport: 850, efficiency: 91.5, temperature: 35.2 },
  },
  'station-003': {
    station: { id: 'station-003', name: '杭州光储一体化电站', type: 'solar_storage', capacity: 8000, installedCapacity: 7500, peakPower: 6800, location: '浙江省杭州市', status: 'online', gridConnectionDate: '2022-09-01', owner: '杭州光储', contact: '王经理' },
    devices: [
      { id: 'd-201', name: '光伏逆变器#1', type: 'inverter', status: 'online', value: 3200, unit: 'kW', lastUpdate: '2026-03-31 12:20:00' },
      { id: 'd-202', name: '光伏逆变器#2', type: 'inverter', status: 'online', value: 2800, unit: 'kW', lastUpdate: '2026-03-31 12:20:02' },
      { id: 'd-203', name: '储能PCS', type: 'inverter', status: 'online', value: -1200, unit: 'kW', lastUpdate: '2026-03-31 12:20:01' },
      { id: 'd-204', name: '储能BMS', type: 'battery_bms', status: 'online', value: 75, unit: '%', lastUpdate: '2026-03-31 12:20:00' },
      { id: 'd-205', name: '并网总表', type: 'meter', status: 'online', value: 4800, unit: 'kW', lastUpdate: '2026-03-31 12:20:03' },
      { id: 'd-206', name: '辐照传感器', type: 'sensor', status: 'online', value: 945, unit: 'W/m²', lastUpdate: '2026-03-31 12:20:01' },
      { id: 'd-207', name: '环境监测站', type: 'sensor', status: 'online', value: 26.8, unit: '°C', lastUpdate: '2026-03-31 12:20:02' },
    ],
    realTime: { generation: 6000, consumption: 1200, storage: 4800, gridExport: 3600, gridImport: 0, efficiency: 93.8, temperature: 26.8 },
  },
};

const deviceTypeMap: Record<string, { color: string; label: string; icon: string }> = {
  meter: { color: '#0066FF', label: '电表', icon: '⚡' },
  inverter: { color: '#FF9500', label: '逆变器', icon: '🔄' },
  battery_bms: { color: '#00D4AA', label: 'BMS', icon: '🔋' },
  sensor: { color: '#9B59B6', label: '传感器', icon: '📡' },
  gateway: { color: '#666666', label: '网关', icon: '📶' },
};

const deviceColumns = [
  { title: '设备', dataIndex: 'name', key: 'name', render: (n: string, r: IoTDevice) => <Space><span>{deviceTypeMap[r.type]?.icon}</span>{n}</Space> },
  { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={deviceTypeMap[t]?.color}>{deviceTypeMap[t]?.label}</Tag> },
  { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Badge status={s === 'online' ? 'success' : s === 'warning' ? 'warning' : 'error'} text={s === 'online' ? '在线' : s === 'warning' ? '告警' : '离线'} /> },
  { title: '当前值', dataIndex: 'value', key: 'value', render: (v: number, r: IoTDevice) => <span style={{ fontWeight: 600 }}>{v} {r.unit}</span> },
  { title: '更新时间', dataIndex: 'lastUpdate', key: 'lastUpdate', render: (t: string) => <span style={{ color: '#888', fontSize: 12 }}>{t}</span> },
];

// Draw SVG energy flow diagram
function EnergyFlowDiagram({ twin }: { twin: StationDigitalTwin }) {
  const { station, realTime } = twin;
  const isSolar = station.type === 'solar' || station.type === 'solar_storage';
  const hasStorage = station.type === 'storage' || station.type === 'solar_storage';

  const nodes = [
    { id: 'solar', x: 100, y: 150, show: isSolar, icon: '☀️', label: '光伏阵列', value: realTime.generation > 0 ? `${realTime.generation} kW` : '--', color: '#FFD700' },
    { id: 'inverter', x: 280, y: 150, show: true, icon: '🔄', label: '逆变器', value: `${realTime.generation} kW`, color: '#FF9500' },
    { id: 'battery', x: 280, y: 300, show: hasStorage, icon: '🔋', label: '储能电池', value: `${realTime.storage} kWh`, color: '#00D4AA' },
    { id: 'meter', x: 460, y: 150, show: true, icon: '⚡', label: '并网电表', value: realTime.gridExport > 0 ? `送出 ${realTime.gridExport} kW` : `受电 ${realTime.gridImport} kW`, color: '#0066FF' },
    { id: 'load', x: 460, y: 300, show: true, icon: '🏭', label: '负载消耗', value: `${realTime.consumption} kW`, color: '#9B59B6' },
    { id: 'grid', x: 640, y: 150, show: true, icon: '🌐', label: '电网', value: realTime.gridExport > 0 ? '送出 ↓' : '受电 ↑', color: realTime.gridExport > 0 ? '#27AE60' : '#E74C3C' },
  ].filter(n => n.show);

  const links = [
    { from: 'solar', to: 'inverter', show: isSolar },
    { from: 'inverter', to: 'meter', show: true },
    { from: 'inverter', to: 'battery', show: hasStorage },
    { from: 'battery', to: 'inverter', show: hasStorage },
    { from: 'meter', to: 'load', show: true },
    { from: 'meter', to: 'grid', show: true },
  ].filter(l => l.show);

  return (
    <div style={{ position: 'relative', width: '100%', height: 380, background: '#1A1A2E', borderRadius: 12, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 720 420">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Links */}
        {links.map((link, i) => {
          const from = nodes.find(n => n.id === link.from)!;
          const to = nodes.find(n => n.id === link.to)!;
          const midX = (from.x + to.x) / 2;
          return (
            <g key={i}>
              <path
                d={`M ${from.x + 50} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke={realTime.gridExport > 0 && link.to === 'grid' ? '#27AE60' : '#0066FF'}
                strokeWidth={3}
                strokeDasharray="8,4"
                opacity={0.6}
              />
              {/* Animated flow dot */}
              <circle r="4" fill="#00D4AA">
                <animateMotion dur={`${2 + i * 0.5}s`} repeatCount="indefinite" path={`M ${from.x + 50} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`} />
              </circle>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle r="44" fill={node.color} opacity={0.15} />
            <circle r="36" fill={node.color} opacity={0.3} />
            <circle r="28" fill={node.color} />
            <text x="0" y="5" textAnchor="middle" fontSize="22">{node.icon}</text>
            <text x="0" y="65" textAnchor="middle" fill="white" fontSize="13" fontWeight="600">{node.label}</text>
            <text x="0" y="82" textAnchor="middle" fill={node.color} fontSize="12" fontWeight="bold">{node.value}</text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
        <span>--- 能量流向</span>
        <span>●● 实时数据</span>
        <span style={{ color: '#00D4AA' }}>● 流动动画</span>
      </div>

      {/* Station type badge */}
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'white' }}>
        {station.type === 'solar' ? '☀️ 纯光伏' : station.type === 'storage' ? '🔋 储能' : '☀️🔋 光储一体'}
      </div>
    </div>
  );
}

// Real-time line chart for power flow
function PowerFlowChart({ twin }: { twin: StationDigitalTwin }) {
  const now = new Date();
  const hours = Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now.getTime() - (11 - i) * 5 * 60000);
    return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  });
  const genData = twin.station.type === 'solar' || twin.station.type === 'solar_storage'
    ? hours.map((_, i) => Math.max(0, twin.realTime.generation * (0.6 + Math.random() * 0.4) * (i < 8 ? i / 8 : Math.max(0, 1 - (i - 8) / 4))))
    : Array(12).fill(0);
  const conData = hours.map(() => twin.realTime.consumption * (0.7 + Math.random() * 0.3));
  const storageData = twin.realTime.storage > 0 ? hours.map(() => twin.realTime.storage * (0.8 + Math.random() * 0.2)) : [];

  const series = [
    { name: '发电', data: genData, color: '#FFD700' },
    { name: '消耗', data: conData, color: '#9B59B6' },
    ...(storageData.length ? [{ name: '储电', data: storageData, color: '#00D4AA' }] : []),
  ];

  return (
    <ReactECharts
      option={{
        tooltip: { trigger: 'axis' },
        legend: { data: series.map(s => s.name), bottom: 0 },
        grid: { top: 10, right: 10, bottom: 40, left: 50 },
        xAxis: { type: 'category', data: hours },
        yAxis: { type: 'value', name: 'kW', min: 0 },
        series: series.map(s => ({
          name: s.name,
          type: 'line',
          data: s.data.map(v => parseFloat(v.toFixed(1))),
          smooth: true,
          lineStyle: { color: s.color, width: 2 },
          itemStyle: { color: s.color },
          areaStyle: s.name !== '储电' ? { color: s.color + '20' } : undefined,
        })),
      }}
      style={{ height: 200 }}
    />
  );
}

export default function DigitalTwin() {
  const [selected, setSelected] = useState('station-001');
  const [twin, setTwin] = useState<StationDigitalTwin>(mockTwinData['station-001']);

  useEffect(() => {
    setTwin(mockTwinData[selected] || mockTwinData['station-001']);
  }, [selected]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTwin(prev => ({
        ...prev,
        realTime: {
          ...prev.realTime,
          generation: Math.max(0, prev.realTime.generation + (Math.random() - 0.5) * 50),
          consumption: Math.max(0, prev.realTime.consumption + (Math.random() - 0.5) * 30),
          temperature: Math.max(20, Math.min(45, prev.realTime.temperature + (Math.random() - 0.5) * 2)),
        },
        devices: prev.devices.map(d => ({
          ...d,
          value: d.type === 'sensor' && d.unit === '°C'
            ? parseFloat((prev.realTime.temperature + (Math.random() - 0.5)).toFixed(1))
            : d.type === 'inverter'
              ? parseFloat((prev.realTime.generation * 0.5 + Math.random() * 200).toFixed(0))
              : d.value,
          lastUpdate: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        })),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stationOptions = Object.values(mockTwinData).map(t => ({
    value: t.station.id,
    label: t.station.name,
  }));

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 500, color: 'white' }}>🪩 数字孪生</h2>

      <Row gutter={[12, 12]}>
        {/* Station Selector */}
        <Col span={24}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <Space wrap size="middle">
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>选择电站：</span>
              <Select value={selected} onChange={setSelected} options={stationOptions} style={{ minWidth: 200 }} />
              <Tag color={twin.station.status === 'online' ? 'green' : 'red'}>
                {twin.station.status === 'online' ? '在线运行' : '离线'}
              </Tag>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>实时数据每3秒刷新</span>
            </Space>
          </Card>
        </Col>

        {/* Key Metrics */}
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title="当前发电" value={twin.realTime.generation} suffix="kW" valueStyle={{ color: '#FFD700' }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title="负载消耗" value={twin.realTime.consumption} suffix="kW" valueStyle={{ color: '#9B59B6' }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}><Statistic title="今日发电量" value={Math.round(twin.realTime.generation * 6.5)} suffix="kWh" valueStyle={{ color: '#FF9500' }} /></Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>系统效率</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#00D4AA' }}>{twin.realTime.efficiency}%</div>
              </div>
              <Progress type="circle" percent={twin.realTime.efficiency} size={50} strokeColor="#00D4AA" />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        {/* Energy Flow Diagram */}
        <Col xs={24} lg={14}>
          <Card title="⚡ 能量流向图" extra={<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{twin.station.name}</span>} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <EnergyFlowDiagram twin={twin} />
          </Card>
        </Col>

        {/* Power Flow Chart */}
        <Col xs={24} lg={10}>
          <Card title="📈 功率趋势（最近1小时）" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <PowerFlowChart twin={twin} />
          </Card>
        </Col>
      </Row>

      {/* IoT Devices */}
      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }} title="📡 IoT 设备状态">
        <Row gutter={[12, 12]}>
          {twin.devices.map(device => (
            <Col xs={12} lg={6} key={device.id}>
              <div style={{
                background: device.status === 'warning' ? 'rgba(255,149,0,0.1)' : 'rgba(0,102,255,0.05)',
                border: `1px solid ${device.status === 'warning' ? '#FF9500' : 'rgba(0,102,255,0.2)'}`,
                borderRadius: 8,
                padding: '12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Space size="small">
                    <span style={{ fontSize: 16 }}>{deviceTypeMap[device.type]?.icon}</span>
                    <span style={{ fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{device.name}</span>
                  </Space>
                  <Badge status={device.status === 'online' ? 'success' : device.status === 'warning' ? 'warning' : 'error'} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: deviceTypeMap[device.type]?.color }}>
                  {device.value} <span style={{ fontSize: 11, fontWeight: 400 }}>{device.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  更新: {device.lastUpdate}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <Table dataSource={twin.devices} columns={deviceColumns} rowKey="id" pagination={false} size="small" scroll={{ x: 700 }} />
        </div>
      </Card>

      {/* Station Info */}
      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }} title="🏭 电站基本信息">
        <Row gutter={[12, 12]}>
          <Col xs={12} lg={6}><Statistic title="装机容量" value={twin.station.capacity} suffix="kW" valueStyle={{ fontSize: 18 }} /></Col>
          <Col xs={12} lg={6}><Statistic title="当前功率" value={twin.station.peakPower} suffix="kW" valueStyle={{ color: '#FF9500', fontSize: 18 }} /></Col>
          <Col xs={12} lg={6}><Statistic title="并网日期" value={twin.station.gridConnectionDate} valueStyle={{ fontSize: 18 }} /></Col>
          <Col xs={12} lg={6}><Statistic title="运营方" value={twin.station.owner} valueStyle={{ fontSize: 18 }} /></Col>
        </Row>
      </Card>
    </div>
  );
}
