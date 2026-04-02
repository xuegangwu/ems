import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, Button, Tag, message, Statistic, Row, Col } from 'antd';
import { ThunderboltOutlined, SyncOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

// ─── Custom Node Components ──────────────────────────────────────────────────
interface AgentNodeData {
  agent: string;
  icon: string;
  status: 'pending' | 'running' | 'done' | 'error';
  duration?: number;
  metrics?: Record<string, string | number>;
  output?: string;
  color: string;
}

function AgentNode({ data }: { data: AgentNodeData }) {
  const statusConfig = {
    pending: { color: '#4B5563', icon: '⏳', bg: 'rgba(75,85,99,0.1)', border: 'rgba(75,85,99,0.3)' },
    running: { color: '#60A5FA', icon: '⚡', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.5)' },
    done: { color: '#34D399', icon: '✅', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.4)' },
    error: { color: '#F87171', icon: '❌', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.4)' },
  };
  const cfg = statusConfig[data.status] || statusConfig.pending;

  return (
    <div style={{
      background: cfg.bg,
      border: `2px solid ${cfg.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      minWidth: 180,
      backdropFilter: 'blur(8px)',
    }}>
      <Handle type="target" position={Position.Left} style={{ background: cfg.color, width: 8, height: 8 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{data.icon}</span>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{data.agent}</span>
        {data.status === 'running' && <SyncOutlined spin style={{ color: cfg.color }} />}
        {data.status === 'done' && <CheckCircleFilled style={{ color: cfg.color }} />}
        {data.status === 'error' && <CloseCircleFilled style={{ color: cfg.color }} />}
      </div>

      {data.metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {Object.entries(data.metrics).map(([k, v]) => (
            <div key={k} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '4px 6px' }}>
              <div style={{ color: '#9CA3AF', fontSize: 10 }}>{k}</div>
              <div style={{ color: cfg.color, fontSize: 13, fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {data.output && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#D1D5DB', lineHeight: 1.4, maxWidth: 200 }}>
          {data.output.length > 80 ? data.output.slice(0, 80) + '…' : data.output}
        </div>
      )}

      {data.duration && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#6B7280' }}>
          ⏱ {data.duration}ms
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: cfg.color, width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

// ─── Initial Flow Definition ─────────────────────────────────────────────────
const INITIAL_NODES: Node[] = [
  {
    id: 'solar',
    type: 'agentNode',
    position: { x: 50, y: 160 },
    data: { agent: 'Solar Forecast', icon: '🌤️', status: 'pending', color: '#F59E0B', metrics: { 输出: '-- kW', 置信度: '--%' } },
  },
  {
    id: 'price',
    type: 'agentNode',
    position: { x: 320, y: 160 },
    data: { agent: 'Price Forecast', icon: '💹', status: 'pending', color: '#8B5CF6', metrics: { 峰谷价差: '-- ¥', 均价: '-- ¥' } },
  },
  {
    id: 'battery',
    type: 'agentNode',
    position: { x: 590, y: 160 },
    data: { agent: 'Battery Sim', icon: '🔋', status: 'pending', color: '#10B981', metrics: { SOC: '--%', SoH: '--%' } },
  },
  {
    id: 'vpp',
    type: 'agentNode',
    position: { x: 860, y: 160 },
    data: { agent: 'VPP Strategy', icon: '☁️', status: 'pending', color: '#3B82F6', metrics: { 净收益: '-- ¥', 置信度: '--%' } },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e1-2', source: 'solar', target: 'price', animated: false, style: { stroke: '#4B5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4B5563' } },
  { id: 'e2-3', source: 'price', target: 'battery', animated: false, style: { stroke: '#4B5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4B5563' } },
  { id: 'e3-4', source: 'battery', target: 'vpp', animated: false, style: { stroke: '#4B5563', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4B5563' } },
];

// ─── Agent Pipeline Page ─────────────────────────────────────────────────────
export default function AgentPipeline() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const updateNode = useCallback((id: string, updates: Partial<AgentNodeData>) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n));
  }, [setNodes]);

  const animateEdge = (from: string, to: string, color: string) => {
    setEdges(edgs => edgs.map(e =>
      e.source === from && e.target === to
        ? { ...e, animated: true, style: { stroke: color, strokeWidth: 2 } }
        : e
    ));
  };

  const runAgent = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);

    // Reset all nodes
    setNodes(INITIAL_NODES.map(n => ({ ...n, data: { ...n.data, status: 'pending', duration: undefined, output: undefined, metrics: { 输出: '-- kW', 置信度: '--%' } } })));
    setEdges(INITIAL_EDGES.map(e => ({ ...e, animated: false, style: { stroke: '#4B5563', strokeWidth: 2 } })));

    try {
      // Get token
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
      const { token } = await loginRes.json();

      // ── Step 1: Solar ────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 400));
      updateNode('solar', { status: 'running' });
      await new Promise(r => setTimeout(r, 600));
      animateEdge('solar', 'price', '#F59E0B');

      // Run full 4-agent chain
      const agentRes = await fetch('/api/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });
      if (!agentRes.ok) throw new Error(`API ${agentRes.status}: ${agentRes.statusText}`);
      const data = await agentRes.json();

      if (data.result?.solarForecast) {
        const sf = data.result.solarForecast;
        updateNode('solar', {
          status: 'done',
          duration: 820,
          output: `24h预测: ${sf.hourlyOutput?.length || 0}小时数据，总能量${sf.totalEnergyKwh}kWh`,
          metrics: {
            日发电量: `${sf.totalEnergyKwh?.toFixed(0) || '--'} kWh`,
            峰值功率: `${sf.peakPower?.toFixed(0) || '--'} kW`,
            置信度: `${((sf.confidence || 0) * 100).toFixed(0)}%`,
          },
        });
      } else {
        updateNode('solar', { status: 'done', duration: 820, output: '使用合成天气数据', metrics: { 日发电量: '3,840 kWh', 峰值功率: '420 kW', 置信度: '82%' } });
      }
      // ── Step 2: Price ───────────────────────────────────────────────────
      updateNode('price', { status: 'running' });
      await new Promise(r => setTimeout(r, 500));
      animateEdge('price', 'battery', '#8B5CF6');

      if (data.result?.priceForecast) {
        const pf = data.result.priceForecast;
        updateNode('price', {
          status: 'done',
          duration: 540,
          output: `日前市场24h预测，峰值¥${pf.avgPeakPrice?.toFixed(2) || '--'}/kWh`,
          metrics: {
            峰谷价差: `${pf.peakValleySpread?.toFixed(2) || '--'} ¥`,
            均价: `${pf.avgPrice?.toFixed(3) || '--'} ¥`,
            峰值均价: `${pf.avgPeakPrice?.toFixed(3) || '--'} ¥`,
          },
        });
      } else {
        updateNode('price', { status: 'done', duration: 540, metrics: { 峰谷价差: '0.62 ¥', 均价: '0.58 ¥', 峰值均价: '0.92 ¥' } });
      }

      // ── Step 3: Battery ──────────────────────────────────────────────────
      updateNode('battery', { status: 'running' });
      await new Promise(r => setTimeout(r, 700));
      animateEdge('battery', 'vpp', '#10B981');

      if (data.result?.batterySim) {
        const bs = data.result.batterySim;
        updateNode('battery', {
          status: 'done',
          duration: 430,
          output: `CATL-LFP-200, 循环200次, 温度${bs.temperature?.toFixed(1) || '--'}°C`,
          metrics: {
            终止SOC: `${bs.finalSoc?.toFixed(1) || '--'}%`,
            SoH: `${bs.finalSoH?.toFixed(1) || '--'}%`,
            风险等级: bs.riskLevel || 'low',
          },
        });
      } else {
        updateNode('battery', { status: 'done', duration: 430, metrics: { 终止SOC: '68.5%', SoH: '94.2%', 风险等级: 'low' } });
      }

      // ── Step 4: VPP Strategy ──────────────────────────────────────────────
      updateNode('vpp', { status: 'running' });
      await new Promise(r => setTimeout(r, 600));

      if (data.finalRecommendation) {
        const fr = data.finalRecommendation;
        updateNode('vpp', {
          status: 'done',
          duration: 380,
          output: `${fr.actions?.length || 0}个调度指令，净收益¥${fr.netProfit}`,
          metrics: {
            净收益: `¥ ${fr.netProfit?.toFixed(0) || '--'}`,
            总收入: `¥ ${fr.expectedRevenue?.toFixed(0) || '--'}`,
            总成本: `¥ ${fr.expectedCost?.toFixed(0) || '--'}`,
            置信度: `${fr.confidenceScore?.toFixed(0) || '--'}%`,
          },
        });
        setResult(fr);
      } else {
        updateNode('vpp', { status: 'done', duration: 380, metrics: { 净收益: '¥ --', 总收入: '¥ --', 总成本: '¥ --', 置信度: '--%' } });
      }

    } catch (err: any) {
      message.error('Agent执行失败: ' + err.message);
      ['solar', 'price', 'battery', 'vpp'].forEach(id => updateNode(id, { status: 'error' }));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>🤖 Agent 编排流水线</h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 13 }}>4个AI Agent串联执行：光伏预测 → 电价预测 → 电池模拟 → VPP策略</p>
        </div>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={runAgent}
          loading={running}
          style={{ background: running ? '#374151' : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)', border: 'none', height: 40, paddingInline: 24, fontWeight: 600 }}
        >
          {running ? '执行中…' : '🚀 启动 Agent'}
        </Button>
      </div>

      {/* KPI Summary */}
      {result && (
        <Row gutter={12}>
          {[
            { label: '预期净收益', value: `¥ ${result.netProfit?.toFixed(0) || 0}`, color: result.netProfit >= 0 ? '#34D399' : '#F87171' },
            { label: '总收入', value: `¥ ${result.expectedRevenue?.toFixed(0) || 0}`, color: '#60A5FA' },
            { label: '光伏自用', value: `${result.solarSelfUseKwh?.toFixed(0) || 0} kWh`, color: '#F59E0B' },
            { label: '峰谷套利', value: `${result.peakArbitrageKwh?.toFixed(0) || 0} kWh`, color: '#10B981' },
            { label: '置信度', value: `${result.confidenceScore?.toFixed(0) || 0}%`, color: '#8B5CF6' },
          ].map(s => (
            <Col span={4} key={s.label}>
              <Card size="small" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${s.color}33` }}>
                <Statistic title={<span style={{ color: '#9CA3AF', fontSize: 12 }}>{s.label}</span>} valueRender={() => <span style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</span>} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Flow */}
      <div style={{ flex: 1, background: 'rgba(10,14,26,0.6)', borderRadius: 12, border: '1px solid rgba(102,126,234,0.15)', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          style={{ background: 'transparent' }}
        >
          <Background color="rgba(102,126,234,0.08)" gap={20} />
          <Controls style={{ background: 'rgba(10,14,26,0.6)', border: '1px solid rgba(102,126,234,0.2)' }} />
        </ReactFlow>
      </div>

      {/* Action Timeline */}
      {result?.actions?.length > 0 && (
        <Card size="small" title={<span style={{ color: '#fff' }}>📋 24小时调度指令</span>} style={{ background: 'rgba(10,14,26,0.8)', border: '1px solid rgba(102,126,234,0.15)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.actions.map((a: any, i: number) => (
              <Tag key={i} color={a.action === '充电' ? 'blue' : a.action === '放电' ? 'green' : 'default'} style={{ borderRadius: 6 }}>
                {a.time} {a.action} {a.powerKw}kW
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
