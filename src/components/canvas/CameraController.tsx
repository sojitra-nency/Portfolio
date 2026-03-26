'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useNetworkStore } from '@/store/useNetworkStore';
import { ZOOM_LEVELS } from '@/lib/constants';
import type { NodeLevel } from '@/data/types';

export default function CameraController() {
  const { camera } = useThree();
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 50));
  const targetLookRef = useRef(new THREE.Vector3(0, 0, 0));

  const activeNodeId = useNetworkStore((s) => s.activeNodeId);
  const cameraTarget = useNetworkStore((s) => s.cameraTarget);
  const zoomLevel = useNetworkStore((s) => s.zoomLevel);
  const setZoom = useNetworkStore((s) => s.setZoom);
  const setCameraTarget = useNetworkStore((s) => s.setCameraTarget);

  const updateCameraForNode = useCallback(() => {
    const state = useNetworkStore.getState();
    const id = state.activeNodeId;
    if (id) {
      const node = state.getNodeById(id);
      if (node) {
        const zoom = ZOOM_LEVELS[node.level as NodeLevel] || 30;
        setZoom(zoom);
      }
    } else {
      setZoom(50);
      setCameraTarget([0, 0, 0]);
    }
  }, [setZoom, setCameraTarget]);

  useEffect(() => {
    updateCameraForNode();
  }, [activeNodeId, updateCameraForNode]);

  useFrame(() => {
    targetPosRef.current.set(cameraTarget[0], cameraTarget[1], zoomLevel);
    targetLookRef.current.set(cameraTarget[0], cameraTarget[1], 0);
    camera.position.lerp(targetPosRef.current, 0.05);
    camera.lookAt(targetLookRef.current);
  });

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentZoom = useNetworkStore.getState().zoomLevel;
      const delta = e.deltaY * 0.05;
      const newZoom = THREE.MathUtils.clamp(currentZoom + delta, 8, 70);
      setZoom(newZoom);
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [setZoom]);

  return null;
}
