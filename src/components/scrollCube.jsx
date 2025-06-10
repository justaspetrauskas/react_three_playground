import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const GRID_SIZE = 20;
const SPACING = 1.1;

const RippleCube = ({ position, distanceToMouse }) => {
  const meshRef = useRef();
  const targetZ = Math.max(0, 1 - distanceToMouse * 0.5); // dropoff

  useFrame(() => {
    if (meshRef.current) {
      // Smooth transition toward targetZ
      meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3399ff" />
    </mesh>
  );
};

const RippleGrid = () => {
  const [hoverPos, setHoverPos] = useState(null);
  const mouse = useRef(new THREE.Vector2());
  const raycaster = new THREE.Raycaster();
  const { camera, gl, scene } = useThree();

  const planes = useRef([]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse.current, camera);
      const intersects = raycaster.intersectObjects(planes.current);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        setHoverPos([point.x, point.y]);
      } else {
        setHoverPos(null);
      }
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => gl.domElement.removeEventListener('mousemove', handleMouseMove);
  }, [camera, gl]);

  // Create a plane of invisible meshes to detect mouse hover
  useEffect(() => {
    planes.current = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        plane.position.set(
          (x - GRID_SIZE / 2) * SPACING,
          (y - GRID_SIZE / 2) * SPACING,
          0
        );
        scene.add(plane);
        planes.current.push(plane);
      }
    }

    return () => {
      planes.current.forEach(p => scene.remove(p));
    };
  }, [scene]);

  return (
    <>
      {Array.from({ length: GRID_SIZE }).map((_, x) =>
        Array.from({ length: GRID_SIZE }).map((_, y) => {
          const posX = (x - GRID_SIZE / 2) * SPACING;
          const posY = (y - GRID_SIZE / 2) * SPACING;

          // Calculate distance from hover point
          const distanceToMouse =
            hoverPos != null
              ? Math.hypot(posX - hoverPos[0], posY - hoverPos[1])
              : Infinity;

          return (
            <RippleCube
              key={`${x}-${y}`}
              position={[posX, posY, 0]}
              distanceToMouse={distanceToMouse}
            />
          );
        })
      )}
    </>
  );
};

const RippleScene = () => (
  <div style={{ width: '100%', height: '600px' }}>
    <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[30, 30, 30]} />
      <OrbitControls enableRotate={false} enableZoom={false} />
      <RippleGrid />
    </Canvas>
  </div>
);

export default RippleScene;
