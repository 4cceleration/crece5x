import type { Metadata } from 'next'
import { Backdrop } from '@/ui/backdrop'
import { ThemeToggle } from '@/ui/theme-toggle'

// El enlace lleva el token en la ruta: que no se indexe ni viaje como referer al salir de la página
export const metadata: Metadata = {
  title: 'crece5x · Estados financieros',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

// Página pública para el contador invitado: sin cuenta y sin la barra de la app
export default function ContadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Backdrop />
      <div className="absolute right-3 top-3">
        <ThemeToggle />
      </div>
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">{children}</main>
    </>
  )
}
