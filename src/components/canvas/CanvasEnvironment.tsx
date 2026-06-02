// src/components/canvas/CanvasEnvironment.tsx

'use client';

import { AdaptiveDpr, AdaptiveEvents, ContactShadows } from '@react-three/drei';

export default function CanvasEnvironment() {
  return (
    <>
      <color attach="background" args={['#0b1220']} />

      <ambientLight intensity={1.15} />

      <directionalLight
        castShadow
        position={[8, 6, 12]}
        intensity={2.2}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <pointLight position={[-8, -8, 10]} intensity={0.7} />

      <ContactShadows
        position={[0, 0, -0.001]}
        opacity={0.22}
        scale={80}
        blur={2.4}
        far={25}
        resolution={512}
        color="#000000"
      />

      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  );
}
