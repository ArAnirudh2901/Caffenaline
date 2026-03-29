'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'

// ---------------------------------------------------------------------------
//  4 camera keyframes corresponding to each scroll section
//  Each has a position and a lookAt target
// ---------------------------------------------------------------------------
const KEYFRAMES = [
  {
    // Section 0 — Hero: Tight macro of the liquid surface
    position: new THREE.Vector3(0, 2.5, 6),
    lookAt: new THREE.Vector3(0, 0.5, 0),
  },
  {
    // Section 1 — Brand Story: Side-profile pan revealing the decal
    position: new THREE.Vector3(5.5, 2.0, 3.5),
    lookAt: new THREE.Vector3(0, 0.4, 0),
  },
  {
    // Section 2 — Menu: Elevated view looking into the cup
    position: new THREE.Vector3(1.5, 3.0, 5.0),
    // Pushing lookAt extremely low (-4.0) forces the camera to angle sharply downwards, throwing the cup high into the top of the viewport
    lookAt: new THREE.Vector3(0, -4.0, 0),
  },
  {
    // Section 3 — Footer: Pan UP so the cup smoothly drops off the bottom of the screen
    position: new THREE.Vector3(0, 10.0, 5.0),
    lookAt: new THREE.Vector3(0, 8.0, 0),
  },
]

// Scratch vectors to avoid per-frame allocation
const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _currentLook = new THREE.Vector3()

export default function ScrollCameraController() {
  const { camera } = useThree()
  
  // Create refs for target values, starting at KEYFRAME 0
  const targetPos = useRef(KEYFRAMES[0].position.clone())
  const targetLook = useRef(KEYFRAMES[0].lookAt.clone())

  useEffect(() => {
    // We must wait for GSAP / Lenis
    if (typeof window === 'undefined' || !window.gsap) return

    const gsap = window.gsap
    const ScrollTrigger = window.ScrollTrigger

    // Hero -> Story (Transition 0 -> 1)
    const st1 = ScrollTrigger.create({
      trigger: '#story-section',
      start: 'top bottom', // when story enters viewport from bottom
      end: 'top top',      // fully centered
      scrub: true,
      onUpdate: (self) => {
        targetPos.current.lerpVectors(KEYFRAMES[0].position, KEYFRAMES[1].position, self.progress)
        targetLook.current.lerpVectors(KEYFRAMES[0].lookAt, KEYFRAMES[1].lookAt, self.progress)
      }
    })

    // Story -> Menu (Transition 1 -> 2)
    const st2 = ScrollTrigger.create({
      trigger: '#menu-section',
      start: 'top bottom',
      end: 'top top',      // exactly when Menu pins, progress hits 1.0!
      scrub: true,
      onUpdate: (self) => {
        targetPos.current.lerpVectors(KEYFRAMES[1].position, KEYFRAMES[2].position, self.progress)
        targetLook.current.lerpVectors(KEYFRAMES[1].lookAt, KEYFRAMES[2].lookAt, self.progress)
      }
    })

    // Menu -> Footer (Transition 2 -> 3)
    const st3 = ScrollTrigger.create({
      trigger: '#footer-section',
      start: 'top bottom', // when footer reveals after the 400vh pin
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        targetPos.current.lerpVectors(KEYFRAMES[2].position, KEYFRAMES[3].position, self.progress)
        targetLook.current.lerpVectors(KEYFRAMES[2].lookAt, KEYFRAMES[3].lookAt, self.progress)
      }
    })

    return () => {
      st1.kill()
      st2.kill()
      st3.kill()
    }
  }, [])

  useFrame(() => {
    // Smoothly drag camera to whatever target ScrollTrigger has requested
    camera.position.lerp(targetPos.current, 0.08)
    _currentLook.lerp(targetLook.current, 0.08)
    camera.lookAt(_currentLook)
  })

  return null
}
