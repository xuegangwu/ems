import { useRef, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface ChargingStationProps {
  position: [number, number, number];
  onClick?: () => void;
  isSelected?: boolean;
  chargingPower?: number; // kW
  evCount?: number;
}

export default function ChargingStation({
  position,
  onClick,
  isSelected,
  chargingPower = 0,
  evCount = 1,
}: ChargingStationProps) {
  const ledRef = useRef<THREE.Mesh>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const cableRef = useRef<THREE.Mesh[]>([]);

  const statusColor = useMemo(() => {
    if (chargingPower === 0) return '#4a5568';
    if (chargingPower < 20) return '#ED8936';
    if (chargingPower < 60) return '#38A169';
    return '#00D4AA';
  }, [chargingPower]);

  const isCharging = chargingPower > 0;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Pulsing LED
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isCharging ? 1.5 + Math.sin(t * 4) * 0.5 : 0.3;
    }
    // Screen flicker when charging
    if (screenRef.current && isCharging) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.2 + Math.sin(t * 8) * 0.05;
    }
    // Cable glow animation
    cableRef.current.forEach((cable, i) => {
      if (cable && isCharging) {
        const mat = cable.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.3 + Math.sin(t * 3 + i) * 0.2;
      }
    });
  });

  const statusText = useMemo(() => {
    if (chargingPower === 0) return '待机';
    if (chargingPower < 20) return '慢充';
    if (chargingPower < 60) return '快充';
    return '极速充';
  }, [chargingPower]);

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Main body */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2.0, 0.9]} />
        <meshStandardMaterial
          color={isSelected ? '#2a4a5a' : '#1a2a3a'}
          emissive={isSelected ? '#1a3a5a' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.55}
          metalness={0.4}
        />
      </mesh>

      {/* Top canopy */}
      <mesh position={[0, 2.15, 0]} castShadow>
        <boxGeometry args={[3.2, 0.12, 1.2]} />
        <meshStandardMaterial color="#2a3a4a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Canopy support */}
      {[[-1.2, 0], [1.2, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.15, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 2.3, 8]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 1.35, 0.46]}>
        <planeGeometry args={[1.8, 0.9]} />
        <meshStandardMaterial
          color={isCharging ? '#0a2a1a' : '#1a1a2a'}
          emissive={statusColor}
          emissiveIntensity={isCharging ? 0.25 : 0.08}
        />
      </mesh>

      {/* Status LED strip */}
      <mesh position={[0, 1.85, 0.46]}>
        <planeGeometry args={[1.6, 0.08]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={isCharging ? 1 : 0.2} />
      </mesh>

      {/* Charging LED */}
      <mesh ref={ledRef} position={[0, 1.85, 0.47]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={isCharging ? 2 : 0.3} />
      </mesh>

      {/* Screen text */}
      <Text position={[0, 1.5, 0.47]} fontSize={0.22} color={statusColor} anchorX="center">
        {isCharging ? `${chargingPower.toFixed(1)} kW` : '就绪'}
      </Text>
      <Text position={[0, 1.25, 0.47]} fontSize={0.18} color="rgba(255,255,255,0.5)" anchorX="center">
        {statusText} · {evCount} 桩
      </Text>

      {/* Connector handles */}
      {[-0.7, 0.7].map((x, i) => (
        <group key={i} position={[x, 0.5, 0.45]}>
          {/* Gun body */}
          <mesh ref={el => { if (el) cableRef.current[i] = el; }} rotation={[Math.PI / 4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.055, 0.45, 8]} />
            <meshStandardMaterial
              color={isCharging ? statusColor : '#3a3a4a'}
              emissive={isCharging ? statusColor : '#000'}
              emissiveIntensity={isCharging ? 0.3 : 0}
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
          {/* Handle grip */}
          <mesh position={[0, -0.35, 0.25]} rotation={[Math.PI / 5, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.045, 0.5, 8]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.6} />
          </mesh>
          {/* Cable */}
          <mesh position={[0, -0.7, 0.35]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
            <meshStandardMaterial color="#1a1a2a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Base foundation */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.15, 1.0]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.9} />
      </mesh>

      {/* Floor marking */}
      <mesh position={[0, 0.08, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 0.6]} />
        <meshBasicMaterial color="#1a3020" transparent opacity={0.5} />
      </mesh>

      {/* Selection glow */}
      {isSelected && (
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[3.0, 2.2, 1.1]} />
          <meshBasicMaterial color="#38A169" wireframe transparent opacity={0.5} />
        </mesh>
      )}

      {/* Active glow ring */}
      {isCharging && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.5, 32]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.15} />
        </mesh>
      )}

      {/* Label */}
      <Text position={[0, -0.3, 0]} fontSize={0.52} color="rgba(255,255,255,0.5)" anchorX="center">
        充电桩
      </Text>
      <Text position={[0, -0.7, 0]} fontSize={0.42} color={statusColor} anchorX="center">
        {isCharging ? `⚡ 充电中 ${chargingPower.toFixed(1)}kW` : '✓ 待机'}
      </Text>
    </group>
  );
}
