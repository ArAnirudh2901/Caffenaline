'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, Preload, PerformanceMonitor } from '@react-three/drei'
import { Suspense, useCallback } from 'react'
import * as THREE from 'three'
import CoffeeCupHero from './CoffeeCupHero'
import ScrollCameraController from './ScrollCameraController'
import { useStore } from '@/store/useStore'

export default function Scene() {
  const handleCreated = ({ gl, scene, camera }) => {
    // Force GPU shader compilation before revealing the scene
    gl.compile(scene, camera)
    // Signal that shaders are ready
    useStore.getState().setShadersCompiled(true)
  }

  const handleDecline = useCallback(() => {
    useStore.getState().setPerformanceTier('low')
  }, [])

  const handleIncline = useCallback(() => {
    useStore.getState().setPerformanceTier('high')
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full canvas-container" style={{ zIndex: -1, backgroundColor: '#fbf5e0' }}>
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, toneMapping: 3 }}
        shadows={{ type: THREE.PCFShadowMap }}
        onCreated={handleCreated}
      >
        <color attach="background" args={['#fbf5e0']} />

        {/* Performance-adaptive rendering */}
        <PerformanceMonitor
          onDecline={handleDecline}
          onIncline={handleIncline}
          flipflops={3}
          onFallback={() => useStore.getState().setPerformanceTier('low')}
        >
          {/* Soft ambient fill */}
          <ambientLight intensity={1.1} color="#FFF5E6" />

          {/* Key light */}
          <directionalLight
            position={[8, 10, -5]}
            intensity={2.0}
            color="#FFF0DD"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />

          {/* HDR Environment */}
          <Suspense fallback={null}>
            <Environment
              preset="studio"
              environmentIntensity={0.3}
              environmentRotation={[0, Math.PI / 4, 0]}
            />
          </Suspense>

          <CoffeeCupHero />

          {/* Scroll-driven camera interpolation (reads scrollProgress from store) */}
          <ScrollCameraController />

          {/* Force initialization of all off-screen textures and materials */}
          <Preload all />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
