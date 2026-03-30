'use client'

import { useRef, useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function BrandStorySection() {
  const sectionRef = useRef(null)
  const headlineRef = useRef(null)
  const bodyRef = useRef(null)
  const slabRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const scrollVelocity = useStore((s) => s.scrollVelocity)

  // IntersectionObserver for reveal + section tracking
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          useStore.getState().setCurrentSection(1)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // GSAP scroll-driven slide-in from right + reveal animations
  useEffect(() => {
    if (!slabRef.current || !sectionRef.current) return

    const ctx = gsap.context(() => {
      // Slide the glassmorphism slab in from the right
      gsap.fromTo(
        slabRef.current,
        { x: 200, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 30%',
            scrub: 1,
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  // GSAP reveal animations for content
  useEffect(() => {
    if (!isVisible) return

    const tl = gsap.timeline()

    tl.fromTo(
      headlineRef.current,
      { y: 80, opacity: 0, skewY: 4 },
      { y: 0, opacity: 1, skewY: 0, duration: 1.0, ease: 'power4.out' }
    )

    tl.fromTo(
      bodyRef.current,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
      '-=0.5'
    )
  }, [isVisible])

  // Tone down the gauge response so normal scrolls produce a calmer fill range.
  const speedFill = Math.min(100, Math.abs(scrollVelocity) * 0.125)

  return (
    <section
      ref={sectionRef}
      id="story-section"
      className="relative z-20 w-full h-screen"
    >
      {/* Speedometer track — left edge */}
      <div
        className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
        style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}
      >
        <div className="speedometer-track" style={{ height: '200px' }}>
          <div
            className="speedometer-fill"
            style={{ height: `${speedFill}%` }}
          />
          {/* Notches */}
          {[...Array(11)].map((_, i) => (
            <div
              key={i}
              className="speedometer-notch"
              style={{ bottom: `${i * 10}%` }}
            />
          ))}
        </div>
        <span
          className="block mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-center"
          style={{ color: 'rgba(118, 97, 97, 0.6)' }}
        >
          Velocity
        </span>
      </div>

      {/* Content — Positioned strictly on the RIGHT side to counterbalance the cup on the left */}
      <div className="w-full h-full flex items-center justify-end pr-8 lg:pr-16 pl-4 pointer-events-none">
        <div ref={slabRef} className="pointer-events-auto" style={{ opacity: 0, width: 'min(90vw, 500px)' }}>
          <div
            className="glass-panel p-10 md:p-14 tilt-card w-full"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'rgba(251, 245, 224, 0.4)',
            }}
          >
            <h2
              ref={headlineRef}
              className="kinetic-headline text-4xl md:text-6xl uppercase tracking-tighter leading-[0.9] mb-8 opacity-0"
              style={{
                color: '#4F3C32',
                fontStyle: 'italic',
                fontVariationSettings: `'wght' ${Math.min(950, 800 + Math.abs(scrollVelocity) * 0.4)}`,
              }}
            >
              Defy the Ordinary
            </h2>

            <div ref={bodyRef} className="opacity-0 space-y-6">
              <p
                className="text-base md:text-lg leading-relaxed"
                style={{ color: '#4F3C32' }}
              >
                We reject the standard morning routine. Caffenaline is about
                conveying the perfect harmony of life-giving water and
                energy-rich coffee.
              </p>
              <p
                className="text-base md:text-lg leading-relaxed"
                style={{ color: '#4F3C32' }}
              >
                We roast and brew our beans for those chasing their next thrill,
                delivering a visceral, high-energy experience with every single
                drop.
              </p>

              {/* Decorative divider */}
              <div className="flex items-center gap-4 pt-4">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(200, 159, 112, 0.4), transparent)' }} />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: '#8B6447' }}>
                  Est. 2026
                </span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(200, 159, 112, 0.4), transparent)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
