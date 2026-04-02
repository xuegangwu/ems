/**
 * AgentConsole — AI Agent 调度控制台
 * Mission Control 风格：4个Agent流水线 + 实时日志 + 输出报告
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Row, Col, Button, Tag, Badge, message, Progress } from 'antd';
import { PlayCircleOutlined, WarningOutlined, SyncOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const API = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '';

const AGENTS = [
  { id: 'solar-forecast', name: 'SolarForecastAgent', icon: '🌤️', color: '#FF9500', description: '光伏出力预测', shortName: '光伏预测' },
  { id: 'price-forecast', name: 'PriceForecastAgent', icon: '⚡', color: '#667EEA', description: '电价预测', shortName: '电价预测' },
  { id: 'battery-sim', name: 'BatterySimAgent', icon: '🔋', color: '#00D4AA', description: '电池模拟', shortName: '电池模拟' },
  { id: 'vpp-strategy', name: 'VPPStrategyAgent', icon: '☁️', color: '#FF4D4F', description: 'VPP报价策略', shortName: 'VPP策略' },
];

const AUTH_HEADERS = () => ({ Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` });

interface AgentLog {
  timestamp: string;
  agent: string;
  icon: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'warning';
  message: string;
  durationMs?: number;
}

interface OrchestratorResult {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  totalDurationMs: number;
  logs: AgentLog[];
  result: {
    solarForecast: any;
    priceForecast: any;
    batterySim: any;
    vppStrategy: any;
  };
  finalRecommendation: {
    actions: { time: string; action: string; powerKw: number; reason: string }[];
    expectedRevenue: number;
    expectedCost: number;
    netProfit: number;
    confidenceScore: number;
    riskAlerts: { level: 'low' | 'medium' | 'high'; message: string }[];
    executionStatus: string;
  };
}

// ─── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({ agent, status, log }: { agent: typeof AGENTS[0]; status: 'pending' | 'running' | 'done' | 'error'; log?: AgentLog }) {
  const statusConfig = {
    pending: { color: 'rgba(255,255,255,0.15)', border: 'rgba(255,255,255,0.1)', icon: '⏳', text: '待启动' },
    running: { color: 'rgba(102,126,234,0.08)', border: 'rgba(102,126,234,0.4)', icon: '⏳', text: '运行中', glow: '0 0 12px rgba(102,126,234,0.3)' },
    done: { color: 'rgba(0,212,170,0.08)', border: 'rgba(0,212,170,0.4)', icon: '✅', text: '已完成' },
    error: { color: 'rgba(255,77,79,0.08)', border: 'rgba(255,77,79,0.4)', icon: '❌', text: '失败' },
  };
  const cfg = statusConfig[status] || statusConfig.pending;

  return (
    <div style={{
      background: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 12,
      padding: '16px 12px',
      textAlign: 'center',
      boxShadow: (cfg as any).glow ? (cfg as any).glow : 'none',
      transition: 'all 0.3s',
      minWidth: 0,
    }}>
      {/* Arrow */}
      <div style={{ fontSize: 20, marginBottom: 8 }}>{agent.icon}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: agent.color, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.shortName}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8, minHeight: 28 }}>{agent.description}</div>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{cfg.icon}</div>
      <Tag
        color={status === 'done' ? 'green' : status === 'running' ? 'processing' : status === 'error' ? 'error' : 'default'}
        style={{ fontSize: 10, margin: 0 }}
      >
        {cfg.text}
      </Tag>
      {log?.durationMs && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
          {log.durationMs}ms
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Arrow ───────────────────────────────────────────────────────────
function PipelineArrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,212,170,0.3)', fontSize: 18, flexShrink: 0 }}>
      ➡️
    </div>
  );
}

