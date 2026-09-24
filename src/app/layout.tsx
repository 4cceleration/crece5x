import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Inter variable: todos los pesos, del regular del texto al negrita de los títulos
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'crece5x · Consulta NIIF',
  description: 'Diagnóstico y guía NIIF para pymes',
}

// Aplica el tema guardado antes del primer pintado; sin preferencia manda el sistema (globals.css)
const TEMA_GUARDADO = "try{var t=localStorage.getItem('tema');if(t)document.documentElement.dataset.theme=t}catch(e){}"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: TEMA_GUARDADO }} />
        {children}
      </body>
    </html>
  )
}
