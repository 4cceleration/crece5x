'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ChartKey } from '@/domain/charts'
import { Spinner } from '@/ui/spinner'

export type ExplainAction = (key: ChartKey) => Promise<string>

const ASK =
  'flex size-8 shrink-0 items-center justify-center rounded-full bg-ink/5 font-semibold text-muted transition-colors hover:bg-brand-soft hover:text-brand-strong'

type State = { kind: 'idle' } | { kind: 'cargando' } | { kind: 'listo'; text: string } | { kind: 'error'; message: string }

// Tarjeta de una gráfica con su botón "?": el modelo explica en un diálogo lo que hay en pantalla
export function ChartCard({
  title,
  chartKey,
  explainAction,
  upgrade,
  children,
  className = '',
}: {
  title: string
  chartKey: ChartKey
  explainAction?: ExplainAction
  /** Sin permiso para la explicación: el "?" lleva a ver los planes */
  upgrade?: { href: string; label: string }
  children: React.ReactNode
  className?: string
}) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const dialog = useRef<HTMLDialogElement>(null)

  // Cerrar con Escape o con el botón deja el <dialog> en un estado que hay que reflejar
  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onClose = () => setState((s) => (s.kind === 'cargando' ? { kind: 'idle' } : s))
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [])

  async function open() {
    dialog.current?.showModal()
    // La explicación se pide una sola vez por gráfica
    if (state.kind === 'listo' || state.kind === 'cargando' || !explainAction) return
    setState({ kind: 'cargando' })
    try {
      const text = await explainAction(chartKey)
      setState({ kind: 'listo', text })
    } catch {
      setState({ kind: 'error', message: 'No pudimos preparar la explicación. Intente de nuevo.' })
    }
  }

  return (
    <section className={`glass flex flex-col gap-5 rounded-lg p-6 text-left ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {explainAction ? (
          <button
            type="button"
            onClick={open}
            aria-label={`Explicar la gráfica ${title}`}
            title={`Explicar la gráfica ${title}`}
            className={ASK}
          >
            ?
          </button>
        ) : (
          upgrade && (
            <Link href={upgrade.href} aria-label={`${upgrade.label}: ${title}`} title={upgrade.label} className={ASK}>
              ?
            </Link>
          )
        )}
      </header>

      {children}

      <dialog
        ref={dialog}
        className="animate-pop m-auto w-[min(34rem,calc(100vw-2rem))] glass rounded-lg p-0 text-ink backdrop:bg-canvas/50 backdrop:backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-4">
          <p className="font-display text-lg font-semibold">{title}</p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Cerrar"
            className="-mr-2 flex size-9 items-center justify-center rounded-full text-xl leading-none text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm leading-relaxed" aria-live="polite">
          {state.kind === 'cargando' && (
            <p className="flex items-center gap-2 text-muted">
              <Spinner />
              Leyendo sus cifras…
            </p>
          )}
          {state.kind === 'listo' &&
            state.text.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          {state.kind === 'error' && <p className="text-bad">{state.message}</p>}
        </div>
        <div className="flex justify-end px-6 pb-5">
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-md px-4 py-2 text-sm font-medium text-brand-strong transition-colors hover:bg-brand-soft"
          >
            Entendido
          </button>
        </div>
      </dialog>
    </section>
  )
}
