'use client'

import { useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const DRINKS = [
  {
    name: 'THE BASE DROP',
    type: 'Espresso',
    tagline: 'Pure energy. No filter.',
    description:
      'A highly concentrated, strong shot of pure energy featuring a rich, heavy body. The ultimate quick hit.',
    notes: ['Dark Roast', 'Crema', 'Intense Body'],
    color: '#3B2419',
    accent: '#5C3D2E',
  },
  {
    name: 'THE SWEET THRILL',
    type: 'Mocha',
    tagline: 'Where chocolate meets chaos.',
    description:
      'An intoxicatingly rich blend of sweet chocolate sauce, espresso, and velvety textured milk.',
    notes: ['Dark Chocolate', 'Double Shot', 'Steamed Milk'],
    color: '#4A2C2A',
    accent: '#8B5E3C',
  },
  {
    name: 'THE SMOOTH GLIDE',
    type: 'Latte',
    tagline: 'Silky. Seamless. Unstoppable.',
    description:
      'A seamless blend of one-third bold espresso and two-thirds hot steamed milk, finished with a smooth microfoam layer.',
    notes: ['Microfoam', 'Steamed Milk', 'Single Shot'],
    color: '#A0826D',
    accent: '#C4A882',
  },
  {
    name: 'THE CLOUD NINE',
    type: 'Cappuccino',
    tagline: 'Ascend through the foam.',
    description:
      'A dessert-like experience featuring our signature espresso and a thicker, highly concentrated dose of microfoam.',
    notes: ['Dense Foam', 'Equal Parts', 'Velvety Crema'],
    color: '#6F4E37',
    accent: '#D4A373',
  },
  {
    name: 'THE COMFORTER',
    type: 'Hot Chocolate',
    tagline: 'Warmth without limits.',
    description:
      'Pure, dense, and comforting cocoa. All the rich flavor and warmth for a different kind of rush.',
    notes: ['Belgian Cocoa', 'Whole Milk', 'Marshmallow'],
    color: '#5C3317',
    accent: '#A0522D',
  },
]

export default function MenuSection() {
  const sectionRef = useRef(null)
  const panelsRef = useRef([])
  const counterRef = useRef(null)
  const progressBarRef = useRef(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const panels = panelsRef.current.filter(Boolean)
    if (!panels.length || !sectionRef.current) return

    // Set initial panel visibility
    gsap.set(panels[0], { opacity: 1, y: 0 })
    panels.slice(1).forEach((el) => gsap.set(el, { opacity: 0, y: 80 }))

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=400%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress * 4
            useStore.getState().setCoffeeProgress(p)

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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="menu-section" className="relative z-20">
      <div className="h-screen flex items-center pointer-events-none">
        {/* LEFT: Glassmorphism Slab */}
        <div className="w-full md:w-[55%] h-full flex items-center pl-6 lg:pl-16 pr-4 relative z-30">
          <div
            className="w-full max-w-2xl relative pointer-events-auto"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'rgba(251, 245, 224, 0.4)',
              border: '1px solid rgba(118, 97, 97, 0.1)',
              borderRadius: '24px',
              boxShadow:
                '0 8px 40px rgba(74, 54, 45, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              padding: 'clamp(2rem, 4vw, 3.5rem)',
              minHeight: '420px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Section label + counter */}
            <div className="flex items-center gap-3 mb-8">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.4em]"
                style={{ color: '#C89F70' }}
              >
                The Offerings
              </span>
              <div
                className="h-px flex-1"
                style={{ background: 'rgba(200, 159, 112, 0.3)' }}
              />
              <span
                ref={counterRef}
                className="font-mono text-[10px]"
                style={{ color: '#C89F70' }}
              >
                01
              </span>
              <span
                className="font-mono text-[10px]"
                style={{ color: 'rgba(118, 97, 97, 0.3)' }}
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
                      className="font-mono text-[11px] uppercase tracking-[0.3em]"
                      style={{ color: drink.accent }}
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
                    className="font-mono text-xs uppercase tracking-[0.3em] mb-6"
                    style={{ color: '#C89F70' }}
                  >
                    {drink.tagline}
                  </p>

                  {/* Description */}
                  <p
                    className="text-base leading-relaxed mb-6"
                    style={{ color: '#4F3C32', opacity: 0.75 }}
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
