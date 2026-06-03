// src/components/canvas/CanvasScene.tsx

'use client';

import { useEffect, useMemo } from 'react';
import type { MutableRefObject } from 'react';

import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

import { AlertCircle, Loader2 } from 'lucide-react';

// --- Hooks & Store ---
import { useProjectGraph } from '@/hooks/useProjectGraph';
import { useCreateConnection } from '@/hooks/useCreateConnection';
import { useUpdateSystemEntity } from '@/hooks/useUpdateSystemEntity';
import { useDeleteConnection } from '@/hooks/useDeleteConnection';
import { useFemBulkStatus } from '@/hooks/useFemModel';
import { useCanvasStore } from '@/store/useCanvasStore';
import { filterVisibleGraph } from '@/lib/graph/visibility';

// --- Canvas Components ---
import EntityNode from './EntityNode';
import ConnectionEdgeLine from './ConnectionEdgeLine';
import FloatingEdge from './FloatingEdge';
import CanvasCameraSync from './CanvasCameraSync';
import CanvasGizmoCameraController from './CanvasGizmoCameraController';
import CanvasAxesGizmoOverlay from './CanvasAxesGizmoOverlay';
import CameraController from './CameraController';
import CanvasEnvironment from './CanvasEnvironment';

import type { CameraApi } from './CameraController';

// --- UI Components ---
import Card from '@/components/common/Card/Card';

import type { CanvasEntity } from '@/lib/types/canvas.types';

import styles from './canvas.module.css';

// تنظیم سراسری محور قائم Three.js روی Z
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

type CanvasSceneProps = {
  projectUuid: string;
  scenarioId?: string;
  cameraApiRef: MutableRefObject<CameraApi | null>;
  rotateEnabled: boolean;
};

