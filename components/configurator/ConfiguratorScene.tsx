'use client';

import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';

export interface ConfiguratorValues {
  mode: 'wardrobe' | 'tv';
  finish: 'ivory' | 'walnut' | 'sage';
  width: number;
  height: number;
  doors: number;
  shelves: number;
  overhead: boolean;
  showInterior: boolean;
  shelfWidth: number;
}

const finishes = {
  ivory: { front: '#e9e2d6', frame: '#755238', accent: '#b58b5f' },
  walnut: { front: '#72503a', frame: '#3e3028', accent: '#b58b5f' },
  sage: { front: '#87907f', frame: '#454c43', accent: '#d8c5a9' },
};

function Box({
  position,
  scale,
  color,
  visible = true,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  visible?: boolean;
}) {
  return (
    <mesh position={position} castShadow receiveShadow visible={visible}>
      <boxGeometry args={scale} />
      <meshStandardMaterial color={color} roughness={0.72} metalness={0.03} />
    </mesh>
  );
}

function Wardrobe({ values }: { values: ConfiguratorValues }) {
  const palette = finishes[values.finish];
  const width = values.width;
  const height = values.height;
  const overheadHeight = values.overhead ? 0.45 : 0;
  const mainHeight = height - overheadHeight;
  const doorWidth = width / values.doors;
  return (
    <group position={[0, -height / 2 + 0.08, 0]}>
      <Box position={[0, height / 2, -0.28]} scale={[width, height, 0.08]} color={palette.frame} />
      <Box position={[-width / 2, height / 2, 0]} scale={[0.07, height, 0.62]} color={palette.frame} />
      <Box position={[width / 2, height / 2, 0]} scale={[0.07, height, 0.62]} color={palette.frame} />
      <Box position={[0, 0.03, 0]} scale={[width, 0.07, 0.62]} color={palette.frame} />
      {Array.from(
        { length: values.shelves },
        (_, index) => ((index + 1) * mainHeight) / (values.shelves + 1),
      ).map((y) => (
        <Box
          key={y}
          position={[0, y, 0]}
          scale={[width - 0.1, 0.045, 0.56]}
          color={palette.accent}
          visible={values.showInterior}
        />
      ))}
      {Array.from({ length: values.doors }, (_, index) => -width / 2 + doorWidth * (index + 0.5)).map((x) => {
        return (
          <group key={x} visible={!values.showInterior}>
            <Box
              position={[x, mainHeight / 2, 0.34]}
              scale={[doorWidth - 0.025, mainHeight - 0.05, 0.055]}
              color={palette.front}
            />
            <Box
              position={[x + doorWidth * 0.32, mainHeight / 2, 0.39]}
              scale={[0.025, 0.34, 0.025]}
              color={palette.accent}
            />
          </group>
        );
      })}
      {values.overhead &&
        Array.from({ length: Math.min(values.doors, 3) }, (_, index) => {
          const count = Math.min(values.doors, 3);
          const panelWidth = width / count;
          return -width / 2 + panelWidth * (index + 0.5);
        }).map((x) => {
          const count = Math.min(values.doors, 3);
          const panelWidth = width / count;
          return (
            <Box
              key={x}
              position={[x, mainHeight + overheadHeight / 2, 0.34]}
              scale={[panelWidth - 0.025, overheadHeight - 0.04, 0.055]}
              color={palette.front}
              visible={!values.showInterior}
            />
          );
        })}
    </group>
  );
}

function TvWall({ values }: { values: ConfiguratorValues }) {
  const palette = finishes[values.finish];
  const width = values.width;
  const height = values.height;
  const shelfWidth = Math.min(values.shelfWidth, width * 0.35);
  const towerX = width / 2 - shelfWidth / 2 - 0.12;
  return (
    <group position={[0, -height / 2 + 0.05, 0]}>
      <Box position={[0, height / 2, -0.12]} scale={[width, height, 0.16]} color="#e8e1d6" />
      <Box
        position={[-0.25, height * 0.53, 0]}
        scale={[Math.min(width * 0.58, 2.2), height * 0.72, 0.08]}
        color={palette.front}
      />
      <Box
        position={[-0.25, height * 0.56, 0.09]}
        scale={[Math.min(width * 0.46, 1.65), 0.88, 0.07]}
        color="#171b19"
      />
      <Box position={[-0.25, 0.43, 0.25]} scale={[width * 0.64, 0.38, 0.48]} color={palette.frame} />
      <Box
        position={[towerX - shelfWidth / 2, height / 2, 0.08]}
        scale={[0.055, height - 0.18, 0.38]}
        color={palette.frame}
      />
      <Box
        position={[towerX + shelfWidth / 2, height / 2, 0.08]}
        scale={[0.055, height - 0.18, 0.38]}
        color={palette.frame}
      />
      {Array.from(
        { length: values.shelves },
        (_, index) => 0.18 + (index * (height - 0.35)) / Math.max(1, values.shelves - 1),
      ).map((y) => (
        <Box key={y} position={[towerX, y, 0.09]} scale={[shelfWidth, 0.055, 0.4]} color={palette.accent} />
      ))}
    </group>
  );
}

export default function ConfiguratorScene({ values }: { values: ConfiguratorValues }) {
  return (
    <div
      className="configurator-canvas"
      role="img"
      aria-label={`Interactive 3D ${values.mode === 'wardrobe' ? 'wardrobe' : 'TV wall'} configuration. Drag to rotate and scroll to zoom.`}
    >
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [3.2, 2.1, 4.4], fov: 42 }}>
        <color attach="background" args={['#e9e4dc']} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 2, 2]} intensity={0.7} />
        {values.mode === 'wardrobe' ? <Wardrobe values={values} /> : <TvWall values={values} />}
        <ContactShadows position={[0, -values.height / 2, 0]} opacity={0.35} scale={9} blur={2.4} far={5} />
        <OrbitControls
          enablePan={false}
          minDistance={2.3}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.1, 0]}
        />
      </Canvas>
    </div>
  );
}
