'use client'

import { useEffect, useRef } from 'react'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useStore } from '@/store/useStore'

// Register GSAP plugins once — this is the single registration point
gsap.registerPlugin(ScrollTrigger)

// Expose on window so R3F canvas components (which run outside the DOM tree)
// can access them reliably without module-scope timing issues
if (typeof window !== 'undefined') {
  window.gsap = gsap
  window.ScrollTrigger = ScrollTrigger
}

export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2, // Standard responsive timing
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      wheelMultiplier: 1.0, // Standard 1:1 input tracking speed
      lerp: 0.05, // Ultra smooth easing interpolation
      smoothTouch: true,
      touchMultiplier: 1.5,
    })

    lenisRef.current = lenis
    window.__lenis = lenis

    // Track scroll position for velocity computation (fallback for keyboard)
    let lastScroll = 0
    let lastTime = performance.now()
    let smoothedComputedVelocity = 0 // EMA smoother

    // Synchronize Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ({ scroll, progress, velocity }) => {
      // Update ScrollTrigger on every Lenis tick so scrub-based
      // timelines stay perfectly synced with the smooth scroll position
      ScrollTrigger.update()

      const store = useStore.getState()
      store.setScrollProgress(progress)

      // Compute velocity from position delta as fallback for keyboard scrolling
      const now = performance.now()
      const dt = (now - lastTime) / 1000 // seconds
      const positionDelta = Math.abs(scroll - lastScroll)
      
      // Limit dt constraint to prevent dividing by tiny fractions and causing massive spikes
      const computedVelocity = (dt > 0.005 && dt < 0.1) ? (positionDelta / dt) : 0
      
      lastScroll = scroll
      lastTime = now

      // Blend raw computed velocity to kill keyboard scroll jitter
      smoothedComputedVelocity = smoothedComputedVelocity + (computedVelocity - smoothedComputedVelocity) * 0.15

      // Use the higher of Lenis velocity or computing fallback
      const lenisVelocity = Math.abs(velocity) * 300
      let rawVelocity = Math.max(lenisVelocity, smoothedComputedVelocity)
      
      // Snap deadzone to prevent the bar from hanging or hovering slightly above zero
      if (rawVelocity < 10) {
        rawVelocity = 0
        smoothedComputedVelocity = 0 // Reset smoother
      }

      const clampedVelocity = Math.min(800, rawVelocity)
      store.setScrollVelocity(clampedVelocity)

      // Update CSS custom property for kinetic text
      document.documentElement.style.setProperty(
        '--scroll-velocity',
        String(clampedVelocity)
      )
    })

    // Use GSAP's ticker to drive Lenis — ensures perfect frame alignment
    const updateLenis = (time) => {
      lenis.raf(time * 1000)
    }

    gsap.ticker.add(updateLenis)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(updateLenis)

      if (window.__lenis === lenis) {
        delete window.__lenis
      }

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
