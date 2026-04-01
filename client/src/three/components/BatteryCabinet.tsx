import { useRef, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface BatteryCabinetProps {
  position: [number, number, number];
  onClick?: () => void;
  isSelected?: boolean;
  soc?: number; // 0-100%
  power?: number; // kW (positive=discharge, negative=charge)
}

export default function BatteryCabinet({
  position,
  onClick,
  isSelected,
  soc = 75,
  power = 0,
}: BatteryCabinetProps) {
  const ledRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const barRef = useRef<THREE.Mesh>(null);

  const socColor = useMemo(() => {
    if (soc < 20) return '#E53E3E';
    if (soc < 40) return '#ED8936';
    if (soc < 60) return '#ECC94B';
    return '#38A169';
  }, [soc]);

  const statusColor = power >= 0 ? '#38A169' : '#3182CE';
  const isDischarging = power > 0;
  const isCharging = power < 0;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Pulsing LED ring
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isDischarging || isCharging
        ? 1.5 + Math.sin(t * 4) * 0.5
        : 0.8 + Math.sin(t * 1.5) * 0.2;
    }
    // Pulsing outer ring
    if (ringRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.04 * (isDischarging || isCharging ? 1 : 0.3);
      ringRef.current.scale.setScalar(scale);
    }
    // SOC bar shimmer
    if (barRef.current) {
      const mat = barRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.15;
    }
  });

  const powerText = useMemo(() => {
    if (power > 0) return `⚡ 放电 ${power.toFixed(0)}kW`;
    if (power < 0) return `🔌 充电 ${Math.abs(power).toFixed(0)}kW`;
    return '✓ 待机';
  }, [power]);

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Main cabinet */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.6, 1.6]} />
        <meshStandardMaterial
          color={isSelected ? '#2a4a6a' : '#1a2a3a'}
          emissive={isSelected ? '#1a3a6a' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.55}
          metalness={0.4}
        />
      </mesh>

      {/* Cabinet top ridge */}
      <mesh position={[0, 2.7, 0]} castShadow>
        <boxGeometry args={[3.4, 0.12, 1.8]} />
        <meshStandardMaterial color="#2a3a4a" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Front panel - dark glass */}
      <mesh position={[0, 1.3, 0.81]}>
        <boxGeometry args={[2.8, 2.2, 0.02]} />
        <meshStandardMaterial color="#0a1520" roughness={0.1} metalness={0.3} transparent opacity={0.95} />
      </mesh>

      {/* SOC bar background */}
      <mesh position={[0, 2.05, 0.83]}>
        <boxGeometry args={[2.4, 0.28, 0.02]} />
        <meshStandardMaterial color="#1a1a2a" />
      </mesh>

      {/* SOC bar fill */}
      <mesh ref={barRef} position={[-(2.4 * (1 - soc / 100)) / 2, 2.05, 0.84]}>
        <boxGeometry args={[2.4 * (soc / 100), 0.24, 0.02]} />
        <meshStandardMaterial color={socColor} emissive={socColor} emissiveIntensity={0.4} />
      </mesh>

      {/* Battery cell visualization (6 cells) */}
      {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
        <group key={i} position={[x, 1.3, 0.84]}>
          <mesh>
            <boxGeometry args={[0.45, 1.0, 0.02]} />
            <meshStandardMaterial
              color={socColor}
              emissive={socColor}
              emissiveIntensity={0.25}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Cell divider */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[0.47, 0.01, 0.01]} />
            <meshBasicMaterial color="#0a1520" />
          </mesh>
        </group>
      ))}

      {/* Status LED ring on top */}
      <mesh ref={ledRef} position={[0, 2.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.06, 16, 32]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={isDischarging || isCharging ? 2 : 0.8}
        />
      </mesh>

      {/* Corner status lights */}
      {[[-1.3, 0.9], [1.3, 0.9], [-1.3, 1.7], [1.3, 1.7]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.82]}>
          <circleGeometry args={[0.06, 16]} />
          <meshStandardMaterial
            color={i < 2 ? (isDischarging ? '#38A169' : isCharging ? '#3182CE' : '#4a4a5a') : '#1a1a2a'}
            emissive={i < 2 ? (isDischarging ? '#38A169' : isCharging ? '#3182CE' : '#4a4a5a') : '#000'}
            emissiveIntensity={i < 2 ? 1 : 0}
          />
        </mesh>
      ))}

      {/* Terminal block on side */}
      <mesh position={[1.4, 1.3, 0]}>
        <boxGeometry args={[0.25, 0.7, 1.0]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Terminal bolts */}
      {[[0.2, 0.3], [0.2, -0.3]].map(([y, z], i) => (
        <mesh key={i} position={[1.55, 1.3 + y, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 8]} />
          <meshStandardMaterial color={i === 0 ? '#E53E3E' : '#2a6a9a'} roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Info text */}
      <Text position={[0, 0.5, 0.85]} fontSize={0.55} color="white" anchorX="center" anchorY="middle">
        🔋 {soc.toFixed(1)}%
      </Text>
      <Text position={[0, 0.0, 0.85]} fontSize={0.42} color={statusColor} anchorX="center" anchorY="middle">
        {powerText}
      </Text>

      {/* Selection glow */}
      {isSelected && (
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[3.4, 2.8, 1.8]} />
          <meshBasicMaterial color="#00D4AA" wireframe transparent opacity={0.5} />
        </mesh>
      )}

      {/* Animated glow ring when active */}
      {isDischarging || isCharging ? (
        <mesh ref={ringRef} position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.05, 8, 32]} />
          <meshBasicMaterial color={statusColor} transparent opacity={0.25} />
        </mesh>
      ) : null}

      {/* Label */}
      <Text position={[0, -0.4, 0]} fontSize={0.52} color="rgba(255,255,255,0.5)" anchorX="center">
        储能电池系统
      </Text>
    </group>
  );
}
