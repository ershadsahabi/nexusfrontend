// src/components/canvas/FloatingEdge.tsx


'use client';

import { Line } from '@react-three/drei';

type Props = {
  source: [number, number, number];
  target: [number, number, number];
};

export default function FloatingEdge({ source, target }: Props) {
  return (
    <Line
      points={[source, target]}
      color="#a855f7"
      lineWidth={2.4}
      dashed
      dashSize={0.25}
      gapSize={0.18}
    />
  );
}
