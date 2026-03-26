'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NeuralConnection as ConnectionType, CATEGORY_COLORS, NodePosition } from '@/data/types';
import { useNetworkStore } from '@/store/useNetworkStore';

interface Props {
  connection: ConnectionType;
  sourcePos: NodePosition;
  targetPos: NodePosition;
}

export default function NeuralConnection({ connection, sourcePos, targetPos }: Props) {
  const lineRef = useRef<THREE.Line>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(Math.random());

  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const hoveredNodeId = useNetworkStore((s) => s.hoveredNodeId);
  const getNodeById = useNetworkStore((s) => s.getNodeById);

  const sourceNode = getNodeById(connection.sourceId);
  const isActive =
    activeNodeId === connection.sourceId ||
    activeNodeId === connection.targetId;
  const isHovered =
    hoveredNodeId === connection.sourceId ||
    hoveredNodeId === connection.targetId;

  const color = useMemo(() => {
    if (sourceNode) return CATEGORY_COLORS[sourceNode.category];
    return '#ffffff';
  }, [sourceNode]);

  const lineOpacity = isActive ? 0.6 : isHovered ? 0.4 : connection.type === 'cross-domain' ? 0.08 : 0.12;
  const showParticle = isActive || isHovered;
  const isDashed = connection.type === 'cross-domain';

  // Create line object imperatively — recreate when dash type changes
  const lineObject = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      sourcePos.x, sourcePos.y, sourcePos.z,
      targetPos.x, targetPos.y, targetPos.z,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = isDashed
      ? new THREE.LineDashedMaterial({
          color,
          transparent: true,
          opacity: lineOpacity,
          dashSize: 0.5,
          gapSize: 0.3,
          depthWrite: false,
        })
      : new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: lineOpacity,
          depthWrite: false,
        });

    const line = new THREE.Line(geometry, material);
    if (isDashed) line.computeLineDistances();
    return line;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDashed]);

  // Dispose geometry and material on unmount or when lineObject is recreated
  useEffect(() => {
    return () => {
      lineObject.geometry.dispose();
      (lineObject.material as THREE.Material).dispose();
    };
  }, [lineObject]);

  useFrame((_, delta) => {
    if (!lineObject) return;

    // Update positions
    const posAttr = lineObject.geometry.attributes.position;
    if (posAttr) {
      posAttr.setXYZ(0, sourcePos.x, sourcePos.y, sourcePos.z);
      posAttr.setXYZ(1, targetPos.x, targetPos.y, targetPos.z);
      posAttr.needsUpdate = true;
      if (isDashed) lineObject.computeLineDistances();
    }

    // Update material
    const mat = lineObject.material as THREE.LineBasicMaterial;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, lineOpacity, 0.1);
    mat.color.set(color);

    // Animate signal particle
    if (particleRef.current && showParticle) {
      progressRef.current += delta * (0.3 + connection.strength * 0.4);
      if (progressRef.current > 1) progressRef.current = 0;

      const t = progressRef.current;
      particleRef.current.position.set(
        sourcePos.x + (targetPos.x - sourcePos.x) * t,
        sourcePos.y + (targetPos.y - sourcePos.y) * t,
        sourcePos.z + (targetPos.z - sourcePos.z) * t
      );
      particleRef.current.visible = true;
    } else if (particleRef.current) {
      particleRef.current.visible = false;
    }
  });

  return (
    <group>
      <primitive object={lineObject} ref={lineRef} />

      {/* Signal particle */}
      <mesh ref={particleRef} visible={false}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
