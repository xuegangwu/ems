import { Tag, Space, Divider, Typography } from 'antd';

const { Text } = Typography;

interface DeviceData {
  solarPower?: number;
  batterySoc?: number;
  batteryPower?: number;
  evCharging?: number;
  load?: number;
  gridExport?: number;
}

interface DeviceDetailPanelProps {
  deviceId: string | null;
  deviceData: DeviceData;
  onClose: () => void;
}

const DEVICE_LABELS: Record<string, string> = {
  'solar': '光伏阵列 #1',
  'solar-2': '光伏阵列 #2',
  'battery': '储能电池系统',
  'ev': '充电桩站',
  'building-main': '主厂房',
  'building-2': '生产车间',
  'building-3': '仓库',
};

export default function DeviceDetailPanel({ deviceId, deviceData, onClose }: DeviceDetailPanelProps) {
  if (!deviceId) return null;

  const label = DEVICE_LABELS[deviceId] || deviceId;

  const renderContent = () => {
    switch (deviceId) {
      case 'solar':
      case 'solar-2': {
        const power = deviceData.solarPower || 0;
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Tag color="gold">☀️ 光伏</Tag>
              <Tag color="green">在线</Tag>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">当前功率</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#FFD700' }}>
                {power.toFixed(0)} <span style={{ fontSize: 14, fontWeight: 400 }}>kW</span>
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">今日发电量</Text>
                <Text strong>{(power * 6.5).toFixed(0)} kWh</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">转换效率</Text>
                <Text strong>98.2%</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">组串数量</Text>
                <Text strong>{deviceId === 'solar' ? '35组' : '21组'}</Text>
              </div>
            </Space>
          </>
        );
      }

      case 'battery': {
        const soc = deviceData.batterySoc || 75;
        const power = deviceData.batteryPower || 0;
        const socColor = soc < 20 ? '#E53E3E' : soc < 50 ? '#ED8936' : '#38A169';
        const powerDisplay = power >= 0 ? power : Math.abs(power);
        const powerColor = power >= 0 ? '#38A169' : '#3182CE';
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Tag color="cyan">🔋 储能</Tag>
              <Tag color={power > 0 ? 'green' : power < 0 ? 'blue' : 'default'}>
                {power > 0 ? '放电中' : power < 0 ? '充电中' : '待机'}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">电池容量 (SOC)</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${soc}%`, height: '100%', background: socColor, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: socColor, minWidth: 50 }}>
                  {soc.toFixed(0)}%
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>当前功率</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: powerColor }}>
                  {powerDisplay.toFixed(0)} <span style={{ fontSize: 12, fontWeight: 400 }}>kW</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>可用容量</Text>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>
                  {(soc * 0.2).toFixed(0)} <span style={{ fontSize: 12, fontWeight: 400 }}>kWh</span>
                </div>
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">电池健康度 (SOH)</Text>
                <Text strong style={{ color: '#00D4AA' }}>96%</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">电芯温度</Text>
                <Text strong>32.5°C</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">今日收益</Text>
                <Text strong style={{ color: '#38A169' }}>¥128.50</Text>
              </div>
            </Space>
          </>
        );
      }

      case 'ev': {
        const evPower = deviceData.evCharging || 0;
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Tag color="green">🚗 充电桩</Tag>
              <Tag color={evPower > 0 ? 'cyan' : 'default'}>
                {evPower > 0 ? '充电中' : '待机'}
              </Tag>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">当前功率</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: evPower > 0 ? '#38A169' : '#666' }}>
                {evPower.toFixed(0)} <span style={{ fontSize: 14, fontWeight: 400 }}>kW</span>
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">枪数量</Text>
                <Text strong>2枪</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">最大功率</Text>
                <Text strong>120 kW</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">今日充电量</Text>
                <Text strong>245.6 kWh</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">今日收益</Text>
                <Text strong style={{ color: '#38A169' }}>¥196.48</Text>
              </div>
            </Space>
          </>
        );
      }

      default: {
        if (deviceId.startsWith('building')) {
          const load = deviceData.load || 280;
          const multiplier = deviceId === 'building-main' ? 0.6 : deviceId === 'building-2' ? 0.3 : 0.1;
          const area = deviceId === 'building-main' ? '12,000' : deviceId === 'building-2' ? '8,000' : '3,000';
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Tag color="purple">🏭 建筑</Tag>
                <Tag color="green">在线</Tag>
              </div>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">建筑面积</Text>
                  <Text strong>{area} m²</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">负载消耗</Text>
                  <Text strong>{(load * multiplier).toFixed(0)} kW</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">空调功耗</Text>
                  <Text strong>{(load * 0.25).toFixed(0)} kW</Text>
                </div>
              </Space>
            </>
          );
        }
        return (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary">点击3D场景中的设备查看详情</Text>
          </div>
        );
      }
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 260,
        background: 'rgba(10, 14, 26, 0.95)',
        borderRadius: 12,
        border: '1px solid rgba(102, 126, 234, 0.3)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(102, 126, 234, 0.15)',
          borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{label}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ padding: 16 }}>
        {renderContent()}
      </div>
    </div>
  );
}
