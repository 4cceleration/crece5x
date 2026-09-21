'use client'
import { useEffect, useState } from 'react'

// Cuenta desde 0 hasta el valor mientras se dibuja el anillo. Si el sistema pide menos movimiento, muestra el valor final
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value)

  useEffect(() => {
    // Con menos movimiento no se anima: el estado ya arranca en el valor final
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // Misma curva que el dibujo del anillo (ease-out-soft), para que terminen juntos
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(value * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    // El primer cuadro ya pinta el 0; así no hay setState síncrono dentro del efecto
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{shown}</>
}
