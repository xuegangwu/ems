import { useState } from 'react';

const Lab = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: '项目案例', value: '20+', icon: '🏢' },
    { label: '解决方案', value: '15+', icon: '💡' },
    { label: '技术测试', value: '50+', icon: '⚙️' },
    { label: '覆盖行业', value: '10+', icon: '🌏' },
  ];

  const recentProjects = [
    { name: '上海某工业园区光储项目', type: '园区综合能源', capacity: '5MW/10MWh', status: '运行中' },
    { name: '日本某制造业工厂光储', type: '工业光储', capacity: '2MW/4MWh', status: '并网中' },
    { name: '马来西亚商业建筑光储', type: '商业建筑', capacity: '1MW/2MWh', status: '测试中' },
  ];

  const technologies = [
    { name: '光伏组件效率提升', status: '测试中', progress: 75 },
    { name: '储能系统热管理', status: '已完成', progress: 100 },
    { name: '智能调度算法优化', status: '规划中', progress: 30 },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          🧪 Solaripple Lab
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          工商业光储实验室 - 专注技术研发、项目验证、解决方案优化
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0066FF' }}>{stat.value}</div>
            <div style={{ color: '#666', fontSize: '14px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #eee' }}>
        {['overview', 'projects', 'tech', 'tools'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === tab ? '#0066FF' : 'transparent',
              color: activeTab === tab ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
            }}
          >
            {tab === 'overview' ? '📊 概览' : 
             tab === 'projects' ? '🏢 项目' : 
             tab === 'tech' ? '⚙️ 技术' : '🔧 工具'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
            {activeTab === 'overview' && '📈 最新动态'}
            {activeTab === 'projects' && '🏢 项目案例'}
            {activeTab === 'tech' && '⚙️ 技术研发'}
            {activeTab === 'tools' && '🔧 工具箱'}
          </h2>
          
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentProjects.map((project, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{project.name}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>{project.type} | {project.capacity}</div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    background: project.status === '运行中' ? '#00D4AA' : '#FFD700',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#1A1A2E'
                  }}>
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'projects' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {recentProjects.map((project, idx) => (
                <div key={idx} style={{
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #0066FF'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{project.name}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{project.type}</div>
                  <div style={{ fontSize: '14px', color: '#0066FF' }}>⚡ {project.capacity}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tech' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {technologies.map((tech, idx) => (
                <div key={idx} style={{ padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{tech.name}</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{tech.status}</span>
                  </div>
                  <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
                    <div style={{
                      width: `${tech.progress}%`,
                      height: '100%',
                      background: tech.progress === 100 ? '#00D4AA' : '#0066FF',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tools' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
                <div style={{ fontWeight: 'bold' }}>投资计算器</div>
                <div style={{ fontSize: '12px', color: '#666' }}>计算项目回报周期</div>
              </div>
              <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontWeight: 'bold' }}>系统配置</div>
                <div style={{ fontSize: '12px', color: '#666' }}>推荐最优方案</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>🔬 关于 Lab</h3>
            <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
              Solaripple Lab 专注于工商业光储项目的技术研发与验证，为企业提供最前沿的解决方案。
            </p>
            <button style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#0066FF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              了解更多 →
            </button>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>📞 合作咨询</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>
              有项目合作意向？联系我们获取定制化方案。
            </p>
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              📧 info@solaripple.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lab;
