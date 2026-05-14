'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Canvas, ThreeEvent } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';

import * as THREE from 'three';

import { useProjectGraph } from '@/hooks/useProjectGraph';
import { useCreateConnection } from '@/hooks/useCreateConnection';
import { useUpdateSystemEntity } from '@/hooks/useUpdateSystemEntity';
import { useDeleteConnection } from '@/hooks/useDeleteConnection';
import { useDeleteSystemEntity } from '@/hooks/useDeleteSystemEntity';

import { useCanvasStore } from '@/store/useCanvasStore';

import { filterVisibleGraph } from '@/lib/graph/visibility';

import {
  buildChildrenMap,
  buildEntityMap,
} from '@/lib/graph/systemTree';

import EntityNode from './EntityNode';
import ConnectionEdgeLine from './ConnectionEdgeLine';
import FloatingEdge from './FloatingEdge';
import CanvasToolbar from './CanvasToolbar';

import CameraDock, {
  type CameraPreset,
} from './CameraDock';

import CanvasCameraSync from './CanvasCameraSync';
import CanvasGizmoCameraController from './CanvasGizmoCameraController';
import CanvasAxesGizmoOverlay from './CanvasAxesGizmoOverlay';
import RootSystemSelector from './RootSystemSelector';

import type { CanvasEntity } from '@/lib/types/canvas.types';

import styles from './canvas.module.css';

type Props = {
  projectUuid: string;
  scenarioId?: string;
};

type CameraApi = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  setView: (view: CameraPreset) => void;
};

const DEFAULT_CAMERA_POSITION =
  new THREE.Vector3(8, 8, 8);

const DEFAULT_TARGET =
  new THREE.Vector3(0, 0, 0);





/* =========================================================
   HIERARCHY DROPDOWN
========================================================= */

type HierarchyNodeProps = {
  uuid: string;
  level: number;
  childrenMap: Map<string, any[]>;
  entityMap: Map<string, any>;
};

