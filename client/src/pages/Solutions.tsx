const Solutions = () => {
  const solutions = [
    { icon: '🏭', name: '工业园区', desc: '综合能源解决方案，集成光伏、储能、充电桩', cases: '15+' },
    { icon: '🏢', name: '商业建筑', desc: '楼宇光储系统，降低峰值用电成本', cases: '10+' },
    { icon: '🏭', name: '制造业', desc: '工厂能耗优化，备用电源保障', cases: '8+' },
    { icon: '🌾', name: '农业设施', desc: '农业大棚、灌溉系统光储方案', cases: '5+' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>💡 解决方案库</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>不同场景的标准化解决方案</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {solutions.map((sol, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            gap: '20px',
          }}>
            <div style={{ fontSize: '48px' }}>{sol.icon}</div>
            <div>
              <h3 style={{ marginBottom: '8px' }}>{sol.name}</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>{sol.desc}</p>
              <span style={{ fontSize: '12px', color: '#0066FF' }}>📊 {sol.cases} 案例</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Solutions;
