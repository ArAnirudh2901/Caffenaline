'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, Preload } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import CoffeeCupHero from './CoffeeCupHero'
import ScrollCameraController from './ScrollCameraController'

export default function Scene() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-auto z-10" style={{ backgroundColor: '#fbf5e0' }}>
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, toneMapping: 3 }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        <color attach="background" args={['#fbf5e0']} />

        {/* Soft ambient fill */}
        <ambientLight intensity={1.5} color="#FFF5E6" />

        {/* Key light */}
        <directionalLight
          position={[4, 6, 2]}
          intensity={2.5}
          color="#FFF0DD"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />

        {/* HDR Environment */}
        <Suspense fallback={null}>
          <Environment
            preset="city"
            environmentIntensity={0.6}
            environmentRotation={[0, Math.PI / 4, 0]}
          />
        </Suspense>

        <CoffeeCupHero />

        {/* Scroll-driven camera interpolation (reads scrollProgress from store) */}
        <ScrollCameraController />

        <Preload all />
      </Canvas>
    </div>
  )
}