export default function CanvasScene({
  projectUuid,
  scenarioId,
  cameraApiRef,
  rotateEnabled,
}: CanvasSceneProps) {
  // === Queries & Mutations ===
  const { data, isLoading, isError } = useProjectGraph(projectUuid, scenarioId);
  const createConnection = useCreateConnection(projectUuid, scenarioId);
  const updateEntity = useUpdateSystemEntity(projectUuid, scenarioId);
  const deleteConnection = useDeleteConnection(projectUuid, scenarioId);

  // === Global Store ===
  const {
    entities,
    connections,
    setGraph,
    activeRootSystemUuid,
    viewDepth,
    focusEntityUuid,
    selectedEntity,
    selectedConnection,
    selectEntity,
    selectConnection,
    clearSelection,
    mode,
    edgeCreationSourceUuid,
    startEdgeCreation,
    cancelEdgeCreation,
    setMode,
    mouseWorld,
    setMouseWorld,
  } = useCanvasStore();

  // === Memo / Helpers ===
  const groundPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    []
  );

  const tempPoint = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (data) {
      setGraph(data.entities, data.connections);
    }
  }, [data, setGraph]);

  const entityMap = useMemo(() => {
    return new Map(entities.map((entity) => [entity.uuid, entity]));
  }, [entities]);

  const visibleGraph = useMemo(() => {
    return filterVisibleGraph(
      entities,
      connections,
      activeRootSystemUuid,
      viewDepth,
      focusEntityUuid
    );
  }, [
    entities,
    connections,
    activeRootSystemUuid,
    viewDepth,
    focusEntityUuid,
  ]);

  const visibleEntityMap = useMemo(() => {
    return new Map(visibleGraph.entities.map((entity) => [entity.uuid, entity]));
  }, [visibleGraph.entities]);

  const visibleEntityUuids = useMemo(() => {
    return visibleGraph.entities.map((entity) => entity.uuid);
  }, [visibleGraph.entities]);

  /**
   * فقط وضعیت FEM نودهای visible گرفته می‌شود.
   * داده تحلیلی FEM هرگز اینجا fetch نمی‌شود.
   * نتیجه داخل FemStatusStore cache می‌شود و EntityNodeها جداگانه از آن می‌خوانند.
   */
  useFemBulkStatus(projectUuid, visibleEntityUuids);

  const floatingSource = useMemo(() => {
    if (!edgeCreationSourceUuid) return null;

    return (
      visibleEntityMap.get(edgeCreationSourceUuid) ??
      entityMap.get(edgeCreationSourceUuid) ??
      null
    );
  }, [edgeCreationSourceUuid, visibleEntityMap, entityMap]);

  // === Handlers ===
  const handleEntityClickForEdge = async (clickedUuid: string) => {
    if (!edgeCreationSourceUuid) {
      startEdgeCreation(clickedUuid);
      return;
    }

    if (edgeCreationSourceUuid === clickedUuid) {
      cancelEdgeCreation();
      return;
    }

    const source =
      visibleEntityMap.get(edgeCreationSourceUuid) ??
      entityMap.get(edgeCreationSourceUuid);

    const target =
      visibleEntityMap.get(clickedUuid) ?? entityMap.get(clickedUuid);

    if (!source || !target) return;

    try {
      await createConnection.mutateAsync({
        source_entity_uuid: source.uuid,
        target_entity_uuid: target.uuid,
        relation_type: 'connected_to',
      });

      cancelEdgeCreation();
      setMode('select');
      clearSelection();
    } catch (error) {
      console.error('Connection creation failed:', error);
    }
  };

  const handlePositionCommit = async (
    entity: CanvasEntity,
    nextPosition: [number, number, number]
  ) => {
    const [cx, cy, cz] = entity.position;
    const [nx, ny, nz] = nextPosition;

    const unchanged = cx === nx && cy === ny && cz === nz;
    if (unchanged) return;

    // optimistic update
    useCanvasStore.getState().updateEntityProps(entity.uuid, {
      position: nextPosition,
    });

    try {
      await updateEntity.mutateAsync({
        entityUuid: entity.uuid,
        payload: {
          pos_x: nx,
          pos_y: ny,
          pos_z: nz,
        },
      });
    } catch (error: any) {
      console.error('Position update failed:', error);
      console.error('Response error data:', error?.response?.data);
    }
  };

  const handleCanvasPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!event.ray) return;

    const hit = event.ray.intersectPlane(groundPlane, tempPoint);
    if (!hit) return;

    setMouseWorld([
      Number(hit.x.toFixed(2)),
      Number(hit.y.toFixed(2)),
      Number(hit.z.toFixed(2)),
    ]);
  };

  const handlePointerMissed = () => {
    if (mode === 'create-edge') return;
    clearSelection();
  };

  // === Render States ===
  if (isLoading) {
    return (
      <div className={styles.canvasStateOverlay}>
        <Card className="flex flex-col items-center gap-4 p-8 bg-slate-900/80 backdrop-blur-md border-slate-700/50">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-200 font-medium tracking-wide">
            در حال آماده‌سازی محیط سه‌بعدی...
          </p>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.canvasStateOverlay}>
        <Card className="flex flex-col items-center gap-4 p-8 bg-red-950/80 backdrop-blur-md border-red-900/50">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-200 font-medium">
            ارتباط با سرور نکسوس مختل شده است.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className={styles.canvasSceneLayer}>
        <Canvas
          shadows
          camera={{
            position: [8, -8, 8],
            up: [0, 0, 1],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          onPointerMove={handleCanvasPointerMove}
          onPointerMissed={handlePointerMissed}
          gl={{
            antialias: true,
            alpha: false,
          }}
        >
          <CanvasEnvironment />

          <CanvasCameraSync />
          <CanvasGizmoCameraController />

          <Grid
            position={[0, 0, -0.01]}
            rotation={[Math.PI / 2, 0, 0]}
            args={[100, 100]}
            cellSize={1}
            cellThickness={0.6}
            cellColor="#2b3a55"
            sectionSize={5}
            sectionThickness={1.2}
            sectionColor="#3f5b8a"
            fadeDistance={80}
            fadeStrength={1}
            infiniteGrid
          />

          {/* اتصالات */}
          {visibleGraph.connections.map((connection) => {
            const source = visibleEntityMap.get(connection.sourceUuid);
            const target = visibleEntityMap.get(connection.targetUuid);

            if (!source || !target) return null;

            return (
              <ConnectionEdgeLine
                key={connection.uuid}
                connection={connection}
                source={source}
                target={target}
                isSelected={selectedConnection === connection.uuid}
                onSelect={selectConnection}
                onDelete={() =>
                  deleteConnection
                    .mutateAsync(connection.uuid)
                    .then(clearSelection)
                }
              />
            );
          })}

          {/* موجودیت‌ها */}
          {visibleGraph.entities.map((entity) => (
            <EntityNode
              key={entity.uuid}
              entity={entity}
              isSelected={selectedEntity === entity.uuid}
              isFocused={focusEntityUuid === entity.uuid}
              isEdgeSource={edgeCreationSourceUuid === entity.uuid}
              mode={mode}
              onSelect={selectEntity}
              onCreateEdgeClick={handleEntityClickForEdge}
              onPositionCommit={handlePositionCommit}
            />
          ))}

          {/* خط شناور هنگام ساخت اتصال */}
          {mode === 'create-edge' && floatingSource && (
            <FloatingEdge source={floatingSource.position} target={mouseWorld} />
          )}

          <CameraController
            rotateEnabled={rotateEnabled}
            onReady={(api) => {
              cameraApiRef.current = api;
            }}
          />
        </Canvas>
      </div>

      <div className={styles.canvasUiLayer}>
        <div className={styles.overlayBottomRight}>
          <Card
            className={`p-3 bg-slate-900/80 backdrop-blur-md border-slate-700/50 shadow-lg ${styles.canvasLegend}`}
          >
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className={styles.legendSwatchMacro} />
              Macro
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className={styles.legendSwatchFem} />
              FEM
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className={styles.legendSwatchEnv} />
              Environment
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className={styles.legendSwatchGeneric} />
              Generic
            </div>
          </Card>
        </div>

        <div className={styles.overlayBottomLeft}>
          <CanvasAxesGizmoOverlay />
        </div>
      </div>
    </>
  );
}
