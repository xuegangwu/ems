import { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { StationDigitalTwin, IoTDevice } from './DigitalTwin';

// ─── Solar Panel Array ───────────────────────────────────────────────────────────────
function SolarArray({ position, rotation = 0, countX = 6, countZ = 4, scale = 1 }: { position: [number, number, number]; rotation?: number; countX?: number; countZ?: number; scale?: number }) {
  const panelW = 2 * scale, panelH = 1.2 * scale;
  const tiltAngle = -Math.PI / 5; // 36° tilt
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Support structure */}
      {[-((countX - 1) * panelW) / 2, ((countX - 1) * panelW) / 2].map((x, i) => (
        <mesh key={i} position={[x, panelH / 2 * Math.cos(tiltAngle), 0]} >
          <boxGeometry args={[0.1, panelH, 0.1]} />
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Panel rows */}
      {Array.from({ length: countZ }).map((_, z) =>
        Array.from({ length: countX }).map((_, x) => {
          const px = (x - (countX - 1) / 2) * panelW;
          const pz = (z - (countZ - 1) / 2) * panelH * 1.1;
          return (
            <mesh
              key={`${x}-${z}`}
              position={[px, panelH / 2 * Math.cos(tiltAngle), pz]}
              rotation={[tiltAngle, 0, 0]}
              
              
            >
              <boxGeometry args={[panelW * 0.98, 0.05, panelH * 0.98]} />
              <meshStandardMaterial
                color="#1a3a6a"
                metalness={0.9}
                roughness={0.1}
                emissive="#0a1428"
                emissiveIntensity={0.2}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// ─── Battery Storage Cabinet ───────────────────────────────────────────────────────
function BatteryCabinet({ position, soc = 78 }: { position: [number, number, number]; soc?: number }) {
  const glowColor = soc > 80 ? '#00ff88' : soc > 50 ? '#ffcc00' : '#ff4444';
  const flickerRef = useRef<number>(0);

  useFrame(({ clock }) => {
    flickerRef.current = Math.sin(clock.elapsedTime * 2) * 0.5 + 0.5;
  });

  return (
    <group position={position}>
      {/* Main cabinet body */}
      <mesh  >
        <boxGeometry args={[4, 3, 2]} />
        <meshStandardMaterial color="#0f1a2e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Top accent light */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[3.8, 0.1, 1.8]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.8} />
      </mesh>
      {/* Battery cell indicators */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-1.5 + i * 0.43, 0.2, 1.01]} >
          <boxGeometry args={[0.35, 1.5, 0.05]} />
          <meshStandardMaterial
            color={i < soc / 12.5 ? glowColor : '#1a2a3a'}
            emissive={i < soc / 12.5 ? glowColor : '#000'}
            emissiveIntensity={i < soc / 12.5 ? 0.6 : 0}
          />
        </mesh>
      ))}
      {/* Ventilation grilles */}
      <mesh position={[0, -1, 1.01]}>
        <boxGeometry args={[3.5, 0.4, 0.02]} />
        <meshStandardMaterial color="#2a3a4a" />
      </mesh>
      {/* Logo label */}
      <Text position={[0, 0, 1.06]} fontSize={0.3} color="#00D4AA" anchorX="center" anchorY="middle">
        BESS
      </Text>
    </group>
  );
}

// ─── EV Charger ─────────────────────────────────────────────────────────────────────
function EVCharger({ position, status = 'charging', power }: { position: [number, number, number]; status?: string; power?: number }) {
  const isCharging = status === 'charging';
  const baseColor = isCharging ? '#38A169' : '#555';

  return (
    <group position={position}>
      {/* Main body */}
      <mesh >
        <boxGeometry args={[0.8, 2, 0.5]} />
        <meshStandardMaterial color={baseColor} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Screen */}
      <mesh position={[0.26, 0.3, 0]}>
        <boxGeometry args={[0.05, 0.6, 0.4]} />
        <meshStandardMaterial color="#001a0a" emissive={isCharging ? '#00ff44' : '#333'} emissiveIntensity={isCharging ? 0.4 : 0.1} />
      </mesh>
      {/* Status light */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={isCharging ? '#38A169' : '#888'}
          emissive={isCharging ? '#38A169' : '#333'}
          emissiveIntensity={isCharging ? 1.5 : 0.2}
        />
      </mesh>
      {/* Cable */}
      <mesh position={[0.5, 0, 0.3]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Power label */}
      {typeof power === 'number' && power > 0 && (
        <Text position={[0, -1.4, 0.26]} fontSize={0.22} color="#38A169" anchorX="center" anchorY="middle">
          {power.toFixed(0)}kW
        </Text>
      )}
    </group>
  );
}

// ─── Industrial Building ────────────────────────────────────────────────────────────
function IndustrialBuilding({ position, size = [20, 8, 15], color = '#1a2040' }: { position: [number, number, number]; size?: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      {/* Main body */}
      <mesh  >
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Roof edge */}
      <mesh position={[0, size[1] / 2 + 0.15, 0]}>
        <boxGeometry args={[size[0] + 0.4, 0.3, size[2] + 0.4]} />
        <meshStandardMaterial color="#2a3050" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Windows row */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-8 + i * 4, 1, size[2] / 2 + 0.01]}>
          <boxGeometry args={[1.5, 1.2, 0.05]} />
          <meshStandardMaterial color="#88ccff" emissive="#88ccff" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────────────
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]} >
        <cylinderGeometry args={[0.15, 0.2, 1.6, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 2.2, 0]} >
        <coneGeometry args={[1.2, 2.5, 8]} />
        <meshStandardMaterial color="#1a5c1a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Energy Flow Arrow ───────────────────────────────────────────────────────────────
function EnergyArrow({ start, end, color = '#FFD700' }: { start: [number, number, number]; end: [number, number, number]; color?: string }) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3((start[0] + end[0]) / 2, Math.max(start[1], end[1]) + 3, (start[2] + end[2]) / 2),
    new THREE.Vector3(...end)
  );
  const points = curve.getPoints(50);
  const positions = new Float32Array(points.flatMap(p => [p.x, p.y, p.z]));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));

  return <primitive object={line} />;
}

