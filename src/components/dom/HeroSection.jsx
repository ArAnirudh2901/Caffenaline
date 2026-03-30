'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import gsap from 'gsap'
import { smoothScrollTo } from '@/lib/smoothScrollTo'

export default function HeroSection() {
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const ctaRef = useRef(null)
  const sectionRef = useRef(null)
  const isSplit = useRef(false)

  // Refs for parallax layers — direct DOM manipulation, no React re-renders
  const titleWrapRef = useRef(null)
  const subtitleWrapRef = useRef(null)
  const ctaWrapRef = useRef(null)
  const badgeWrapRef = useRef(null)
  const sideTextRef = useRef(null)

  // Smoothed mouse position (lerped every frame, never triggers renders)
  const mouse = useRef({ x: 0, y: 0 })
  const smoothMouse = useRef({ x: 0, y: 0 })
  const smoothVelocity = useRef(0)
  const rafId = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          useStore.getState().setCurrentSection(0)
        }
      },
      { threshold: 0.45 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Raw mouse tracking — just writes to a ref, zero React involvement
  // Disabled on touch-only devices to save CPU
  useEffect(() => {
    const hasHover = window.matchMedia('(hover: hover)').matches
    if (!hasHover) return

    const handleMouse = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handleMouse, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  // rAF loop: lerp toward target mouse + velocity, write transforms directly to DOM
  useEffect(() => {
    const LERP = 0.06 // lower = smoother/slower follow
    const VELOCITY_LERP = 0.08

    const tick = () => {
      // Smooth-damp mouse
      smoothMouse.current.x += (mouse.current.x - smoothMouse.current.x) * LERP
      smoothMouse.current.y += (mouse.current.y - smoothMouse.current.y) * LERP

      const sx = smoothMouse.current.x
      const sy = smoothMouse.current.y

      // Smooth-damp scroll velocity (read non-reactively)
      const targetVel = useStore.getState().scrollVelocity
      smoothVelocity.current += (targetVel - smoothVelocity.current) * VELOCITY_LERP
      const sv = smoothVelocity.current

      // --- Write transforms directly to DOM nodes ---

      if (titleWrapRef.current) {
        titleWrapRef.current.style.transform =
          `translate3d(${sx * -15}px, ${sy * -10}px, 0)`
      }

      // Kinetic font weight on the <h1>
      if (titleRef.current) {
        const wght = Math.min(950, 800 + Math.abs(sv) * 0.5)
        titleRef.current.style.fontVariationSettings = `'wght' ${wght}`
      }

      if (subtitleWrapRef.current) {
        subtitleWrapRef.current.style.transform =
          `translate3d(${sx * -7}px, ${sy * -5}px, 0)`
      }

      if (ctaWrapRef.current) {
        ctaWrapRef.current.style.transform =
          `translate3d(${sx * -4}px, ${sy * -2}px, 0)`
      }

      if (badgeWrapRef.current) {
        badgeWrapRef.current.style.transform =
          `translate3d(${sx * -3}px, ${sy * -2}px, 0)`
      }

      if (sideTextRef.current) {
        sideTextRef.current.style.transform =
          `translateY(calc(-50% + ${sy * -5}px))`
      }

      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  // GSAP staggered entrance
  useEffect(() => {
    if (titleRef.current && !isSplit.current) {
      isSplit.current = true

      const chars = titleRef.current.innerText.split('')
      titleRef.current.innerHTML = ''
      chars.forEach((char) => {
        const span = document.createElement('span')
        span.innerText = char === ' ' ? '\u00A0' : char
        span.style.display = 'inline-block'
        span.style.overflow = 'visible'
        span.style.opacity = '0'
        span.style.transform = 'translateY(120px) rotateX(90deg)'
        span.style.transformOrigin = 'bottom center'
        if (char === ' ') {
          span.style.width = '0.3em'
        }
        titleRef.current.appendChild(span)
      })

      const tl = gsap.timeline({ delay: 2.0 })

      tl.to(titleRef.current.children, {
        y: 0,
        rotateX: 0,
        opacity: 1,
        stagger: 0.04,
        duration: 1.0,
        ease: 'power4.out',
      })

      tl.fromTo(
        subtitleRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.5'
      )

      tl.fromTo(
        ctaRef.current,
        { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' },
        '-=0.3'
      )
    }
  }, [])

  const handleCTA = useCallback(() => {
    smoothScrollTo('#menu-section')
  }, [])

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      className="section-container flex-col justify-center items-center text-center px-8 lg:px-24 pt-24 pb-12"
      style={{ minHeight: '100vh', minHeight: '100dvh' }}
    >
      {/* Z-axis parallax title — moves faster than bg */}
      <div ref={titleWrapRef} style={{ willChange: 'transform' }}>
        <h1
          ref={titleRef}
          className="kinetic-headline text-[clamp(1.55rem,8vw,6.2rem)] uppercase tracking-tighter leading-[0.85] whitespace-nowrap will-change-transform"
          style={{
            perspective: '800px',
            color: '#4F3C32',
            fontStyle: 'italic',
            overflow: 'visible',
            marginRight: '-0.2em',
            paddingRight: '0.25em',
            whiteSpace: 'nowrap',
          }}
        >
          Adrenaline in a Cup
        </h1>
      </div>

      {/* Subtitle with lighter parallax */}
      <div ref={subtitleWrapRef} style={{ willChange: 'transform' }}>
        <p
          ref={subtitleRef}
          className="font-mono mt-6 text-sm md:text-base font-semibold uppercase tracking-[0.3em] opacity-0"
          style={{ color: '#8B6447' }}
        >
          Fuel for the fearless.
        </p>
      </div>

      {/* CTA Button */}
      <div
        ref={ctaWrapRef}
        className="mt-10 opacity-0"
        style={{ willChange: 'transform' }}
      >
        <div ref={ctaRef}>
          <button
            className="cta-btn pointer-events-auto"
            onClick={handleCTA}
          >
            <span className="cta-bg" />
            <span className="cta-content">
              Choose Your Rush
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Bottom badge */}
      <div
        ref={badgeWrapRef}
        className="absolute bottom-8 left-8 lg:left-24"
        style={{ willChange: 'transform' }}
      >
        <div className="inline-flex items-center gap-3 pointer-events-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#C89F70' }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#C89F70' }} />
          </span>
          <span className="font-mono text-xs font-medium uppercase tracking-[0.25em]" style={{ color: '#8B6447' }}>
            Fresh roast — Stirring live
          </span>
        </div>
      </div>

      {/* Side vertical text */}
      <div
        ref={sideTextRef}
        className="hidden lg:flex fixed right-8 top-1/2 z-20 pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <span
          className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-[#8B6447]"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
        >
          Hand Crafted • Single Origin • Est. 2026
        </span>
      </div>
    </section>
  )
}
