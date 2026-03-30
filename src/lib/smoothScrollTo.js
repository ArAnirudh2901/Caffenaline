const EDGE_TARGETS = new Set(['top', 'left', 'start', 'bottom', 'right', 'end'])

function getNavbarOffset() {
  if (typeof document === 'undefined') return 0

  const navbar = document.querySelector('[data-navbar]')
  if (!(navbar instanceof HTMLElement)) return 0

  return -(navbar.getBoundingClientRect().height + 16)
}

export function smoothScrollTo(target, options = {}) {
  if (typeof window === 'undefined') return

  const offset = options.offset ?? getNavbarOffset()
  const immediate = options.immediate ?? false
  const behavior = immediate ? 'auto' : 'smooth'
  const lenis = window.__lenis

  if (lenis?.scrollTo) {
    // Dynamically compute duration based on scroll distance for cinematic pacing:
    // short hops (~500px) ≈ 2s, full-page traversals (~4000px+) ≈ 4.5s
    let duration = options.duration
    if (!duration) {
      let distance = 2000 // fallback
      try {
        let targetEl = null
        if (typeof target === 'string' && !EDGE_TARGETS.has(target)) {
          targetEl = document.querySelector(target)
        } else if (target instanceof HTMLElement) {
          targetEl = target
        }
        if (targetEl) {
          const targetTop = targetEl.getBoundingClientRect().top + window.scrollY + offset
          distance = Math.abs(targetTop - window.scrollY)
        }
      } catch (_) { /* use fallback */ }

      // Clamp between 2.5s (short) and 10s (full-page traversal)
      duration = Math.min(10.0, Math.max(2.5, 2.5 + (distance / 550)))
    }

    lenis.scrollTo(target, {
      offset,
      force: true,
      immediate,
      duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    return
  }

  if (typeof target === 'string' && EDGE_TARGETS.has(target)) {
    const top = ['bottom', 'right', 'end'].includes(target)
      ? document.documentElement.scrollHeight - window.innerHeight
      : 0

    window.scrollTo({ top, behavior })
    return
  }

  const element =
    typeof target === 'string' ? document.querySelector(target) : target

  if (!(element instanceof HTMLElement)) return

  const top = element.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior })
}