// ─── Interactive Device ─────────────────────────────────────────────────────────────
function InteractiveDevice({
  children,
  id,
  label,
  position,
  onSelect,
  selectedId,
  twin,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
  position: [number, number, number];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  twin: StationDigitalTwin;
}) {
  const isSelected = selectedId === id;
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current && isSelected) {
      ref.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });

  return (
    <group>
      {isSelected && (
        <mesh ref={ref} position={position}>
          <boxGeometry args={[6, 6, 6]} />
          <meshBasicMaterial color="#00D4AA" transparent opacity={0.08} wireframe />
        </mesh>
      )}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(isSelected ? null : id);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {children}
        {/* Label on hover/select */}
        {(isSelected) && (
          <Html position={[position[0], position[1] + 4, position[2]]} center>
            <div style={{
              background: 'rgba(0,0,0,0.85)',
              border: '1px solid #00D4AA',
              borderRadius: 8,
              padding: '8px 14px',
              color: 'white',
              fontSize: 12,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}>
              <div style={{ fontWeight: 600, color: '#00D4AA', marginBottom: 4 }}>{label}</div>
              {twin.devices.filter((d: IoTDevice) => d.id.startsWith('d-00') || d.type !== 'sensor').slice(0, 3).map((d: IoTDevice) => (
                <div key={d.id} style={{ color: '#aaa' }}>
                  {d.name}: <span style={{ color: '#fff' }}>{d.value} {d.unit}</span>
                </div>
              ))}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ─── Main 3D Scene ──────────────────────────────────────────────────────────────────
function Scene({ twin, selectedId, onSelect }: { twin: StationDigitalTwin; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const { realTime } = twin;

  return (
    <>
      {/* Ambient + directional lights */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.2}
      />
      <pointLight position={[-20, 20, -20]} intensity={0.4} color="#4488ff" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0d1520" roughness={0.9} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[200, 200]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#1a2540"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#2a3860"
        fadeDistance={100}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Buildings */}
      <IndustrialBuilding position={[-25, 4, -15]} size={[22, 8, 16]} color="#121a30" />
      <IndustrialBuilding position={[10, 3, -20]} size={[14, 6, 10]} color="#0f1830" />
      <IndustrialBuilding position={[30, 5, -10]} size={[18, 10, 14]} color="#151d38" />

      {/* Solar Arrays — south-facing roofs/ground */}
      <SolarArray position={[-35, 0, 5]} rotation={0} countX={8} countZ={5} scale={1.2} />
      <SolarArray position={[-18, 0, 5]} rotation={0} countX={6} countZ={4} scale={1.2} />
      <SolarArray position={[5, 0, 5]} rotation={0} countX={5} countZ={3} scale={1.2} />

      {/* Battery Storage */}
      <InteractiveDevice id="battery" label="🔋 储能系统 (BMS)" position={[-8, 1.5, -8]} onSelect={onSelect} selectedId={selectedId} twin={twin}>
        <BatteryCabinet position={[-8, 1.5, -8]} soc={realTime.storageSoc} />
      </InteractiveDevice>

      {/* EV Chargers */}
      <InteractiveDevice id="ev1" label="🚗 充电桩 #1" position={[5, 1, -8]} onSelect={onSelect} selectedId={selectedId} twin={twin}>
        <EVCharger position={[5, 1, -8]} status={twin.devices.find(d => d.type === 'ev_charger')?.status} power={realTime.evCharging} />
      </InteractiveDevice>
      <InteractiveDevice id="ev2" label="🚗 充电桩 #2" position={[8, 1, -8]} onSelect={onSelect} selectedId={selectedId} twin={twin}>
        <EVCharger position={[8, 1, -8]} status="idle" power={0} />
      </InteractiveDevice>

      {/* Trees */}
      {[[-40, 0, 15], [-35, 0, 20], [25, 0, 15], [40, 0, 5], [15, 0, -35], [-15, 0, -35], [0, 0, 25]].map(([x, y, z], i) => (
        <Tree key={i} position={[x, y, z]} />
      ))}

      {/* Energy flow arrows (decorative, based on current power flow) */}
      {realTime.generation > 100 && (
        <EnergyArrow start={[-8, 3, -8]} end={[5, 2, -8]} color="#FFD700" />
      )}
      {realTime.storageSoc < 90 && realTime.generation > realTime.consumption && (
        <EnergyArrow start={[-8, 3, -8]} end={[-8, 3, -15]} color="#00D4AA" />
      )}

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={15}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 3, 0]}
      />
    </>
  );
}

// ─── 3D Info Overlay ─────────────────────────────────────────────────────────────────
function InfoOverlay({ twin, selectedId, onClose }: { twin: StationDigitalTwin; selectedId: string | null; onClose: () => void }) {
  if (!selectedId) return null;

  const deviceMap: Record<string, { icon: string; label: string }> = {
    battery: { icon: '🔋', label: '储能系统' },
    ev1: { icon: '🚗', label: '充电桩 #1' },
    ev2: { icon: '🚗', label: '充电桩 #2' },
  };

  const info = deviceMap[selectedId];
  if (!info) return null;

  const devices = selectedId === 'battery'
    ? twin.devices.filter((d: IoTDevice) => d.type === 'battery_bms' || d.type === 'inverter')
    : twin.devices.filter((d: IoTDevice) => d.type === 'ev_charger');

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      background: 'rgba(10,15,30,0.92)',
      border: '1px solid #00D4AA',
      borderRadius: 12,
      padding: 16,
      minWidth: 220,
      backdropFilter: 'blur(12px)',
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#00D4AA' }}>
          {info.icon} {info.label}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 }}
        >
          ×
        </button>
      </div>
      {devices.map(d => (
        <div key={d.id} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{d.name}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: d.type === 'battery_bms' ? '#00D4AA' : '#38A169' }}>
              {d.value}
            </span>
            <span style={{ fontSize: 12, color: '#888' }}>{d.unit}</span>
            <span style={{
              marginLeft: 8,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: d.status === 'online' || d.status === 'charging' ? 'rgba(0,212,170,0.15)' : 'rgba(255,149,0,0.15)',
              color: d.status === 'online' || d.status === 'charging' ? '#00D4AA' : '#FF9500',
            }}>
              {d.status === 'online' ? '在线' : d.status === 'charging' ? '充电中' : '离线'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────────────
export default function IndustrialPark3D({ twin }: { twin: StationDigitalTwin }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: 520, borderRadius: 12, overflow: 'hidden', background: '#080c18' }}>
      {/* Header bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '10px 16px',
        background: 'linear-gradient(180deg, rgba(8,12,24,0.9) 0%, transparent 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
          🪩 工业园区数字孪生 · 拖拽旋转 · 滚轮缩放 · 点击设备查看详情
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
          <span style={{ color: '#FFD700' }}>☀️ {twin.realTime.generation.toFixed(0)} kW</span>
          <span style={{ color: '#9B59B6' }}>🏭 {twin.realTime.consumption.toFixed(0)} kW</span>
          <span style={{ color: '#00D4AA' }}>🔋 {twin.realTime.storageSoc.toFixed(0)}%</span>
          <span style={{ color: twin.realTime.gridExport > 0 ? '#27AE60' : '#E53E3E' }}>⚡ {twin.realTime.gridExport > 0 ? '送出' : '受电'} {Math.abs(twin.realTime.gridExport - twin.realTime.gridImport).toFixed(0)} kW</span>
        </div>
      </div>

      <Canvas
        camera={{ position: [50, 35, 50], fov: 50, near: 0.1, far: 500 }}
        style={{ background: '#080c18' }}
        onPointerMissed={() => setSelectedId(null)}
        gl={{ antialias: true, alpha: false }}
        shadows={false}
      >
        <Scene twin={twin} selectedId={selectedId} onSelect={handleSelect} />
      </Canvas>

      <InfoOverlay twin={twin} selectedId={selectedId} onClose={() => setSelectedId(null)} />

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 16,
        display: 'flex',
        gap: 12,
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <span>🏢 工业建筑</span>
        <span>☀️ 光伏阵列</span>
        <span>🔋 储能系统</span>
        <span>🚗 充电桩</span>
        <span>🌳 景观绿化</span>
      </div>
    </div>
  );
}
