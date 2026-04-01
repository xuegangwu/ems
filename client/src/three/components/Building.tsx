import { useRef } from 'react';
import * as THREE from 'three';

interface BuildingProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function Building({ position, size, color = '#2a3a5a', onClick, isSelected }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={position}>
      {/* Main building body */}
      <mesh
        ref={meshRef}
        position={[0, size[1] / 2, 0]}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={isSelected ? '#4a6a9a' : color}
          emissive={isSelected ? '#1a3a6a' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Window rows */}
      {Array.from({ length: Math.floor(size[1] / 1.5) }).map((_, floor) => (
        <group key={floor} position={[0, floor * 1.5 + 0.75, size[2] / 2 + 0.01]}>
          {Array.from({ length: Math.floor(size[0] / 1.5) }).map((_, col) => (
            <mesh key={col} position={[(col - (Math.floor(size[0] / 1.5) - 1) / 2) * 1.5, 0, 0]}>
              <planeGeometry args={[1, 0.8]} />
              <meshStandardMaterial
                color="#3a6a9a"
                emissive="#2a4a7a"
                emissiveIntensity={0.5}
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Roof */}
      <mesh position={[0, size[1] + 0.1, 0]} castShadow>
        <boxGeometry args={[size[0] + 0.4, 0.2, size[2] + 0.4]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.8} />
      </mesh>

      {/* Selection glow */}
      {isSelected && (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={[size[0] + 0.3, size[1] + 0.3, size[2] + 0.3]} />
          <meshBasicMaterial color="#4a9aff" wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
