import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Tag, Statistic, Select, Spin, Alert, Divider } from 'antd'
import ReactECharts from 'echarts-for-react'
import { ArrowUpOutlined, ArrowDownOutlined, BulbOutlined, MoneyCollectOutlined } from '@ant-design/icons'

// ─── Types ─────────────────────────────────────────────────────────────────

interface TOUPeriod {
  hour: number
  price: number
  period: string
  type: string
}

interface OptimalStrategy {
  chargeHours: number[]
  dischargeHours: number[]
  peakPrice: number
  valleyPrice: number
  spread: number
  arbitrageProfit: number
  monthlySavingEstimate: number
}

interface PricingData {
  province: string
  provinceCode: string
  description: string
  currentTime: string
  isSharpSeason: boolean
  currentPeriod: { name: string; price: number; type: string } | null
  curve24h: TOUPeriod[]
  strategy: OptimalStrategy
}

interface SolarOverlapData {
  province: string
  solarCurve: Array<TOUPeriod & { solarOutput: number }>
  analysis: {
    avgPriceDuringSolar: number
    peakSolarHour: { hour: number; solarOutput: number; gridPrice: number }
    gridPeakPrice: number
    solarSelfUseProfit: number
    conclusion: string
  }
}

// ─── Color helpers ─────────────────────────────────────────────────────────

function priceColor(price: number): string {
  if (price <= 0.35) return '#0ea5e9'    // 深谷
  if (price <= 0.45) return '#06b6d4'    // 谷
  if (price <= 0.55) return '#00D4AA'   // 低谷偏低
  if (price <= 0.70) return '#34D399'   // 谷-平
  if (price <= 0.80) return '#FBBF24'   // 平
  if (price <= 0.95) return '#FB923C'   // 平-高
  if (price <= 1.10) return '#F87171'   // 高
  if (price <= 1.30) return '#EF4444'   // 尖
  return '#DC2626'                      // 极尖
}

function priceColorName(type: string): string {
  const map: Record<string, string> = {
    valley: '#0ea5e9',
    flat: '#FBBF24',
    peak: '#F87171',
    sharp: '#DC2626',
  }
  return map[type] || '#6B7280'
}

// ─── Main Component ─────────────────────────────────────────────────────────

const API_BASE = 'https://enos.solaripple.com/api'

