import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component, ReactNode } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DigitalTwin from './pages/DigitalTwin';
import Lab from './pages/Lab';
import Projects from './pages/Projects';
import Solutions from './pages/Solutions';
import Monitoring from './pages/Monitoring';
import StationManagement from './pages/StationManagement';
import ElectricityTrade from './pages/ElectricityTrade';
import VPP from './pages/VPP';
import StationTrade from './pages/StationTrade';
import Operation from './pages/Operation';
import AlertManagement from './pages/AlertManagement';
import Tech from './pages/Tech';
import Tools from './pages/Tools';
import About from './pages/About';
import Login from './pages/Login';
import AIPrediction from './pages/AIPrediction';
import APIExplorer from './pages/APIExplorer';

// ─── Error Boundary ───────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e.message };
  }
  componentDidCatch(e: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', e.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0A0E1A',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', textAlign: 'center', color: 'white',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>页面渲染出错</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
            {this.state.error || '未知错误'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', background: '#00D4AA', color: '#0A0E1A', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Page Wrapper with Error Boundary ──────────────────────────────────────────────────────────
function Page({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Page><Login /></Page>} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Page><Dashboard /></Page>} />
          <Route path="digital-twin" element={<Page><DigitalTwin /></Page>} />
          <Route path="monitoring" element={<Page><Monitoring /></Page>} />
          <Route path="stations" element={<Page><StationManagement /></Page>} />
          <Route path="electricity-trade" element={<Page><ElectricityTrade /></Page>} />
          <Route path="vpp" element={<Page><VPP /></Page>} />
          <Route path="station-trade" element={<Page><StationTrade /></Page>} />
          <Route path="operation" element={<Page><Operation /></Page>} />
          <Route path="alerts" element={<Page><AlertManagement /></Page>} />
          <Route path="ai-prediction" element={<Page><AIPrediction /></Page>} />
          <Route path="lab" element={<Page><Lab /></Page>} />
          <Route path="projects" element={<Page><Projects /></Page>} />
          <Route path="solutions" element={<Page><Solutions /></Page>} />
          <Route path="tech" element={<Page><Tech /></Page>} />
          <Route path="tools" element={<Page><Tools /></Page>} />
          <Route path="api-explorer" element={<Page><APIExplorer /></Page>} />
          <Route path="about" element={<Page><About /></Page>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
