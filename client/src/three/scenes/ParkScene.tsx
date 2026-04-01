import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Stars } from '@react-three/drei';
import { Suspense } from 'react';
import Building from '../components/Building';
import SolarArray from '../components/SolarArray';
import BatteryCabinet from '../components/BatteryCabinet';
import ChargingStation from '../components/ChargingStation';
import EnergyFlowEffect from './EnergyFlowEffect';

interface ParkSceneProps {
  devices?: {
    solarPower: number;
    batterySoc: number;
    batteryPower: number;
    evCharging: number;
    load: number;
    gridExport: number;
  };
  selectedDevice?: string;
  onDeviceClick?: (id: string) => void;
}

function SceneContent({ devices, selectedDevice, onDeviceClick }: ParkSceneProps) {
  return (
    <>
      {/* Camera & Controls */}
      <PerspectiveCamera makeDefault position={[30, 25, 30]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.2}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight args={['#87CEEB', '#2d4a2d', 0.3]} />

      {/* Environment */}
      <Stars radius={100} depth={50} count={1000} factor={4} fade speed={1} />
      <Grid
        position={[0, -0.01, 0]}
        args={[100, 100]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#1a3a5c"
        sectionSize={10}
        sectionThickness={1}
        sectionColor="#0a5a8c"
        fadeDistance={80}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.9} />
      </mesh>

      {/* Buildings */}
      <Building
        position={[-8, 0, -5]}
        size={[12, 6, 8]}
        color="#2a3a5a"
        onClick={() => onDeviceClick?.('building-main')}
        isSelected={selectedDevice === 'building-main'}
      />
      <Building
        position={[5, 0, -8]}
        size={[8, 4, 6]}
        color="#1a2a4a"
        onClick={() => onDeviceClick?.('building-2')}
        isSelected={selectedDevice === 'building-2'}
      />

      {/* Solar Arrays */}
      <SolarArray
        position={[-15, 0, 5]}
        rows={4}
        cols={6}
        onClick={() => onDeviceClick?.('solar')}
        isSelected={selectedDevice === 'solar'}
        power={devices?.solarPower ?? 0}
      />
      <SolarArray
        position={[10, 0, 5]}
        rows={3}
        cols={4}
        onClick={() => onDeviceClick?.('solar-2')}
        isSelected={selectedDevice === 'solar-2'}
        power={devices?.solarPower ?? 0}
      />

      {/* Battery Storage */}
      <BatteryCabinet
        position={[0, 0, -12]}
        onClick={() => onDeviceClick?.('battery')}
        isSelected={selectedDevice === 'battery'}
        soc={devices?.batterySoc ?? 75}
        power={devices?.batteryPower ?? 0}
      />

      {/* EV Charging Station */}
      <ChargingStation
        position={[12, 0, -5]}
        onClick={() => onDeviceClick?.('ev')}
        isSelected={selectedDevice === 'ev'}
        chargingPower={devices?.evCharging ?? 0}
      />

      {/* Energy Flow Effect */}
      <EnergyFlowEffect devices={devices} />

      {/* Environment */}
      <Environment preset="night" />
    </>
  );
}

export default function ParkScene(props: ParkSceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0e1a' }}>
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
