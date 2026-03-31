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

  const tabs = [
    { key: 'overview', label: '📊 概览' },
    { key: 'projects', label: '🏢 项目' },
    { key: 'tech', label: '⚙️ 技术' },
    { key: 'tools', label: '🔧 工具' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: 'white' }}>
          🧪 Solaripple Lab
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          工商业光储实验室 - 专注技术研发、项目验证、解决方案优化
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(102,126,234,0.12)',
            padding: '16px',
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: '#667EEA' }}>{stat.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab.key ? '#667EEA' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.5)',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              fontSize: 14,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', padding: 24, borderRadius: 12 }}>
          <h2 style={{ fontSize: 16, color: 'white', marginBottom: 16 }}>
            {activeTab === 'overview' && '📈 最新动态'}
            {activeTab === 'projects' && '🏢 项目案例'}
            {activeTab === 'tech' && '⚙️ 技术研发'}
            {activeTab === 'tools' && '🔧 工具箱'}
          </h2>

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentProjects.map((project, idx) => (
                <div key={idx} style={{
                  padding: '14px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: 'white', fontSize: 14 }}>{project.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{project.type} | {project.capacity}</div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    background: project.status === '运行中' ? 'rgba(0,212,170,0.2)' : 'rgba(255,215,0,0.2)',
                    borderRadius: 12,
                    fontSize: 11,
                    color: project.status === '运行中' ? '#00D4AA' : '#FFD700',
                    border: `1px solid ${project.status === '运行中' ? 'rgba(0,212,170,0.3)' : 'rgba(255,215,0,0.3)'}`,
                  }}>
                    {project.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'projects' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {recentProjects.map((project, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  borderLeft: '3px solid #667EEA',
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, color: 'white', fontSize: 14 }}>{project.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{project.type}</div>
                  <div style={{ fontSize: 13, color: '#667EEA' }}>⚡ {project.capacity}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tech' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {technologies.map((tech, idx) => (
                <div key={idx} style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 'bold', color: 'white', fontSize: 14 }}>{tech.name}</span>
                    <span style={{
                      padding: '3px 10px',
                      background: tech.status === '已完成' ? 'rgba(0,212,170,0.2)' : tech.status === '测试中' ? 'rgba(102,126,234,0.2)' : 'rgba(255,215,0,0.2)',
                      borderRadius: 10,
                      fontSize: 11,
                      color: tech.status === '已完成' ? '#00D4AA' : tech.status === '测试中' ? '#667EEA' : '#FFD700',
                    }}>{tech.status}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <div style={{
                      width: `${tech.progress}%`,
                      height: '100%',
                      background: tech.progress === 100 ? '#00D4AA' : '#667EEA',
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tools' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { icon: '📊', name: '投资计算器', desc: '计算项目回报周期' },
                { icon: '⚡', name: '系统配置', desc: '推荐最优方案' },
                { icon: '📈', name: '收益分析', desc: '分析收益情况' },
              ].map((tool, idx) => (
                <div key={idx} style={{
                  padding: '24px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '1px solid rgba(102,126,234,0.12)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{tool.icon}</div>
                  <div style={{ fontWeight: 'bold', marginBottom: 4, color: 'white', fontSize: 14 }}>{tool.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{tool.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lab;
