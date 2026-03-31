const Projects = () => {
  const projects = [
    { name: '上海某工业园区', type: '园区综合能源', capacity: '5MW/10MWh', status: '运行中' },
    { name: '日本某制造工厂', type: '工业光储', capacity: '2MW/4MWh', status: '并网中' },
    { name: '马来西亚商业建筑', type: '商业建筑', capacity: '1MW/2MWh', status: '测试中' },
    { name: '越南某工业园', type: '工业光储', capacity: '3MW/6MWh', status: '规划中' },
    { name: '德国某商业中心', type: '商业建筑', capacity: '800kW/1.6MWh', status: '运行中' },
    { name: '澳大利亚某农场', type: '农业光储', capacity: '500kW/1MWh', status: '运行中' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: 'white' }}>🏢 项目案例库</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>展示国内外工商业光储项目案例</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {projects.map((project, idx) => (
          <div key={idx} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(102,126,234,0.12)',
            padding: 20,
            borderRadius: 12,
          }}>
            <h3 style={{ marginBottom: 10, color: 'white', fontSize: 15, fontWeight: 600 }}>{project.name}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{project.type}</p>
            <p style={{ fontSize: 15, color: '#667EEA', fontWeight: 'bold' }}>⚡ {project.capacity}</p>
            <span style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '4px 12px',
              background: project.status === '运行中' ? 'rgba(0,212,170,0.15)' : project.status === '规划中' ? 'rgba(255,215,0,0.15)' : 'rgba(102,126,234,0.15)',
              borderRadius: 12,
              fontSize: 12,
              color: project.status === '运行中' ? '#00D4AA' : project.status === '规划中' ? '#FFD700' : '#667EEA',
              border: `1px solid ${project.status === '运行中' ? 'rgba(0,212,170,0.3)' : project.status === '规划中' ? 'rgba(255,215,0,0.3)' : 'rgba(102,126,234,0.3)'}`,
            }}>
              {project.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
