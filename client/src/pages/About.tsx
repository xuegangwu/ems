const About = () => {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: 'white' }}>ℹ️ 关于 Solaripple Lab</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', padding: 24, borderRadius: 12 }}>
          <h2 style={{ fontSize: 18, color: 'white', marginBottom: 16 }}>关于我们</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 16 }}>
            Solaripple Lab 是专注工商业光储项目的研发与实验平台，致力于为全球企业提供最前沿的光储技术解决方案。
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            我们整合全球优质资源，结合本地化服务能力，为中国、日本、东南亚及欧洲市场的工商业客户提供一站式光储服务。
          </p>

          <h3 style={{ fontSize: 16, color: 'white', marginTop: 30, marginBottom: 16 }}>核心能力</h3>
          <ul style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 2.2, listStyle: 'none', padding: 0 }}>
            <li>🔬 技术研发 - 光储系统优化与创新</li>
            <li>📊 项目分析 - 全方位项目评估与尽调</li>
            <li>💡 解决方案 - 定制化光储系统设计</li>
            <li>⚡ 运营管理 - 智能化运维与数据分析</li>
          </ul>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(102,126,234,0.12)', padding: 24, borderRadius: 12 }}>
          <h3 style={{ fontSize: 16, color: 'white', marginBottom: 16 }}>📞 联系我们</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontSize: 14 }}>📧 info@solaripple.com</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>🌐 www.solaripple.com</p>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.3), rgba(0,212,170,0.3))', padding: 24, borderRadius: 12, border: '1px solid rgba(102,126,234,0.2)' }}>
          <h3 style={{ fontSize: 16, color: 'white', marginBottom: 12 }}>相关链接</h3>
          <p style={{ marginBottom: 8, fontSize: 14 }}>🔗 <a href="https://solaripple.com" style={{ color: '#667EEA' }}>Solaripple 主站</a></p>
          <p style={{ fontSize: 14 }}>🔗 <a href="https://xuegangwu.github.io/guangchu" style={{ color: '#667EEA' }}>光储龙虾社区</a></p>
        </div>
      </div>
    </div>
  );
};

export default About;
