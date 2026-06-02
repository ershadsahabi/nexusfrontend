// src/components/canvas/WorkspaceCanvas.tsx

'use client';

import { useCallback, useRef, useState } from 'react';

import CanvasToolbar from './CanvasToolbar';
import CanvasScene from './CanvasScene';
import CanvasTopBar from './CanvasTopBar';
import CameraDock from './CameraDock';
import CanvasStructureSidebar from './CanvasStructureSidebar';

import type { CameraApi } from './CameraController';

import { useCanvasStore } from '@/store/useCanvasStore';

import topBarStyles from './CanvasTopBar.module.css';
import styles from './canvas.module.css';

export default function WorkspaceCanvas({
  projectUuid,
  scenarioId,
}: {
  projectUuid: string;
  scenarioId?: string;
}) {
  const [rotateEnabled, setRotateEnabled] = useState(false);
  const cameraApiRef = useRef<CameraApi | null>(null);

  const mouseWorld = useCanvasStore((state) => state.mouseWorld);

  const handleToggleOrbit = useCallback(() => {
    setRotateEnabled((prev) => !prev);
  }, []);

  return (
    <div className={styles.canvasShell}>
      <div className={styles.canvasStage}>
        <CanvasScene
          projectUuid={projectUuid}
          scenarioId={scenarioId}
          cameraApiRef={cameraApiRef}
          rotateEnabled={rotateEnabled}
        />

        <CanvasTopBar>
          <div className={`${topBarStyles.group} ${topBarStyles.pushRight}`}>
            <CanvasToolbar projectUuid={projectUuid} scenarioId={scenarioId} />
          </div>

          <div className={topBarStyles.separator} />

          <div className={topBarStyles.group}>
            <CameraDock
              orbitEnabled={rotateEnabled}
              coordinates={mouseWorld}
              onZoomIn={() => cameraApiRef.current?.zoomIn()}
              onZoomOut={() => cameraApiRef.current?.zoomOut()}
              onReset={() => cameraApiRef.current?.reset()}
              onToggleOrbit={handleToggleOrbit}
              onPreset={(preset) => cameraApiRef.current?.setView(preset)}
            />
          </div>
        </CanvasTopBar>

        <CanvasStructureSidebar />
      </div>
    </div>
  );
}
