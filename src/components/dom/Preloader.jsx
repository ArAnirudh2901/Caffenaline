'use client'

import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'

export default function Preloader() {
  const { progress } = useProgress()
  const isLoading = useStore((state) => state.isLoading)
  const setIsLoading = useStore((state) => state.setIsLoading)
  const shadersCompiled = useStore((state) => state.shadersCompiled)
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const tick = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev >= 100) return 100;
        if (progress === 100) return Math.min(100, prev + 2);
        if (prev < progress) return prev + 1;
        if (prev < 90) return prev + 0.1; // Slowly fake progress even if stuck
        return prev;
      });
    }, 20);
    return () => clearInterval(tick);
  }, [progress]);

  useEffect(() => {
    // Only dismiss loader when BOTH asset download is complete AND shaders are compiled
    if (displayProgress >= 100 && shadersCompiled) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [displayProgress, shadersCompiled, setIsLoading])

  // Framer motion variants to simulate the "blast doors" opening
  const blastVariantLeft = {
    initial: { x: '0%', opacity: 1 },
    exit: {
      x: '-100%',
      opacity: 0,
      transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] }
    }
  }

  const blastVariantRight = {
    initial: { x: '0%', opacity: 1 },
    exit: {
      x: '100%',
      opacity: 0,
      transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] }
    }
  }

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center text-[#FDF8F0] pointer-events-none"
          exit={{ opacity: 0, transition: { duration: 1.2, delay: 0.1 } }}
        >
          {/* Blast door panels — 1px overlap eliminates subpixel seam */}
          <motion.div
            variants={blastVariantLeft}
            initial="initial"
            exit="exit"
            className="absolute left-0 h-full bg-[#38261F]"
            style={{ width: 'calc(50% + 1px)' }}
          />
          <motion.div
            variants={blastVariantRight}
            initial="initial"
            exit="exit"
            className="absolute right-0 h-full bg-[#38261F]"
            style={{ width: 'calc(50% + 1px)' }}
          />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <h1
              className="text-4xl md:text-6xl font-black italic uppercase whitespace-nowrap overflow-clip"
              style={{
                wordSpacing: '0.2em',
                letterSpacing: '1px',
              }}
            >
              Brewing the rush...
            </h1>
            <div className="w-64 h-1 bg-[#4F3C32] rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 left-0 h-full bg-[#D4A373] shadow-[0_0_15px_#D4A373]"
                style={{ width: `${displayProgress}%`, transition: 'width 0.1s linear' }}
              />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#967969]">
              {Math.min(100, Math.floor(displayProgress))}% Fueled
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
