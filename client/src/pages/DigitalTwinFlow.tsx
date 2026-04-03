import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ReactFlow,
  Node, Edge, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, MarkerType, Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, Row, Col, Select, Statistic, Space, Badge } from 'antd'

// ── Energy Flow Node ─────────────────────────────────────────────────────────
interface EnergyNodeData {
  label: string; icon: string; unit: string;
  value: number; status: 'online' | 'offline' | 'warn';
  color: string; description: string;
  [key: string]: unknown;
}

function EnergyNode({ data }: { data: EnergyNodeData }) {
  const statusColor = { online: '#00D4AA', offline: '#F87171', warn: '#FBBF24' }[data.status] || '#00D4AA';
  return (
    <div style={{
      background: 'rgba(26,16,64,0.95)',
      border: `1.5px solid ${statusColor}55`,
      borderRadius: 14,
      padding: '12px 18px',
      minWidth: 130,
      textAlign: 'center',
      boxShadow: `0 0 20px ${statusColor}22`,
    }}>
      <div style={{ fontSize: 28 }}>{data.icon}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{data.label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: statusColor, marginTop: 2 }}>
        {data.value.toFixed(1)} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{data.unit}</span>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{data.description}</div>
    </div>
  );
}

const nodeTypes = { energy: EnergyNode };

// ── Animated Data Flow Edge ────────────────────────────────────────────────

function buildEdges(data: Record<string, number>): Edge[] {
  const { solar = 0, battery = 0, grid = 0, load = 0 } = data;
  const marker = (color: string) => ({
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color }
  });

  const edges: Edge[] = [];

  // Solar → Battery (excess goes to battery)
  if (solar > 10) {
    edges.push({
      id: 'solar-battery', source: 'solar', target: 'battery',
      animated: true, style: { stroke: '#FFB020', strokeWidth: Math.max(2, solar / 120) },
      label: `${solar.toFixed(0)}kW`,
      labelStyle: { fill: '#FFB020', fontSize: 11 },
      ...marker('#FFB020'),
    });
  }

  // Solar → Load
  if (solar > 0 && load > 0) {
    edges.push({
      id: 'solar-load', source: 'solar', target: 'load',
      animated: true, style: { stroke: '#34D399', strokeWidth: Math.max(2, Math.min(solar, load) / 80) },
      label: `${Math.min(solar, load).toFixed(0)}kW`,
      labelStyle: { fill: '#34D399', fontSize: 11 },
      ...marker('#34D399'),
    });
  }

  // Battery → Load
  if (battery > 0 && load > 0) {
    edges.push({
      id: 'battery-load', source: 'battery', target: 'load',
      animated: true, style: { stroke: '#60A5FA', strokeWidth: Math.max(2, battery / 60) },
      label: `${battery.toFixed(0)}kW`,
      labelStyle: { fill: '#60A5FA', fontSize: 11 },
      ...marker('#60A5FA'),
    });
  }

  // Grid → Load (when solar+battery insufficient)
  if (grid > 0) {
    edges.push({
      id: 'grid-load', source: 'grid', target: 'load',
      animated: true, style: { stroke: '#F87171', strokeWidth: Math.max(2, grid / 80) },
      label: `${grid.toFixed(0)}kW`,
      labelStyle: { fill: '#F87171', fontSize: 11 },
      ...marker('#F87171'),
    });
  }

  return edges;
}

const STATIONS = [
  { id: 'station-001', name: '苏州工业园 500kW/200kWh' },
  { id: 'station-002', name: '杭州站 350kW/150kWh' },
  { id: 'station-003', name: '上海站 200kW/100kWh' },
];

