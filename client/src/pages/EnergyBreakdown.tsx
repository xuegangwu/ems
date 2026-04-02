import { useState, useEffect } from 'react'
import { Card, Row, Col, Select, Tag } from 'antd'
import ReactECharts from 'echarts-for-react'

// ── Mock hourly data generator ─────────────────────────────────────────────
function generateHourlyData() {
  const now = new Date();
  const currentHour = now.getHours();
  const data = [];

  for (let h = 0; h < 24; h++) {
    // Solar: peaks at noon
    const solar = h >= 7 && h <= 18
      ? Math.max(0, Math.sin((h - 7) / 11 * Math.PI) * 380 + (Math.random() - 0.5) * 40)
      : 0;

    // Load: office hours high, night low
    const baseLoad = h >= 9 && h <= 18 ? 65 + Math.sin((h - 9) / 9 * Math.PI) * 25
                  : h >= 19 && h <= 22 ? 80 - (h - 19) * 8
                  : 35 + Math.random() * 15;
    const load = baseLoad;

    // Battery: charges when solar > load, discharges when solar < load
    const excess = solar - load;
    const batteryFlow = excess > 20 ? Math.min(excess * 0.8, 80)   // charge
                    : excess < -10 ? Math.min(-excess, 60)          // discharge
                    : Math.random() * 10 - 5;

    // Grid: fills the gap
    const gridImport = Math.max(0, load - solar - Math.max(0, batteryFlow));
    const gridExport = Math.max(0, solar - load - Math.max(0, -batteryFlow));

    data.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      solar: parseFloat(solar.toFixed(1)),
      load: parseFloat(load.toFixed(1)),
      battery: parseFloat(Math.abs(batteryFlow).toFixed(1)),
      batteryDir: batteryFlow >= 0 ? 'charge' : 'discharge',
      gridImport: parseFloat(gridImport.toFixed(1)),
      gridExport: parseFloat(gridExport.toFixed(1)),
      isCurrent: h === currentHour,
    });
  }
  return data;
}

