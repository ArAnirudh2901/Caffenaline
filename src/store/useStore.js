import { create } from 'zustand'

export const useStore = create((set) => ({
  // Scroll and App State
  scrollProgress: 0,
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  
  // Scroll velocity for kinetic typography (pixels/second, clamped)
  scrollVelocity: 0,
  setScrollVelocity: (velocity) => set({ scrollVelocity: velocity }),

  // Current section index (0=Hero, 1=Story, 2=Menu, 3=Footer)
  currentSection: 0,
  setCurrentSection: (section) => set({ currentSection: section }),

  // Menu/Coffee Morph State (0.0 to 4.0 for Espresso -> Mocha -> Hot Choc)
  coffeeProgress: 0.0,
  setCoffeeProgress: (progress) => set({ coffeeProgress: progress }),

  // Active menu item (0-4 for beverage selection, -1 for none)
  activeMenuItem: 2, // Default: Cloud Nine (Cappuccino)
  setActiveMenuItem: (index) => set({ activeMenuItem: index }),

  // Interaction State
  hoverIndex: -1,
  setHoverIndex: (index) => set({ hoverIndex: index }),
  
  // Loading State
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Shader compilation state — set true after gl.compile() completes
  shadersCompiled: false,
  setShadersCompiled: (compiled) => set({ shadersCompiled: compiled }),

  // GPU Performance Tier — 'high' or 'low' (set by PerformanceMonitor)
  performanceTier: 'high',
  setPerformanceTier: (tier) => set({ performanceTier: tier }),

  // Order Modal State
  orderModalOpen: false,
  setOrderModalOpen: (open) => set({ orderModalOpen: open }),
  orderStep: 0, // 0=menu, 1=customize, 2=success
  setOrderStep: (step) => set({ orderStep: step }),
  // Rect of the "Order Now" button for origin-aware animation
  orderButtonRect: null,
  setOrderButtonRect: (rect) => set({ orderButtonRect: rect }),
}))
