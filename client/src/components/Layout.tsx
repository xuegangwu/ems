import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  DashboardOutlined,
  MonitorOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  ShopOutlined,
  AppstoreOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '首页概览',
  },
  {
    key: '/monitoring',
    icon: <MonitorOutlined />,
    label: '监控中心',
  },
  {
    key: '/operation',
    icon: <ToolOutlined />,
    label: '运维管理',
  },
  {
    key: '/electricity-trade',
    icon: <ThunderboltOutlined />,
    label: '电力交易',
  },
  {
    key: '/station-trade',
    icon: <ShopOutlined />,
    label: '电站交易',
  },
  {
    key: '/stations',
    icon: <AppstoreOutlined />,
    label: '电站管理',
  },
  {
    key: '/alerts',
    icon: <BellOutlined />,
    label: '告警管理',
  },
];

export default function LayoutComponent() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: '个人中心' },
    { key: 'settings', label: '设置' },
    { type: 'divider' },
    { key: 'logout', label: '退出登录' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          {collapsed ? 'EMS' : '光储管理平台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {collapsed ? (
              <MenuUnfoldOutlined style={{ fontSize: 18 }} onClick={() => setCollapsed(true)} />
            ) : (
              <MenuFoldOutlined style={{ fontSize: 18 }} onClick={() => setCollapsed(false)} />
            )}
            <span style={{ fontSize: 14, color: '#666' }}>工商业光储监控运维平台</span>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, overflow: 'initial' }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)',
            padding: 24,
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
