import { useState, useEffect } from 'react'
import { Row, Col, Tag, Button } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'

export default function NewDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/mqtt/realtime')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
    const t = setInterval(() => {
      fetch('/api/mqtt/realtime').then(r => r.json()).then(d => setData(d)).catch(() => {})
    }, 15000)
    return () => clearInterval(t)
  }, [])

  const latest = data?.stations?.[0]?.latest || {}
  const solarKw = latest?.solarPowerKw || 0
  const loadKw = latest?.loadPowerKw || 0
  const gridKw = latest?.gridPowerKw || 0
  const soc = latest?.batterySoc || 0

  const now = new Date()
  const greeting = now.getHours() < 12 ? '上午好' : now.getHours() < 18 ? '下午好' : '晚上好'

  const cards = [
    {
      href: '/monitor', color: '#667EEA', colorBg: 'rgba(102,126,234,0.06)',
      colorGlow: 'rgba(102,126,234,0.15)', icon: '📡',
      title: '监控运营', sub: '实时数据 · 数字孪生 · 能耗分解 · 告警',
      tags: ['实时监控', '能量流图', '能耗分解', '告警中心'],
      cta: '进入监控', ctaColor: '#667EEA',
    },
    {
      href: '/agent-pipeline', color: '#00D4AA', colorBg: 'rgba(0,212,170,0.05)',
      colorGlow: 'rgba(0,212,170,0.12)', icon: '🤖',
      title: 'AI 优化', sub: 'Agent调度 · 电价日历 · 交易策略 · 月度报告',
      tags: ['🚀 AI流水线', '⚡ AI调度', '📅 电价日历', '💹 VPP交易'],
      cta: '启动Agent', ctaColor: '#00D4AA',
    },
    {
      href: '/customers', color: '#FBBF24', colorBg: 'rgba(251,191,36,0.05)',
      colorGlow: 'rgba(251,191,36,0.1)', icon: '📊',
      title: '商业管理', sub: '客户管理 · 资产总览 · 能源月报 · 工单',
      tags: ['👥 客户管理', '🏭 资产管理', '📈 能源月报', '🛠️ 工单'],
      cta: '进入管理', ctaColor: '#FBBF24',
    },
  ]

  const quickStats = [
    { label: '接入电站', value: '3', unit: '座', icon: '🏭', color: '#667EEA', href: '/stations' },
    { label: '总装机', value: '1.05', unit: 'MW', icon: '⚡', color: '#FFB020', href: '/stations' },
    { label: '今日发电', value: '1,472', unit: 'kWh', icon: '☀️', color: '#FFB020', href: '/monitor' },
    { label: 'AI日净收益', value: '¥+139', unit: '', icon: '🤖', color: '#00D4AA', href: '/agent-pipeline' },
    { label: '活跃客户', value: '8', unit: '家', icon: '👥', color: '#FBBF24', href: '/customers' },
    { label: '本月碳减排', value: '18.2', unit: 't', icon: '🌱', color: '#34D399', href: '/energy-report' },
  ]

  const alerts = [
    { time: '16:32', level: 'warning', msg: '苏州工业园 · 电池SOC过低: 25%' },
    { time: '14:18', level: 'info', msg: '武汉光储项目 · 合同即将到期（剩余90天）' },
    { time: '11:05', level: 'warning', msg: '杭州光伏基地 · 欠费¥12,000待处理' },
    { time: '09:41', level: 'success', msg: '宁波小微光储 · 设备恢复正常运行' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', paddingBottom: 40 }}>
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F1A2E 0%, #1A1040 50%, #0A1628 100%)',
        borderBottom: '1px solid rgba(102,126,234,0.12)',
        padding: '28px 32px 24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
              {now.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              {greeting}，光之涟漪
            </h1>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
              苏州工业园光储站 · 实时运行中
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: '光伏出力', value: `${Math.round(solarKw)}kW`, color: '#FFB020' },
              { label: '负荷用电', value: `${Math.round(loadKw)}kW`, color: '#A78BFA' },
              { label: '电池SOC', value: `${soc}%`, color: soc > 50 ? '#34D399' : '#F87171' },
              { label: '电网', value: gridKw > 0 ? `购${Math.round(gridKw)}kW` : `售${Math.abs(Math.round(gridKw))}kW`, color: gridKw > 0 ? '#F87171' : '#34D399' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 32px 0' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>
          选择您的工作模式
        </div>

        <Row gutter={[16, 16]}>
          {cards.map(card => (
            <Col xs={24} md={8} key={card.href}>
              <a href={card.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div style={{
                  background: card.colorBg,
                  border: `1px solid ${card.color}22`,
                  borderRadius: 16, padding: '28px 24px',
                  height: '100%', cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => Object.assign((e.currentTarget as any).style, { background: card.colorGlow, transform: 'translateY(-2px)' })}
                  onMouseLeave={e => Object.assign((e.currentTarget as any).style, { background: card.colorBg, transform: 'none' })}
                >
                  <div style={{
                    position: 'absolute', top: -40, right: -40, width: 120, height: 120,
                    background: `radial-gradient(circle, ${card.colorGlow} 0%, transparent 70%)`, pointerEvents: 'none',
                  }} />
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 26 }}>{card.icon}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20, whiteSpace: 'pre-line' }}>{card.sub}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {card.tags.map(t => (
                      <Tag key={t} style={{ background: `${card.color}15`, border: 'none', color: card.color, fontSize: 11, padding: '1px 8px' }}>{t}</Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: card.ctaColor, fontSize: 13, fontWeight: 600 }}>
                    {card.cta} <ArrowRightOutlined style={{ fontSize: 12 }} />
                  </div>
                </div>
              </a>
            </Col>
          ))}
        </Row>
      </div>

      {/* ── Quick Stats ── */}
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          关键指标
        </div>
        <Row gutter={[12, 12]}>
          {quickStats.map(s => (
            <Col xs={12} sm={8} md={4} key={s.label}>
              <a href={s.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.color}22`,
                  borderRadius: 12, padding: '16px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => Object.assign((e.currentTarget as any).style, { background: `${s.color}0a`, transform: 'translateY(-1px)' })}
                  onMouseLeave={e => Object.assign((e.currentTarget as any).style, { background: 'rgba(255,255,255,0.03)', transform: 'none' })}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}{s.unit}</div>
                </div>
              </a>
            </Col>
          ))}
        </Row>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          快捷操作
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '🚀 启动Agent', href: '/agent-pipeline', color: '#667EEA' },
            { label: '📡 实时监控', href: '/monitor', color: '#00D4AA' },
            { label: '📅 电价日历', href: '/electricity-price', color: '#FFB020' },
            { label: '👥 客户管理', href: '/customers', color: '#FBBF24' },
            { label: '📈 能源月报', href: '/energy-report', color: '#34D399' },
            { label: '🛠️ 创建工单', href: '/work-order', color: '#A78BFA' },
          ].map(b => (
            <a key={b.label} href={b.href} style={{ textDecoration: 'none' }}>
              <Button
                style={{
                  background: `${b.color}15`, border: `1px solid ${b.color}30`,
                  color: b.color, fontWeight: 600, borderRadius: 8, height: 40, paddingInline: 18,
                }}
              >
                {b.label}
              </Button>
            </a>
          ))}
        </div>
      </div>

      {/* ── Recent Alerts ── */}
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          最近告警
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < alerts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: { warning: '#FBBF24', info: '#60A5FA', success: '#34D399', critical: '#F87171' }[a.level],
              }} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{a.msg}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{a.time}</div>
            </div>
          ))}
        </div>
        <a href="/alerts" style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 12, color: '#667EEA', textDecoration: 'none' }}>
          查看全部告警 →
        </a>
      </div>
    </div>
  )
}
