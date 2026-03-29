const About = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>ℹ️ 关于 Solaripple Lab</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginBottom: '16px' }}>关于我们</h2>
          <p style={{ color: '#666', lineHeight: '1.8', marginBottom: '20px' }}>
            Solaripple Lab 是专注工商业光储项目的研发与实验平台，致力于为全球企业提供最前沿的光储技术解决方案。
          </p>
          <p style={{ color: '#666', lineHeight: '1.8' }}>
            我们整合全球优质资源，结合本地化服务能力，为中国、日本、东南亚及欧洲市场的工商业客户提供一站式光储服务。
          </p>
          
          <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>核心能力</h3>
          <ul style={{ color: '#666', lineHeight: '2' }}>
            <li>🔬 技术研发 - 光储系统优化与创新</li>
            <li>📊 项目分析 - 全方位项目评估与尽调</li>
            <li>💡 解决方案 - 定制化光储系统设计</li>
            <li>⚡ 运营管理 - 智能化运维与数据分析</li>
          </ul>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '16px' }}>📞 联系我们</h3>
            <p style={{ color: '#666', marginBottom: '8px' }}>📧 info@solaripple.com</p>
            <p style={{ color: '#666' }}>🌐 www.solaripple.com</p>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, #0066FF, #00D4AA)', padding: '24px', borderRadius: '12px', color: 'white' }}>
            <h3 style={{ marginBottom: '12px' }}>相关链接</h3>
            <p style={{ marginBottom: '8px' }}>🔗 <a href="https://solaripple.com" style={{ color: 'white' }}>Solaripple 主站</a></p>
            <p style={{ marginBottom: '8px' }}>🔗 <a href="https://xuegangwu.github.io/guangchu" style={{ color: 'white' }}>光储龙虾社区</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
