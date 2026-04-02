import { useState, useEffect } from 'react'
import { Card, Row, Col, Progress, Tag } from 'antd'
import ReactECharts from 'echarts-for-react'

// ── Mock monthly forecast ─────────────────────────────────────────────────────
function computeForecast(realtime: any[]) {
  const station = realtime[0];
  const latest = station?.latest || {};
  const solarPower = Math.max(0, latest.solarPowerKw || 0);
  const loadPower = latest.loadPowerKw || 100;

  // Current day's metrics
  const todaySolarKwh = solarPower * 8 * 0.8;
  const todayLoadKwh = loadPower * 24;
  const todayGridKwh = Math.max(0, loadPower - solarPower) * 12;
  const todayCost = todayGridKwh * 0.65;
  const todaySaving = todaySolarKwh * 0.80;

  // Month-to-date
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
const mtdKwh = todayLoadKwh * dayOfMonth;
  const mtdCost = todayCost * dayOfMonth;
  const mtdSaving = todaySaving * dayOfMonth;
  const mtdCarbon = mtdKwh * 0.0004; // tonnes CO2

  // Month-end forecast
  const dailyAvgCost = mtdCost / dayOfMonth;
  const remainingDays = daysInMonth - dayOfMonth;
  const forecastCost = mtdCost + dailyAvgCost * remainingDays;
  const forecastSaving = mtdSaving + todaySaving * remainingDays;
  const forecastCarbon = mtdCarbon + (todaySolarKwh * 0.0004) * remainingDays;

  // vs factory average (mock: factory avg = 4500 kWh/day)
  const factoryDailyAvg = 4500;
  const ourDailyKwh = todayLoadKwh;
  const efficiencyPct = ((factoryDailyAvg - ourDailyKwh) / factoryDailyAvg * 100);
  const vsAvgLabel = efficiencyPct > 0
    ? `比同类工厂节能 ${efficiencyPct.toFixed(1)}%`
    : `比同类工厂多用 ${Math.abs(efficiencyPct).toFixed(1)}%`;

  // CO2 equivalencies
  const treeEquivalent = (mtdCarbon * 1000 / 18).toFixed(0); // ~18kg CO2 per tree per year
  const carMilesEquivalent = (mtdCarbon * 3600 / 0.411).toFixed(0); // 0.411kg CO2/mile avg car
  const coalKgAvoided = (mtdCarbon * 1000 / 2.42).toFixed(0); // 2.42kg CO2 per kg coal burned

  // Carbon intensity trend (mock)
  const monthStartCarbon = mtdCarbon * (dayOfMonth / daysInMonth);
  const carbonReductionPct = monthStartCarbon > 0
    ? ((monthStartCarbon - mtdCarbon) / monthStartCarbon * 100) : 0;

  // Day progress (for "today" ring)
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const dayProgressPct = Math.min(100, (nowMinute / (24 * 60)) * 100);

  return {
    // Today
    todaySolarKwh: Math.round(todaySolarKwh),
    todayLoadKwh: Math.round(todayLoadKwh),
    todayGridKwh: Math.round(todayGridKwh),
    todayCost: Math.round(todayCost),
    todaySaving: Math.round(todaySaving),
    // MTD
    mtdKwh: Math.round(mtdKwh),
    mtdCost: Math.round(mtdCost),
    mtdSaving: Math.round(mtdSaving),
    mtdCarbon: parseFloat(mtdCarbon.toFixed(2)),
    dayOfMonth,
    // Month forecast
    forecastCost: Math.round(forecastCost),
    forecastSaving: Math.round(forecastSaving),
    forecastCarbon: parseFloat(forecastCarbon.toFixed(2)),
    remainingDays,
    // Comparisons
    vsAvgLabel,
    efficiencyPct: parseFloat(efficiencyPct.toFixed(1)),
    factoryDailyAvg,
    // CO2 equivalencies
    treeEquivalent,
    carMilesEquivalent,
    coalKgAvoided,
    // Progress
    dayProgressPct: Math.round(dayProgressPct),
    monthProgressPct: Math.round((dayOfMonth / daysInMonth) * 100),
    // Carbon trend
    carbonReductionPct,
  };
}

