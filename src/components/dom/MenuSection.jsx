'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useStore } from '@/store/useStore'
import { DRINKS } from '@/lib/menuData'

export default function MenuSection() {
  const containerRef = useRef(null)
  const sectionRef = useRef(null)
  const panelsRef = useRef([])
  const counterRef = useRef(null)
  const progressBarRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          useStore.getState().setCurrentSection(2)
        }
      },
      { threshold: 0.45 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const panels = panelsRef.current.filter(Boolean)
    if (!panels.length || !sectionRef.current) return

    const store = useStore.getState()

    // Set initial panel visibility
    gsap.set(panels[0], { opacity: 1, y: 0 })
    panels.slice(1).forEach((el) => gsap.set(el, { opacity: 0, y: 80 }))

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress * 4
            store.setCoffeeProgress(p)

            // Update counter
            if (counterRef.current) {
              counterRef.current.textContent = `0${Math.min(5, Math.floor(p) + 1)}`
            }
            // Update progress bar
            if (progressBarRef.current) {
              progressBarRef.current.style.height = `${self.progress * 100}%`
            }
          },
        },
      })

      // Build transition timeline between panels
      for (let i = 0; i < panels.length - 1; i++) {
        tl.to(panels[i], {
          opacity: 0,
          y: -60,
          duration: 0.8,
          ease: 'power2.inOut',
        })
          .fromTo(
            panels[i + 1],
            { opacity: 0, y: 80 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.inOut' },
            '-=0.4'
          )
          // Breathing room between transitions
          .to({}, { duration: 0.3 })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} id="menu-section" className="relative z-20">
      <div
        ref={sectionRef}
        className="flex items-center pointer-events-none w-full relative"
        style={{ height: '100vh', height: '100dvh' }}
      >
        {/* LEFT: Glassmorphism Slab — on mobile becomes bottom-aligned card */}
        <div className="menu-slab-wrapper w-full md:w-[55%] h-full flex items-center pl-6 lg:pl-16 pr-4 relative z-30">
          <div
            className="glass-slab glass-slab-clear relative pointer-events-auto"
            style={{
              width: 'min(90vw, 640px)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              background: 'transparent',
              border: '1px solid rgba(118, 97, 97, 0.1)',
              borderRadius: '24px',
              boxShadow: 'none',
              padding: 'clamp(2rem, 4vw, 3.5rem)',
              minHeight: '420px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Section label + counter */}
            <div className="flex items-center gap-3 mb-8">
              <span
                className="font-mono text-xs font-semibold uppercase tracking-[0.4em]"
                style={{ color: '#8B6447' }}
              >
                The Offerings
              </span>
              <div
                className="h-px flex-1"
                style={{ background: 'rgba(200, 159, 112, 0.3)' }}
              />
              <span
                ref={counterRef}
                className="font-mono text-xs font-bold"
                style={{ color: '#8B6447' }}
              >
                01
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: 'rgba(118, 97, 97, 0.5)' }}
              >
                /05
              </span>
            </div>

            {/* Drink panels — absolutely stacked, GSAP transitions between them */}
            <div className="relative" style={{ minHeight: '320px' }}>
              {DRINKS.map((drink, i) => (
                <div
                  key={drink.name}
                  ref={(el) => (panelsRef.current[i] = el)}
                  className="absolute inset-0"
                  style={{ opacity: i === 0 ? 1 : 0 }}
                >
                  {/* Type badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: drink.color,
                        boxShadow: `0 0 12px ${drink.accent}40`,
                      }}
                    />
                    <span
                      className="font-mono text-sm font-bold uppercase tracking-[0.3em]"
                      style={{ color: drink.color }}
                    >
                      {drink.type}
                    </span>
                  </div>

                  {/* Drink name — massive bold italic */}
                  <h2
                    className="text-4xl md:text-5xl lg:text-[3.5rem] font-black italic uppercase tracking-tighter leading-[0.9] mb-3"
                    style={{ color: '#4F3C32' }}
                  >
                    {drink.name}
                  </h2>

                  {/* Tagline */}
                  <p
                    className="font-mono text-sm font-medium uppercase tracking-[0.3em] mb-6"
                    style={{ color: '#C89F70' }}
                  >
                    {drink.tagline}
                  </p>

                  {/* Description */}
                  <p
                    className="text-base leading-relaxed mb-6"
                    style={{ color: '#4F3C32' }}
                  >
                    {drink.description}
                  </p>

                  {/* Tasting notes */}
                  <div className="flex flex-wrap gap-2">
                    {drink.notes.map((note) => (
                      <span
                        key={note}
                        className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider"
                        style={{
                          background: 'rgba(251, 245, 224, 0.5)',
                          border: '1px solid rgba(118, 97, 97, 0.12)',
                          color: '#4F3C32',
                        }}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Vertical progress bar */}
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 w-[2px] h-24 rounded-full overflow-hidden"
              style={{ background: 'rgba(118, 97, 97, 0.1)' }}
            >
              <div
                ref={progressBarRef}
                className="w-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, #C89F70, #8B6914)',
                  height: '0%',
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Transparent — 3D cup shows through the fixed canvas */}
        <div className="hidden md:block w-[45%]" />
      </div>
    </section>
  )
}
