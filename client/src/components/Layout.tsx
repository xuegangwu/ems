import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

interface NavItem {
  key: string;
  label: string;
  icon: string;
  group?: string;
  badge?: 'alert' | 'new';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'command', label: '能量指挥台', icon: '⚡', group: '主导航' },
  { key: 'digital-twin-flow', label: '能量流', icon: '🌊', group: '主导航' },
  { key: 'monitor', label: '监控中心', icon: '📊', group: '主导航' },
  { key: 'ai-prediction', label: 'AI预测', icon: '🤖', group: 'AI优化' },
  { key: 'schedule', label: 'AI调度', icon: '⚡', group: 'AI优化' },
  { key: 'vpp-trading', label: 'VPP交易', icon: '📈', group: 'AI优化' },
  { key: 'electricity-price', label: '电价日历', icon: '📅', group: 'AI优化' },
  { key: 'electricity-trade', label: '电力交易', icon: '💰', group: '交易策略' },
  { key: 'station-trade', label: '电站交易', icon: '🏭', group: '交易策略' },
  { key: 'energy-report', label: '能源月报', icon: '📋', group: '交易策略' },
  { key: 'stations', label: '电站管理', icon: '🏢', group: '资产客户' },
  { key: 'customers', label: '客户管理', icon: '👥', group: '资产客户' },
  { key: 'work-order', label: '工单管理', icon: '🛠️', group: '资产客户' },
  { key: 'alerts', label: '告警管理', icon: '🚨', group: '资产客户', badge: 'alert' },
  { key: 'agent-pipeline', label: 'Agent流水线', icon: '🔄', group: '工具' },
  { key: 'tools', label: '工具箱', icon: '🔧', group: '工具' },
  { key: 'rest-explorer', label: 'REST Explorer', icon: '🔌', group: '工具' },
  { key: 'about', label: '关于', icon: 'ℹ️', group: '信息' },
];

const NAV_TO_ROUTE: Record<string, string> = {
  'command': '/dashboard',
  'digital-twin-flow': '/digital-twin-flow',
  'monitor': '/monitor',
  'ai-prediction': '/ai-prediction',
  'schedule': '/schedule',
  'vpp-trading': '/vpp-trading',
  'electricity-price': '/electricity-price',
  'electricity-trade': '/electricity-trade',
  'station-trade': '/station-trade',
  'energy-report': '/energy-report',
  'stations': '/stations',
  'customers': '/customers',
  'work-order': '/work-order',
  'alerts': '/alerts',
  'agent-pipeline': '/agent-pipeline',
  'tools': '/tools',
  'rest-explorer': '/rest-explorer',
  'about': '/about',
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [focused, setFocused] = React.useState(0);

  const allItems = NAV_ITEMS.map(item => ({ ...item, route: NAV_TO_ROUTE[item.key] }));

  const filtered = query.trim()
    ? allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.group?.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const g = item.group || '';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  React.useEffect(() => {
    if (!open) { setQuery(''); setFocused(0); }
  }, [open]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
      if (e.key === 'Enter' && filtered[focused]) {
        onNavigate(filtered[focused].route);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, focused, filtered, onNavigate, onClose]);

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-dialog" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <span style={{ fontSize: 18 }}>🔍</span>
          <input className="cmd-input" placeholder="搜索页面、功能..." value={query}
            onChange={e => { setQuery(e.target.value); setFocused(0); }} autoFocus />
          <span className="kbb">ESC</span>
        </div>
        <div className="cmd-results">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div className="cmd-group-label">{group}</div>
              {items.map(item => {
                const idx = filtered.indexOf(item);
                return (
                  <div key={item.key} className={`cmd-item${idx === focused ? ' focused' : ''}`}
                    onClick={() => { onNavigate(item.route); onClose(); }} onMouseEnter={() => setFocused(idx)}>
                    <span className="cmd-item-icon">{item.icon}</span>
                    <span className="cmd-item-label">{item.label}</span>
                    {item.badge === 'alert' && <span style={{ background: '#EF4444', borderRadius: '50%', width: 8, height: 8 }} />}
                  </div>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-tertiary)', fontSize: 13 }}>
              没有找到匹配结果
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const [lightMode, setLightMode] = useState(() => {
    return localStorage.getItem('enos_theme') === 'light';
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Apply light mode class to html element
  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
    }
    localStorage.setItem('enos_theme', lightMode ? 'light' : 'dark');
  }, [lightMode]);

  const isActive = (key: string) => {
    const route = NAV_TO_ROUTE[key];
    if (!route) return false;
    if (route === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(route);
  };

  const handleNav = (key: string) => {
    const route = NAV_TO_ROUTE[key];
    if (route) navigate(route);
  };

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Grouped nav items
  const groups: Record<string, NavItem[]> = {};
  for (const item of NAV_ITEMS) {
    const g = item.group || '';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  }

  return (
    <>
      {/* Topbar */}
      <div className="layout-topbar">
        <a href="https://solaripple.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0 4px', flexShrink: 0, textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: lightMode ? '#1a1a1a' : 'white', lineHeight: 1.2 }}>EnOS</div>
            <div style={{ fontSize: 9, color: lightMode ? 'rgba(0,113,227,0.8)' : 'rgba(0,113,227,0.8)', letterSpacing: '0.3px' }}>光之涟漪</div>
          </div>
        </a>
        <a href="https://solaripple.com" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 10, color: lightMode ? 'rgba(0,113,227,0.7)' : 'rgba(0,113,227,0.7)', background: lightMode ? 'rgba(0,113,227,0.08)' : 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.2)', padding: '2px 8px', borderRadius: 6, textDecoration: 'none', flexShrink: 0 }}>
          ← 首页
        </a>

        <div className="topbar-search" onClick={() => setCmdOpen(true)}>
          <span>🔍</span>
          <span>搜索页面、功能...</span>
          <span className="kbb">⌘K</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setLightMode(!lightMode)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16,
              background: lightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
              border: lightMode ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)',
              color: lightMode ? '#1a1a1a' : 'white',
            }}
            title={lightMode ? '切换深色模式' : '切换浅色模式'}
          >
            {lightMode ? '🌙' : '☀️'}
          </button>
          <div className="status-dot online" title="系统正常" />
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0071e3, #00c7be)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer',
          }}>
            伍
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="layout-main">
        {/* Sidebar */}
        <nav className="sidebar-nav">
          {Object.entries(groups).map(([group, items]) => (
            <React.Fragment key={group}>
              <div className="sidebar-group-label">{group}</div>
              {items.map(item => (
                <div
                  key={item.key}
                  className={`sidebar-nav-item${isActive(item.key) ? ' active' : ''}`}
                  onClick={() => handleNav(item.key)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge === 'alert' && <span className="badge" />}
                </div>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Content */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={path => { navigate(path); setCmdOpen(false); }} />
    </>
  );
}
