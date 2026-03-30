'use client'

import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Reusable scratch objects — allocated once, never GC'd
const _bowlPos = new THREE.Vector3()
const _pivot = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _worldUp = new THREE.Vector3(0, 1, 0)
const _X = new THREE.Vector3()
const _Z = new THREE.Vector3()
const _mat4 = new THREE.Matrix4()

export default function Spoon({ liquidY = 1.52 }) {
  const spoonGroupRef = useRef()
  const timeRef = useRef(0)

  // Spoon handle curve
  const handleCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0, 1.0, 0.01),
      new THREE.Vector3(0, 1.5, 0.04),
      new THREE.Vector3(0, 2.0, 0.08),
      new THREE.Vector3(0, 2.6, 0.14),
    ], false, 'catmullrom', 0.5)
  }, [])

  // High-frequency stirring via useFrame (zero GC pressure)
  useFrame((_, delta) => {
    if (!spoonGroupRef.current) return
    timeRef.current += delta * 1.8

    const t = timeRef.current

    // Elliptical stirring path (right-side arc)
    const x = 0.45 + Math.cos(t) * 0.45
    const z = Math.sin(t) * 0.45

    _bowlPos.set(x, liquidY - 0.06, z)
    spoonGroupRef.current.position.copy(_bowlPos)

    // Orient spoon: bowl-end follows motion, handle points toward rim pivot
    _pivot.set(1.2, liquidY + 1.2, 0.0)
    _dir.subVectors(_pivot, _bowlPos).normalize()

    _X.crossVectors(_worldUp, _dir).normalize()
    if (_X.lengthSq() < 0.0001) _X.set(1, 0, 0)
    _Z.crossVectors(_X, _dir).normalize()

    _mat4.makeBasis(_X, _dir, _Z)
    spoonGroupRef.current.quaternion.setFromRotationMatrix(_mat4)
  })

  const metalProps = useMemo(() => ({
    color: '#ffffff',
    roughness: 0.1,
    metalness: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.0,
  }), [])

  return (
    <group
      ref={spoonGroupRef}
      position={[0, liquidY, 0]}
    >
      <group scale={0.85}>
        {/* Spoon handle shaft */}
        <mesh castShadow receiveShadow>
          <tubeGeometry args={[handleCurve, 48, 0.07, 16, false]} />
          <meshPhysicalMaterial {...metalProps} />
        </mesh>

        {/* Spoon bowl */}
        <group position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
            <meshPhysicalMaterial {...metalProps} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Handle top cap */}
        <mesh position={[0, 2.6, 0.14]} castShadow>
          <sphereGeometry args={[0.072, 12, 12]} />
          <meshPhysicalMaterial {...metalProps} />
        </mesh>

        {/* Bowl bottom cap */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.072, 12, 12]} />
          <meshPhysicalMaterial {...metalProps} />
        </mesh>
      </group>
    </group>
  )
}
