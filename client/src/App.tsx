import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Lab from './pages/Lab';
import Projects from './pages/Projects';
import Solutions from './pages/Solutions';
import Tech from './pages/Tech';
import Tools from './pages/Tools';
import About from './pages/About';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/lab" replace />} />
          <Route path="lab" element={<Lab />} />
          <Route path="projects" element={<Projects />} />
          <Route path="solutions" element={<Solutions />} />
          <Route path="tech" element={<Tech />} />
          <Route path="tools" element={<Tools />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
