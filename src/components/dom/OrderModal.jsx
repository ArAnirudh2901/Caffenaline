'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '@/store/useStore'
import gsap from 'gsap'
import { DRINKS, SIZES } from '@/lib/menuData'

export default function OrderModal() {
  const modalRef = useRef(null)
  const backdropRef = useRef(null)
  const stepRefs = useRef([])
  const tlRef = useRef(null)
  const advanceTimeoutRef = useRef(null)

  const isOpen = useStore((s) => s.orderModalOpen)
  const step = useStore((s) => s.orderStep)
  const buttonRect = useStore((s) => s.orderButtonRect)

  const [selectedDrink, setSelectedDrink] = useState(null)
  const [selectedSize, setSelectedSize] = useState(1) // default Grande

  // ─── ENTRY ANIMATION: origin-aware swoosh from button ───
  useEffect(() => {
    if (!isOpen || !modalRef.current || !backdropRef.current) return

    // Kill any running animations
    if (tlRef.current) tlRef.current.kill()

    const modal = modalRef.current
    const backdrop = backdropRef.current

    // Calculate origin offset from button rect
    // If no rect captured, default to top-right corner
    const vw = window.innerWidth
    const vh = window.innerHeight

    let originX = '40vw'
    let originY = '-45vh'

    if (buttonRect) {
      const btnCenterX = buttonRect.left + buttonRect.width / 2
      const btnCenterY = buttonRect.top + buttonRect.height / 2
      const modalCenterX = vw / 2
      const modalCenterY = vh / 2
      originX = btnCenterX - modalCenterX
      originY = btnCenterY - modalCenterY
    }

    const tl = gsap.timeline()
    tlRef.current = tl

    // Backdrop fade
    tl.fromTo(
      backdrop,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' },
      0
    )

    // Modal swoosh from button origin
    tl.fromTo(
      modal,
      {
        scale: 0,
        x: originX,
        y: originY,
        rotateY: 0,
        opacity: 0,
      },
      {
        scale: 1,
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'expo.out',
        transformOrigin: 'top right',
      },
      0.05
    )

    return () => {
      if (tlRef.current) tlRef.current.kill()
    }
  }, [isOpen, buttonRect])

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current)
      }
    }
  }, [])

  // ─── STEP TRANSITIONS ───
  useEffect(() => {
    if (!isOpen) return

    const panels = stepRefs.current.filter(Boolean)
    if (!panels.length) return

    // Animate step transition
    panels.forEach((panel, i) => {
      if (i === step) {
        gsap.fromTo(
          panel,
          { opacity: 0, y: 30, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power3.out',
            delay: 0.05,
          }
        )
      } else {
        gsap.set(panel, { opacity: 0, y: 30, position: 'absolute', pointerEvents: 'none' })
      }
    })
  }, [step, isOpen])

  // ─── EXIT: 3D flip-back for success or normal close ───
  const closeModal = useCallback(
    (is3DFlip = false) => {
      if (!modalRef.current || !backdropRef.current) return

      const modal = modalRef.current
      const backdrop = backdropRef.current

      const vw = window.innerWidth
      const vh = window.innerHeight

      let targetX = vw * 0.4
      let targetY = vh * -0.45

      if (buttonRect) {
        const btnCenterX = buttonRect.left + buttonRect.width / 2
        const btnCenterY = buttonRect.top + buttonRect.height / 2
        const modalCenterX = vw / 2
        const modalCenterY = vh / 2
        targetX = btnCenterX - modalCenterX
        targetY = btnCenterY - modalCenterY
      }

      const tl = gsap.timeline({
        onComplete: () => {
          if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current)
            advanceTimeoutRef.current = null
          }
          setSelectedDrink(null)
          setSelectedSize(1)
          useStore.getState().setOrderModalOpen(false)
          useStore.getState().setOrderStep(0)
        },
      })

      if (is3DFlip) {
        // 3D flip-back exit from success
        tl.to(modal, {
          rotateY: -180,
          scale: 0,
          x: targetX,
          y: targetY,
          opacity: 0,
          duration: 0.9,
          ease: 'expo.inOut',
          transformOrigin: 'center center',
        })
      } else {
        // Normal close — reverse swoosh
        tl.to(modal, {
          scale: 0,
          x: targetX,
          y: targetY,
          opacity: 0,
          duration: 0.6,
          ease: 'expo.in',
          transformOrigin: 'top right',
        })
      }

      tl.to(
        backdrop,
        { opacity: 0, duration: 0.35, ease: 'power2.in' },
        is3DFlip ? '-=0.4' : '-=0.3'
      )
    },
    [buttonRect]
  )

  const handleDrinkSelect = useCallback((index) => {
    setSelectedDrink(index)

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current)
    }

    // Brief delay then advance
    advanceTimeoutRef.current = setTimeout(() => {
      useStore.getState().setOrderStep(1)
      advanceTimeoutRef.current = null
    }, 200)
  }, [])

  const handleConfirmOrder = useCallback(() => {
    useStore.getState().setOrderStep(2)
  }, [])

  const handleBackToMenu = useCallback(() => {
    closeModal(true) // 3D flip-back
  }, [closeModal])

  const handleBackStep = useCallback(() => {
    const currentStep = useStore.getState().orderStep
    if (currentStep > 0) {
      useStore.getState().setOrderStep(currentStep - 1)
    }
  }, [])

  if (!isOpen) return null

  const drink = selectedDrink !== null ? DRINKS[selectedDrink] : null
  const size = SIZES[selectedSize]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ perspective: '1200px' }}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0"
        style={{
          background: 'rgba(79, 60, 50, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          opacity: 0,
        }}
        onClick={() => closeModal(false)}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative z-10 w-[92vw] max-w-[520px]"
        style={{
          transformStyle: 'preserve-3d',
          opacity: 0,
        }}
      >
        {/* Glassmorphism Shell */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'rgba(251, 245, 224, 0.65)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(200, 159, 112, 0.2)',
            borderRadius: '28px',
            boxShadow:
              '0 32px 80px rgba(74, 54, 45, 0.18), 0 8px 24px rgba(74, 54, 45, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          }}
        >
          {/* Top bar with close */}
          <div className="flex items-center justify-between px-7 pt-6 pb-2">
            <div className="flex items-center gap-2">
              {step > 0 && step < 2 && (
                <button
                  onClick={handleBackStep}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                  style={{ background: 'rgba(74, 54, 45, 0.08)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(74, 54, 45, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(74, 54, 45, 0.08)')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="#4A362D" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-[0.4em]"
                style={{ color: '#8B6447' }}
              >
                {step === 0 ? 'Select Drink' : step === 1 ? 'Customize' : 'Confirmed'}
              </span>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((s) => (
                  <div
                    key={s}
                    className="rounded-full transition-all duration-400"
                    style={{
                      width: s === step ? 20 : 6,
                      height: 6,
                      background:
                        s === step
                          ? 'linear-gradient(135deg, #4A362D, #8B6447)'
                          : s < step
                            ? '#C89F70'
                            : 'rgba(118, 97, 97, 0.2)',
                      borderRadius: 999,
                    }}
                  />
                ))}
              </div>

              {step < 2 && (
                <button
                  onClick={() => closeModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                  style={{ background: 'rgba(74, 54, 45, 0.08)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(74, 54, 45, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(74, 54, 45, 0.08)')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="#4A362D" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Content Area — relative container, steps absolutely stacked */}
          <div className="relative px-7 pb-7" style={{ minHeight: '380px' }}>
            {/* ─── STEP 0: Drink Selection ─── */}
            <div
              ref={(el) => (stepRefs.current[0] = el)}
              style={{ opacity: step === 0 ? 1 : 0, position: step === 0 ? 'relative' : 'absolute', inset: step === 0 ? undefined : 0, pointerEvents: step === 0 ? 'auto' : 'none', padding: step === 0 ? 0 : '0 28px 28px' }}
            >
              <h3
                className="text-2xl font-black uppercase tracking-tight mb-1"
                style={{ color: '#4A362D' }}
              >
                Choose Your Rush
              </h3>
              <p className="text-xs mb-5" style={{ color: '#8B6447' }}>
                Tap a drink to begin your order
              </p>

              <div className="space-y-2.5">
                {DRINKS.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() => handleDrinkSelect(i)}
                    className="w-full text-left rounded-2xl p-4 transition-all duration-300 group"
                    style={{
                      background: selectedDrink === i ? 'rgba(74, 54, 45, 0.1)' : 'rgba(251, 245, 224, 0.4)',
                      border: `1px solid ${selectedDrink === i ? 'rgba(200, 159, 112, 0.4)' : 'rgba(118, 97, 97, 0.08)'}`,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDrink !== i) {
                        e.currentTarget.style.background = 'rgba(74, 54, 45, 0.06)'
                        e.currentTarget.style.borderColor = 'rgba(200, 159, 112, 0.25)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDrink !== i) {
                        e.currentTarget.style.background = 'rgba(251, 245, 224, 0.4)'
                        e.currentTarget.style.borderColor = 'rgba(118, 97, 97, 0.08)'
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: d.color,
                            boxShadow: `0 0 10px ${d.accent}50`,
                          }}
                        />
                        <div>
                          <span
                            className="text-sm font-bold uppercase tracking-tight block"
                            style={{ color: '#4A362D' }}
                          >
                            {d.name}
                          </span>
                          <span
                            className="font-mono text-[10px] uppercase tracking-[0.2em]"
                            style={{ color: d.accent }}
                          >
                            {d.type}
                          </span>
                        </div>
                      </div>
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: '#4A362D' }}
                      >
                        {d.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── STEP 1: Customize ─── */}
            <div
              ref={(el) => (stepRefs.current[1] = el)}
              style={{ opacity: step === 1 ? 1 : 0, position: step === 1 ? 'relative' : 'absolute', inset: step === 1 ? undefined : 0, pointerEvents: step === 1 ? 'auto' : 'none', padding: step === 1 ? 0 : '0 28px 28px' }}
            >
              {drink && (
                <>
                  {/* Selected drink header */}
                  <div className="flex items-center gap-3 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: drink.color,
                        boxShadow: `0 0 14px ${drink.accent}60`,
                      }}
                    />
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
                      style={{ color: drink.color }}
                    >
                      {drink.type}
                    </span>
                  </div>
                  <h3
                    className="text-2xl font-black uppercase tracking-tight mb-1"
                    style={{ color: '#4A362D' }}
                  >
                    {drink.name}
                  </h3>
                  <p className="text-xs mb-6" style={{ color: '#8B6447' }}>
                    Select your size
                  </p>

                  {/* Size selector */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {SIZES.map((s, i) => (
                      <button
                        key={s.label}
                        onClick={() => setSelectedSize(i)}
                        className="rounded-2xl py-5 px-3 text-center transition-all duration-300 relative"
                        style={{
                          background:
                            selectedSize === i
                              ? 'linear-gradient(135deg, #4A362D, #6B4F3D)'
                              : 'rgba(251, 245, 224, 0.5)',
                          border: `1px solid ${selectedSize === i ? 'transparent' : 'rgba(118, 97, 97, 0.12)'}`,
                          color: selectedSize === i ? '#fbf5e0' : '#4A362D',
                          boxShadow:
                            selectedSize === i
                              ? '0 8px 24px rgba(74, 54, 45, 0.2)'
                              : 'none',
                        }}
                      >
                        <span className="block text-lg font-black uppercase tracking-tight">
                          {s.label}
                        </span>
                        <span
                          className="block font-mono text-[10px] uppercase tracking-wider mt-1"
                          style={{ opacity: 0.7 }}
                        >
                          {s.ml}
                        </span>
                        {s.extra && (
                          <span
                            className="block font-mono text-[10px] font-bold mt-1"
                            style={{ color: selectedSize === i ? '#C89F70' : '#8B6447' }}
                          >
                            {s.extra}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Order summary */}
                  <div
                    className="rounded-2xl p-4 mb-5"
                    style={{
                      background: 'rgba(74, 54, 45, 0.04)',
                      border: '1px solid rgba(118, 97, 97, 0.08)',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium" style={{ color: '#5C4A42' }}>
                        {drink.name} · {SIZES[selectedSize].label}
                      </span>
                      <span className="font-mono text-lg font-black" style={{ color: '#4A362D' }}>
                        {drink.price}
                      </span>
                    </div>
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={handleConfirmOrder}
                    className="cta-btn pointer-events-auto w-full justify-center"
                    style={{ padding: '16px 24px' }}
                  >
                    <span className="cta-bg" />
                    <span className="cta-content">
                      Confirm Order
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* ─── STEP 2: Success ─── */}
            <div
              ref={(el) => (stepRefs.current[2] = el)}
              className="flex flex-col items-center justify-center text-center"
              style={{ opacity: step === 2 ? 1 : 0, position: step === 2 ? 'relative' : 'absolute', inset: step === 2 ? undefined : 0, pointerEvents: step === 2 ? 'auto' : 'none', minHeight: '350px', padding: step === 2 ? 0 : '0 28px 28px' }}
            >
              {/* Animated checkmark */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: 'linear-gradient(135deg, #4A362D, #6B4F3D)',
                  boxShadow: '0 12px 40px rgba(74, 54, 45, 0.3)',
                }}
              >
                <svg className="w-10 h-10" fill="none" stroke="#C89F70" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3
                className="text-3xl font-black uppercase tracking-tight mb-2"
                style={{ color: '#4A362D' }}
              >
                Order Placed!
              </h3>

              {drink && (
                <p className="text-sm mb-2" style={{ color: '#5C4A42' }}>
                  Your <strong style={{ color: '#4A362D' }}>{drink.type}</strong> is being prepared.
                </p>
              )}

              <p
                className="font-mono text-xs uppercase tracking-[0.3em] mb-8"
                style={{ color: '#C89F70' }}
              >
                Fuel for the fearless
              </p>

              {/* Estimated time */}
              <div
                className="rounded-2xl px-6 py-3 mb-8 inline-flex items-center gap-3"
                style={{
                  background: 'rgba(74, 54, 45, 0.06)',
                  border: '1px solid rgba(118, 97, 97, 0.1)',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="#8B6447" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono text-xs font-bold" style={{ color: '#4A362D' }}>
                  ~3 min
                </span>
              </div>

              {/* Back to Menu — triggers 3D flip-back */}
              <button
                onClick={handleBackToMenu}
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300"
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
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
