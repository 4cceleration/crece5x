'use client'
import { useSyncExternalStore } from 'react'
import { Icon } from './icons'

export type Theme = 'claro' | 'oscuro'

const CAMBIO = 'tema:cambiado'

function subscribe(onChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', onChange)
  window.addEventListener(CAMBIO, onChange)
  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener(CAMBIO, onChange)
  }
}

function current(): Theme {
  const chosen = document.documentElement.dataset.theme as Theme | undefined
  return chosen ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro')
}

// La preferencia es de cada navegador: se guarda en localStorage y la aplica el script de
// src/app/layout.tsx antes de pintar, para que no haya parpadeo. Sin elección, manda el sistema.
export function ThemeToggle({ className = '' }: { className?: string }) {
  // En el servidor no se sabe el tema: el botón se pinta neutro y se corrige al hidratar
  const theme = useSyncExternalStore(subscribe, current, () => null)
  const next: Theme = theme === 'oscuro' ? 'claro' : 'oscuro'
  const label = theme === null ? 'Cambiar el tema' : `Cambiar a modo ${next}`

  function toggle() {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('tema', next)
    } catch {
      // Navegador sin almacenamiento: el cambio vale para esta pantalla
    }
    window.dispatchEvent(new Event(CAMBIO))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-muted transition-[color] hover:text-ink focus-visible:-outline-offset-2 ${className}`}
    >
      <Icon name={next} size={18} />
    </button>
  )
}
