import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Row, Col, Select, Statistic, Space, Badge } from 'antd'

// ── Energy Flow Data ──────────────────────────────────────────────────────

// ── Custom Canvas Energy Flow ───────────────────────────────────────────────
interface FlowEdge { from: { x: number; y: number }; to: { x: number; y: number }; color: string; label: string; power: number; dashed?: boolean; reverse?: boolean; }

function EnergyFlowCanvas({ realtime }: { realtime: { solar: number; battery: number; grid: number; load: number; soc: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, W, H);

    // Background dots
    ctx.fillStyle = 'rgba(102,126,234,0.07)';
    for (let x = 20; x < W; x += 24) {
      for (let y = 20; y < H; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Node positions (relative to canvas size)
    const nodes = {
      solar:   { x: W * 0.12, y: H * 0.35, icon: '☀️', label: '光伏', value: realtime.solar, unit: 'kW', color: '#FFB020', bg: 'rgba(255,176,0,0.12)' },
      battery: { x: W * 0.12, y: H * 0.68, icon: '🔋', label: `储能 ${realtime.soc.toFixed(0)}%`, value: Math.abs(realtime.battery), unit: 'kW', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
      load:    { x: W * 0.72, y: H * 0.35, icon: '🏭', label: '负荷', value: realtime.load, unit: 'kW', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
      grid:    { x: W * 0.72, y: H * 0.70, icon: '⚡', label: realtime.grid >= 0 ? '电网(购)' : '电网(售)', value: Math.abs(realtime.grid), unit: 'kW', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    };

    // Build flow edges based on data
    const flows: FlowEdge[] = [];
    const sw = (v: number) => Math.max(1.5, Math.min(6, v / 60));

    if (realtime.solar > 20) {
      const toBat = Math.min(realtime.solar * 0.35, 150);
      flows.push({ from: nodes.solar, to: nodes.battery, color: '#FFB020', label: `☀️→🔋 ${toBat.toFixed(0)}kW`, power: toBat });
    }
    if (realtime.solar > 0 && realtime.load > 0) {
      const toLoad = Math.min(realtime.solar * 0.65, realtime.load);
      flows.push({ from: nodes.solar, to: nodes.load, color: '#34D399', label: `☀️→🏭 ${toLoad.toFixed(0)}kW`, power: toLoad });
    }
    if (realtime.battery < -5) {
      // battery discharging → load
      // toLoad unused
      flows.push({ from: nodes.battery, to: nodes.load, color: '#60A5FA', label: `🔋→🏭 ${Math.abs(realtime.battery).toFixed(0)}kW`, power: Math.abs(realtime.battery) });
    }
    if (realtime.grid > 5) {
      // importing from grid
      flows.push({ from: nodes.grid, to: nodes.load, color: '#F87171', label: `⚡→🏭 ${realtime.grid.toFixed(0)}kW`, power: realtime.grid });
    } else if (realtime.grid < -5) {
      // exporting to grid (dashed)
      flows.push({ from: nodes.load, to: nodes.grid, color: '#F87171', label: `🏭→⚡ ${Math.abs(realtime.grid).toFixed(0)}kW`, power: Math.abs(realtime.grid), dashed: true });
    }

    // Animate particles along flows
    const t = Date.now() / 1000;

    // Draw edges
    flows.forEach((flow, i) => {
      const dx = flow.to.x - flow.from.x;
      const dy = flow.to.y - flow.from.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / len, ny = dy / len;

      // Draw the edge line
      ctx.save();
      ctx.strokeStyle = flow.color;
      ctx.lineWidth = sw(flow.power);
      ctx.globalAlpha = 0.3;
      if (flow.dashed) ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(flow.from.x, flow.from.y);
      ctx.lineTo(flow.to.x, flow.to.y);
      ctx.stroke();
      ctx.restore();

      // Animated particles
      const speed = 80;
      const numParticles = Math.max(2, Math.floor(len / speed));
      const cycleOffset = (t * speed + i * 30) % len;

      for (let p = 0; p < numParticles; p++) {
        let dist = ((p / numParticles) * len + cycleOffset) % len;
        const px = flow.from.x + nx * dist;
        const py = flow.from.y + ny * dist;
        const alpha = 0.5 + 0.5 * Math.sin((dist / len) * Math.PI * 2 + t * 2);
        const radius = 2 + (sw(flow.power) / 3);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = flow.color;
        ctx.fillStyle = flow.color;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Arrow head at midpoint
      const mx = (flow.from.x + flow.to.x) / 2;
      const my = (flow.from.y + flow.to.y) / 2;
      ctx.save();
      ctx.fillStyle = flow.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = flow.color;
      ctx.globalAlpha = 0.8;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(flow.label, mx, my - 10);
      ctx.restore();

      // Arrow
      const arrowX = flow.from.x + nx * (len * 0.85);
      const arrowY = flow.from.y + ny * (len * 0.85);
      const arrowSize = 8;
      const angle = Math.atan2(ny, nx);
      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angle);
      ctx.fillStyle = flow.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowSize, arrowSize * 0.5);
      ctx.lineTo(-arrowSize, -arrowSize * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Draw nodes
    Object.values(nodes).forEach(node => {
      const nodeW = 100, nodeH = 70;
      const x = node.x - nodeW / 2, y = node.y - nodeH / 2;

      // Glow
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = node.color + '44';
      ctx.fillStyle = node.bg;
      ctx.beginPath();
      ctx.roundRect(x, y, nodeW, nodeH, 12);
      ctx.fill();
      ctx.strokeStyle = node.color + '55';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Icon
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.icon, node.x, node.y - 8);

      // Label
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(node.label, node.x, node.y + 12);

      // Value
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillStyle = node.color;
      ctx.fillText(`${node.value.toFixed(0)} ${node.unit}`, node.x, node.y + 26);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const animate = () => { draw(); animRef.current = requestAnimationFrame(animate); };
    animRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [realtime]);

  return (
    <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(102,126,234,0.12)' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', background: 'rgba(10,14,26,0.6)' }} />
      {/* Legend */}
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
          { color: '#F87171', label: '电网购/售电' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 20, height: 2, background: l.color, borderRadius: 1 }} />
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
  const [demoMode, setDemoMode] = useState(true);
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
          battery: latest.batteryPowerKw || 0,  // positive=discharge, negative=charge
          grid: latest.gridPowerKw || 0,        // positive=import, negative=export
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

  // Demo mode: simulate daytime energy flow with smooth sine-wave animation
  useEffect(() => {
    if (!demoMode) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      const t = Date.now();
      setRealtime({
        solar: 320 + Math.sin(t / 3000) * 80,
        battery: -60 + Math.sin(t / 4000) * 20,
        grid: -20 + Math.sin(t / 5000) * 10,
        load: 180 + Math.sin(t / 4500) * 30,
        soc: 65 + Math.sin(t / 8000) * 10,
      });
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => { running = false; clearInterval(id); };
  }, [demoMode]);



  const totalGeneration = realtime.solar + realtime.battery;
  const selfSufficiency = realtime.load > 0 ? Math.min(100, (totalGeneration / realtime.load) * 100) : 0;

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>⚡ 能源数字孪生</h2>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 13 }}>
            实时能量流可视化{demoMode ? ' (模拟演示)' : ' · 实时数据'} · {STATIONS.find(s => s.id === stationId)?.name}
          </p>
        </div>
        <Space>
          <Select value={stationId} onChange={v => setStationId(v)} style={{ width: 200 }}
            options={STATIONS.map(s => ({ value: s.id, label: s.name }))}
          />
          <button
            onClick={() => setDemoMode(d => !d)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: `1px solid ${demoMode ? '#34D399' : 'rgba(102,126,234,0.2)'}`,
              background: demoMode ? 'rgba(52,211,153,0.15)' : 'transparent',
              color: demoMode ? '#34D399' : 'rgba(255,255,255,0.5)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {demoMode ? '🔴 关闭模拟' : '▶ 开启模拟'}
          </button>
          {demoMode && <Badge status="error" />}
          {!demoMode && <Badge status="processing" />}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>5s刷新</span>
        </Space>
      </div>

      {/* KPI Row */}
      <Row gutter={10}>
        {[
          { label: '光伏出力', value: `${realtime.solar.toFixed(0)} kW`, color: '#FFB020' },
          { label: realtime.battery >= 0 ? '储能放电' : '储能充电', value: `${Math.abs(realtime.battery).toFixed(0)} kW`, color: '#60A5FA' },
          { label: realtime.grid >= 0 ? '电网购电' : '电网售电', value: `${Math.abs(realtime.grid).toFixed(0)} kW`, color: '#F87171' },
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

      {/* Energy Flow Canvas */}
      <EnergyFlowCanvas realtime={realtime} />
    </div>
  );
}
