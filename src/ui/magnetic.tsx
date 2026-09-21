'use client'
import { useRef, type ReactNode } from 'react'

// Efecto imán: el elemento se acerca un poco al cursor y vuelve con un rebote corto.
// Solo con mouse o trackpad (no en pantallas táctiles) y nunca si el sistema pide menos movimiento.
export function Magnetic({ children, strength = 6 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  const enabled = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <span
      ref={ref}
      className="inline-block will-change-transform"
      onPointerMove={(e) => {
        const el = ref.current
        if (!el || !enabled()) return
        const r = el.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width - 0.5) * 2
        const y = ((e.clientY - r.top) / r.height - 0.5) * 2
        el.style.transition = 'translate 80ms linear'
        el.style.translate = `${x * strength}px ${y * strength}px`
      }}
      onPointerLeave={() => {
        const el = ref.current
        if (!el) return
        el.style.transition = 'translate 420ms var(--ease-spring)'
        el.style.translate = '0px 0px'
      }}
    >
      {children}
    </span>
  )
}
