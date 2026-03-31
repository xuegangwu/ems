import { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import { ThunderboltOutlined, RiseOutlined, FallOutlined, DollarOutlined, CloudOutlined, SwapOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../services/api';

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(102,126,234,0.12)',
  borderRadius: 12,
  height: '100%',
};

const cardHeadStyle: React.CSSProperties = {
  borderBottom: '1px solid rgba(102,126,234,0.08)',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 13,
};

const statTitleStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.45)', fontSize: 12 };

const powerData = {
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,15,35,0.9)', borderColor: 'rgba(102,126,234,0.3)', textStyle: { color: 'white' } },
  legend: { data: ['光伏', '储能', '电网'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)' } },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'], axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' } },
  yAxis: { type: 'value', name: 'kW', axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.4)' } },
  series: [
    { name: '光伏', type: 'line', smooth: true, data: [0, 0, 120, 380, 420, 280, 50], areaStyle: { color: 'rgba(255,193,7,0.15)' }, lineStyle: { color: '#FFC107' }, itemStyle: { color: '#FFC107' } },
    { name: '储能', type: 'line', smooth: true, data: [-50, -80, -30, 60, 100, 80, 40], areaStyle: { color: 'rgba(0,212,170,0.15)' }, lineStyle: { color: '#00D4AA' }, itemStyle: { color: '#00D4AA' } },
    { name: '电网', type: 'line', smooth: true, data: [80, 120, 60, -20, -60, 20, 100], areaStyle: { color: 'rgba(255,77,79,0.1)' }, lineStyle: { color: '#FF4D4F' }, itemStyle: { color: '#FF4D4F' } },
  ],
};

const energyData = {
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,15,35,0.9)', borderColor: 'rgba(102,126,234,0.3)', textStyle: { color: 'white' } },
  grid: { top: 20, right: 20, bottom: 30, left: 50 },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'], axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' } },
  yAxis: { type: 'value', name: 'MWh', axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.4)' } },
  series: [{ type: 'bar', data: [120, 145, 180, 220, 280, 320], itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#667EEA' }, { offset: 1, color: '#9B5DE5' }] }, borderRadius: [4, 4, 0, 0] } }],
};

const revenueData = {
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,15,35,0.9)', borderColor: 'rgba(102,126,234,0.3)', textStyle: { color: 'white' } },
  legend: { data: ['发电收益', '峰谷套利'], bottom: 0, textStyle: { color: 'rgba(255,255,255,0.6)' } },
  grid: { top: 20, right: 20, bottom: 40, left: 50 },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'], axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' } },
  yAxis: { type: 'value', name: '万元', axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: 'rgba(255,255,255,0.5)' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, nameTextStyle: { color: 'rgba(255,255,255,0.4)' } },
  series: [
    { name: '发电收益', type: 'bar', data: [12, 15, 18, 22, 28, 32], itemStyle: { color: '#667EEA', borderRadius: [4, 4, 0, 0] } },
    { name: '峰谷套利', type: 'bar', data: [3, 4, 5, 6, 7, 8], itemStyle: { color: '#00D4AA', borderRadius: [4, 4, 0, 0] } },
  ],
};

