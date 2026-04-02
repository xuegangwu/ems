import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Input, Switch, Button, Space, Tag, message, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';


export default function MqttSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    fetch('/api/store/mqtt-config')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.config) {
          form.setFieldsValue({
            brokerUrl: d.config.brokerUrl || 'mqtt://localhost:1883',
            username: d.config.username || '',
            password: '',
            topics: (d.config.topics || ['/energon/#']).join('\n'),
            enabled: d.config.enabled,
          });
        }
      });
  }, []);

  const onSave = async (values: any) => {
    setLoading(true);
    try {
      const topics = values.topics.split('\n').map((t: string) => t.trim()).filter(Boolean);
      const res = await fetch('/api/store/mqtt-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...values, topics }),
      });
      const d = await res.json();
      if (d.success) {
        message.success({ content: 'MQTT配置已保存', duration: 2 });
      } else {
        message.error({ content: d.error || '保存失败', duration: 3 });
      }
    } catch (e: any) {
      message.error('保存失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    setStatus('idle');
    setTestMsg('');
    const vals = form.getFieldsValue();
    // Simulate MQTT connection test
    await new Promise(r => setTimeout(r, 1500));
    // Check if broker URL looks valid
    const url = vals.brokerUrl || '';
    const looksOk = url.startsWith('mqtt://') || url.startsWith('mqtts://') || url.startsWith('ws://') || url.startsWith('wss://');
    if (looksOk) {
      setStatus('ok');
      setTestMsg('连接参数格式正确，实际连接需在服务器端验证');
    } else {
      setStatus('fail');
      setTestMsg('Broker URL 必须以 mqtt:// / mqtts:// / ws:// / wss:// 开头');
    }
    setTesting(false);
  };

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>⚙️ MQTT 配置</h2>
        <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 13 }}>
          连接真实光伏/储能设备的数据采集系统（支持 MQTT 3.1.1 / 5.0）
        </p>
      </div>

      <Row gutter={16}>
        {/* Left: Config Form */}
        <Col span={14}>
          <Card size="small" title={<span style={{ color: '#fff' }}>连接参数</span>}
            extra={<Switch checkedChildren="启用" unCheckedChildren="禁用" onChange={v => form.setFieldValue('enabled', v)} />}>
            <Form form={form} layout="vertical" onFinish={onSave} initialValues={{ enabled: false }}>
              <Form.Item name="brokerUrl" label={<span style={{ color: '#9CA3AF' }}>Broker URL</span>}
                rules={[{ required: true, message: '请输入 MQTT Broker 地址' }]}>
                <Input placeholder="mqtt://localhost:1883 或 mqtts://broker.example.com:8883" />
              </Form.Item>
              <Space style={{ width: '100%' }}>
                <Form.Item name="username" label={<span style={{ color: '#9CA3AF' }}>用户名</span>} style={{ flex: 1 }}>
                  <Input placeholder="留空表示匿名" />
                </Form.Item>
                <Form.Item name="password" label={<span style={{ color: '#9CA3AF' }}>密码</span>} style={{ flex: 1 }}>
                  <Input.Password placeholder={form.getFieldValue('hasPassword') ? '•••••••• (已设置)' : '留空表示无密码'} />
                </Form.Item>
              </Space>
              <Form.Item name="topics" label={<span style={{ color: '#9CA3AF' }}>订阅主题（一行一个）</span>}
                rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder={'/energon/solar/#\n/energon/battery/#\n/energon/load/#\n/energon/grid/#'} />
              </Form.Item>
              <Form.Item name="enabled" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch checkedChildren="启用采集" unCheckedChildren="暂停采集" />
              </Form.Item>
              <Divider style={{ margin: '16px 0' }} />
              <Space>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading} style={{ background: '#667EEA' }}>
                  保存配置
                </Button>
                <Button icon={<ReloadOutlined />} onClick={onTest} loading={testing}>
                  测试连接参数
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* Right: Status + Topics */}
        <Col span={10}>
          <Card size="small" title={<span style={{ color: '#fff' }}>当前状态</span>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {status === 'ok' ? <CheckCircleFilled style={{ color: '#00D4AA', fontSize: 18 }} /> :
                 status === 'fail' ? <CloseCircleFilled style={{ color: '#F87171', fontSize: 18 }} /> :
                 <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />}
                <span style={{ color: status === 'ok' ? '#00D4AA' : status === 'fail' ? '#F87171' : '#9CA3AF', fontSize: 13 }}>
                  {status === 'ok' ? '连接参数正常' : status === 'fail' ? '参数有误' : '等待测试'}
                </span>
              </div>
              {testMsg && (
                <div style={{ color: '#9CA3AF', fontSize: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                  {testMsg}
                </div>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>推荐主题格式</div>
                {[
                  { topic: '/energon/solar/{station}/power', desc: '光伏逆变器实时功率' },
                  { topic: '/energon/battery/{station}/soc', desc: 'BMS荷电状态' },
                  { topic: '/energon/load/{station}/kw', desc: '负荷功率' },
                  { topic: '/energon/grid/{station}/import', desc: '电网购电功率' },
                ].map(t => (
                  <div key={t.topic} style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Tag style={{ fontFamily: 'monospace', fontSize: 10, background: 'rgba(102,126,234,0.15)', border: 'none', color: '#667EEA' }}>{t.topic}</Tag>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{t.desc}</span>
                  </div>
                ))}
              </div>
            </Space>
          </Card>

          <Card size="small" title={<span style={{ color: '#fff' }}>说明</span>} style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.8 }}>
              <p>• 当前使用 <Tag style={{ fontFamily: 'monospace', fontSize: 10 }}>synthetic</Tag> 合成数据（无真实设备时）</p>
              <p>• 接入真实 MQTT 后，实时监控页面将自动显示真实数据</p>
              <p>• 支持 TLS/SSL 加密连接（mqtts://）</p>
              <p>• 支持 WebSocket 穿透防火墙（ws://）</p>
              <p>• 支持 QoS 0/1/2 消息质量等级</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

