import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Inter variable: todos los pesos, del regular del texto al negrita de los títulos
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'crece5x · Consulta NIIF',
  description: 'Diagnóstico y guía NIIF para pymes',
}

// Solo modo oscuro: la barra del navegador y sus controles se pintan con el fondo de la app (--color-canvas)
export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0E1413',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
