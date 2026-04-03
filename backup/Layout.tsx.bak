import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout as AntdLayout } from 'antd';

const MENU_ITEMS = [
  { key: '/', label: '首页', icon: '🏠', group: null },
  { key: '/monitor', label: '监控中心', icon: '📊', group: '监控运营' },
  { key: '/digital-twin-flow', label: '能量流', icon: '⚡', group: '监控运营' },
  { key: '/energy-breakdown', label: '能耗分解', icon: '📊', group: '监控运营' },
  { key: '/alerts', label: '告警管理', icon: '🚨', group: '监控运营' },
  { key: '/agent-pipeline', label: 'AI流水线', icon: '🔄', group: 'AI优化' },
  { key: '/ai-prediction', label: 'AI预测', icon: '🤖', group: 'AI优化' },
  { key: '/schedule', label: 'AI调度', icon: '⚡', group: 'AI优化' },
  { key: '/electricity-price', label: '电价日历', icon: '📅', group: 'AI优化' },
  { key: '/energy-report', label: '能源月报', icon: '📈', group: 'AI优化' },
  { key: '/customers', label: '客户管理', icon: '👥', group: '资产与客户' },
  { key: '/stations', label: '电站管理', icon: '🏭', group: '资产与客户' },
  { key: '/work-order', label: '工单管理', icon: '🛠️', group: '资产与客户' },
  { key: '/tools', label: '工具箱', icon: '🔧', group: '工具' },
  { key: '/mqtt-settings', label: 'MQTT设置', icon: '📡', group: '工具' },
  { key: '/rest-explorer', label: 'REST Explorer', icon: '🔌', group: '工具' },
  { key: '/about', label: '关于', icon: 'ℹ️', group: '信息' },
];

export { MENU_ITEMS };

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => navigate(path);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const renderMenu = () => {
    const items: React.ReactNode[] = [];
    let lastGroup: string | null = null;
    for (const item of MENU_ITEMS) {
      const showDivider = item.group !== null && item.group !== lastGroup;
      if (item.group) lastGroup = item.group;

      if (showDivider && !collapsed) {
        items.push(
          <div key={`div-${item.group}`}
            style={{ padding: '16px 20px 4px', fontSize: 10, fontWeight: 600,
              color: 'rgba(102,126,234,0.7)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {item.group}
          </div>
        );
      }
      if (showDivider && collapsed) {
        items.push(<div key={`d-${item.group}`} style={{ height: 12 }} />);
      }

      items.push(
        <div
          key={item.key}
          onClick={() => handleNav(item.key)}
          style={{
            padding: collapsed ? '10px 0' : '9px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderLeft: isActive(item.key) ? '2px solid #667EEA' : '2px solid transparent',
            color: isActive(item.key) ? 'white' : 'rgba(255,255,255,0.55)',
            transition: 'all 0.2s',
            fontSize: 14,
            margin: '1px 8px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
          {!collapsed && (
            <span style={{ fontWeight: isActive(item.key) ? 500 : 400 }}>{item.label}</span>
          )}
        </div>
      );
    }
    return items;
  };

  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      <AntdLayout.Sider
        collapsible collapsed={collapsed} onCollapse={setCollapsed}
        width={220} collapsedWidth={64}
        style={{
          background: 'linear-gradient(180deg, #0F0F23 0%, #1A1040 100%)',
          borderRight: '1px solid rgba(102,126,234,0.15)',
          position: 'fixed', left: 0, top: 0, bottom: 0, overflowY: 'auto', zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: '1px solid rgba(102,126,234,0.12)', gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>⚡</span>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>EnOS Platform</div>
              <div style={{ fontSize: 10, color: 'rgba(102,126,234,0.8)', letterSpacing: '0.3px' }}>光之涟漪</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ padding: '8px 0', overflowY: 'auto', flex: 1 }}>
          {renderMenu()}
        </div>

        <style>{`
          .enos-nav-item:hover { background: rgba(102,126,234,0.12) !important; }
          .enos-nav-item.active { background: rgba(102,126,234,0.2) !important; }
        `}</style>
      </AntdLayout.Sider>

      <AntdLayout.Content style={{
        marginLeft: collapsed ? 64 : 220,
        transition: 'margin-left 0.2s',
        background: '#0A0E1A', minHeight: '100vh',
      }}>
        <Outlet />
      </AntdLayout.Content>
    </AntdLayout>
  );
}
