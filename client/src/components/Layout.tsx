import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const MENU_ITEMS = [
  { key: '/dashboard', label: '总览', icon: '📊' },
  { key: '/ai-prediction', label: 'AI预测中心', icon: '🤖' },
  { key: '/digital-twin', label: '数字孪生', icon: '🪩' },
  { key: '/monitoring', label: '实时监控', icon: '📡' },
  { key: '/electricity-trade', label: '电力交易', icon: '⚡' },
  { key: '/vpp', label: '虚拟电厂', icon: '🔗' },
  { key: '/station-trade', label: '电站交易', icon: '🔄' },
  { key: '/stations', label: '电站管理', icon: '🏭' },
  { key: '/operation', label: '运营管理', icon: '📋' },
  { key: '/alerts', label: '告警管理', icon: '🚨' },
  { key: '/api-explorer', label: 'API Explorer', icon: '🔌' },
  { key: '/lab', label: 'Solaripple Lab', icon: '🔬' },
  { key: '/projects', label: '项目案例', icon: '🏢' },
  { key: '/solutions', label: '解决方案', icon: '💡' },
  { key: '/tech', label: '技术研发', icon: '⚙️' },
  { key: '/tools', label: '工具箱', icon: '🔧' },
  { key: '/about', label: '关于', icon: 'ℹ️' },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 80;

export default function LayoutComponent() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const w = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const isActive = (key: string) => location.pathname === key;

  const handleNav = (key: string) => {
    navigate(key);
    setMobileOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0E1A' }}>
      {/* Desktop Sidebar */}
      <div style={{
        width: w,
        background: 'linear-gradient(180deg, #0F0F23 0%, #1A1040 100%)',
        borderRight: '1px solid rgba(102,126,234,0.15)',
        color: 'white',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }} className="desktop-sidebar">
        {/* Logo */}
        <div style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 20px',
          borderBottom: '1px solid rgba(102,126,234,0.12)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667EEA, #9B5DE5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 18,
          }}>🌊</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Ripple EnOS</div>
              <div style={{ fontSize: 10, color: 'rgba(102,126,234,0.8)', letterSpacing: '0.5px' }}>新能源资产智能管理</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
          <style>{`
            .enos-nav-item:hover { background: rgba(102,126,234,0.12) !important; }
            .enos-nav-item.active { background: rgba(102,126,234,0.2) !important; border-left: 2px solid #667EEA !important; }
            .enos-nav-item::-webkit-scrollbar { width: 0px; }
          `}</style>
          {MENU_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => handleNav(item.key)}
              className={`enos-nav-item ${isActive(item.key) ? 'active' : ''}`}
              style={{
                padding: '11px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: isActive(item.key) ? '2px solid #667EEA' : '2px solid transparent',
                color: isActive(item.key) ? 'white' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.2s',
                fontSize: '14px',
                margin: '1px 8px',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ fontWeight: isActive(item.key) ? 500 : 400 }}>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Collapse */}
        {!collapsed && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(102,126,234,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #667EEA, #9B5DE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👤</div>
              <div>
                <div style={{ fontSize: 12, color: 'white', fontWeight: 500 }}>演示用户</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>管理员</div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{ background: 'rgba(102,126,234,0.2)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px 6px', fontSize: 12 }}
            >
              ←
            </button>
          </div>
        )}
        {collapsed && (
          <div style={{ padding: '16px', borderTop: '1px solid rgba(102,126,234,0.1)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <button
              onClick={() => setCollapsed(false)}
              style={{ background: 'rgba(102,126,234,0.2)', border: 'none', borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div style={{
        width: SIDEBAR_WIDTH,
        background: 'linear-gradient(180deg, #0F0F23 0%, #1A1040 100%)',
        position: 'fixed',
        height: '100vh',
        zIndex: 1200,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s',
        overflow: 'auto',
        borderRight: '1px solid rgba(102,126,234,0.15)',
      }} className="mobile-sidebar">
        <div style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(102,126,234,0.12)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #667EEA, #9B5DE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌊</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>Ripple EnOS</div>
              <div style={{ fontSize: 10, color: 'rgba(102,126,234,0.8)' }}>新能源资产智能管理</div>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <nav style={{ padding: '12px 0' }}>
          {MENU_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => handleNav(item.key)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: isActive(item.key) ? 'rgba(102,126,234,0.2)' : 'transparent',
                borderLeft: isActive(item.key) ? '3px solid #667EEA' : '3px solid transparent',
                color: isActive(item.key) ? 'white' : 'rgba(255,255,255,0.55)',
                fontSize: '14px',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span style={{ fontWeight: isActive(item.key) ? 500 : 400 }}>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : w,
        flex: 1,
        minHeight: '100vh',
        transition: 'margin-left 0.3s',
        width: '100%',
      }}>
        {/* Desktop Header */}
        <header style={{
          height: '64px',
          background: 'rgba(10,14,26,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(102,126,234,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }} className="desktop-header">
          <div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginRight: 8 }}>当前位置</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {MENU_ITEMS.find(m => m.key === location.pathname)?.label || '总览'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 18 }} title="通知中心">
              🔔
              <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#FF4D4F', border: '2px solid #0A0E1A' }} />
            </div>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00D4AA', display: 'inline-block', boxShadow: '0 0 6px #00D4AA' }} />
              系统正常
            </div>
            <a href="https://solaripple.com" style={{ color: '#667EEA', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>🌐 solaripple.com</a>
            {/* Logout */}
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: 6, color: '#FF4D4F', cursor: 'pointer', padding: '5px 12px', fontSize: 12 }}
            >
              退出
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header style={{
          height: '56px',
          background: 'rgba(10,14,26,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(102,126,234,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 99,
        }} className="mobile-header">
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'white' }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #667EEA, #9B5DE5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌊</div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>Ripple EnOS</span>
          </div>
          <a href="https://solaripple.com" style={{ color: '#667EEA', textDecoration: 'none', fontSize: 18 }}>🌐</a>
        </header>

        {/* Content */}
        <main style={{
          padding: '24px 28px',
          paddingBottom: '48px',
          maxWidth: 1600,
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-sidebar, .mobile-header { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-sidebar, .desktop-header { display: none !important; }
          .mobile-sidebar, .mobile-header { display: flex !important; flex-direction: column; }
          main { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
