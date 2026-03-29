'use client'

import { useEffect, useRef } from 'react'
import Lenis from '@studio-freight/lenis'
import { useStore } from '@/store/useStore'

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    })

    lenisRef.current = lenis

    // Track scroll progress & velocity, push into Zustand
    lenis.on('scroll', ({ progress, velocity }) => {
      const store = useStore.getState()
      store.setScrollProgress(progress)

      // Clamp velocity to a useful range for kinetic typography
      const clampedVelocity = Math.min(200, Math.abs(velocity * 100))
      store.setScrollVelocity(clampedVelocity)

      // Update CSS custom property for kinetic text
      document.documentElement.style.setProperty(
        '--scroll-velocity',
        String(clampedVelocity)
      )
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">
        {children}
      </div>
    </div>
  )
}
