'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NeuralNode as NeuralNodeType, CATEGORY_COLORS, NodePosition } from '@/data/types';
import { NODE_SIZES, ANIMATION } from '@/lib/constants';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useExplorationStore } from '@/store/useExplorationStore';

interface Props {
  node: NeuralNodeType;
  position: NodePosition;
}

// Reusable vector to avoid per-frame allocations
const _targetScale = new THREE.Vector3();

export default function NeuralNode({ node, position }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const hoveredNodeId = useNetworkStore((s) => s.hoveredNodeId);
  const activateNode = useNetworkStore((s) => s.activateNode);
  const hoverNode = useNetworkStore((s) => s.hoverNode);
  const visitNode = useExplorationStore((s) => s.visitNode);
  const isVisited = useExplorationStore((s) => s.isNodeVisited(node.id));

  const isActive = activeNodeId === node.id;
  const isHovered = hoveredNodeId === node.id || hovered;
  const color = CATEGORY_COLORS[node.category];
  const baseSize = node.size || NODE_SIZES[node.level] || 1;

  const colorObj = useMemo(() => new THREE.Color(color), [color]);
  const glowColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.4), [color]);

  // Animate
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // Floating motion
    const floatX = Math.sin(time * ANIMATION.floatFrequency + position.x) * ANIMATION.floatAmplitude;
    const floatY = Math.cos(time * ANIMATION.floatFrequency * 0.8 + position.y) * ANIMATION.floatAmplitude;

    const currentX = position.x + floatX;
    const currentY = position.y + floatY;
    const currentZ = position.z;

    meshRef.current.position.set(currentX, currentY, currentZ);

    // Scale animation (reuse vector to avoid GC pressure)
    const targetScale = isActive ? 1.3 : isHovered ? ANIMATION.hoverScale : 1;
    _targetScale.set(targetScale, targetScale, targetScale);
    meshRef.current.scale.lerp(_targetScale, 0.1);

    // Sync glow with floating position
    if (glowRef.current) {
      glowRef.current.position.set(currentX, currentY, currentZ);
      glowRef.current.scale.copy(meshRef.current.scale).multiplyScalar(1.8);
      const glowOpacity = isActive ? 0.3 : isHovered ? 0.2 : 0.08;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity,
        glowOpacity,
        0.1
      );
    }

    // Sync visited ring with floating position
    if (ringRef.current) {
      ringRef.current.position.set(currentX, currentY, currentZ);
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    activateNode(node.id);
    visitNode(node.id);
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(true);
    hoverNode(node.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    hoverNode(null);
    document.body.style.cursor = 'default';
  };

  const emissiveIntensity = isActive ? 2 : isHovered ? 1.2 : isVisited ? 0.5 : 0.3;

  return (
    <group>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Main node sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        position={[position.x, position.y, position.z]}
      >
        <sphereGeometry args={[baseSize, node.level <= 1 ? 32 : 16, node.level <= 1 ? 32 : 16]} />
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={isActive ? 1 : isHovered ? 0.95 : isVisited ? 0.8 : 0.7}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Visited ring — synced via ref in useFrame */}
      {isVisited && !isActive && (
        <mesh ref={ringRef} position={[position.x, position.y, position.z]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.3, baseSize * 1.4, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Active pulse ring */}
      {isActive && (
        <PulseRing color={color} size={baseSize} meshRef={meshRef} />
      )}

      {/* Label */}
      {(isHovered || isActive || node.level <= 1) && meshRef.current && (
        <Html
          position={[meshRef.current.position.x, meshRef.current.position.y + baseSize + 0.8, meshRef.current.position.z]}
          center
          distanceFactor={30}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`
              px-3 py-1.5 rounded-lg whitespace-nowrap text-center
              backdrop-blur-md border border-white/10
              transition-all duration-200
              ${isActive ? 'bg-black/80 scale-110' : 'bg-black/60'}
            `}
          >
            <p
              className="text-xs font-medium"
              style={{ color: isActive ? color : '#F0F0F0' }}
            >
              {node.label}
            </p>
            {isHovered && !isActive && node.level > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5 max-w-[160px]">
                {node.summary}
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// Pulse ring effect for active nodes — follows the parent mesh position
function PulseRing({
  color,
  size,
  meshRef,
}: {
  color: string;
  size: number;
  meshRef: React.RefObject<THREE.Mesh | null>;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current || !meshRef.current) return;
    // Follow the parent mesh (which floats)
    ringRef.current.position.copy(meshRef.current.position);

    const t = (state.clock.elapsedTime % 2) / 2; // 0-1 every 2 seconds
    const scale = 1 + t * 3;
    ringRef.current.scale.set(scale, scale, 1);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.4;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[size * 1.2, size * 1.35, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}
