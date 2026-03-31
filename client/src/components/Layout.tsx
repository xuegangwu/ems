import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function LayoutComponent() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { key: '/dashboard', label: '总览', icon: '📊' },
    { key: '/monitoring', label: '实时监控', icon: '📡' },
    { key: '/stations', label: '电站管理', icon: '🏭' },
    { key: '/electricity-trade', label: '电力交易', icon: '⚡' },
    { key: '/vpp', label: '虚拟电厂', icon: '🔗' },
    { key: '/station-trade', label: '电站交易', icon: '🔄' },
    { key: '/operation', label: '运营管理', icon: '📋' },
    { key: '/alerts', label: '告警管理', icon: '🚨' },
    { key: '/lab', label: 'Solaripple Lab', icon: '🔬' },
    { key: '/projects', label: '项目案例', icon: '🏢' },
    { key: '/solutions', label: '解决方案', icon: '💡' },
    { key: '/tech', label: '技术研发', icon: '⚙️' },
    { key: '/tools', label: '工具箱', icon: '🔧' },
    { key: '/about', label: '关于', icon: 'ℹ️' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? '80px' : '240px',
        background: 'linear-gradient(180deg, #1A1A2E 0%, #2D2D44 100%)',
        color: 'white',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '0 20px',
        }}>
          <span style={{ fontSize: collapsed ? '20px' : '24px', fontWeight: 'bold' }}>
            ☀️ {collapsed ? 'SL' : 'Solaripple Lab'}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ padding: '20px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                padding: '14px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: location.pathname === item.key ? 'rgba(0,102,255,0.3)' : 'transparent',
                borderLeft: location.pathname === item.key ? '3px solid #0066FF' : '3px solid transparent',
                color: location.pathname === item.key ? 'white' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
                fontSize: '15px',
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.key) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Collapse Button */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        >
          {collapsed ? '→' : '← 收起'}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: collapsed ? '80px' : '240px',
        flex: 1,
        background: '#F0F7FF',
        minHeight: '100vh',
        transition: 'margin-left 0.3s'
      }}>
        {/* Header */}
        <header style={{
          height: '70px',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Solaripple Lab - 工商业光储实验室
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="https://solaripple.com" style={{ color: '#0066FF', textDecoration: 'none', fontSize: '14px' }}>
              🌐 solaripple.com
            </a>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