// ─── Log Entry ────────────────────────────────────────────────────────────────
function LogEntry({ log }: { log: AgentLog }) {
  const statusColors: Record<string, string> = {
    running: '#667EEA',
    done: '#00D4AA',
    error: '#FF4D4F',
    warning: '#FF9500',
    pending: 'rgba(255,255,255,0.2)',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '5px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
      animation: log.status === 'running' ? 'pulse 1s infinite' : 'none',
    }}>
      <span style={{ fontSize: 11, color: statusColors[log.status] || '#fff', flexShrink: 0, minWidth: 55 }}>
        {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span style={{ fontSize: 11 }}>{log.icon}</span>
      <span style={{ fontSize: 11, color: statusColors[log.status] || 'rgba(255,255,255,0.6)', flex: 1, lineHeight: '16px' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>[{log.agent}]</span>{' '}
        {log.message}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AgentConsole() {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'pending' | 'running' | 'done' | 'error'>>({
    'solar-forecast': 'pending',
    'price-forecast': 'pending',
    'battery-sim': 'pending',
    'vpp-strategy': 'pending',
  });
  const [progress, setProgress] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (logs.length > 0) scrollToBottom();
  }, [logs]);

  const handleRun = async () => {
    if (executing) return;
    setExecuting(true);
    setResult(null);
    setLogs([]);
    setProgress(0);
    pollCountRef.current = 0;

    // Reset agent statuses
    setAgentStatuses({ 'solar-forecast': 'running', 'price-forecast': 'pending', 'battery-sim': 'pending', 'vpp-strategy': 'pending' });

    // Add system start log
    setLogs([{ timestamp: new Date().toISOString(), agent: 'System', icon: '🚀', status: 'running', message: '任务已提交，等待Agent链启动...' }]);

    // Start orchestration
    try {
      await fetch(`${API}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AUTH_HEADERS() },
        body: JSON.stringify({}),
      });

      // Polling until done (simulated async)
      pollForResult();
    } catch (e) {
      message.error('启动失败，请检查登录状态');
      setExecuting(false);
      setAgentStatuses({ 'solar-forecast': 'error', 'price-forecast': 'error', 'battery-sim': 'error', 'vpp-strategy': 'error' });
    }
  };

  const pollForResult = useCallback(async () => {
    if (!executing) return;
    pollCountRef.current++;

    try {
      // Poll the run endpoint
      const r = await fetch(`${API}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AUTH_HEADERS() },
      });
      const data = await r.json();

      if (data.success) {
        setResult(data);
        setLogs(data.logs || []);

        // Update agent statuses based on completed agents
        const newStatuses: Record<string, 'pending' | 'running' | 'done' | 'error'> = {
          'solar-forecast': 'pending',
          'price-forecast': 'pending',
          'battery-sim': 'pending',
          'vpp-strategy': 'pending',
        };
        if (data.logs) {
          const agentOrder = ['SolarForecastAgent', 'PriceForecastAgent', 'BatterySimAgent', 'VPPStrategyAgent'];
          data.logs.forEach((log: AgentLog) => {
            if (log.status === 'done') {
              const idx = agentOrder.indexOf(log.agent);
              if (idx >= 0) newStatuses[AGENTS[idx].id] = 'done';
            }
            if (log.status === 'running' && log.agent !== 'System') {
              const idx = agentOrder.indexOf(log.agent);
              if (idx >= 0) newStatuses[AGENTS[idx].id] = 'running';
            }
            if (log.status === 'error') {
              const idx = agentOrder.indexOf(log.agent);
              if (idx >= 0) newStatuses[AGENTS[idx].id] = 'error';
            }
          });
        }
        setAgentStatuses(newStatuses);
        setProgress(data.result ? 100 : Math.min(80, pollCountRef.current * 20));

        if (data.result) {
          setExecuting(false);
          message.success({ content: `调度完成！耗时${data.totalDurationMs}ms，预期收益¥${data.finalRecommendation.netProfit}`, duration: 4 });
          return;
        }
      } else if (data.logs && data.logs.length > 0) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Poll error', e);
    }

    if (executing && pollCountRef.current < 15) {
      pollingRef.current = setTimeout(pollForResult, 2000);
    } else if (executing && pollCountRef.current >= 15) {
      setExecuting(false);
      message.error('执行超时');
    }
  }, [executing]);

  // ─── Dispatch chart ──────────────────────────────────────────────────────
  const dispatchChartOption = result?.result?.vppStrategy?.dispatchPlan ? {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: 'rgba(0,212,170,0.3)',
      textStyle: { color: '#fff' },
      formatter: (params: any[]) => {
        const p = params[0];
        const plan = result.result.vppStrategy.dispatchPlan[p.dataIndex];
        return `<b>${p.name}</b><br/>功率: ${plan.powerKw > 0 ? '+' : ''}${plan.powerKw}kW<br/>电价: ¥${plan.priceCny?.toFixed(3) || '-'}/kWh<br/>操作: ${plan.action === 'charge' ? '充电' : plan.action === 'discharge' ? '放电' : '待机'}`;
      },
    },
    legend: { data: ['放电(+)', '充电(-)'], top: 0, textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 } },
    grid: { top: 28, right: 12, bottom: 28, left: 44 },
    xAxis: {
      type: 'category',
      data: result.result.vppStrategy.dispatchPlan.map((p: any) => `${p.hour}:00`),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, interval: 2 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'kW',
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      nameTextStyle: { color: 'rgba(255,255,255,0.2)', fontSize: 9 },
    },
    series: [
      {
        name: '放电(+)',
        type: 'bar',
        stack: 'power',
        data: result.result.vppStrategy.dispatchPlan.map((p: any) => p.action === 'discharge' ? p.powerKw : 0),
        itemStyle: { color: '#FF4D4F', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '充电(-)',
        type: 'bar',
        stack: 'power',
        data: result.result.vppStrategy.dispatchPlan.map((p: any) => p.action === 'charge' ? -p.powerKw : 0),
        itemStyle: { color: '#00D4AA', borderRadius: [2, 2, 0, 0] },
      },
    ],
  } : {};

  // ─── Solar forecast chart ─────────────────────────────────────────────────
  const solarChartOption = result?.result?.solarForecast?.hourlyOutput ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'rgba(255,149,0,0.3)', textStyle: { color: '#fff' } },
    grid: { top: 12, right: 12, bottom: 28, left: 44 },
    xAxis: { type: 'category', data: result.result.solarForecast.hourlyOutput.map((h: any) => `${h.hour}:00`), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, interval: 2 }, axisTick: { show: false } },
    yAxis: { type: 'value', name: 'kW', axisLine: { show: false }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.2)', fontSize: 9 } },
    series: [{ name: '光伏出力', type: 'line', data: result.result.solarForecast.hourlyOutput.map((h: any) => h.powerKw), smooth: 0.5, lineStyle: { width: 2, color: '#FF9500' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,149,0,0.25)' }, { offset: 1, color: 'rgba(255,149,0,0)' }] } }, symbol: 'circle', symbolSize: 3, itemStyle: { color: '#FF9500' } }],
  } : {};

  // ─── Price forecast chart ─────────────────────────────────────────────────
  const priceChartOption = result?.result?.priceForecast?.hourlyPrices ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: 'rgba(102,126,234,0.3)', textStyle: { color: '#fff' } },
    grid: { top: 12, right: 12, bottom: 28, left: 48 },
    xAxis: { type: 'category', data: result.result.priceForecast.hourlyPrices.map((p: any) => `${p.hour}:00`), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, interval: 2 }, axisTick: { show: false } },
    yAxis: { type: 'value', name: '¥/kWh', axisLine: { show: false }, axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, formatter: (v: number) => `¥${v.toFixed(2)}` }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.2)', fontSize: 9 } },
    series: [{ name: '日前电价', type: 'line', data: result.result.priceForecast.hourlyPrices.map((p: any) => p.priceCny), smooth: 0.3, lineStyle: { width: 2, color: '#667EEA' }, symbol: 'circle', symbolSize: 3, itemStyle: { color: '#667EEA' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(102,126,234,0.2)' }, { offset: 1, color: 'rgba(102,126,234,0)' }] } } }],
  } : {};

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: '#fff' }}>🤖 Agent 调度中心</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>AI Agent 流水线 · 实时协作 · 智能调度</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {executing && (
            <div style={{ fontSize: 11, color: '#667EEA', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SyncOutlined spin /> 执行中... {progress}%
            </div>
          )}
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRun}
            loading={executing}
            style={{
              background: executing ? 'rgba(102,126,234,0.3)' : 'rgba(0,212,170,0.8)',
              border: 'none',
              fontWeight: 600,
              height: 38,
            }}
          >
            {executing ? '执行中...' : '执行日优化'}
          </Button>
        </div>
      </div>

      {/* Agent Pipeline */}
      <Card
        size="small"
        title={<span style={{ fontSize: 13 }}>🔄 Agent 流水线</span>}
        extra={<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>4 Agent 串联执行</span>}
        bodyStyle={{ padding: '12px 16px' }}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)', marginBottom: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
          {AGENTS.map((agent, idx) => (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AgentCard agent={agent} status={agentStatuses[agent.id]} log={logs.find(l => l.agent === agent.name && l.status === 'done')} />
              </div>
              {idx < AGENTS.length - 1 && <PipelineArrow key={`arrow-${idx}`} />}
            </>
          ))}
        </div>

        {/* Overall progress bar */}
        {executing && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
              <span>执行进度</span><span>{progress}%</span>
            </div>
            <Progress percent={progress} size="small" showInfo={false} strokeColor={{ '0%': '#667EEA', '100%': '#00D4AA' }} trailColor="rgba(255,255,255,0.05)" />
          </div>
        )}
      </Card>

      {/* Main content: Logs + Output */}
      <Row gutter={[10, 10]}>
        {/* Execution Log */}
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={<span style={{ fontSize: 13 }}>📋 执行日志</span>}
            extra={<Badge count={logs.filter(l => l.status === 'error' || l.status === 'warning').length} style={{ fontSize: 9 }}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>问题</span></Badge>}
            bodyStyle={{ padding: '8px 12px', maxHeight: 420, overflowY: 'auto' }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}
          >
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                点击「执行日优化」启动 Agent 链
              </div>
            ) : (
              <div>
                {logs.map((log, i) => <LogEntry key={i} log={log} />)}
                <div ref={logEndRef} />
              </div>
            )}
          </Card>
        </Col>

        {/* Output Report */}
        <Col xs={24} lg={12}>
          {result ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* KPI Row */}
              <Row gutter={[8, 8]}>
                {[
                  { label: '预期净收益', value: `¥${result.finalRecommendation.netProfit.toLocaleString()}`, color: '#00D4AA', icon: '💰' },
                  { label: '置信度', value: `${result.finalRecommendation.confidenceScore}%`, color: '#667EEA', icon: '🎯' },
                  { label: '光伏预测', value: `${result.result.solarForecast.totalEnergyKwh}kWh`, color: '#FF9500', icon: '☀️' },
                  { label: '峰谷价差', value: `¥${result.result.priceForecast.peakValleySpread.toFixed(3)}`, color: '#FF4D4F', icon: '⚡' },
                ].map(k => (
                  <Col xs={12} sm={6} key={k.label}>
                    <Card size="small" bodyStyle={{ padding: '8px 6px', textAlign: 'center' }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${k.color}18` }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: k.color }}>{k.value}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{k.icon} {k.label}</div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Battery sim summary */}
              <Card size="small" title={<span style={{ fontSize: 12 }}>🔋 电池模拟结果</span>} bodyStyle={{ padding: '8px 10px' }} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${result.result.batterySim.riskLevel === 'low' ? 'rgba(0,212,170,0.2)' : result.result.batterySim.riskLevel === 'high' || result.result.batterySim.riskLevel === 'critical' ? 'rgba(255,77,79,0.2)' : 'rgba(255,149,0,0.2)'}` }}>
                <Row gutter={[8, 8]}>
                  {[
                    { label: 'SoH损耗', value: `${(result.result.batterySim.sohLoss * 100).toFixed(4)}%`, color: result.result.batterySim.sohLoss > 0.01 ? '#FF4D4F' : '#00D4AA' },
                    { label: '等效循环', value: `${result.result.batterySim.cycleCount}次`, color: '#667EEA' },
                    { label: '最高温度', value: `${result.result.batterySim.maxTemp}°C`, color: result.result.batterySim.maxTemp > 45 ? '#FF4D4F' : '#00D4AA' },
                    { label: '风险等级', value: result.result.batterySim.riskLevel.toUpperCase(), color: result.result.batterySim.riskLevel === 'low' ? '#00D4AA' : result.result.batterySim.riskLevel === 'critical' ? '#FF4D4F' : '#FF9500' },
                  ].map(k => (
                    <Col span={6} key={k.label}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{k.label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* Dispatch plan chart */}
              <Card size="small" title={<span style={{ fontSize: 12 }}>📊 调度计划（充放电功率）</span>} bodyStyle={{ padding: '8px 8px 4px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}>
                <ReactECharts option={dispatchChartOption} style={{ height: 160 }} />
              </Card>

              {/* Solar + Price forecast */}
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Card size="small" title={<span style={{ fontSize: 11 }}>☀️ 光伏出力预测</span>} bodyStyle={{ padding: '6px 6px 2px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,149,0,0.12)' }}>
                    <ReactECharts option={solarChartOption} style={{ height: 120 }} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title={<span style={{ fontSize: 11 }}>⚡ 日前电价预测</span>} bodyStyle={{ padding: '6px 6px 2px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
                    <ReactECharts option={priceChartOption} style={{ height: 120 }} />
                  </Card>
                </Col>
              </Row>

              {/* Risk alerts */}
              {result.finalRecommendation.riskAlerts.length > 0 && (
                <Card size="small" title={<span style={{ fontSize: 12 }}>⚠️ 风险提示</span>} bodyStyle={{ padding: '8px 10px' }} style={{ background: 'rgba(255,77,79,0.05)', border: '1px solid rgba(255,77,79,0.2)' }}>
                  {result.finalRecommendation.riskAlerts.map((alert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < result.finalRecommendation.riskAlerts.length - 1 ? 6 : 0 }}>
                      <WarningOutlined style={{ color: alert.level === 'high' ? '#FF4D4F' : '#FF9500', fontSize: 11 }} />
                      <span style={{ fontSize: 11, color: alert.level === 'high' ? '#FF4D4F' : '#FF9500' }}>{alert.message}</span>
                    </div>
                  ))}
                </Card>
              )}

              {/* Recommended actions */}
              {result.finalRecommendation.actions.length > 0 && (
                <Card size="small" title={<span style={{ fontSize: 12 }}>📋 建议操作</span>} bodyStyle={{ padding: '8px 10px' }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)' }}>
                  {result.finalRecommendation.actions.slice(0, 6).map((action, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < Math.min(result.finalRecommendation.actions.length, 6) - 1 ? 6 : 0 }}>
                      <Tag color={action.action === '放电' ? 'red' : 'blue'} style={{ fontSize: 10, margin: 0 }}>{action.time}</Tag>
                      <span style={{ fontSize: 11, color: action.action === '放电' ? '#FF4D4F' : '#667EEA', fontWeight: 600 }}>{action.action} {action.powerKw}kW</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', flex: 1 }}>{action.reason}</span>
                    </div>
                  ))}
                </Card>
              )}

              {/* Execution time */}
              <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                任务ID: {result.sessionId} | 耗时 {result.totalDurationMs}ms | {new Date(result.completedAt).toLocaleTimeString('zh-CN')}
              </div>
            </div>
          ) : (
            <Card
              size="small"
              bodyStyle={{ padding: '40px 20px', textAlign: 'center' }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.12)', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Agent 控制台待命</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 20 }}>点击「执行日优化」，4个Agent将串联运行</div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                {AGENTS.map(a => (
                  <div key={a.id} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>{a.icon}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{a.shortName}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
