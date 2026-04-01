import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { Suspense, Component, ReactNode } from 'react';
import Building from '../components/Building';
import SolarArray from '../components/SolarArray';
import BatteryCabinet from '../components/BatteryCabinet';
import ChargingStation from '../components/ChargingStation';

interface DeviceData {
  solarPower: number;
  batterySoc: number;
  batteryPower: number;
  evCharging: number;
  load: number;
  gridExport: number;
}

interface ParkScene3DProps {
  devices?: DeviceData;
  selectedDevice?: string;
  onDeviceClick?: (id: string) => void;
}

// ─── Error Boundary for Canvas ────────────────────────────────────────────────────────────────────
class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: 480, background: '#0f1629', borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)', fontSize: 14, flexDirection: 'column', gap: 12,
        }}>
          <span style={{ fontSize: 32 }}>🌐</span>
          <span>3D场景暂不可用，请切换到能量流图</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Scene Content ──────────────────────────────────────────────────────────────────────────────
function SceneContent({ devices, selectedDevice, onDeviceClick }: ParkScene3DProps) {
  const { gl } = useThree();
  gl.setClearColor('#0a0e1a');

  const solarPower = devices?.solarPower ?? 0;
  const batterySoc = devices?.batterySoc ?? 75;
  const batteryPower = devices?.batteryPower ?? 0;
  const evCharging = devices?.evCharging ?? 60;
  const gridExport = devices?.gridExport ?? 0;

  return (
    <>
      {/* Camera & Controls */}
      <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={45} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
      />

      {/* Lighting - simplified for mobile */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 50, 25]} intensity={0.9} castShadow={false} />
      <hemisphereLight args={['#87CEEB', '#1a3a2a', 0.5]} />

      {/* Static Ground Grid - no infiniteGrid */}
      <Grid
        position={[0, -0.01, 0]}
        args={[100, 100]}
        cellSize={2}
        cellThickness={0.4}
        cellColor="#1a3a5c"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#0a5a8c"
        fadeDistance={60}
        fadeStrength={1}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0f1a2a" roughness={0.95} />
      </mesh>

      {/* Buildings */}
      <Building position={[-10, 0, -8]} size={[14, 7, 10]} color="#1a2a4a"
        onClick={() => onDeviceClick?.('building-main')} isSelected={selectedDevice === 'building-main'} />
      <Building position={[8, 0, -10]} size={[10, 5, 8]} color="#1a2a3a"
        onClick={() => onDeviceClick?.('building-2')} isSelected={selectedDevice === 'building-2'} />
      <Building position={[15, 0, -14]} size={[6, 3.5, 5]} color="#15202a"
        onClick={() => onDeviceClick?.('building-3')} isSelected={selectedDevice === 'building-3'} />

      {/* Solar Arrays */}
      <SolarArray position={[-18, 0, 8]} rows={5} cols={7}
        onClick={() => onDeviceClick?.('solar')} isSelected={selectedDevice === 'solar'} power={solarPower} />
      <SolarArray position={[8, 0, 8]} rows={3} cols={5}
        onClick={() => onDeviceClick?.('solar-2')} isSelected={selectedDevice === 'solar-2'} power={solarPower * 0.6} />

      {/* Battery */}
      <BatteryCabinet position={[0, 0, -15]}
        onClick={() => onDeviceClick?.('battery')} isSelected={selectedDevice === 'battery'}
        soc={batterySoc} power={batteryPower} />

      {/* EV Charging */}
      <ChargingStation position={[15, 0, -6]}
        onClick={() => onDeviceClick?.('ev')} isSelected={selectedDevice === 'ev'}
        chargingPower={evCharging} evCount={2} />

      {/* Grid tower */}
      <group position={[22, 0, 0]}>
        <mesh position={[0, 4, 0]}>
          <cylinderGeometry args={[0.3, 0.5, 8, 6]} />
          <meshStandardMaterial color="#3a3a4a" roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 8.1, 0]}>
          <coneGeometry args={[1.2, 1.5, 6]} />
          <meshStandardMaterial
            color={gridExport > 0 ? '#27AE60' : '#E53E3E'}
            emissive={gridExport > 0 ? '#27AE60' : '#E53E3E'}
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────────────────────
export default function ParkScene3D(props: ParkScene3DProps) {
  return (
    <CanvasErrorBoundary>
      <Canvas
        shadows={false}
        dpr={[1, 1]}
        style={{ background: '#0a0e1a', borderRadius: 12 }}
        gl={{
          antialias: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0e1a');
        }}
      >
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
