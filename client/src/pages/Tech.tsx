const Tech = () => {
  const technologies = [
    { name: '光伏组件效率提升技术', status: '测试中', progress: 75 },
    { name: '储能系统热管理优化', status: '已完成', progress: 100 },
    { name: '智能调度算法优化', status: '规划中', progress: 30 },
    { name: '微电网协同控制', status: '测试中', progress: 60 },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: 'white' }}>⚙️ 技术研发</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>新技术测试与验证</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {technologies.map((tech, idx) => (
          <div key={idx} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(102,126,234,0.12)',
            padding: 24,
            borderRadius: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', fontSize: 16, color: 'white' }}>{tech.name}</span>
              <span style={{
                padding: '4px 14px',
                background: tech.status === '已完成' ? 'rgba(0,212,170,0.15)' : tech.status === '测试中' ? 'rgba(102,126,234,0.15)' : 'rgba(255,215,0,0.15)',
                borderRadius: 12,
                fontSize: 12,
                color: tech.status === '已完成' ? '#00D4AA' : tech.status === '测试中' ? '#667EEA' : '#FFD700',
                border: `1px solid ${tech.status === '已完成' ? 'rgba(0,212,170,0.3)' : tech.status === '测试中' ? 'rgba(102,126,234,0.3)' : 'rgba(255,215,0,0.3)'}`,
              }}>{tech.status}</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
              <div style={{
                width: `${tech.progress}%`,
                height: '100%',
                background: tech.progress === 100 ? '#00D4AA' : '#667EEA',
                borderRadius: 4,
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>{tech.progress}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tech;
