import { useState, useEffect, useRef } from 'react';
import { Row, Col, Select } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ── Animated Energy Flow ────────────────────────────────────────────────────
function EnergyFlowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Energy flow particles
    const flows = [
      { from: { x: 0.1, y: 0.5 }, to: { x: 0.45, y: 0.5 }, color: '#FFB020', speed: 1.2, label: '光伏', icon: '☀️', power: 3280 },
      { from: { x: 0.55, y: 0.35 }, to: { x: 0.55, y: 0.65 }, color: '#60A5FA', speed: 0.8, label: '储能', icon: '🔋', power: 156 },
      { from: { x: 0.55, y: 0.5 }, to: { x: 0.9, y: 0.5 }, color: '#F87171', speed: 0.6, label: '电网', icon: '⚡', power: -120 },
    ];

    const particles: any[] = [];
    const addParticle = (flow: typeof flows[0]) => {
      particles.push({
        flow,
        t: 0,
        x: flow.from.x,
        y: flow.from.y,
        size: 4 + Math.random() * 4,
        alpha: 0,
      });
    };

    let lastTime = 0;
    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 16, 3);
      lastTime = time;

      const W = canvas.width / window.devicePixelRatio;
      const H = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, W, H);

      // Background glow
      const grad = ctx.createRadialGradient(W * 0.55, H * 0.5, 0, W * 0.55, H * 0.5, W * 0.4);
      grad.addColorStop(0, 'rgba(102,126,234,0.06)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Draw flow paths
      flows.forEach(flow => {
        const x1 = flow.from.x * W, y1 = flow.from.y * H;
        const x2 = flow.to.x * W, y2 = flow.to.y * H;

        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = flow.color;
        ctx.strokeStyle = flow.color + '25';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Dashed line
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = flow.color + '40';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Icon at midpoint
        ctx.font = `${flow.icon === '☀️' ? 22 : 20}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(flow.icon, flow.from.x * W + 20, flow.from.y * H);

        // Power label
        const labelX = flow.to.x * W - 20;
        const labelY = flow.to.y * H;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = flow.color;
        ctx.fillText(`${Math.abs(flow.power)}kW`, labelX, labelY - 10);
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(flow.label, labelX, labelY + 6);
      });

      // Spawn particles
      if (Math.random() < 0.15 * dt) {
        const f = flows[Math.floor(Math.random() * flows.length)];
        addParticle(f);
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += 0.012 * dt * p.flow.speed;
        p.x = p.flow.from.x + (p.flow.to.x - p.flow.from.x) * p.t;
        p.y = p.flow.from.y + (p.flow.to.y - p.flow.from.y) * p.t;
        p.alpha = p.t < 0.2 ? p.t / 0.2 : p.t > 0.8 ? (1 - p.t) / 0.2 : 1;

        if (p.t >= 1) { particles.splice(i, 1); continue; }

        const px = p.x * W, py = p.y * H;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.flow.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.flow.color;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Center building hub
      const cx = W * 0.55, cy = H * 0.5;
      const r = 28;
      const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      hubGrad.addColorStop(0, 'rgba(102,126,234,0.3)');
      hubGrad.addColorStop(1, 'rgba(102,126,234,0.05)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = hubGrad;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(102,126,234,0.8)';
      ctx.fill();
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏢', cx, cy);

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, suffix, sub, color }: {
  icon: string; label: string; value: string | number;
  suffix?: string; sub?: string; color: string;
}) {
  return (
    <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kpi-label">{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <span className="kpi-value" style={{ fontSize: 24, color }}>{value}</span>
          {suffix && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{suffix}</span>}
        </div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickCard({ icon, label, desc, color, onClick }: {
  icon: string; label: string; desc: string; color: string; onClick: () => void;
}) {
  return (
    <div
      className="card"
      style={{
        padding: '16px 18px', cursor: 'pointer',
        transition: 'all 0.15s ease',
        borderColor: 'transparent',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = color + '40';
        (e.currentTarget as HTMLDivElement).style.background = color + '08';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent';
        (e.currentTarget as HTMLDivElement).style.background = '';
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{desc}</div>
    </div>
  );
}

// ── Chart configs ─────────────────────────────────────────────────────────────
const powerData = {
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(13,18,33,0.95)',
    borderColor: 'rgba(102,126,234,0.2)',
    textStyle: { color: 'white', fontSize: 12 },
  },
  legend: { data: ['光伏', '储能', '电网'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 } },
  grid: { top: 16, right: 16, bottom: 36, left: 44 },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  },
  yAxis: {
    type: 'value', name: 'kW',
    axisLine: { show: false },
    axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
    nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
  },
  series: [
    { name: '光伏', type: 'line', smooth: true, data: [0, 0, 120, 380, 420, 280, 50],
      areaStyle: { color: 'rgba(255,176,0,0.12)' }, lineStyle: { color: '#FFB020' }, itemStyle: { color: '#FFB020' },
      symbol: 'none',
    },
    { name: '储能', type: 'line', smooth: true, data: [-50, -80, -30, 60, 100, 80, 40],
      areaStyle: { color: 'rgba(96,165,250,0.12)' }, lineStyle: { color: '#60A5FA' }, itemStyle: { color: '#60A5FA' },
      symbol: 'none',
    },
    { name: '电网', type: 'line', smooth: true, data: [80, 120, 60, -20, -60, 20, 100],
      areaStyle: { color: 'rgba(248,113,113,0.1)' }, lineStyle: { color: '#F87171' }, itemStyle: { color: '#F87171' },
      symbol: 'none',
    },
  ],
};

const revenueData = {
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(13,18,33,0.95)', borderColor: 'rgba(102,126,234,0.2)', textStyle: { color: 'white', fontSize: 12 } },
  legend: { data: ['发电收益', '峰谷套利'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 } },
  grid: { top: 16, right: 16, bottom: 36, left: 44 },
  xAxis: {
    type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
    axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  },
  yAxis: {
    type: 'value', name: '万元',
    axisLine: { show: false },
    axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
    nameTextStyle: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },
  },
  series: [
    { name: '发电收益', type: 'bar', data: [12, 15, 18, 22, 28, 32],
      itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#667EEA' }, { offset: 1, color: '#9B5DE5' }] }, borderRadius: [4, 4, 0, 0] },
    },
    { name: '峰谷套利', type: 'bar', data: [3, 4, 5, 6, 7, 8],
      itemStyle: { color: '#34D399', borderRadius: [4, 4, 0, 0] },
    },
  ],
};

export default function Dashboard() {
  const [selectedStation, setSelectedStation] = useState('station-001');
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [optimal, setOptimal] = useState<any>(null);
  const [bill, setBill] = useState<any>(null);
  const [realtime, setRealtime] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch('/api/mqtt/realtime').then(r => r.json()).catch(() => null),
    ]).then(([mqttData]) => {
      if (mqttData?.stations) {
        const stations = mqttData.stations;
        setRealtime(stations);
        const primary = stations.find((s: any) => s.id === selectedStation) || stations[0];
        const latest = primary?.latest || {};
        const solar = latest?.solarPowerKw || 0;
        const gridImport = latest?.gridPowerKw > 0 ? latest.gridPowerKw : 0;
        const soc = latest?.batterySoc || 50;
        const solarKwh = Math.round(Math.max(0, solar) * 8 * 0.8);
        const gridKwh = Math.round(gridImport * 12);
        const batteryKwh = Math.round(soc / 100 * 200);
        const carbonTon = parseFloat((solarKwh * 0.0004).toFixed(2));
        const gridCost = gridKwh * 0.65;
        const solarSaving = solarKwh * 0.80;
        setBill({ solarKwh, batteryKwh, gridKwh, carbonTon, totalCost: Math.round(gridCost - solarSaving * 0.3), solarSaving: Math.round(solarSaving) });
      }
    });

    api.get('/electricity/prices/half-hourly?region=华东电网').then(r => {
      if (r.data?.success) setOptimal(r.data.data.optimal);
    }).catch(() => {});

    const timer = setInterval(() => {
      fetch('/api/mqtt/realtime').then(r => r.json()).then(d => {
        if (d?.stations) { setRealtime(d.stations); setRefreshTime(new Date()); }
      }).catch(() => {});
    }, 15000);

    return () => clearInterval(timer);
  }, [selectedStation]);

  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="page-enter" style={{ paddingTop: 4 }}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>能量指挥台</h2>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{today} · {realtime[0]?.name || '苏州工业园'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Select
            value={selectedStation}
            onChange={v => setSelectedStation(v)}
            style={{ width: 160, fontSize: 12 }}
            options={[
              { value: 'station-001', label: '苏州工业园' },
              { value: 'station-002', label: '杭州站' },
              { value: 'station-003', label: '上海站' },
            ]}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="status-dot online" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{refreshTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* ── Hero: Energy Flow Canvas ────────────────────────────────────── */}
      <div className="hero-energy" style={{ height: 'calc(52vh)', minHeight: 280, marginBottom: 18, position: 'relative' }}>
        <EnergyFlowCanvas />
        {/* Floating overlay text */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(7,11,20,0.7)', backdropFilter: 'blur(8px)',
          borderRadius: 10, padding: '8px 14px',
          border: '1px solid rgba(102,126,234,0.15)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>当前功率</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>3,280 <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>kW</span></div>
        </div>
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(7,11,20,0.7)', backdropFilter: 'blur(8px)',
          borderRadius: 10, padding: '6px 12px',
          border: '1px solid rgba(102,126,234,0.15)',
          fontSize: 11, color: '#34D399',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <div className="status-dot online" />
          实时能量流
        </div>
      </div>

      {/* ── Glanceable KPIs (4 cards) ───────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
        <Col xs={12} sm={12} md={6}>
          <KPICard
            icon="☀️" label="今日发电量" value={bill?.solarKwh?.toLocaleString() || '45,600'} suffix="kWh"
            sub="光伏利用率 86%" color="#FFB020"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <KPICard
            icon="🔋" label="储能SOC" value={bill ? Math.round(bill.batteryKwh / 200 * 100) : 78} suffix="%"
            sub={`可用 ${bill?.batteryKwh || 156} kWh`} color="#60A5FA"
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <KPICard
            icon="⚡" label="今日净收益" value={bill ? (bill.totalCost > 0 ? '+' : '') + '¥' + bill.totalCost.toLocaleString() : '+¥28,500'}
            sub="峰谷套利 ¥3,200" color={bill?.totalCost >= 0 ? '#34D399' : '#F87171'}
          />
        </Col>
        <Col xs={12} sm={12} md={6}>
          <KPICard
            icon="🌱" label="碳减排" value={bill?.carbonTon || 285} suffix="吨"
            sub="等效植树 1,425棵" color="#A78BFA"
          />
        </Col>
      </Row>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
          快捷功能
        </div>
        <Row gutter={[10, 10]}>
          <Col xs={12} sm={8} md={4}>
            <QuickCard icon="🤖" label="AI预测" desc="光伏/负荷预测" color="#667EEA" onClick={() => navigate('/ai-prediction')} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <QuickCard icon="⚡" label="AI调度" desc="峰谷套利优化" color="#00D4AA" onClick={() => navigate('/schedule')} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <QuickCard icon="📈" label="VPP交易" desc="虚拟电厂竞价" color="#F59E0B" onClick={() => navigate('/vpp-trading')} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <QuickCard icon="📅" label="电价日历" desc="实时电价查看" color="#EC4899" onClick={() => navigate('/electricity-price')} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <QuickCard icon="🌊" label="能量流" desc="数字孪生视图" color="#06B6D4" onClick={() => navigate('/digital-twin-flow')} />
          </Col>
          <Col xs={12} sm={8} md={4}>
            <QuickCard icon="📊" label="监控中心" desc="实时数据监控" color="#8B5CF6" onClick={() => navigate('/monitor')} />
          </Col>
        </Row>
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={14}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              ⚡ 实时功率曲线
            </div>
            <ReactECharts option={powerData} style={{ height: 260 }} />
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="card" style={{ padding: '14px 16px', height: '100%' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              💰 智能调度建议
            </div>
            {optimal ? (
              <div>
                <div style={{
                  padding: '10px 14px',
                  background: `${optimal.action?.color || '#667EEA'}15`,
                  border: `1px solid ${optimal.action?.color || '#667EEA'}30`,
                  borderRadius: 10, marginBottom: 12,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: optimal.action?.color || 'white', marginBottom: 3 }}>
                    {optimal.action?.text || '当前最优策略'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{optimal.action?.reason || '基于实时电价自动计算'}</div>
                </div>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ padding: '9px 12px', background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: '#00D4AA', marginBottom: 4, fontWeight: 600 }}>⚡ 最佳充电</div>
                      {(optimal.bestCharge || []).slice(0, 2).map((s: any) => (
                        <div key={s.time} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                          {s.time} <span style={{ fontSize: 10, color: '#00D4AA' }}>¥{s.price?.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ padding: '9px 12px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: '#F87171', marginBottom: 4, fontWeight: 600 }}>💰 最佳放电</div>
                      {(optimal.bestDischarge || []).slice(0, 2).map((s: any) => (
                        <div key={s.time} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                          {s.time} <span style={{ fontSize: 10, color: '#F87171' }}>¥{s.price?.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                  <SwapOutlined style={{ marginRight: 4 }} />
                  基于实时电价 · 每分钟自动刷新
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                加载调度建议...
              </div>
            )}
          </div>
        </Col>
        <Col xs={24} lg={14}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              💰 月度收益趋势
            </div>
            <ReactECharts option={revenueData} style={{ height: 220 }} />
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <div className="card" style={{ padding: '14px 16px', height: '100%' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              📋 今日能源账单
            </div>
            {bill ? (
              <div>
                {[
                  { icon: '☀️', label: '光伏发电', value: `${bill.solarKwh.toLocaleString()}kWh`, color: '#FFB020', bg: 'rgba(255,176,0,0.1)' },
                  { icon: '🔋', label: '储能(SOC)', value: `${bill.batteryKwh}kWh`, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
                  { icon: '⚡', label: '电网购电', value: `${bill.gridKwh}kWh`, color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
                  { icon: '🌱', label: '碳减排', value: `${bill.carbonTon}t`, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', background: item.bg,
                    borderRadius: 8, marginBottom: 7,
                  }}>
                    <div style={{ fontSize: 18 }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                加载账单数据...
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