function StatCard({ title, value, suffix, prefix, valueColor }: { title: string; value: number | string; suffix?: string; prefix?: React.ReactNode; valueColor?: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={statTitleStyle}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
          {prefix && <span style={{ fontSize: 18 }}>{prefix}</span>}
          <span style={{ fontSize: 28, fontWeight: 700, color: valueColor || 'white', lineHeight: 1.2 }}>{value}</span>
          {suffix && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <div style={{ ...cardHeadStyle, padding: '14px 16px', borderBottom: '1px solid rgba(102,126,234,0.08)' }}>{title}</div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [optimal, setOptimal] = useState<{ action: { text: string; reason: string; color: string }; bestCharge: Array<{ time: string; price: number }>; bestDischarge: Array<{ time: string; price: number }> } | null>(null);

  useEffect(() => {
    api.get('/electricity/prices/half-hourly?region=华东电网').then(r => {
      if (r.data.success) setOptimal(r.data.data.optimal);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontSize: 18, fontWeight: 600, color: 'white' }}>总览</h2>
      <Row gutter={[12, 12]}>
        <Col xs={12} lg={4}>
          <StatCard title="总装机容量" value={12.8} suffix="MW" prefix={<ThunderboltOutlined style={{ color: '#667EEA', fontSize: 18 }} />} valueColor="#667EEA" />
        </Col>
        <Col xs={12} lg={4}>
          <StatCard title="今日发电量" value={45600} suffix="kWh" prefix={<RiseOutlined style={{ color: '#00D4AA', fontSize: 18 }} />} valueColor="#00D4AA" />
        </Col>
        <Col xs={12} lg={4}>
          <StatCard title="当前功率" value={3280} suffix="kW" valueColor="white" />
        </Col>
        <Col xs={12} lg={4}>
          <StatCard title="今日收益" value="¥28,500" prefix={<FallOutlined style={{ color: '#FF9500', fontSize: 18 }} />} valueColor="#FF9500" />
        </Col>
        <Col xs={12} lg={4}>
          <StatCard title="本月收益" value="¥68.5万" prefix={<DollarOutlined style={{ color: '#00D4AA', fontSize: 18 }} />} valueColor="#00D4AA" />
        </Col>
        <Col xs={12} lg={4}>
          <StatCard title="碳减排" value={285} suffix="吨" prefix={<CloudOutlined style={{ color: '#52c41a', fontSize: 18 }} />} valueColor="#52c41a" />
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <ChartCard title="⚡ 实时功率">
            <ReactECharts option={powerData} style={{ height: 'calc(100vw < 768 ? 220px : 280px)' }} />
          </ChartCard>
        </Col>
        <Col xs={24} lg={10}>
          <ChartCard title="📊 月度发电量">
            <ReactECharts option={energyData} style={{ height: 'calc(100vw < 768 ? 220px : 280px)' }} />
          </ChartCard>
        </Col>
      </Row>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <ChartCard title="💰 收益统计">
            <ReactECharts option={revenueData} style={{ height: 'calc(100vw < 768 ? 220px : 260px)' }} />
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard title="⚡ 智能调度建议">
            {optimal ? (
              <div>
                <div style={{ padding: '10px 14px', background: `${optimal.action.color}15`, border: `1px solid ${optimal.action.color}30`, borderRadius: 8, marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: optimal.action.color, marginBottom: 4 }}>{optimal.action.text}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{optimal.action.reason}</div>
                </div>
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <div style={{ padding: '10px 12px', background: 'rgba(0,212,170,0.08)', borderRadius: 8, border: '1px solid rgba(0,212,170,0.15)' }}>
                      <div style={{ fontSize: 11, color: '#00D4AA', marginBottom: 4 }}>⚡ 最佳充电时段</div>
                      {optimal.bestCharge.slice(0, 2).map(s => (
                        <div key={s.time} style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{s.time} <span style={{ fontSize: 11, color: '#00D4AA' }}>¥{s.price.toFixed(4)}</span></div>
                      ))}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ padding: '10px 12px', background: 'rgba(255,77,79,0.08)', borderRadius: 8, border: '1px solid rgba(255,77,79,0.15)' }}>
                      <div style={{ fontSize: 11, color: '#FF4D4F', marginBottom: 4 }}>💰 最佳放电时段</div>
                      {optimal.bestDischarge.slice(0, 2).map(s => (
                        <div key={s.time} style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{s.time} <span style={{ fontSize: 11, color: '#FF4D4F' }}>¥{s.price.toFixed(4)}</span></div>
                      ))}
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  <SwapOutlined style={{ marginRight: 4 }} />
                  基于实时电价 · 每分钟自动刷新
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)' }}>加载中...</div>
            )}
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}
