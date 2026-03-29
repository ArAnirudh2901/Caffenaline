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
    lenis.scrollTo(target, {
      offset,
      force: true,
      immediate,
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
