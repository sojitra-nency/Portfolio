'use client';

import { memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useForceLayout } from '@/hooks/useForceLayout';
import NeuralNodeComponent from './NeuralNode';
import NeuralConnectionComponent from './NeuralConnection';
import { NeuralNode, NeuralConnection, NodePosition } from '@/data/types';

export default function NeuralNetwork() {
  const getVisibleNodes = useNetworkStore((s) => s.getVisibleNodes);
  const getVisibleConnections = useNetworkStore((s) => s.getVisibleConnections);
  const expandedClusters = useNetworkStore((s) => s.expandedClusters);
  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const setCameraTarget = useNetworkStore((s) => s.setCameraTarget);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visibleNodes = useMemo(() => getVisibleNodes(), [getVisibleNodes, expandedClusters]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visibleConnections = useMemo(() => getVisibleConnections(), [getVisibleConnections, expandedClusters]);

  const { tick, getPosition } = useForceLayout(
    visibleNodes,
    visibleConnections,
    expandedClusters
  );

  // Run physics every frame
  useFrame(() => {
    tick();

    // Update camera target to follow active node
    if (activeNodeId) {
      const pos = getPosition(activeNodeId);
      if (pos) {
        const store = useNetworkStore.getState();
        const current = store.cameraTarget;
        const dx = Math.abs(pos.x - current[0]);
        const dy = Math.abs(pos.y - current[1]);
        if (dx > 0.1 || dy > 0.1) {
          setCameraTarget([pos.x, pos.y, 0]);
        }
      }
    }
  });

  return (
    <group>
      {/* Connections (rendered below nodes) */}
      {visibleConnections.map((conn) => (
        <MemoizedConnectionWrapper key={conn.id} connection={conn} getPosition={getPosition} />
      ))}

      {/* Nodes */}
      {visibleNodes.map((node) => (
        <MemoizedNodeWrapper key={node.id} node={node} getPosition={getPosition} />
      ))}
    </group>
  );
}

// Memoized wrappers prevent unnecessary re-renders of individual nodes/connections
const MemoizedNodeWrapper = memo(function NeuralNodeWrapper({
  node,
  getPosition,
}: {
  node: NeuralNode;
  getPosition: (id: string) => NodePosition;
}) {
  const position = getPosition(node.id);
  return <NeuralNodeComponent node={node} position={position} />;
});

const MemoizedConnectionWrapper = memo(function NeuralConnectionWrapper({
  connection,
  getPosition,
}: {
  connection: NeuralConnection;
  getPosition: (id: string) => NodePosition;
}) {
  const sourcePos = getPosition(connection.sourceId);
  const targetPos = getPosition(connection.targetId);
  return (
    <NeuralConnectionComponent
      connection={connection}
      sourcePos={sourcePos}
      targetPos={targetPos}
    />
  );
});
