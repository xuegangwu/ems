import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined } from '@ant-design/icons';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true);
    // 模拟登录
    await new Promise(resolve => setTimeout(resolve, 800));
    if (values.username && values.password) {
      message.success('登录成功，正在跳转...');
      setTimeout(() => navigate('/dashboard'), 500);
    } else {
      message.error('请输入用户名和密码');
    }
    setLoading(false);
  };

  const handleSmsLogin = async (values: { phone: string; code: string }) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    if (values.phone && values.code) {
      message.success('登录成功，正在跳转...');
      setTimeout(() => navigate('/dashboard'), 500);
    } else {
      message.error('请输入手机号和验证码');
    }
    setLoading(false);
  };

  const tabItems = [
    {
      key: 'password',
      label: '密码登录',
      children: (
        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(102,126,234,0.6)' }} />}
              placeholder="用户名 / 手机号"
              style={{ height: 44 }}
            />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(102,126,234,0.6)' }} />}
              placeholder="密码"
              style={{ height: 44 }}
            />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox style={{ color: 'rgba(255,255,255,0.5)' }}>记住我</Checkbox>
              <a style={{ color: '#667EEA', fontSize: 13 }}>忘记密码？</a>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontSize: 15 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'sms',
      label: '短信登录',
      children: (
        <Form onFinish={handleSmsLogin} layout="vertical" size="large">
          <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input
              prefix={<MobileOutlined style={{ color: 'rgba(102,126,234,0.6)' }} />}
              placeholder="手机号"
              style={{ height: 44 }}
            />
          </Form.Item>
          <Form.Item name="code" rules={[{ required: true, message: '请输入验证码' }]}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="验证码"
                style={{ height: 44, flex: 1 }}
              />
              <Button style={{ height: 44, color: '#667EEA', borderColor: '#667EEA' }}>
                获取验证码
              </Button>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontSize: 15 }}>
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0E1A 0%, #1A1040 50%, #0F1A3A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(102,126,234,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '50%',
        background: 'radial-gradient(ellipse at 80% 50%, rgba(155,93,229,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 440,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #667EEA, #9B5DE5)',
            fontSize: 28,
            marginBottom: 16,
            boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
          }}>
            🌊
          </div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'white',
            marginBottom: 4,
            letterSpacing: '0.5px',
          }}>
            Ripple EnOS
          </h1>
          <p style={{ color: 'rgba(102,126,234,0.8)', fontSize: 13 }}>
            新能源资产智能管理平台
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(102,126,234,0.15)',
          borderRadius: 20,
          padding: '32px 32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 24,
            textAlign: 'center',
          }}>
            欢迎登录
          </h2>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            centered
            style={{ color: 'white' }}
          />

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              还没有账号？{' '}
            </span>
            <a style={{ color: '#667EEA', fontSize: 13 }}>立即注册</a>
          </div>

          {/* Demo hint */}
          <div style={{
            marginTop: 24,
            padding: '12px 16px',
            background: 'rgba(102,126,234,0.08)',
            borderRadius: 10,
            border: '1px solid rgba(102,126,234,0.12)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
          }}>
            💡 演示模式：输入任意用户名密码即可登录
          </div>
        </div>

        {/* Bottom links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 24,
        }}>
          <a href="https://solaripple.com" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>关于我们</a>
          <a href="https://solaripple.com" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>帮助中心</a>
          <a href="https://solaripple.com" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>用户协议</a>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 16 }}>
          © 2026 Solaripple Lab. All rights reserved.
        </p>
      </div>
    </div>
  );
}
