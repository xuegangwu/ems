import { useState } from 'react';
import { Card, Row, Col, InputNumber, Select, Divider } from 'antd';
import ReactECharts from 'echarts-for-react';

// ─── Utility ──────────────────────────────────────────────────────────────────────────────
const formatK = (n: number) => n >= 10000 ? `${(n/10000).toFixed(1)}万` : n.toFixed(0);

type ToolKey = 'roi' | 'config' | 'revenue';

const TOOLS = [
  { key: 'roi' as ToolKey, icon: '📊', label: '投资回报计算器', desc: '计算光储项目投资回报周期、IRR、NPV' },
  { key: 'config' as ToolKey, icon: '⚡', label: '系统配置推荐', desc: '根据负载情况推荐最优光储充配置' },
  { key: 'revenue' as ToolKey, icon: '💰', label: '收益分析工具', desc: '分项计算峰谷套利、VPP收益、节省电费' },
];

// ─── ROI Calculator ───────────────────────────────────────────────────────────────────
function ROICalculator() {
  const [pv, setPv] = useState(1000);      // kW
  const [storage, setStorage] = useState(2000); // kWh
  const [evCharger, setEvCharger] = useState(200); // kW
  const [elecPrice, setElecPrice] = useState(0.7); // CNY/kWh
  const [fit, setFit] = useState(0.35);    // CNY/kWh FIT
  const [subsidy, setSubsidy] = useState((1000)); // CNY/kW 补贴

  const pvCost = pv * 4000 + storage * 1500 + evCharger * 3000;
  const totalSubsidy = pv * subsidy;
  const netCost = pvCost - totalSubsidy;

  // Annual revenue estimates
  const selfConsume = pv * 1200 * 0.7; // 70% self-consumption
  const feedIn = pv * 1200 * 0.3;       // 30% feed to grid
  const storageBenefit = storage * 0.5 * 365 * elecPrice * 0.5; // 0.5 CNY/kWh avg arbitrage
  const evBenefit = evCharger * 0.6 * 2000 * elecPrice; // 60% utilization
  const annualRevenue = selfConsume * elecPrice + feedIn * fit + storageBenefit + evBenefit;

  const payback = annualRevenue > 0 ? netCost / annualRevenue : 0;
  const rate = payback > 0 ? (1 / payback * 100) : 0;
  const npv10y = annualRevenue * ((1 - Math.pow(1.1, -10)) / 0.1) - netCost;

  const yearlyData = Array.from({ length: 10 }, (_, i) => ({
    year: i + 1,
    revenue: annualRevenue,
    cumulative: annualRevenue * (i + 1),
    cost: netCost,
    profit: annualRevenue * (i + 1) - netCost,
  }));

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,15,35,0.9)', borderColor: 'rgba(102,126,234,0.3)', textStyle: { color: 'white' } },
    legend: { data: ['累计收益', '累计成本', '累计利润'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)' } },
    grid: { top: 10, right: 10, bottom: 40, left: 55 },
    xAxis: { type: 'category', data: yearlyData.map(d => `第${d.year}年`), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' } },
    yAxis: { type: 'value', name: '万元', axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)', formatter: (v: number) => (v / 10000).toFixed(0) }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
    series: [
      { name: '累计收益', type: 'bar', stack: 'total', data: yearlyData.map(d => parseFloat((d.cumulative / 10000).toFixed(2))), itemStyle: { color: '#00D4AA' } },
      { name: '累计成本', stack: 'total', type: 'bar', data: yearlyData.map(d => parseFloat((-d.cost / 10000).toFixed(2))), itemStyle: { color: 'rgba(255,77,79,0.6)' } },
      { name: '累计利润', type: 'line', data: yearlyData.map(d => parseFloat((d.profit / 10000).toFixed(2))), itemStyle: { color: '#FFD700' }, lineStyle: { color: '#FFD700' } },
    ],
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, fontWeight: 600 }}>📥 项目参数</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>光伏容量 (kW)</span>
                <InputNumber min={0} max={10000} value={pv} onChange={v => setPv(v ?? 0)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>储能容量 (kWh)</span>
                <InputNumber min={0} max={20000} value={storage} onChange={v => setStorage(v ?? 0)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>充电桩 (kW)</span>
                <InputNumber min={0} max={2000} value={evCharger} onChange={v => setEvCharger(v ?? 0)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>电价 (CNY/kWh)</span>
                <InputNumber min={0.1} max={2} step={0.01} value={elecPrice} onChange={v => setElecPrice(v ?? 0.7)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>光伏上网价 (CNY/kWh)</span>
                <InputNumber min={0.1} max={1} step={0.01} value={fit} onChange={v => setFit(v ?? 0.35)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>光伏补贴 (CNY/kW)</span>
                <InputNumber min={0} max={3000} value={subsidy} onChange={v => setSubsidy(v ?? 0)} style={{ width: 120 }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Row gutter={[8, 8]}>
            <Col span={12}><Card size="small" style={{ background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.2)', textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>💰 总投资</div><div style={{ fontSize: 20, fontWeight: 700, color: '#FFB400' }}>¥{formatK(pvCost)}</div><div style={{ fontSize: 11, color: '#00D4AA' }}>补贴 ¥{formatK(totalSubsidy)}</div></Card></Col>
            <Col span={12}><Card size="small" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>📆 回本周期</div><div style={{ fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>{payback > 0 ? `${payback.toFixed(1)}年` : '—'}</div></Card></Col>
            <Col span={12}><Card size="small" style={{ background: 'rgba(102,126,234,0.08)', border: '1px solid rgba(102,126,234,0.2)', textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>📈 IRR</div><div style={{ fontSize: 20, fontWeight: 700, color: '#667EEA' }}>{rate > 0 ? `${rate.toFixed(1)}%` : '—'}</div></Card></Col>
            <Col span={12}><Card size="small" style={{ background: 'rgba(255,77,79,0.06)', border: '1px solid rgba(255,77,79,0.15)', textAlign: 'center' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>💹 10年NPV</div><div style={{ fontSize: 20, fontWeight: 700, color: '#FF4D4F' }}>{npv10y > 0 ? `¥${formatK(npv10y)}` : '—'}</div></Card></Col>
          </Row>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)', marginTop: 8 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>📊 年均收益构成</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>自用节省电费</span><span style={{ color: '#FFD700' }}>¥{formatK(selfConsume * elecPrice)}/年</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>余电上网收益</span><span style={{ color: '#9B59B6' }}>¥{formatK(feedIn * fit)}/年</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>峰谷套利收益</span><span style={{ color: '#00D4AA' }}>¥{formatK(storageBenefit)}/年</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>充电服务收益</span><span style={{ color: '#38A169' }}>¥{formatK(evBenefit)}/年</span></div>
              <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}><span style={{ color: 'white' }}>年均总收益</span><span style={{ color: '#00D4AA' }}>¥{formatK(annualRevenue)}/年</span></div>
            </div>
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>📈 10年累计收益走势（万元）</div>
        <ReactECharts option={chartOption} style={{ height: 220 }} />
      </Card>
    </div>
  );
}

// ─── System Configurator ──────────────────────────────────────────────────────────────
function SystemConfigurator() {
  const [annualConsumption, setAnnualConsumption] = useState(1000000); // kWh/year
  const [peakLoad, setPeakLoad] = useState(500); // kW
  const [evCount, setEvCount] = useState(20);
  const [area, setArea] = useState(5000); // m² roof area
  const [goal, setGoal] = useState('cost');

  const peakHours = 1500; // hours/year
  const pvEfficiency = 150; // kWh/m²/year
  const selfConsumeRate = 0.7;

  const recommendedPv = Math.min(Math.floor(area * 0.6 / pvEfficiency * 1000), Math.floor(annualConsumption * 0.8 / peakHours));
  const recommendedStorage = Math.max(500, Math.round(peakLoad * 2));
  const recommendedEv = Math.max(4, Math.round(evCount * 0.6));

  const currentElecCost = annualConsumption * 0.7 / 10000;
  const newElecCost = (annualConsumption * (1 - selfConsumeRate * 0.4)) * 0.7 / 10000;
  const annualSaving = currentElecCost - newElecCost;

  const roiData = [
    { label: '☀️ 光伏', value: `${recommendedPv} kW`, color: '#FFD700', detail: `屋顶可装 ${Math.floor(area * 0.6)}m²，年发电 ${(recommendedPv * peakHours / 1000).toFixed(0)}MWh` },
    { label: '🔋 储能', value: `${recommendedStorage} kWh`, color: '#00D4AA', detail: `支持 ${(recommendedStorage / peakLoad * 100).toFixed(0)}% 峰值负荷覆盖` },
    { label: '🚗 充电桩', value: `${recommendedEv} 台`, color: '#38A169', detail: `满足 ${Math.round(evCount * 0.6)} 辆电动车日常充电` },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, fontWeight: 600 }}>📥 园区参数</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>年用电量 (kWh)</span>
                <InputNumber min={10000} max={100000000} value={annualConsumption} onChange={v => setAnnualConsumption(v ?? 1000000)} style={{ width: 130 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>峰值负荷 (kW)</span>
                <InputNumber min={10} max={50000} value={peakLoad} onChange={v => setPeakLoad(v ?? 500)} style={{ width: 130 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>电动车数量</span>
                <InputNumber min={0} max={1000} value={evCount} onChange={v => setEvCount(v ?? 20)} style={{ width: 130 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>可用屋顶面积 (m²)</span>
                <InputNumber min={100} max={100000} value={area} onChange={v => setArea(v ?? 5000)} style={{ width: 130 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>优化目标</span>
                <Select value={goal} onChange={setGoal} style={{ width: 130 }}
                  options={[{ value: 'cost', label: '电费最低' }, { value: 'self', label: '自给率最高' }, { value: 'vpp', label: 'VPP收益' }]}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)', height: '100%' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16, fontWeight: 600 }}>⚡ 推荐配置方案</div>
            <Row gutter={[8, 8]}>
              {roiData.map(item => (
                <Col span={24} key={item.label}>
                  <div style={{ background: `${item.color}10`, border: `1px solid ${item.color}30`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{item.detail}</div>
                  </div>
                </Col>
              ))}
              <Col span={24}>
                <div style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>💡 预计年电费节省</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>¥{(annualSaving / 10000).toFixed(0)}万</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>自发自用率提升至 {Math.round(selfConsumeRate * 100)}%</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>📊 负载曲线 vs 光伏出力 vs 储能调度（典型日）</div>
        {(() => {
          const hours = Array.from({ length: 24 }, (_, i) => i);
          const load = hours.map(h => {
            if (h >= 8 && h <= 11) return peakLoad * (0.7 + Math.random() * 0.3);
            if (h >= 14 && h <= 18) return peakLoad * (0.6 + Math.random() * 0.3);
            if (h >= 19 && h <= 21) return peakLoad * 0.8;
            return peakLoad * 0.3;
          });
          const solar = hours.map(h => h >= 6 && h <= 18 ? recommendedPv * Math.sin((h - 6) / 12 * Math.PI) * (0.8 + Math.random() * 0.2) : 0);
          const storage = hours.map(h => {
            if (h >= 9 && h <= 15 && solar[h] > load[h]) return Math.min(storageBenefitCheck(), (solar[h] - load[h]));
            if ((h >= 18 && h <= 23) && load[h] > solar[h]) return -(load[h] - solar[h]) * 0.5;
            return 0;
          });
          const storageBenefitCheck = () => recommendedStorage * 0.1;
          const chartOption = {
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,15,35,0.9)', textStyle: { color: 'white' } },
            legend: { data: ['负载', '光伏', '储能'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)' } },
            grid: { top: 10, right: 10, bottom: 40, left: 50 },
            xAxis: { type: 'category', data: hours.map(h => `${h}:00`), axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)', interval: 3 } },
            yAxis: { type: 'value', name: 'kW', axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } } },
            series: [
              { name: '负载', type: 'line', smooth: true, data: load.map(v => parseFloat(v.toFixed(1))), itemStyle: { color: '#9B59B6' }, areaStyle: { color: 'rgba(155,89,182,0.1)' } },
              { name: '光伏', type: 'line', smooth: true, data: solar.map(v => parseFloat(v.toFixed(1))), itemStyle: { color: '#FFD700' } },
              { name: '储能', type: 'line', smooth: true, data: storage.map(v => parseFloat(v.toFixed(1))), itemStyle: { color: '#00D4AA' } },
            ],
          };
          return <ReactECharts option={chartOption} style={{ height: 220 }} />;
        })()}
      </Card>
    </div>
  );
}

// ─── Revenue Analyzer ────────────────────────────────────────────────────────────────
function RevenueAnalyzer() {
  const [pv, setPv] = useState(1000);
  const [storage, setStorage] = useState(2000);
  const [evCharger, setEvCharger] = useState(200);
  const [vppCapacity, setVppCapacity] = useState(500);

  const peakPrice = 1.2, offPeakPrice = 0.3;
  const cycles = 2, efficiency = 0.9;
  const vppCapacityPayment = 300; // CNY/kW/year
  const vppEnergyPayment = 0.8;    // CNY/kWh

  const peakValley = storage * cycles * efficiency * (peakPrice - offPeakPrice) * 365;
  const evRevenue = evCharger * 0.6 * 2000 * 0.8; // service fee
  const carbon = pv * 1200 * 0.7 * 0.0008; // 0.8kg CO2/kWh
  const carbonRevenue = carbon * 100; // CNY/ton

  const items = [
    { label: '⚡ 峰谷套利收益', value: peakValley, color: '#00D4AA', detail: `${storage} kWh × ${cycles}次 × ${(peakPrice - offPeakPrice).toFixed(2)}元/kWh × 365天` },
    { label: '🏭 VPP容量费', value: vppCapacity * vppCapacityPayment, color: '#667EEA', detail: `${vppCapacity} kW × ${vppCapacityPayment}元/kW/年` },
    { label: '📊 VPP电量费', value: vppCapacity * vppEnergyPayment * 365 * 0.1, color: '#FF9500', detail: `${vppCapacity} kW × ${vppEnergyPayment}元/kWh × 响应10%时间` },
    { label: '🚗 充电服务费', value: evRevenue, color: '#38A169', detail: `${evCharger} kW × 60%利用率 × 2000h × 0.8元/kWh服务费` },
    { label: '🌱 碳减排收益', value: carbonRevenue, color: '#2ECC71', detail: `${(pv * 1200 * 0.7 / 1000).toFixed(0)}吨 CO₂ × ¥100/吨` },
  ];

  const total = items.reduce((s, item) => s + item.value, 0);

  const chartOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,15,35,0.9)', textStyle: { color: 'white' } },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: 'rgba(255,255,255,0.6)' } },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      center: ['35%', '50%'],
      data: items.map((item) => ({
        name: item.label,
        value: parseFloat(item.value.toFixed(0)),
        itemStyle: { color: item.color },
      })),
      label: { formatter: '{b}\n¥{c}', color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    }],
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, fontWeight: 600 }}>📥 系统参数</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>光伏 (kW)</span>
                <InputNumber min={0} max={10000} value={pv} onChange={v => setPv(v ?? 0)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>储能 (kWh)</span>
                <InputNumber min={0} max={20000} value={storage} onChange={v => setStorage(v ?? 0)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>充电桩 (kW)</span>
                <InputNumber min={0} max={2000} value={evCharger} onChange={v => setEvCharger(v ?? 0)} style={{ width: 120 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>VPP签约容量 (kW)</span>
                <InputNumber min={0} max={5000} value={vppCapacity} onChange={v => setVppCapacity(v ?? 0)} style={{ width: 120 }} />
              </div>
            </div>
          </Card>
          <Card style={{ marginTop: 12, background: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,180,0,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>💰 年度总收益</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#FFB400' }}>¥{formatK(total)}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>≈ ¥{(total / 10000).toFixed(1)}万 / 年</div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)', height: '100%' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>📊 收益构成占比</div>
            <ReactECharts option={chartOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>
      <Card style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(102,126,234,0.12)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>📋 分项明细</div>
        <Row gutter={[8, 8]}>
          {items.map(item => (
            <Col xs={24} sm={12} key={item.label}>
              <div style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: item.color }}>¥{formatK(item.value)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{item.detail}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

// ─── Main Tools Page ──────────────────────────────────────────────────────────────────────
export default function Tools() {
  const [active, setActive] = useState<ToolKey>('roi');

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: 'white', marginBottom: 4 }}>🔧 工具箱</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>光储充项目分析工具集</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TOOLS.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)} style={{
            padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            background: active === t.key ? '#00D4AA' : 'rgba(255,255,255,0.06)',
            color: active === t.key ? '#0A0E1A' : 'rgba(255,255,255,0.6)',
            fontWeight: active === t.key ? 700 : 400,
            transition: 'all 0.2s',
          }}>
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {active === 'roi' && <ROICalculator />}
      {active === 'config' && <SystemConfigurator />}
      {active === 'revenue' && <RevenueAnalyzer />}
    </div>
  );
}
