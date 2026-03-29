'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { label: 'Story', href: '#story-section' },
  { label: 'Menu', href: '#menu-section' },
  { label: 'Find Us', href: '#footer-section' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 2.2, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4 transition-all duration-500 ${
          scrolled
            ? 'border-b shadow-[0_4px_30px_rgba(74,54,45,0.08)]'
            : 'bg-transparent'
        }`}
        style={{
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          backgroundColor: scrolled ? 'rgba(251, 245, 224, 0.6)' : 'transparent',
          borderColor: scrolled ? 'rgba(200, 159, 112, 0.15)' : 'transparent',
        }}
      >
        {/* Brand */}
        <a href="/" className="pointer-events-auto flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs tracking-tighter group-hover:scale-110 transition-transform duration-300"
            style={{ background: 'linear-gradient(135deg, #8B6914, #C89F70)' }}
          >
            C
          </div>
          <span className="font-black text-lg tracking-tight uppercase" style={{ color: '#4A362D' }}>
            Caffenaline
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 pointer-events-auto">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors duration-300 group"
              style={{ color: '#6B4F3D' }}
              onMouseEnter={(e) => (e.target.style.color = '#4A362D')}
              onMouseLeave={(e) => (e.target.style.color = '#6B4F3D')}
            >
              {link.label}
              <span
                className="absolute bottom-1 left-4 right-4 h-[2px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                style={{ backgroundColor: '#C89F70' }}
              />
            </a>
          ))}
          <button
            className="ml-4 px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 active:scale-95"
            style={{
              backgroundColor: '#4A362D',
              color: '#fbf5e0',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#6B4F3D'
              e.target.style.boxShadow = '0 8px 20px rgba(74, 54, 45, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#4A362D'
              e.target.style.boxShadow = 'none'
            }}
          >
            Order Now
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden pointer-events-auto flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-[2px]"
            style={{ backgroundColor: '#4A362D' }}
          />
          <motion.span
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block w-6 h-[2px]"
            style={{ backgroundColor: '#4A362D' }}
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-[2px]"
            style={{ backgroundColor: '#4A362D' }}
          />
        </button>
      </motion.nav>

      {/* Mobile Glassmorphism Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden flex items-center justify-center"
            style={{
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              backgroundColor: 'rgba(251, 245, 224, 0.88)',
            }}
          >
            <nav className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="text-3xl font-black uppercase tracking-tight pointer-events-auto"
                  style={{ color: '#4A362D' }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: navLinks.length * 0.08 }}
                className="mt-4 px-8 py-3 rounded-full text-lg font-semibold uppercase tracking-wider pointer-events-auto"
                style={{ backgroundColor: '#4A362D', color: '#fbf5e0' }}
              >
                Order Now
              </motion.button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
