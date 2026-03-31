const Tools = () => {
  const tools = [
    { icon: '📊', name: '投资计算器', desc: '计算项目投资回报周期' },
    { icon: '⚡', name: '系统配置', desc: '推荐最优光储系统配置' },
    { icon: '📈', name: '收益分析', desc: '分析不同场景收益情况' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: 'white' }}>🔧 工具箱</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>项目分析与计算工具</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {tools.map((tool, idx) => (
          <div key={idx} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(102,126,234,0.12)',
            padding: 32,
            borderRadius: 12,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{tool.icon}</div>
            <h3 style={{ marginBottom: 8, color: 'white', fontSize: 16, fontWeight: 600 }}>{tool.name}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{tool.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tools;