// ── Month forecast chart ──────────────────────────────────────────────────────
function buildMonthChart(data: ReturnType<typeof computeForecast>) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const dailyCost = data.todayCost;

  const actualDays = Array.from({ length: dayOfMonth }, (_, i) => ({
    day: i + 1,
    cost: dailyCost * (0.85 + Math.random() * 0.3),
    isFuture: false,
  }));
  const futureDays = Array.from({ length: daysInMonth - dayOfMonth }, (_, i) => ({
    day: dayOfMonth + i + 1,
    cost: dailyCost * (0.85 + Math.random() * 0.3),
    isFuture: true,
  }));
  const allDays = [...actualDays, ...futureDays];

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: 'rgba(102,126,234,0.2)',
      textStyle: { color: '#fff', fontSize: 11 },
      formatter: (p: any) => {
        const d = p[0];
        const isFuture = d.dataIndex >= dayOfMonth - 1;
        return `<div style="padding:4px">
          <div style="font-weight:700;margin-bottom:4px">${d.day}日${isFuture ? ' (预测)' : ''}</div>
          <div>¥<b>${(d.value as number).toFixed(0)}</b></div>
        </div>`;
      }
    },
    grid: { top: 16, right: 20, bottom: 40, left: 52 },
    xAxis: {
      type: 'category',
      data: allDays.map(d => d.day + '日'),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, interval: 2 },
    },
    yAxis: {
      type: 'value', name: '¥/天',
      axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, formatter: '¥{value}' },
    },
    series: [{
      type: 'bar',
      data: allDays.map((d, i) => ({
        value: Math.round(d.cost),
        itemStyle: {
          color: i < dayOfMonth
            ? (d.cost < dailyCost ? '#34D399' : '#F87171')
            : 'rgba(102,126,234,0.3)',
          borderRadius: [2, 2, 0, 0],
        }
      })),
      barMaxWidth: 12,
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: 'rgba(255,255,255,0.15)', type: 'dashed', width: 1 },
        data: [{ yAxis: dailyCost, label: { formatter: '今日均: ¥' + dailyCost, position: 'end', color: 'rgba(255,255,255,0.4)', fontSize: 9 } }]
      }
    }],
  };
}

