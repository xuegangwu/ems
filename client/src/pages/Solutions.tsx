const Solutions = () => {
  const solutions = [
    { icon: '🏭', name: '工业园区', desc: '综合能源解决方案，集成光伏、储能、充电桩', cases: '15+' },
    { icon: '🏢', name: '商业建筑', desc: '楼宇光储系统，降低峰值用电成本', cases: '10+' },
    { icon: '⚙️', name: '制造业', desc: '工厂能耗优化，备用电源保障', cases: '8+' },
    { icon: '🌾', name: '农业设施', desc: '农业大棚、灌溉系统光储方案', cases: '5+' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: 'white' }}>💡 解决方案库</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>不同场景的标准化解决方案</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {solutions.map((sol, idx) => (
          <div key={idx} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(102,126,234,0.12)',
            padding: 24,
            borderRadius: 12,
            display: 'flex',
            gap: 16,
          }}>
            <div style={{ fontSize: 36, flexShrink: 0 }}>{sol.icon}</div>
            <div>
              <h3 style={{ marginBottom: 8, color: 'white', fontSize: 16, fontWeight: 600 }}>{sol.name}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{sol.desc}</p>
              <span style={{ fontSize: 12, color: '#667EEA' }}>📊 {sol.cases} 案例</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Solutions;
