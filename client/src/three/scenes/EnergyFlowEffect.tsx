import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ─── Particle-based Energy Flow Lines ────────────────────────────────────────
interface FlowLineProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  intensity: number; // 0-1
  offset?: number;
}

function FlowParticles({ from, to, color, intensity, offset = 0 }: FlowLineProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 30;

  const { positions, path } = useMemo(() => {
    const p1 = new THREE.Vector3(...from);
    const p2 = new THREE.Vector3(...to);
    const mid = new THREE.Vector3(
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 3,
      (from[2] + to[2]) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const pts = curve.getPoints(count * 2);
    return { positions: new Float32Array(count * 3), path: pts };
  }, [from, to, count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || intensity <= 0) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const t = ((clock.getElapsedTime() * 0.4 + offset) % 1);

    for (let i = 0; i < count; i++) {
      const prog = ((i / count) + t) % 1;
      const pt = path[Math.min(Math.floor(prog * path.length), path.length - 1)];
      pos.setXYZ(i, pt.x, pt.y, pt.z);
    }
    pos.needsUpdate = true;
  });

  if (intensity <= 0) return null;

  const size = Math.max(4, intensity * 18);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={Math.min(0.9, 0.4 + intensity * 0.5)}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ─── Main Energy Flow Effect ─────────────────────────────────────────────────
interface EnergyFlowEffectProps {
  devices?: {
    solarPower?: number;
    batterySoc?: number;
    batteryPower?: number; // positive=discharge, negative=charge
    evCharging?: number;
    load?: number;
    gridExport?: number;
    gridImport?: number;
  };
}

// Device positions in the scene (match ParkScene3D)
const POS = {
  solar1:   [-18, 4, 8]   as [number, number, number],
  solar2:   [8, 4, 8]     as [number, number, number],
  battery:  [0, 2, -15]   as [number, number, number],
  ev:       [15, 2, -6]   as [number, number, number],
  grid:     [22, 5, 0]    as [number, number, number],
  building: [-10, 5, -8]  as [number, number, number],
};

export default function EnergyFlowEffect({ devices }: EnergyFlowEffectProps) {
  const {
    solarPower: _solarPower = 0,
    batteryPower = 0,
    evCharging = 0,
    gridExport = 0,
    gridImport = 0,
  } = devices ?? {};

  const toBatInt = batteryPower < 0 ? Math.min(1, Math.abs(batteryPower) / 400) : 0;
  const fromBatInt = batteryPower > 0 ? Math.min(1, batteryPower / 400) : 0;
  const toEvInt = Math.min(1, evCharging / 80);
  const toGridInt = gridExport > 0 ? Math.min(1, gridExport / 400) : 0;
  const fromGridInt = gridImport > 0 ? Math.min(1, gridImport / 400) : 0;

  return (
    <group>
      {/* Solar → Battery (charging) */}
      <FlowParticles from={POS.solar1} to={POS.battery} color="#3182CE" intensity={toBatInt} offset={0} />
      <FlowParticles from={POS.solar2} to={POS.battery} color="#3182CE" intensity={toBatInt * 0.6} offset={0.3} />

      {/* Solar → Grid (exporting) */}
      <FlowParticles from={POS.solar1} to={POS.grid} color="#9B59B6" intensity={toGridInt} offset={0.1} />
      <FlowParticles from={POS.solar2} to={POS.grid} color="#9B59B6" intensity={toGridInt * 0.6} offset={0.5} />

      {/* Battery → Building (discharging to load) */}
      <FlowParticles from={POS.battery} to={POS.building} color="#00D4AA" intensity={fromBatInt} offset={0.2} />

      {/* Solar → EV (direct) */}
      <FlowParticles from={POS.solar2} to={POS.ev} color="#38A169" intensity={toEvInt * 0.7} offset={0.4} />
      <FlowParticles from={POS.battery} to={POS.ev} color="#38A169" intensity={toEvInt * 0.3} offset={0.6} />

      {/* Grid → Building (importing) */}
      <FlowParticles from={POS.grid} to={POS.building} color="#E53E3E" intensity={fromGridInt} offset={0.7} />

      {/* EV → Grid (V2G) */}
      {evCharging > 0 && (
        <FlowParticles from={POS.ev} to={POS.grid} color="#F6AD55" intensity={toEvInt * 0.2} offset={0.8} />
      )}
    </group>
  );
}

// ─── Glow Ring around device ─────────────────────────────────────────────────
export function DeviceGlow({ position, color, intensity }: {
  position: [number, number, number];
  color: string;
  intensity: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const scale = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.05 * intensity;
    ringRef.current.scale.setScalar(scale);
  });

  if (intensity <= 0) return null;

  return (
    <mesh ref={ringRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2, 0.08, 8, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.3 + intensity * 0.4} />
    </mesh>
  );
}
