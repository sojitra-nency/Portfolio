'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 80;
const SPREAD = 60;

export default function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positionArray, speeds } = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    const spds = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * SPREAD;
      arr[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
      spds.push({
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return { positionArray: arr, speeds: spds };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    return geo;
  }, [positionArray]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = speeds[i];
      posAttr.setX(i, posAttr.getX(i) + s.x + Math.sin(time * 0.2 + s.phase) * 0.002);
      posAttr.setY(i, posAttr.getY(i) + s.y + Math.cos(time * 0.15 + s.phase) * 0.002);

      if (posAttr.getX(i) > SPREAD / 2) posAttr.setX(i, -SPREAD / 2);
      if (posAttr.getX(i) < -SPREAD / 2) posAttr.setX(i, SPREAD / 2);
      if (posAttr.getY(i) > SPREAD / 2) posAttr.setY(i, -SPREAD / 2);
      if (posAttr.getY(i) < -SPREAD / 2) posAttr.setY(i, SPREAD / 2);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        color="#4466aa"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