export default function ElectricityPrice() {
  const [province, setProvince] = useState<'ZJ' | 'GD' | 'SH'>('ZJ')
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [solarData, setSolarData] = useState<SolarOverlapData | null>(null)
  const [compareData, setCompareData] = useState<{ ZJ: PricingData; GD: PricingData } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPricing = useCallback(async (prov: 'ZJ' | 'GD' | 'SH') => {
    setLoading(true)
    setError(null)
    try {
      const [pricingRes, solarRes] = await Promise.all([
        fetch(`${API_BASE}/market/pricing/${prov}`),
        fetch(`${API_BASE}/market/solar-overlap?province=${prov}`),
      ])
      if (!pricingRes.ok) throw new Error('API请求失败')
      const pricingJson = await pricingRes.json()
      const solarJson = await solarRes.json()
      setPricing(pricingJson.data)
      setSolarData(solarJson.data)
    } catch (e: any) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCompare = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/market/compare?p1=ZJ&p2=GD`)
      const json = await res.json()
      if (json.success && json.data.length === 2) {
        setCompareData({ ZJ: json.data[0], GD: json.data[1] })
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchPricing(province)
    fetchCompare()
  }, [province, fetchPricing, fetchCompare])

  // ─── Chart Options ──────────────────────────────────────────────────────

  const priceChartOption = () => {
    if (!pricing) return {}
    const { curve24h } = pricing
    const now = new Date()
    const currentHour = now.getHours()

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(102,126,234,0.2)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0]
          const d = curve24h[p.dataIndex]
          return `<div style="font-size:12px">
            <b>${String(d.hour).padStart(2,'0')}:00</b><br/>
            <span style="color:${priceColor(d.price)}">●</span> 电价: <b>¥${d.price.toFixed(3)}/kWh</b><br/>
            时段: <b>${d.period}</b>
          </div>`
        },
      },
      grid: { top: 40, right: 60, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: curve24h.map(h => `${String(h.hour).padStart(2,'0')}:00`),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11, interval: 2 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '¥/kWh',
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `¥${v.toFixed(2)}` },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        min: 0,
        max: 1.5,
      },
      series: [
        {
          name: '电价',
          type: 'bar',
          data: curve24h.map(d => ({
            value: d.price,
            itemStyle: {
              color: priceColor(d.price),
              borderRadius: currentHour === d.hour ? [4, 4, 0, 0] : [2, 2, 0, 0],
            },
          })),
          barMaxWidth: 28,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#6366f1', type: 'dashed', width: 1 },
            data: [
              { yAxis: pricing.strategy.valleyPrice, label: { formatter: `谷¥${pricing.strategy.valleyPrice}`, color: '#0ea5e9', fontSize: 10 } },
              { yAxis: pricing.strategy.peakPrice, label: { formatter: `峰¥${pricing.strategy.peakPrice}`, color: '#EF4444', fontSize: 10 } },
            ],
          },
          markArea: {
            silent: true,
            data: [
              // 谷电区域
              [{ yAxis: 0, itemStyle: { color: 'rgba(6,182,212,0.06)' } }, { yAxis: pricing.strategy.valleyPrice }],
              // 峰电区域
              [{ yAxis: pricing.strategy.peakPrice, itemStyle: { color: 'rgba(239,68,68,0.06)' } }, { yAxis: 1.5 }],
            ],
          },
        },
        // 光伏曲线叠加
        {
          name: '光伏出力',
          type: 'line',
          data: solarData?.solarCurve.map(s => [s.hour, s.solarOutput]) || [],
          smooth: true,
          lineStyle: { color: '#fbbf24', width: 2, type: 'dashed' },
          itemStyle: { color: '#fbbf24' },
          yAxisIndex: 1,
          symbol: 'none',
        },
      ],
    }
  }

  const solarChartOption = () => {
    if (!solarData) return {}
    const { solarCurve } = solarData

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(102,126,234,0.2)',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const priceP = params.find((p: any) => p.seriesName === '电价')
          const solarP = params.find((p: any) => p.seriesName === '光伏出力')
          if (!priceP && !solarP) return ''
          const hour = priceP?.dataIndex ?? solarP?.dataIndex ?? 0
          const d = solarCurve[hour]
          return `<div style="font-size:12px">
            <b>${String(hour).padStart(2,'0')}:00</b><br/>
            <span style="color:#fbbf24">☀</span> 光伏: <b>${(d?.solarOutput * 100).toFixed(0)}%</b><br/>
            <span style="color:${priceColor(d?.price ?? 0)}">●</span> 电价: <b>¥${d?.price?.toFixed(3)}/kWh</b>
          </div>`
        },
      },
      legend: {
        data: ['电价', '光伏出力'],
        top: 0,
        textStyle: { color: '#94a3b8', fontSize: 11 },
      },
      grid: { top: 40, right: 60, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: solarCurve.map((_, i) => `${String(i).padStart(2,'0')}:00`),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11, interval: 2 },
        splitLine: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '¥/kWh',
          nameTextStyle: { color: '#94a3b8', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `¥${v.toFixed(2)}` },
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
          min: 0,
          max: 1.5,
        },
        {
          type: 'value',
          name: '%',
          nameTextStyle: { color: '#94a3b8', fontSize: 11 },
          axisLine: { show: false },
          axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
          splitLine: { show: false },
          min: 0,
          max: 1,
        },
      ],
      series: [
        {
          name: '电价',
          type: 'bar',
          data: solarCurve.map(d => ({ value: d.price, itemStyle: { color: priceColor(d.price) } })),
          barMaxWidth: 22,
          yAxisIndex: 0,
        },
        {
          name: '光伏出力',
          type: 'line',
          data: solarCurve.map(s => ({ value: s.solarOutput, itemStyle: { color: '#fbbf24' } })),
          smooth: true,
          lineStyle: { color: '#fbbf24', width: 2.5 },
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 4,
          areaStyle: { color: 'rgba(251,191,36,0.1)' },
        },
      ],
    }
  }

  const compareChartOption = () => {
    if (!compareData) return {}
    const zj = compareData.ZJ.curve24h
    const gd = compareData.GD.curve24h
    const now = new Date()
    const currentHour = now.getHours()

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(102,126,234,0.2)',
        textStyle: { color: '#fff', fontSize: 12 },
      },
      legend: {
        data: ['浙江', '广东'],
        top: 0,
        textStyle: { color: '#94a3b8', fontSize: 11 },
      },
      grid: { top: 40, right: 60, bottom: 40, left: 60 },
      xAxis: {
        type: 'category',
        data: zj.map((_, i) => `${String(i).padStart(2,'0')}:00`),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11, interval: 2 },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        name: '¥/kWh',
        nameTextStyle: { color: '#94a3b8', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `¥${v.toFixed(2)}` },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        min: 0.2,
        max: 1.5,
      },
      series: [
        {
          name: '浙江',
          type: 'line',
          data: zj.map(d => d.price),
          smooth: true,
          lineStyle: { color: '#6366f1', width: 2 },
          itemStyle: { color: '#6366f1' },
          areaStyle: { color: 'rgba(99,102,241,0.1)' },
          markLine: {
            silent: true,
            lineStyle: { type: 'dashed', width: 1 },
            data: [{ yAxis: zj[currentHour]?.price, label: { show: false } }],
          },
        },
        {
          name: '广东',
          type: 'line',
          data: gd.map(d => d.price),
          smooth: true,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
          areaStyle: { color: 'rgba(245,158,11,0.1)' },
        },
      ],
    }
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message={error} description="请检查网络连接或稍后重试" showIcon />
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
            ⚡ 动态电价 — 浙江/广东分时定价
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            对标 Octopus Energy · 实时分时电价 · 最优策略推荐
          </p>
        </div>
        <Select
          value={province}
          onChange={v => setProvince(v)}
          style={{ width: 160 }}
          options={[
            { value: 'ZJ', label: '🇨🇳 浙江' },
            { value: 'GD', label: '🇨🇳 广东' },
            { value: 'SH', label: '🇨🇳 上海' },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
          <p style={{ color: '#64748b', marginTop: 16 }}>加载分时电价数据…</p>
        </div>
      ) : pricing ? (
        <>
          {/* ── 当前时段 & 策略卡片 ──────────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* 当前电价 */}
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Statistic
                  title={<span style={{ color: '#64748b', fontSize: 12 }}>当前电价</span>}
                  value={pricing.curve24h[new Date().getHours()]?.price}
                  precision={3}
                  prefix={<span style={{ color: priceColor(pricing.curve24h[new Date().getHours()]?.price) }}>¥</span>}
                  suffix="元/kWh"
                  valueStyle={{ color: '#f1f5f9', fontSize: 26, fontWeight: 700 }}
                />
                <Tag
                  color={priceColorName(pricing.curve24h[new Date().getHours()]?.type)}
                  style={{ marginTop: 8, borderRadius: 6 }}
                >
                  {pricing.curve24h[new Date().getHours()]?.period}时段
                </Tag>
              </Card>
            </Col>

            {/* 峰谷价差 */}
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Statistic
                  title={<span style={{ color: '#64748b', fontSize: 12 }}>峰谷价差</span>}
                  value={pricing.strategy.spread}
                  precision={3}
                  prefix={<ArrowUpOutlined style={{ color: '#EF4444', fontSize: 16 }} />}
                  suffix="元/kWh"
                  valueStyle={{ color: '#f1f5f9', fontSize: 26, fontWeight: 700 }}
                />
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 11 }}>
                  峰 ¥{pricing.strategy.peakPrice} → 谷 ¥{pricing.strategy.valleyPrice}
                </p>
              </Card>
            </Col>

            {/* 最佳套利收益 */}
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Statistic
                  title={<span style={{ color: '#64748b', fontSize: 12 }}>理论套利(85%效率)</span>}
                  value={pricing.strategy.arbitrageProfit}
                  precision={3}
                  prefix={<MoneyCollectOutlined style={{ color: '#00D4AA', fontSize: 16 }} />}
                  suffix="元/kWh"
                  valueStyle={{ color: '#00D4AA', fontSize: 26, fontWeight: 700 }}
                />
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 11 }}>
                  谷充峰放 · 含15%效率损耗
                </p>
              </Card>
            </Col>

            {/* 月度节省估算 */}
            <Col xs={24} sm={12} md={6}>
              <Card
                size="small"
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Statistic
                  title={<span style={{ color: '#64748b', fontSize: 12 }}>月度储能节省估算</span>}
                  value={pricing.strategy.monthlySavingEstimate}
                  precision={0}
                  prefix={<BulbOutlined style={{ color: '#fbbf24', fontSize: 16 }} />}
                  suffix="元/月"
                  valueStyle={{ color: '#fbbf24', fontSize: 26, fontWeight: 700 }}
                />
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 11 }}>
                  按100kWh装机 · 每日1次循环
                </p>
              </Card>
            </Col>
          </Row>

          {/* ── 24小时电价柱状图 ────────────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card
                size="small"
                title={
                  <span style={{ color: '#f1f5f9', fontSize: 14 }}>
                    📊 {province === 'ZJ' ? '浙江' : province === 'GD' ? '广东' : '上海'} 24小时分时电价曲线
                    <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12, marginLeft: 12 }}>
                      尖峰时段（夏季7-8月 / 冬季1、12月）用红色标注
                    </span>
                  </span>
                }
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <ReactECharts option={priceChartOption()} style={{ height: 300 }} />
              </Card>
            </Col>
          </Row>

          {/* ── 光伏自用分析 & 省间对比 ─────────────────────────────── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {/* 光伏自用分析 */}
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <span style={{ color: '#f1f5f9', fontSize: 14 }}>
                    ☀️ 光伏发电与电价重叠分析
                  </span>
                }
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                {solarData && (
                  <>
                    <ReactECharts option={solarChartOption()} style={{ height: 260 }} />
                    <Divider style={{ margin: '12px 0', borderColor: '#1e293b' }} />
                    <div style={{ padding: '0 4px' }}>
                      <Row gutter={[12, 8]}>
                        <Col span={12}>
                          <Statistic
                            title={<span style={{ color: '#64748b', fontSize: 11 }}>光伏高峰时刻</span>}
                            value={`${String(solarData.analysis.peakSolarHour.hour).padStart(2,'0')}:00`}
                            prefix="☀"
                            valueStyle={{ color: '#fbbf24', fontSize: 18 }}
                            suffix={<span style={{ color: '#64748b', fontSize: 11 }}>出力{(solarData.analysis.peakSolarHour.solarOutput * 100).toFixed(0)}%</span>}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title={<span style={{ color: '#64748b', fontSize: 11 }}>此时电网电价</span>}
                            value={solarData.analysis.peakSolarHour.gridPrice}
                            precision={3}
                            prefix="¥"
                            valueStyle={{ color: priceColor(solarData.analysis.peakSolarHour.gridPrice), fontSize: 18 }}
                            suffix="元/kWh"
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title={<span style={{ color: '#64748b', fontSize: 11 }}>白天平均电价</span>}
                            value={solarData.analysis.avgPriceDuringSolar}
                            precision={3}
                            prefix="¥"
                            valueStyle={{ color: '#34D399', fontSize: 18 }}
                            suffix="元/kWh"
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title={<span style={{ color: '#64748b', fontSize: 11 }}>光伏自用净收益</span>}
                            value={solarData.analysis.solarSelfUseProfit}
                            precision={3}
                            prefix={solarData.analysis.solarSelfUseProfit > 0 ? '+' : ''}
                            valueStyle={{ color: solarData.analysis.solarSelfUseProfit > 0 ? '#00D4AA' : '#EF4444', fontSize: 18 }}
                            suffix="元/kWh"
                          />
                        </Col>
                      </Row>
                      <Alert
                        type={solarData.analysis.solarSelfUseProfit > 0 ? 'success' : 'warning'}
                        message={solarData.analysis.conclusion}
                        showIcon
                        style={{ marginTop: 10, fontSize: 12, borderRadius: 8 }}
                      />
                    </div>
                  </>
                )}
              </Card>
            </Col>

            {/* 浙江 vs 广东对比 */}
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <span style={{ color: '#f1f5f9', fontSize: 14 }}>
                    🗺️ 浙江 vs 广东 分时电价对比
                  </span>
                }
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                {compareData && (
                  <>
                    <ReactECharts option={compareChartOption()} style={{ height: 260 }} />
                    <Divider style={{ margin: '12px 0', borderColor: '#1e293b' }} />
                    <Row gutter={[12, 8]}>
                      {[
                        { label: '浙江 当前价', value: compareData.ZJ.curve24h[new Date().getHours()]?.price, color: '#6366f1', province: '浙江' },
                        { label: '广东 当前价', value: compareData.GD.curve24h[new Date().getHours()]?.price, color: '#f59e0b', province: '广东' },
                      ].map(item => (
                        <Col span={12} key={item.label}>
                          <div style={{ padding: '8px 12px', background: 'rgba(30,41,59,0.6)', borderRadius: 8 }}>
                            <div style={{ color: '#64748b', fontSize: 11 }}>{item.label}</div>
                            <div style={{ color: item.color, fontSize: 22, fontWeight: 700 }}>
                              ¥{item.value?.toFixed(3)} <span style={{ fontSize: 12, color: '#64748b' }}>/kWh</span>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </>
                )}
              </Card>
            </Col>
          </Row>

          {/* ── 最优策略推荐 ─────────────────────────────────────────── */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card
                size="small"
                title={
                  <span style={{ color: '#f1f5f9', fontSize: 14 }}>
                    🎯 最优充放电策略（{province === 'ZJ' ? '浙江' : province === 'GD' ? '广东' : '上海'}省）
                  </span>
                }
                style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Row gutter={[24, 16]}>
                  <Col xs={24} md={12}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(6,182,212,0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>
                        <ArrowDownOutlined style={{ color: '#06b6d4' }} />
                      </div>
                      <div>
                        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>推荐充电时段（谷电）</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>电价为 ¥{pricing.strategy.valleyPrice}/kWh（最低）</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {pricing.strategy.chargeHours.map(h => (
                        <Tag key={h} color="cyan" style={{ borderRadius: 6, fontSize: 13, padding: '2px 10px' }}>
                          {`${String(h).padStart(2,'0')}:00`}
                        </Tag>
                      ))}
                    </div>
                    <p style={{ marginTop: 8, color: '#475569', fontSize: 12 }}>
                      ⓘ 光伏多余时储电效果最佳（电价为¥0/ kWh）
                    </p>
                  </Col>

                  <Col xs={24} md={12}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(239,68,68,0.15)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>
                        <ArrowUpOutlined style={{ color: '#EF4444' }} />
                      </div>
                      <div>
                        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>推荐放电时段（峰电）</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>电价为 ¥{pricing.strategy.peakPrice}/kWh（最高）</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {pricing.strategy.dischargeHours.map(h => (
                        <Tag key={h} color="red" style={{ borderRadius: 6, fontSize: 13, padding: '2px 10px' }}>
                          {`${String(h).padStart(2,'0')}:00`}
                        </Tag>
                      ))}
                    </div>
                    <p style={{ marginTop: 8, color: '#475569', fontSize: 12 }}>
                      ⓘ 响应需求侧调度时可在高峰放电获取补贴收入
                    </p>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0', borderColor: '#1e293b' }} />

                <Row gutter={[16, 8]}>
                  <Col xs={24} md={16}>
                    <Alert
                      type="info"
                      message={
                        <span style={{ fontSize: 12 }}>
                          <strong>参考依据：</strong>
                          {pricing.description} · 数据来源：各省发改委2024年分时电价政策文件 · 实际电价以当地电网公司公示为准
                        </span>
                      }
                      showIcon
                      style={{ borderRadius: 8 }}
                    />
                  </Col>
                  <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { type: 'valley', label: '低谷' },
                        { type: 'flat', label: '平段' },
                        { type: 'peak', label: '高峰' },
                        { type: 'sharp', label: '尖峰' },
                      ].map(t => (
                        <Tag key={t.type} color={priceColorName(t.type)} style={{ borderRadius: 4 }}>
                          {t.label}
                        </Tag>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  )
}
