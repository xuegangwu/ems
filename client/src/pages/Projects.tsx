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
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>🏢 项目案例库</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>展示国内外工商业光储项目案例</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {projects.map((project, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ marginBottom: '12px' }}>{project.name}</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{project.type}</p>
            <p style={{ fontSize: '16px', color: '#0066FF', fontWeight: 'bold' }}>⚡ {project.capacity}</p>
            <span style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '4px 12px',
              background: project.status === '运行中' ? '#00D4AA' : project.status === '规划中' ? '#FFD700' : '#0066FF',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#1A1A2E'
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
