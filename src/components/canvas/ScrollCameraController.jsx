'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
//  Simplified Camera Controller
//
//  The cup translates horizontally via CoffeeCupHero.jsx's GSAP timeline.
//  The camera stays mostly fixed, providing a stable overhead angle that
//  frames the cup across all three stages. Only the Footer section pushes
//  the camera up so the cup exits the bottom of the viewport.
// ---------------------------------------------------------------------------

const HERO_POS = new THREE.Vector3(0, 2.5, 6.0)
const HERO_LOOK = new THREE.Vector3(0, 0.5, 0)

const FOOTER_POS = new THREE.Vector3(0, 10.0, 5.0)
const FOOTER_LOOK = new THREE.Vector3(0, 8.0, 0)

const _pos = new THREE.Vector3()
const _look = new THREE.Vector3()
const _currentLook = new THREE.Vector3()

export default function ScrollCameraController() {
  const { camera } = useThree()

  const targetPos = useRef(HERO_POS.clone())
  const targetLook = useRef(HERO_LOOK.clone())

  // Initialize the current look tracker
  _currentLook.copy(HERO_LOOK)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Wait for GSAP to be registered by SmoothScroll
    const waitForGSAP = () => {
      if (!window.gsap || !window.ScrollTrigger) {
        requestAnimationFrame(waitForGSAP)
        return
      }

      const ScrollTrigger = window.ScrollTrigger

      // Footer exit — pan camera up as the cup drops off screen
      const stFooter = ScrollTrigger.create({
        trigger: '#footer-section',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          targetPos.current.lerpVectors(HERO_POS, FOOTER_POS, self.progress)
          targetLook.current.lerpVectors(HERO_LOOK, FOOTER_LOOK, self.progress)
        },
      })

      // Store for cleanup
      window.__caffCameraFooterST = stFooter
    }

    requestAnimationFrame(waitForGSAP)

    return () => {
      if (window.__caffCameraFooterST) {
        window.__caffCameraFooterST.kill()
        delete window.__caffCameraFooterST
      }
    }
  }, [])

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.08)
    _currentLook.lerp(targetLook.current, 0.08)
    camera.lookAt(_currentLook)
  })

  return null
}
