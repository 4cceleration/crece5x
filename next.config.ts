import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // El proceso auxiliar de Tesseract se carga en tiempo de ejecución: hay que incluir sus archivos en la función
  outputFileTracingIncludes: {
    '/consulta/[id]/examinar': ['./node_modules/tesseract.js/**', './node_modules/tesseract.js-core/**'],
  },
  serverExternalPackages: ['@react-pdf/renderer', 'unpdf', '@electric-sql/pglite', 'tesseract.js', '@napi-rs/canvas'],
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