function HierarchyNode({
  uuid,
  level,
  childrenMap,
  entityMap,
}: HierarchyNodeProps) {

  const entity = entityMap.get(uuid);

  const focusEntityUuid = useCanvasStore(
    (s) => s.focusEntityUuid
  );

  const setFocusEntity = useCanvasStore(
    (s) => s.setFocusEntity
  );

  const children =
    childrenMap.get(uuid) ?? [];

  const [expanded, setExpanded] =
    useState(level < 1);

  if (!entity) return null;

  const isFocused =
    focusEntityUuid === uuid;

  return (
    <div>
      <div
        className={
          isFocused
            ? styles.hierarchyNodeActive
            : styles.hierarchyNode
        }
        style={{
          paddingLeft: `${level * 14}px`,
        }}
      >
        <button
          type="button"
          className={styles.hierarchyExpandButton}
          onClick={() => {
            if (children.length > 0) {
              setExpanded((prev) => !prev);
            }
          }}
        >
          {children.length > 0
            ? expanded
              ? '▾'
              : '▸'
            : '•'}
        </button>

        <button
          type="button"
          className={styles.hierarchyLabel}
          onClick={() => {
            setFocusEntity(uuid);
          }}
        >
          {entity.name}
        </button>
      </div>

      {expanded && children.length > 0 ? (
        <div>
          {children.map((child) => (
            <HierarchyNode
              key={child.uuid}
              uuid={child.uuid}
              level={level + 1}
              childrenMap={childrenMap}
              entityMap={entityMap}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function HierarchyDropdown() {

  const entities = useCanvasStore(
    (s) => s.entities
  );

  const activeRootSystemUuid =
    useCanvasStore(
      (s) => s.activeRootSystemUuid
    );

  const focusEntityUuid = useCanvasStore(
    (s) => s.focusEntityUuid
  );

  const setFocusEntity = useCanvasStore(
    (s) => s.setFocusEntity
  );

  const childrenMap = useMemo(() => {
    return buildChildrenMap(entities);
  }, [entities]);

  const entityMap = useMemo(() => {
    return buildEntityMap(entities);
  }, [entities]);

  if (!activeRootSystemUuid) {
    return null;
  }

  return (
    <div className={styles.hierarchyDropdown}>
      <div className={styles.hierarchyHeader}>
        <span>Hierarchy</span>

        {focusEntityUuid ? (
          <button
            type="button"
            className={styles.hierarchyResetButton}
            onClick={() => {
              setFocusEntity(null);
            }}
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className={styles.hierarchyTree}>
        <HierarchyNode
          uuid={activeRootSystemUuid}
          level={0}
          childrenMap={childrenMap}
          entityMap={entityMap}
        />
      </div>
    </div>
  );
}





/* =========================================================
   CAMERA
========================================================= */

function CameraController({
  rotateEnabled,
  onReady,
}: {
  rotateEnabled: boolean;
  onReady: (api: CameraApi) => void;
}) {

  const controlsRef = useRef<any>(null);

  const animateCameraTo = useCallback(
    (
      position: THREE.Vector3,
      target: THREE.Vector3
    ) => {

      const controls =
        controlsRef.current;

      if (!controls) return;

      controls.object.position.copy(
        position
      );

      controls.target.copy(target);

      controls.update();
    },
    []
  );

  const zoomByFactor = useCallback(
    (factor: number) => {

      const controls =
        controlsRef.current;

      if (!controls) return;

      const camera =
        controls.object as THREE.PerspectiveCamera;

      const direction =
        new THREE.Vector3();

      direction
        .subVectors(
          camera.position,
          controls.target
        )
        .normalize();

      const currentDistance =
        camera.position.distanceTo(
          controls.target
        );

      const nextDistance =
        Math.max(
          2,
          Math.min(
            80,
            currentDistance * factor
          )
        );

      const nextPosition =
        new THREE.Vector3()
          .copy(controls.target)
          .add(
            direction.multiplyScalar(
              nextDistance
            )
          );

      camera.position.copy(
        nextPosition
      );

      controls.update();
    },
    []
  );

  const setView = useCallback(
    (view: CameraPreset) => {

      const controls =
        controlsRef.current;

      if (!controls) return;

      const target =
        DEFAULT_TARGET.clone();

      const currentDistance =
        controls.object.position.distanceTo(
          controls.target
        ) || 12;

      const distance =
        Math.max(
          6,
          Math.min(40, currentDistance)
        );

      switch (view) {

        case 'front':
          animateCameraTo(
            new THREE.Vector3(
              0,
              distance * 0.35,
              distance
            ),
            target
          );
          break;

        case 'back':
          animateCameraTo(
            new THREE.Vector3(
              0,
              distance * 0.35,
              -distance
            ),
            target
          );
          break;

        case 'left':
          animateCameraTo(
            new THREE.Vector3(
              -distance,
              distance * 0.35,
              0
            ),
            target
          );
          break;

        case 'right':
          animateCameraTo(
            new THREE.Vector3(
              distance,
              distance * 0.35,
              0
            ),
            target
          );
          break;

        case 'top':
          animateCameraTo(
            new THREE.Vector3(
              0,
              distance,
              0.001
            ),
            target
          );
          break;

        case 'iso':
        default:
          animateCameraTo(
            new THREE.Vector3(
              distance * 0.8,
              distance * 0.8,
              distance * 0.8
            ),
            target
          );
          break;
      }
    },
    [animateCameraTo]
  );

  const reset = useCallback(() => {
    animateCameraTo(
      DEFAULT_CAMERA_POSITION.clone(),
      DEFAULT_TARGET.clone()
    );
  }, [animateCameraTo]);

  const zoomIn = useCallback(
    () => zoomByFactor(0.85),
    [zoomByFactor]
  );

  const zoomOut = useCallback(
    () => zoomByFactor(1.18),
    [zoomByFactor]
  );

  useEffect(() => {
    onReady({
      zoomIn,
      zoomOut,
      reset,
      setView,
    });
  }, [
    onReady,
    zoomIn,
    zoomOut,
    reset,
    setView,
  ]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.75}
      zoomSpeed={0.9}
      panSpeed={0.8}
      minDistance={2}
      maxDistance={80}
      target={[0, 0, 0]}
      enableRotate={rotateEnabled}
      enableZoom
      enablePan
      screenSpacePanning={false}
      mouseButtons={{
        LEFT: rotateEnabled
          ? THREE.MOUSE.ROTATE
          : THREE.MOUSE.PAN,

        MIDDLE: THREE.MOUSE.DOLLY,

        RIGHT: rotateEnabled
          ? THREE.MOUSE.PAN
          : THREE.MOUSE.ROTATE,
      }}
      touches={{
        ONE: rotateEnabled
          ? THREE.TOUCH.ROTATE
          : THREE.TOUCH.PAN,

        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}





/* =========================================================
   SCENE
========================================================= */

function CanvasScene({
  projectUuid,
  scenarioId,
  cameraApiRef,
  rotateEnabled,
  onToggleOrbit,
}: {
  projectUuid: string;
  scenarioId?: string;
  cameraApiRef: React.MutableRefObject<CameraApi | null>;
  rotateEnabled: boolean;
  onToggleOrbit: () => void;
}) {

  const {
    data,
    isLoading,
    isError,
  } = useProjectGraph(
    projectUuid,
    scenarioId
  );

  const createConnection =
    useCreateConnection(
      projectUuid,
      scenarioId
    );

  const updateEntity =
    useUpdateSystemEntity(
      projectUuid,
      scenarioId
    );

  const deleteConnection =
    useDeleteConnection(
      projectUuid,
      scenarioId
    );

  const deleteEntity =
    useDeleteSystemEntity(
      projectUuid,
      scenarioId
    );

  const entities =
    useCanvasStore((s) => s.entities);

  const connections =
    useCanvasStore((s) => s.connections);

  const setGraph =
    useCanvasStore((s) => s.setGraph);

  const activeRootSystemUuid =
    useCanvasStore(
      (s) => s.activeRootSystemUuid
    );

  const viewDepth =
    useCanvasStore(
      (s) => s.viewDepth
    );

  const focusEntityUuid =
    useCanvasStore(
      (s) => s.focusEntityUuid
    );

  const selectedEntity =
    useCanvasStore(
      (s) => s.selectedEntity
    );

  const selectedConnection =
    useCanvasStore(
      (s) => s.selectedConnection
    );

  const selectEntity =
    useCanvasStore(
      (s) => s.selectEntity
    );

  const selectConnection =
    useCanvasStore(
      (s) => s.selectConnection
    );

  const clearSelection =
    useCanvasStore(
      (s) => s.clearSelection
    );

  const mode =
    useCanvasStore((s) => s.mode);

  const edgeCreationSourceUuid =
    useCanvasStore(
      (s) => s.edgeCreationSourceUuid
    );

  const startEdgeCreation =
    useCanvasStore(
      (s) => s.startEdgeCreation
    );

  const cancelEdgeCreation =
    useCanvasStore(
      (s) => s.cancelEdgeCreation
    );

  const setMode =
    useCanvasStore(
      (s) => s.setMode
    );

  const mouseWorld =
    useCanvasStore(
      (s) => s.mouseWorld
    );

  const setMouseWorld =
    useCanvasStore(
      (s) => s.setMouseWorld
    );

  const groundPlane = useMemo(
    () =>
      new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        0
      ),
    []
  );

  const tempPoint = useMemo(
    () => new THREE.Vector3(),
    []
  );

  useEffect(() => {
    if (data) {
      setGraph(
        data.entities,
        data.connections
      );
    }
  }, [data, setGraph]);

  const entityMap = useMemo(() => {
    return new Map(
      entities.map((entity) => [
        entity.uuid,
        entity,
      ])
    );
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

  const visibleEntityMap =
    useMemo(() => {
      return new Map(
        visibleGraph.entities.map(
          (entity) => [
            entity.uuid,
            entity,
          ]
        )
      );
    }, [visibleGraph.entities]);

  const handleEntityClickForEdge =
    async (clickedUuid: string) => {

      if (!edgeCreationSourceUuid) {
        startEdgeCreation(clickedUuid);
        return;
      }

      if (
        edgeCreationSourceUuid ===
        clickedUuid
      ) {
        cancelEdgeCreation();
        return;
      }

      const source =
        visibleEntityMap.get(
          edgeCreationSourceUuid
        ) ??
        entityMap.get(
          edgeCreationSourceUuid
        );

      const target =
        visibleEntityMap.get(
          clickedUuid
        ) ??
        entityMap.get(clickedUuid);

      if (!source || !target) return;

      await createConnection.mutateAsync({
        source_entity_uuid:
          source.uuid,

        target_entity_uuid:
          target.uuid,

        relation_type:
          'connected_to',
      });

      cancelEdgeCreation();

      setMode('select');

      clearSelection();
    };

  const handlePositionCommit =
    async (
      entity: CanvasEntity,
      nextPosition: [
        number,
        number,
        number
      ]
    ) => {

      useCanvasStore
        .getState()
        .updateEntityProps(
          entity.uuid,
          {
            position: nextPosition,
          }
        );

      await updateEntity.mutateAsync({
        uuid: entity.uuid,

        data: {
          pos_x: nextPosition[0],
          pos_y: nextPosition[1],
          pos_z: nextPosition[2],
        },
      });
    };

  const handleCanvasPointerMove =
    (
      e: ThreeEvent<PointerEvent>
    ) => {

      if (!e.ray) return;

      const hit =
        e.ray.intersectPlane(
          groundPlane,
          tempPoint
        );

      if (!hit) return;

      setMouseWorld([
        Number(hit.x.toFixed(2)),
        Number(hit.y.toFixed(2)),
        Number(hit.z.toFixed(2)),
      ]);
    };

  const handlePointerMissed =
    () => {

      if (mode === 'create-edge')
        return;

      clearSelection();
    };

  const handleDeleteConnection =
    async (uuid: string) => {

      await deleteConnection.mutateAsync(
        uuid
      );

      clearSelection();
    };

  const handleDeleteSelectedEntity =
    async () => {

      if (!selectedEntity) return;

      await deleteEntity.mutateAsync(
        selectedEntity
      );

      clearSelection();
    };

  const handleCameraPreset =
    (preset: CameraPreset) => {
      cameraApiRef.current?.setView(
        preset
      );
    };

  if (isLoading) {
    return (
      <div className={styles.canvasState}>
        در حال بارگذاری گراف...
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.canvasState}>
        خطا در دریافت داده‌های Canvas
      </div>
    );
  }

  const floatingSource =
    edgeCreationSourceUuid
      ? visibleEntityMap.get(
          edgeCreationSourceUuid
        ) ??
        entityMap.get(
          edgeCreationSourceUuid
        )
      : null;

  return (
    <>
      <div
        className={
          styles.canvasSceneLayer
        }
      >
        <Canvas
          shadows
          camera={{
            position: [8, 8, 8],
            fov: 50,
          }}
          onPointerMove={
            handleCanvasPointerMove
          }
          onPointerMissed={
            handlePointerMissed
          }
        >
          <color
            attach="background"
            args={['#0b1220']}
          />

          <ambientLight intensity={1.2} />

          <directionalLight
            castShadow
            position={[8, 12, 6]}
            intensity={2.2}
          />

          <pointLight
            position={[-8, 10, -8]}
            intensity={0.7}
          />

          <CanvasCameraSync />

          <CanvasGizmoCameraController />

          <Grid
            position={[0, -0.01, 0]}
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

          {visibleGraph.connections.map(
            (connection) => {

              const source =
                visibleEntityMap.get(
                  connection.sourceUuid
                );

              const target =
                visibleEntityMap.get(
                  connection.targetUuid
                );

              if (!source || !target)
                return null;

              return (
                <ConnectionEdgeLine
                  key={connection.uuid}
                  connection={
                    connection
                  }
                  source={source}
                  target={target}
                  isSelected={
                    selectedConnection ===
                    connection.uuid
                  }
                  onSelect={
                    selectConnection
                  }
                  onDelete={
                    handleDeleteConnection
                  }
                />
              );
            }
          )}

          {visibleGraph.entities.map(
            (entity) => (
              <EntityNode
                key={entity.uuid}
                entity={entity}
                isSelected={
                  selectedEntity ===
                  entity.uuid
                }
                isEdgeSource={
                  edgeCreationSourceUuid ===
                  entity.uuid
                }
                mode={mode}
                onSelect={
                  selectEntity
                }
                onCreateEdgeClick={
                  handleEntityClickForEdge
                }
                onPositionCommit={
                  handlePositionCommit
                }
              />
            )
          )}

          {mode === 'create-edge' &&
          floatingSource ? (
            <FloatingEdge
              source={
                floatingSource.position
              }
              target={mouseWorld}
            />
          ) : null}

          <CameraController
            rotateEnabled={
              rotateEnabled
            }
            onReady={(api) => {
              cameraApiRef.current =
                api;
            }}
          />
        </Canvas>
      </div>

      <div className={styles.canvasUiLayer}>
        <div
          className={
            styles.overlayTopRight
          }
        >
          <CameraDock
            orbitEnabled={
              rotateEnabled
            }
            coordinates={mouseWorld}
            onZoomIn={() =>
              cameraApiRef.current?.zoomIn()
            }
            onZoomOut={() =>
              cameraApiRef.current?.zoomOut()
            }
            onReset={() =>
              cameraApiRef.current?.reset()
            }
            onToggleOrbit={
              onToggleOrbit
            }
            onPreset={
              handleCameraPreset
            }
          />
        </div>

        {selectedEntity ? (
          <div
            className={
              styles.overlayEntityActions
            }
          >
            <button
              className={
                styles.deleteEntityButton
              }
              onClick={
                handleDeleteSelectedEntity
              }
              disabled={
                deleteEntity.isPending
              }
              type="button"
            >
              {deleteEntity.isPending
                ? 'در حال حذف...'
                : 'حذف موجودیت انتخاب‌شده'}
            </button>
          </div>
        ) : null}

        <div
          className={
            styles.overlayBottomRight
          }
        >
          <div
            className={
              styles.canvasLegend
            }
          >
            <div>
              <span
                className={
                  styles.legendSwatchMacro
                }
              />{' '}
              Macro
            </div>

            <div>
              <span
                className={
                  styles.legendSwatchFem
                }
              />{' '}
              FEM
            </div>

            <div>
              <span
                className={
                  styles.legendSwatchEnv
                }
              />{' '}
              Environment
            </div>

            <div>
              <span
                className={
                  styles.legendSwatchGeneric
                }
              />{' '}
              Generic
            </div>
          </div>
        </div>

        <div
          className={
            styles.overlayBottomLeft
          }
        >
          <CanvasAxesGizmoOverlay />
        </div>
      </div>
    </>
  );
}





export default function WorkspaceCanvas({
  projectUuid,
  scenarioId,
}: Props) {

  const [rotateEnabled, setRotateEnabled] =
    useState(false);

  const cameraApiRef =
    useRef<CameraApi | null>(null);

  const handleToggleOrbit =
    useCallback(() => {
      setRotateEnabled(
        (prev) => !prev
      );
    }, []);

  return (
    <div className={styles.canvasShell}>
      <div className={styles.canvasStage}>
        <div
          className={
            styles.overlayTopLeft
          }
        >
          <div
            className={
              styles.workspaceControls
            }
          >
            <RootSystemSelector
              className={
                styles.rootSystemSelector
              }
            />

            <HierarchyDropdown />

            <CanvasToolbar
              projectUuid={
                projectUuid
              }
              scenarioId={
                scenarioId
              }
            />
          </div>
        </div>

        <CanvasScene
          projectUuid={projectUuid}
          scenarioId={scenarioId}
          cameraApiRef={
            cameraApiRef
          }
          rotateEnabled={
            rotateEnabled
          }
          onToggleOrbit={
            handleToggleOrbit
          }
        />
      </div>
    </div>
  );
}
