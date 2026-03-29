const Tech = () => {
  const technologies = [
    { name: '光伏组件效率提升技术', status: '测试中', progress: 75 },
    { name: '储能系统热管理优化', status: '已完成', progress: 100 },
    { name: '智能调度算法优化', status: '规划中', progress: 30 },
    { name: '微电网协同控制', status: '测试中', progress: 60 },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>⚙️ 技术研发</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>新技术测试与验证</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {technologies.map((tech, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{tech.name}</span>
              <span style={{
                padding: '4px 12px',
                background: tech.status === '已完成' ? '#00D4AA' : tech.status === '测试中' ? '#0066FF' : '#FFD700',
                borderRadius: '12px',
                fontSize: '12px'
              }}>{tech.status}</span>
            </div>
            <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px' }}>
              <div style={{
                width: `${tech.progress}%`,
                height: '100%',
                background: tech.progress === 100 ? '#00D4AA' : '#0066FF',
                borderRadius: '4px'
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>{tech.progress}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tech;