// ── Main Component ───────────────────────────────────────────────────────────
export default function DigitalTwinFlow() {
  const [stationId, setStationId] = useState('station-001');
  const [realtime, setRealtime] = useState({ solar: 0, battery: 0, grid: 0, load: 0, soc: 50 });
  const [legend] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch('/api/mqtt/realtime');
      if (!r.ok) return;
      const d = await r.json();
      const stations = d.stations || [];
      const station = stations.find((s: any) => s.id === stationId) || stations[0];
      const latest = station?.latest || {};
      if (station) {
        setRealtime({
          solar: latest.solarPowerKw || 0,
          battery: Math.abs(latest.batteryPowerKw) || 0,
          grid: Math.abs(latest.gridPowerKw) || 0,
          load: latest.loadPowerKw || 0,
          soc: latest.batterySoc || 50,
        });
      }
    } catch {}
  }, [stationId]);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  // Build nodes from realtime data
  const buildNodes = (): Node[] => [
    {
      id: 'solar', type: 'energy', position: { x: 0, y: 80 },
      data: {
        label: '光伏', icon: '☀️', unit: 'kW', value: realtime.solar,
        status: realtime.solar > 10 ? 'online' : 'offline',
        color: '#FFB020', description: '太阳能发电',
      },
      sourcePosition: Position.Right, targetPosition: Position.Left,
    },
    {
      id: 'battery', type: 'energy', position: { x: 280, y: 80 },
      data: {
        label: `储能 ${realtime.soc.toFixed(0)}%`, icon: '🔋', unit: 'kW', value: realtime.battery,
        status: realtime.soc > 20 ? 'online' : realtime.soc > 10 ? 'warn' : 'offline',
        color: '#60A5FA', description: `SOC ${realtime.soc.toFixed(0)}%`,
      },
      sourcePosition: Position.Right, targetPosition: Position.Left,
    },
    {
      id: 'grid', type: 'energy', position: { x: 560, y: 200 },
      data: {
        label: '电网', icon: '⚡', unit: 'kW', value: realtime.grid,
        status: 'online', color: '#F87171', description: realtime.grid > 0 ? '购电' : '售电',
      },
      sourcePosition: Position.Left, targetPosition: Position.Right,
    },
    {
      id: 'load', type: 'energy', position: { x: 560, y: -20 },
      data: {
        label: '负荷', icon: '🏭', unit: 'kW', value: realtime.load,
        status: 'online', color: '#A78BFA', description: '工商业用电',
      },
      sourcePosition: Position.Bottom, targetPosition: Position.Top,
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(buildNodes());
    setEdges(buildEdges(realtime));
  }, [realtime, stationId]);

  const totalGeneration = realtime.solar + realtime.battery;
  const selfSufficiency = realtime.load > 0 ? Math.min(100, (totalGeneration / realtime.load) * 100) : 0;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>⚡ 能源数字孪生</h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 13 }}>
            实时能量流可视化 · {STATIONS.find(s => s.id === stationId)?.name}
          </p>
        </div>
        <Space>
          <Select value={stationId} onChange={v => setStationId(v)} style={{ width: 200 }}
            options={STATIONS.map(s => ({ value: s.id, label: s.name }))}
          />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <Badge status="processing" /> 5s自动刷新
          </span>
        </Space>
      </div>

      {/* KPI Row */}
      <Row gutter={10}>
        {[
          { label: '光伏出力', value: `${realtime.solar.toFixed(0)} kW`, color: '#FFB020' },
          { label: '储能放电', value: `${realtime.battery.toFixed(0)} kW`, color: '#60A5FA' },
          { label: '电网购电', value: `${realtime.grid.toFixed(0)} kW`, color: '#F87171' },
          { label: '负荷用电', value: `${realtime.load.toFixed(0)} kW`, color: '#A78BFA' },
          { label: '自发自用率', value: `${selfSufficiency.toFixed(0)}%`, color: '#34D399' },
        ].map(s => (
          <Col span={4} key={s.label}>
            <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}22` }}>
              <Statistic title={<span style={{ color: '#9CA3AF', fontSize: 11 }}>{s.label}</span>}
                valueRender={() => <span style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.value}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* React Flow Canvas */}
      <div style={{ flex: 1, background: 'rgba(10,14,26,0.6)', borderRadius: 12, border: '1px solid rgba(102,126,234,0.12)', overflow: 'hidden', position: 'relative' }}>
        {/* @ts-ignore */}
      <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          style={{ background: 'transparent' }}
        >
          <Background color="rgba(102,126,234,0.06)" gap={20} variant={BackgroundVariant.Dots} />
          <Controls style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(102,126,234,0.2)' }} />
        </ReactFlow>

        {/* Legend */}
        {legend && (
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(102,126,234,0.2)',
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: 600 }}>能量流向</div>
            {[
              { color: '#FFB020', label: '光伏发电' },
              { color: '#34D399', label: '光伏→负荷' },
              { color: '#60A5FA', label: '储能放电' },
              { color: '#F87171', label: '电网购电' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 20, height: 2, background: l.color, borderRadius: 1 }} />
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
