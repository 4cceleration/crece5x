import type { Metadata } from 'next'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' })

export const metadata: Metadata = {
  title: 'CRECE · Consulta NIIF',
  description: 'Diagnóstico y guía NIIF para pymes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  )
}
