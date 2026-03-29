const Tools = () => {
  const tools = [
    { icon: '📊', name: '投资计算器', desc: '计算项目投资回报周期' },
    { icon: '⚡', name: '系统配置', desc: '推荐最优光储系统配置' },
    { icon: '📈', name: '收益分析', desc: '分析不同场景收益情况' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>🔧 工具箱</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>项目分析与计算工具</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {tools.map((tool, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{tool.icon}</div>
            <h3 style={{ marginBottom: '8px' }}>{tool.name}</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>{tool.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tools;
