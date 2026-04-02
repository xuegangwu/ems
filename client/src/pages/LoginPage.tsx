/**
 * Login — 简洁的 EnOS 登录页面
 */
import { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const API = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || '';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const d = await r.json();
      if (d.success) {
        sessionStorage.setItem('token', d.token);
        sessionStorage.setItem('user', JSON.stringify(d.user));
        message.success(`欢迎 ${d.user.displayName}（${d.user.role === 'admin' ? '管理员' : d.user.role === 'operator' ? '运维' : '访客'}）`);
        setTimeout(() => window.location.href = '/monitor', 500);
      } else {
        message.error(d.error || '登录失败');
      }
    } catch {
      message.error('网络错误，请检查服务器');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1a2a 50%, #0a1520 100%)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: 0 }}>Ripple EnOS</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '4px 0 0' }}>新能源资产智能管理平台</p>
        </div>
        <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 12 }} bodyStyle={{ padding: '24px 20px' }}>
          <Form layout="vertical" onFinish={handleLogin} initialValues={{ username: 'admin', password: 'admin123' }}>
            <Form.Item name="username" label={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>用户名</span>} rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.2)' }} />} placeholder="admin / operator / viewer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', height: 40 }} />
            </Form.Item>
            <Form.Item name="password" label={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>密码</span>} rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.2)' }} />} placeholder="admin123 / operator123 / viewer123" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', height: 40 }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 42, background: 'rgba(0,212,170,0.8)', border: 'none', fontWeight: 600, fontSize: 15 }}>
                登录
              </Button>
            </Form.Item>
          </Form>
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>测试账号：</div>
            {[['admin', 'admin123', '管理员'], ['operator', 'operator123', '运维'], ['viewer', 'viewer123', '访客']].map(([u, p, role]) => (
              <div key={u} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>
                <span>{u} / {p}</span><span style={{ color: 'rgba(0,212,170,0.5)' }}>{role}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
