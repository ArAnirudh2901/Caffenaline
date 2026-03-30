'use client'

import Preloader from '@/components/dom/Preloader'
import Navbar from '@/components/dom/Navbar'
import OrderModal from '@/components/dom/OrderModal'
import SmoothScroll from '@/components/dom/SmoothScroll'
import HeroSection from '@/components/dom/HeroSection'
import BrandStorySection from '@/components/dom/BrandStorySection'
import MenuSection from '@/components/dom/MenuSection'
import FooterSection from '@/components/dom/FooterSection'
import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
})

export default function Home() {
  return (
    <>
      <Preloader />
      <Navbar />
      <OrderModal />

      {/* R3F Canvas — fixed background with scroll-driven camera */}
      <Scene />

      {/* Scrollable DOM overlay — Lenis smooth scroll wraps all content sections */}
      <SmoothScroll>
        <main className="relative w-full z-20 pointer-events-none">

          {/* Section 1: Hero — "Adrenaline in a Cup" */}
          <HeroSection />

          {/* Section 2: Brand Story — "Defy the Ordinary" */}
          <BrandStorySection />

          {/* Section 3: 3D Morphing Menu — beverage cards */}
          <MenuSection />

          {/* Section 4: Operations & Footer */}
          <FooterSection />

        </main>
      </SmoothScroll>
    </>
  )
}
