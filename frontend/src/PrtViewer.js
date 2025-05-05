
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { Modal } from 'react-bootstrap';

function Model({ url }) {
  const { scene } = useGLTF(url, true);
  return <primitive object={scene} dispose={null} />;
}

function PrtViewer({ fileUrl, show, onHide, filename }) {
  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>3D Preview: {filename}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ height: '80vh', backgroundColor: '#111' }}>
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <Model url={fileUrl} />
            <Environment preset="warehouse" />
            <OrbitControls />
          </Suspense>
        </Canvas>
      </Modal.Body>
    </Modal>
  );
}

export default PrtViewer;
