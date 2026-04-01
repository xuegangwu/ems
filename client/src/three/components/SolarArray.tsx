import { useRef, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface SolarArrayProps {
  position: [number, number, number];
  rows?: number;
  cols?: number;
  onClick?: () => void;
  isSelected?: boolean;
  power?: number; // current power in kW
}

// Individual solar panel component for instancing
function SolarPanel({ position, rotation, power, isSelected }: {
  position: [number, number, number];
  rotation: [number, number, number];
  power: number;
  isSelected?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const emissiveRef = useRef(0);

  const panelColor = useMemo(() => {
    if (isSelected) return '#4a7ab8';
    const ratio = Math.min(power / 800, 1);
    if (ratio < 0.2) return '#1a3060';
    if (ratio < 0.4) return '#1a4870';
    if (ratio < 0.6) return '#2a6878';
    if (ratio < 0.8) return '#3a7858';
    return '#4a8840';
  }, [power, isSelected]);

  const emissiveColor = useMemo(() => {
    const ratio = Math.min(power / 800, 1);
    if (ratio < 0.2) return '#001040';
    if (ratio < 0.4) return '#003060';
    if (ratio < 0.6) return '#005080';
    if (ratio < 0.8) return '#007050';
    return '#00A030';
  }, [power]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const ratio = Math.min(power / 800, 1);
    const pulse = Math.sin(clock.getElapsedTime() * 2 + position[0] * 0.5) * 0.5 + 0.5;
    emissiveRef.current = ratio * (0.3 + pulse * 0.4);
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = emissiveRef.current;
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.06, 1.3]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Cell surface with emissive glow */}
      <mesh ref={meshRef} position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[1.9, 0.03, 1.1]} />
        <meshStandardMaterial
          color={panelColor}
          emissive={emissiveColor}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Grid lines overlay */}
      <mesh position={[0, 0.05, 0]}>
        <planeGeometry args={[1.9, 1.1]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.08 + Math.min(power / 800, 1) * 0.12}
        />
      </mesh>
    </group>
  );
}

const TILT: [number, number, number] = [Math.PI / 6, 0, 0]; // 30 degree tilt

export default function SolarArray({
  position,
  rows = 5,
  cols = 7,
  onClick,
  isSelected,
  power = 0,
}: SolarArrayProps) {
  const groupRef = useRef<THREE.Group>(null);
  const totalPanels = rows * cols;

  const panelData = useMemo(() => {
    const result = [];
    const spacingX = 2.2;
    const spacingZ = 1.35;
    const totalW = cols * spacingX;
    const totalD = rows * spacingZ;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        result.push({
          x: col * spacingX - totalW / 2 + spacingX / 2,
          z: row * spacingZ - totalD / 2,
        });
      }
    }
    return result;
  }, [rows, cols]);

  const powerPerPanel = power / totalPanels;

  return (
    <group ref={groupRef} position={position}>
      {/* Support structure - triangular frame */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[cols * 2.2 + 1, 0.15, 1.5]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Support poles */}
      {[[-cols * 1.1 / 2, 0], [cols * 1.1 / 2, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.2, z]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 2.4, 8]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      {/* Cross beams */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, cols * 2.2 + 1, 8]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Panel array group with tilt */}
      <group
        position={[0, 3.1, 0]}
        rotation={TILT}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        {panelData.map((p, i) => (
          <SolarPanel
            key={i}
            position={[p.x, 0, p.z]}
            rotation={[0, 0, 0]}
            power={powerPerPanel}
            isSelected={isSelected}
          />
        ))}

        {/* Selection glow */}
        {isSelected && (
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[cols * 2.2 + 0.6, 0.1, rows * 1.35 + 0.4]} />
            <meshBasicMaterial color="#FFD700" wireframe transparent opacity={0.4} />
          </mesh>
        )}
      </group>

      {/* Power label floating above */}
      <Text
        position={[0, 5.5, 0]}
        fontSize={0.9}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmYUtfChcVOsSDA.woff2"
      >
        ☀️ {power.toFixed(0)} kW
      </Text>

      {/* Info label */}
      <Text
        position={[0, 4.2, 0]}
        fontSize={0.5}
        color="rgba(255,255,255,0.5)"
        anchorX="center"
        anchorY="middle"
      >
        {rows * cols} 块光伏板
      </Text>

      {/* Label on ground */}
      <Text
        position={[0, 0.15, rows * 1.35 / 2 + 1.5]}
        fontSize={0.55}
        color="rgba(255,255,255,0.6)"
        anchorX="center"
      >
        光伏阵列
      </Text>
    </group>
  );
}