export default function EnergyReport() {
  const [data, setData] = useState<ReturnType<typeof computeForecast> | null>(null);

  useEffect(() => {
    fetch('/api/mqtt/realtime')
      .then(r => r.json())
      .then(d => {
        const stations = d?.stations || [];
        setData(computeForecast(stations));
      });

    const timer = setInterval(() => {
      fetch('/api/mqtt/realtime')
        .then(r => r.json())
        .then(d => {
          const stations = d?.stations || [];
          setData(computeForecast(stations));
        });
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const monthName = new Date().toLocaleDateString('zh-CN', { month: 'long' });

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>📈 能源月报</h2>
        <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 13 }}>
          {monthName}实时追踪 · 月底预测 · 碳足迹等价物
        </p>
      </div>

      {data && (
        <>
          {/* Month Progress + Forecast Header */}
          <Row gutter={12} style={{ marginBottom: 16 }}>
            {/* Month progress ring */}
            <Col span={5}>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', textAlign: 'center', height: '100%' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>本月进度</div>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
                  <Progress
                    type="circle"
                    percent={data.monthProgressPct}
                    strokeColor={{ '0%': '#667EEA', '100%': '#9B5DE5' }}
                    trailColor="rgba(255,255,255,0.06)"
                    strokeWidth={8}
                    size={80}
                    format={() => `${data.dayOfMonth}日`}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                 剩余 {data.remainingDays} 天
                </div>
              </Card>
            </Col>

            {/* Month-end forecast */}
            <Col span={19}>
              <Card size="small" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', height: '100%' }}>
                <Row gutter={[24, 8]} align="middle">
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>预计月底电费</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: '#F87171', lineHeight: 1.2 }}>
                        ¥{data.forecastCost.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        较上月同期 {data.mtdCost > 0 ? '↓' : '↑'} {Math.abs(((data.forecastCost / data.mtdCost - 1) * 100) || 0).toFixed(0)}%
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>已用电费</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
                        ¥{data.mtdCost.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        日均 ¥{Math.round(data.mtdCost / data.dayOfMonth)}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>光伏节省</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#34D399' }}>
                        ¥{data.mtdSaving.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        等效 {data.treeEquivalent} 棵树/年
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* CO2 Equivalencies */}
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>🌱 碳足迹 · 等价换算</span>}
                extra={<Tag style={{ background: 'rgba(52,211,153,0.15)', border: 'none', color: '#34D399', fontSize: 11 }}>
                  本月减排 {data.mtdCarbon.toFixed(1)}t CO₂
                </Tag>}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
                <Row gutter={24}>
                  {[
                    { icon: '🌳', value: data.treeEquivalent, unit: '棵', label: '等效树木', color: '#34D399', sub: '每年吸收CO₂' },
                    { icon: '🚗', value: data.carMilesEquivalent, unit: '公里', label: '等效驾驶', color: '#60A5FA', sub: '家用汽车全年' },
                    { icon: '⚫', value: data.coalKgAvoided, unit: 'kg', label: '等效节煤', color: '#A78BFA', sub: '标准煤燃烧' },
                    { icon: '🏭', value: ((data.mtdCarbon * 1000) / 1000).toFixed(1), unit: '吨', label: '减排总量', color: '#34D399', sub: 'CO₂排放避免' },
                  ].map(item => (
                    <Col span={6} key={item.label}>
                      <div style={{ textAlign: 'center', padding: '8px 4px' }}>
                        <div style={{ fontSize: 28 }}>{item.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>
                          {item.value}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.unit}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.sub}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={12}>
            {/* Month cost chart */}
            <Col span={15}>
              <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>📊 {monthName} 日均电费趋势</span>}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
                <ReactECharts option={buildMonthChart(data)} style={{ height: 220 }} />
                <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { color: '#34D399', label: '低于均价的日' },
                    { color: '#F87171', label: '高于均价的日' },
                    { color: 'rgba(102,126,234,0.3)', label: '预测日 (剩余' + data.remainingDays + '天)' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Comparisons + Today detail */}
            <Col span={9}>
              {/* vs factory average */}
              <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>🏭 vs 同类工厂</span>}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <Progress
                    type="circle"
                    percent={Math.min(100, 50 + data.efficiencyPct)}
                    strokeColor={data.efficiencyPct >= 0 ? '#34D399' : '#F87171'}
                    trailColor="rgba(255,255,255,0.06)"
                    strokeWidth={10}
                    size={90}
                    format={() => <span style={{ color: '#fff', fontSize: 13 }}>{data.efficiencyPct >= 0 ? '🌿' : '⚠️'}</span>}
                  />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: data.efficiencyPct >= 0 ? '#34D399' : '#F87171' }}>
                      {data.efficiencyPct >= 0 ? '领先' : '落后'} {Math.abs(data.efficiencyPct)}%
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      vs 园区均值 {data.factoryDailyAvg}kWh/天
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                      日均用电 {Math.round(data.todayLoadKwh / 24)}kW
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  {data.efficiencyPct >= 0
                    ? '✅ 贵司能源效率优于园区平均水平，光伏自用率表现优异'
                    : '⚠️ 建议检查高耗能设备，优化生产时段，增大储能调度'}
                </div>
              </Card>

              {/* Today snapshot */}
              <Card size="small" title={<span style={{ color: '#fff', fontWeight: 600 }}>⚡ 今日实时</span>}
                extra={<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>已过 {data.dayProgressPct}%</span>}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)' }}>
                <Row gutter={[8, 8]}>
                  {[
                    { label: '光伏发电', value: `${data.todaySolarKwh}kWh`, color: '#FFB020' },
                    { label: '用电量', value: `${data.todayLoadKwh}kWh`, color: '#A78BFA' },
                    { label: '电网购电', value: `${data.todayGridKwh}kWh`, color: '#F87171' },
                    { label: '实时电费', value: `¥${data.todayCost}`, color: '#fff' },
                    { label: '光伏节省', value: `¥${data.todaySaving}`, color: '#34D399' },
                    { label: '今日碳排', value: `${(data.todaySolarKwh * 0.0004).toFixed(1)}t`, color: '#9CA3AF' },
                  ].map(item => (
                    <Col span={12} key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{item.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.value}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {!data && (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
          正在加载能源数据...
        </div>
      )}
    </div>
  );
}
