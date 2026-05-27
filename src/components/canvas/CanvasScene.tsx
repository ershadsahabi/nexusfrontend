// src/components/canvas/CanvasScene.tsx

'use client';

import { useEffect, useMemo } from 'react';
import type { MutableRefObject } from 'react';

import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';

import { AlertCircle, Loader2, Trash2 } from 'lucide-react';

// --- Hooks & Store ---
import { useProjectGraph } from '@/hooks/useProjectGraph';
import { useCreateConnection } from '@/hooks/useCreateConnection';
import { useUpdateSystemEntity } from '@/hooks/useUpdateSystemEntity';
import { useDeleteConnection } from '@/hooks/useDeleteConnection';
import { useDeleteSystemEntity } from '@/hooks/useDeleteSystemEntity';
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

import type { CameraApi } from './CameraController';

// --- UI Components ---
import Button from '@/components/common/Button/Button';
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
  const deleteEntity = useDeleteSystemEntity(projectUuid, scenarioId);

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

  // === Refs & Memos ===

  // سطح زمین روی صفحه X-Y با نرمال Z قرار می‌گیرد
  const groundPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    []
  );

  const tempPoint = useMemo(() => new THREE.Vector3(), []);

  // همگام‌سازی گراف با Store
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
      visibleEntityMap.get(clickedUuid) ??
      entityMap.get(clickedUuid);

    if (!source || !target) return;

    await createConnection.mutateAsync({
      source_entity_uuid: source.uuid,
      target_entity_uuid: target.uuid,
      relation_type: 'connected_to',
    });

    cancelEdgeCreation();
    setMode('select');
    clearSelection();
  };

  const handlePositionCommit = async (
    entity: CanvasEntity,
    nextPosition: [number, number, number]
  ) => {
    const [cx, cy, cz] = entity.position;
    const [nx, ny, nz] = nextPosition;

    const unchanged = cx === nx && cy === ny && cz === nz;

    if (unchanged) {
      return;
    }

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

  const floatingSource = edgeCreationSourceUuid
    ? visibleEntityMap.get(edgeCreationSourceUuid) ??
      entityMap.get(edgeCreationSourceUuid)
    : null;

  return (
    <>
      {/* لایه بوم سه‌بعدی */}
      <div className={styles.canvasSceneLayer}>
        <Canvas
          shadows
          camera={{
            position: [8, -8, 8],
            up: [0, 0, 1],
            fov: 50,
          }}
          onPointerMove={handleCanvasPointerMove}
          onPointerMissed={handlePointerMissed}
        >
          <color attach="background" args={['#0b1220']} />

          <ambientLight intensity={1.2} />

          <directionalLight
            castShadow
            position={[8, 6, 12]}
            intensity={2.2}
          />

          <pointLight
            position={[-8, -8, 10]}
            intensity={0.7}
          />

          <CanvasCameraSync />
          <CanvasGizmoCameraController />

          {/* گرید چرخیده تا روی صفحه X-Y قرار گیرد */}
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

          {/* رندر اتصالات */}
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

          {/* رندر موجودیت‌ها */}
          {visibleGraph.entities.map((entity) => (
            <EntityNode
              key={entity.uuid}
              entity={entity}
              isSelected={selectedEntity === entity.uuid}
              isEdgeSource={edgeCreationSourceUuid === entity.uuid}
              mode={mode}
              onSelect={selectEntity}
              onCreateEdgeClick={handleEntityClickForEdge}
              onPositionCommit={handlePositionCommit}
            />
          ))}

          {/* خط اتصال در حال ایجاد */}
          {mode === 'create-edge' && floatingSource && (
            <FloatingEdge
              source={floatingSource.position}
              target={mouseWorld}
            />
          )}

          <CameraController
            rotateEnabled={rotateEnabled}
            onReady={(api) => {
              cameraApiRef.current = api;
            }}
          />
        </Canvas>
      </div>

      {/* لایه رابط کاربری روی بوم */}
      <div className={styles.canvasUiLayer}>
        {/* اکشن‌های موجودیت انتخاب شده */}
        {selectedEntity && (
          <div className={styles.overlayEntityActions}>
            <Card className="p-1 bg-slate-900/80 backdrop-blur-md border-slate-700/50 shadow-lg">
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  deleteEntity
                    .mutateAsync(selectedEntity)
                    .then(clearSelection)
                }
                disabled={deleteEntity.isPending}
                className="gap-2"
              >
                {deleteEntity.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}

                <span>حذف موجودیت</span>
              </Button>
            </Card>
          </div>
        )}

        {/* راهنمای نقشه */}
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

        {/* نمای محورها */}
        <div className={styles.overlayBottomLeft}>
          <CanvasAxesGizmoOverlay />
        </div>
      </div>
    </>
  );
}
