import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Monitoring from './pages/Monitoring';
import Operation from './pages/Operation';
import ElectricityTrade from './pages/ElectricityTrade';
import StationTrade from './pages/StationTrade';
import StationManagement from './pages/StationManagement';
import AlertManagement from './pages/AlertManagement';
import AlertRuleManagement from './pages/AlertRuleManagement';
import WorkOrderManagement from './pages/WorkOrderManagement';
import StrategyManagement from './pages/StrategyManagement';
import EconomyAnalysis from './pages/EconomyAnalysis';
import MultiEnergyManagement from './pages/MultiEnergyManagement';
import CarbonAssetManagement from './pages/CarbonAssetManagement';
import AIFaultDiagnosis from './pages/AIFaultDiagnosis';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="operation" element={<Operation />} />
          <Route path="workorders" element={<WorkOrderManagement />} />
          <Route path="electricity-trade" element={<ElectricityTrade />} />
          <Route path="station-trade" element={<StationTrade />} />
          <Route path="stations" element={<StationManagement />} />
          <Route path="alerts" element={<AlertManagement />} />
          <Route path="alert-rules" element={<AlertRuleManagement />} />
          <Route path="strategies" element={<StrategyManagement />} />
          <Route path="economy" element={<EconomyAnalysis />} />
          <Route path="multi-energy" element={<MultiEnergyManagement />} />
          <Route path="carbon" element={<CarbonAssetManagement />} />
          <Route path="ai-diagnosis" element={<AIFaultDiagnosis />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