// ── Daily summary ─────────────────────────────────────────────────────────────
function summarizeDay(data: ReturnType<typeof generateHourlyData>) {
  const totalLoad = data.reduce((s, h) => s + h.load, 0);
  const totalSolar = data.reduce((s, h) => s + h.solar, 0);
  const solarSelf = Math.min(totalSolar, totalLoad);
  const gridImport = data.reduce((s, h) => s + h.gridImport, 0);
  const gridExport = data.reduce((s, h) => s + h.gridExport, 0);

  const GRID_PRICE = 0.65;
  const SOLAR_VALUE = 0.80;
  const BATTERY_CYCLE_COST = 8; // ¥ per full cycle

  const solarSaving = solarSelf * SOLAR_VALUE;
  const batteryCycleCount = data.reduce((s, h) => s + Math.abs(h.battery), 0) / 200;
  const batteryCost = batteryCycleCount * BATTERY_CYCLE_COST;
  const gridCost = gridImport * GRID_PRICE;
  const gridRevenue = gridExport * 0.30;
  const totalCost = gridCost - gridRevenue + batteryCost;

  return {
    totalLoad: parseFloat(totalLoad.toFixed(1)),
    totalSolar: parseFloat(totalSolar.toFixed(1)),
    solarSelf: parseFloat(solarSelf.toFixed(1)),
    solarSelfRate: parseFloat((solarSelf / totalLoad * 100).toFixed(1)),
    gridImport: parseFloat(gridImport.toFixed(1)),
    gridExport: parseFloat(gridExport.toFixed(1)),
    batteryCycles: parseFloat(batteryCycleCount.toFixed(2)),
    solarSaving: parseFloat(solarSaving.toFixed(0)),
    batteryCost: parseFloat(batteryCost.toFixed(0)),
    gridCost: parseFloat(gridCost.toFixed(0)),
    gridRevenue: parseFloat(gridRevenue.toFixed(0)),
    totalCost: parseFloat(totalCost.toFixed(0)),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EnergyBreakdown() {
  const [hourly, setHourly] = useState<ReturnType<typeof generateHourlyData>>([]);
  const [summary, setSummary] = useState<ReturnType<typeof summarizeDay> | null>(null);
  const [station, setStation] = useState('station-001');

  useEffect(() => {
    const d = generateHourlyData();
    setHourly(d);
    setSummary(summarizeDay(d));
  }, [station]);

  // Stacked area chart: Solar vs Grid Import vs Battery
  const stackedOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: 'rgba(102,126,234,0.2)',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const h = hourly[params[0].dataIndex];
        return `<div style="padding:4px">
          <div style="font-weight:700;margin-bottom:4px">${h.label}</div>
          <div style="margin-bottom:2px">🏭 负荷: <b>${h.load}kW</b></div>
          <div style="margin-bottom:2px">☀️ 光伏: <b>${h.solar}kW</b></div>
          <div style="margin-bottom:2px">🔋 ${h.batteryDir === 'charge' ? '充电' : '放电'}: <b>${h.battery}kW</b></div>
          <div>⚡ 电网: <b>${h.gridImport}kW</b></div>
        </div>`;
      }
    },
    legend: { data: ['光伏自用', '储能释能', '电网购电'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 } },
    grid: { top: 16, right: 16, bottom: 44, left: 48 },
    xAxis: {
      type: 'category', data: hourly.map(h => h.label),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, interval: 2 },
    },
    yAxis: {
      type: 'value', name: 'kWh', min: 0,
      nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
    },
    series: [
      {
        name: '光伏自用', type: 'bar', stack: 'total',
        data: hourly.map(h => ({ value: Math.min(h.solar, h.load), itemStyle: { color: '#FFB020', borderRadius: h.isCurrent ? [3,3,0,0] : [1,1,0,0] } })),
        barMaxWidth: 18,
      },
      {
        name: '储能释能', type: 'bar', stack: 'total',
        data: hourly.map(h => ({ value: h.batteryDir === 'discharge' ? h.battery : 0, itemStyle: { color: '#60A5FA', borderRadius: h.isCurrent ? [3,3,0,0] : [1,1,0,0] } })),
        barMaxWidth: 18,
      },
      {
        name: '电网购电', type: 'bar', stack: 'total',
        data: hourly.map(h => ({ value: h.gridImport, itemStyle: { color: '#F87171', borderRadius: h.isCurrent ? [3,3,0,0] : [1,1,0,0] } })),
        barMaxWidth: 18,
      },
    ],
  };

  // Pie chart: energy composition
  const pieOption = summary ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(102,126,234,0.2)', textStyle: { color: '#fff' },
      formatter: (p: any) => `${p.marker} ${p.name}: <b>${p.value}kWh</b> (${p.percent}%)` },
    legend: { orient: 'vertical', right: 16, top: 'center', textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#0a0e1a', borderWidth: 2 },
      label: { show: true, color: 'rgba(255,255,255,0.8)', fontSize: 11, formatter: '{b}\n{d}%' },
      data: [
        { name: '光伏自用', value: summary.solarSelf, itemStyle: { color: '#FFB020' } },
        { name: '储能释能', value: summary.gridImport > 0 ? Math.max(10, summary.gridImport) : 0, itemStyle: { color: '#60A5FA' } },
        { name: '电网购电', value: summary.gridImport, itemStyle: { color: '#F87171' } },
      ],
    }],
  } : {};

  // Cost breakdown pie
  const costOption = summary ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(102,126,234,0.2)', textStyle: { color: '#fff' },
      formatter: (p: any) => `${p.marker} ${p.name}: <b>¥${p.value}</b>` },
    legend: { orient: 'vertical', right: 16, top: 'center', textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['35%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#0a0e1a', borderWidth: 2 },
      label: { show: true, color: 'rgba(255,255,255,0.8)', fontSize: 11, formatter: '{b}\n¥{c}' },
      data: [
        { name: '电网购电成本', value: summary.gridCost, itemStyle: { color: '#F87171' } },
        { name: '电池损耗成本', value: summary.batteryCost, itemStyle: { color: '#60A5FA' } },
        { name: '光伏节省', value: summary.solarSaving, itemStyle: { color: '#FFB020' } },
      ],
    }],
  } : {};

  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>📊 能耗分解</h2>
          <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 13 }}>
            {today} · 各能源流向占比分析
          </p>
        </div>
        <Select value={station} onChange={setStation} style={{ width: 180 }}
          options={[
            { value: 'station-001', label: '苏州工业园 500kW/200kWh' },
            { value: 'station-002', label: '杭州站 350kW/150kWh' },
            { value: 'station-003', label: '上海站 200kW/100kWh' },
          ]}
        />
      </div>

      {/* Summary KPIs */}
      {summary && (
        <Row gutter={10} style={{ marginBottom: 16 }}>
          {[
            { label: '今日用电', value: summary.totalLoad.toFixed(0), unit: 'kWh', color: '#fff' },
            { label: '光伏发电', value: summary.totalSolar.toFixed(0), unit: 'kWh', color: '#FFB020' },
            { label: '自发自用率', value: summary.solarSelfRate, unit: '%', color: '#34D399' },
            { label: '电网购电', value: summary.gridImport.toFixed(0), unit: 'kWh', color: '#F87171' },
            { label: '今日电费', value: `¥${summary.totalCost.toFixed(0)}`, color: summary.totalCost > 0 ? '#F87171' : '#34D399', note: summary.totalCost > 0 ? '支出' : '盈余' },
            { label: '光伏节省', value: `¥${summary.solarSaving}`, unit: '', color: '#00D4AA' },
          ].map(s => (
            <Col span={4} key={s.label}>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(102,126,234,0.12)`, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                {s.note ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.note}</div> : null}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Row gutter={16}>
        {/* Left: Stacked area chart */}
        <Col span={15}>
          <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>⚡ 24h 能源流向（堆叠图）</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <ReactECharts option={stackedOption} style={{ height: 280 }} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[{ c: '#FFB020', l: '光伏自用' }, { c: '#60A5FA', l: '储能释能' }, { c: '#F87171', l: '电网购电' }].map(i => (
                <div key={i.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: i.c }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{i.l}</span>
                </div>
              ))}
              <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                * 柱状高度代表该小时各能源的实际使用量
              </div>
            </div>
          </Card>
        </Col>

        {/* Right top: Energy pie */}
        <Col span={9}>
          <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>📈 能源结构占比</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <ReactECharts option={pieOption} style={{ height: 180 }} />
          </Card>
          {/* Cost breakdown */}
          <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>💰 费用结构</span>}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', marginTop: 12 }}>
            <ReactECharts option={costOption} style={{ height: 180 }} />
          </Card>
        </Col>
      </Row>

      {/* Hourly detail table */}
      <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>⏰ 分时明细</span>}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', marginTop: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(102,126,234,0.1)' }}>
                {['时段', '负荷', '光伏', '电池', '电池方向', '电网', '自发自用率'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hourly.map(h => {
                const selfRate = h.load > 0 ? Math.min(100, (Math.min(h.solar, h.load) / h.load * 100)).toFixed(0) : '0';
                return (
                  <tr key={h.hour} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: h.isCurrent ? '#667EEA' : 'rgba(255,255,255,0.7)', fontWeight: h.isCurrent ? 700 : 400 }}>{h.label}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#A78BFA' }}>{h.load.toFixed(0)}kW</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#FFB020' }}>{h.solar.toFixed(0)}kW</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: '#60A5FA' }}>{h.battery.toFixed(0)}kW</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <Tag style={{ background: h.batteryDir === 'charge' ? 'rgba(0,212,170,0.15)' : 'rgba(96,165,250,0.15)', border: 'none', color: h.batteryDir === 'charge' ? '#00D4AA' : '#60A5FA', fontSize: 10 }}>
                        {h.batteryDir === 'charge' ? '充电' : '放电'}
                      </Tag>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', color: h.gridImport > 0 ? '#F87171' : '#34D399' }}>
                      {h.gridImport > 0 ? `${h.gridImport.toFixed(0)}kW` : '-'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                          <div style={{ width: `${selfRate}%`, height: '100%', background: '#34D399', borderRadius: 2 }} />
                        </div>
                        <span style={{ color: '#34D399', fontSize: 11, minWidth: 32 }}>{selfRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
