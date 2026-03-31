import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="digital-twin" element={<DigitalTwin />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="stations" element={<StationManagement />} />
          <Route path="electricity-trade" element={<ElectricityTrade />} />
          <Route path="vpp" element={<VPP />} />
          <Route path="station-trade" element={<StationTrade />} />
          <Route path="operation" element={<Operation />} />
          <Route path="alerts" element={<AlertManagement />} />
          <Route path="ai-prediction" element={<AIPrediction />} />
          <Route path="lab" element={<Lab />} />
          <Route path="projects" element={<Projects />} />
          <Route path="solutions" element={<Solutions />} />
          <Route path="tech" element={<Tech />} />
          <Route path="tools" element={<Tools />} />
          <Route path="api-explorer" element={<APIExplorer />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
