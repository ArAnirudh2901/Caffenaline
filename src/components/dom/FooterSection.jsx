'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'
import gsap from 'gsap'

function TiltGlassCard({ children, className = '' }) {
  const cardRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -6
    const rotateY = ((x - centerX) / centerX) * 6
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }, [])

  return (
    <div
      ref={cardRef}
      className={`glass-panel ${className}`}
      style={{
        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        willChange: 'transform',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

export default function FooterSection() {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          useStore.getState().setCurrentSection(3)
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || !sectionRef.current) return

    const elements = sectionRef.current.querySelectorAll('.footer-reveal')
    gsap.fromTo(
      elements,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
      }
    )
  }, [isVisible])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (email) {
        setIsSubmitted(true)
        // Would POST to backend in production
      }
    },
    [email]
  )

  return (
    <section
      ref={sectionRef}
      id="footer-section"
      className="section-container flex-col justify-center"
      style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '4rem' }}
    >
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-16">
        {/* Headline */}
        <div className="footer-reveal mb-12 lg:mb-16">
          <span
            className="font-mono text-sm font-semibold uppercase tracking-[0.4em] block mb-3"
            style={{ color: '#8B6447' }}
          >
            Find Us
          </span>
          <h2
            className="kinetic-headline text-4xl md:text-6xl uppercase tracking-tighter leading-[0.9]"
            style={{ color: '#4A362D' }}
          >
            Your Starting Line.
          </h2>
        </div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-16">
          {/* Address Card */}
          <TiltGlassCard className="p-8 footer-reveal">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(200, 159, 112, 0.15)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#C89F70" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: '#8B6447' }}>
                Location
              </span>
            </div>
            <h3 className="text-lg font-bold uppercase tracking-tight mb-2" style={{ color: '#4A362D' }}>
              Adrenaline District
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: '#5C4A42' }}>
              123 Extreme Ave<br />
              Adrenaline District
            </p>
          </TiltGlassCard>

          {/* Hours Card */}
          <TiltGlassCard className="p-8 footer-reveal">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(200, 159, 112, 0.15)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#C89F70" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: '#8B6447' }}>
                Hours
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-tight mb-1" style={{ color: '#4A362D' }}>
                  Mon – Fri
                </h4>
                <p className="text-sm font-mono" style={{ color: '#5C4A42' }}>6:00 AM – 8:00 PM</p>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-tight mb-1" style={{ color: '#4A362D' }}>
                  Sat – Sun
                </h4>
                <p className="text-sm font-mono" style={{ color: '#5C4A42' }}>7:00 AM – 9:00 PM</p>
              </div>
            </div>
          </TiltGlassCard>

          {/* Vibe Card */}
          <TiltGlassCard className="p-8 footer-reveal md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(200, 159, 112, 0.15)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#C89F70" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: '#8B6447' }}>
                The Vibe
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#5C4A42' }}>
              High-energy space designed for those who live on the edge. Come for the coffee, stay for the adrenaline.
            </p>
          </TiltGlassCard>
        </div>

        {/* Email CTA */}
        <div className="footer-reveal max-w-2xl mx-auto w-full" style={{ perspective: '1200px' }}>
          <motion.div
            className="w-full relative"
            initial={false}
            animate={{ rotateY: isSubmitted ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* FRONT (FORM) */}
            <div
              className="glass-panel p-8 md:p-12 text-center"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <h3
                className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3"
                style={{ color: '#4A362D' }}
              >
                Join the Rush.
              </h3>
              <p className="text-sm mb-6" style={{ color: '#5C4A42' }}>
                Enter your email for exclusive drops and event invites.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input flex-1"
                  required
                />
                <button type="submit" className="cta-btn pointer-events-auto" style={{ padding: '12px 28px' }}>
                  <span className="cta-bg" />
                  <span className="cta-content">
                    Subscribe
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </form>
            </div>

            {/* BACK (SUCCESS STATE) */}
            <div
              className="glass-panel p-8 md:p-12 text-center absolute inset-0 flex flex-col items-center justify-center"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: '#4A362D' }}>
                <svg className="w-8 h-8 text-[#C89F70]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3
                className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3"
                style={{ color: '#4A362D' }}
              >
                You're In.
              </h3>
              <p className="text-sm mb-6" style={{ color: '#5C4A42' }}>
                Check your inbox for the welcome drop.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                }}
                className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 pointer-events-auto"
                style={{
                  background: 'transparent',
                  border: '2px solid #4A362D',
                  color: '#4A362D',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4A362D'
                  e.currentTarget.style.color = '#fbf5e0'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(74, 54, 45, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#4A362D'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Subscribe Again
              </button>
            </div>
          </motion.div>
        </div>

        {/* Footer bottom */}
        <div className="footer-reveal mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(118, 97, 97, 0.1)' }}>
          <span className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: 'rgba(118, 97, 97, 0.6)' }}>
            © 2026 Caffenaline. All rights reserved.
          </span>
          <div className="flex gap-6">
            {['Instagram', 'Twitter', 'TikTok'].map((social) => (
              <a
                key={social}
                href="#"
                className="font-mono text-xs uppercase tracking-[0.2em] hover:opacity-100 transition-opacity"
                style={{ color: 'rgba(118, 97, 97, 0.6)' }}
              >
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
