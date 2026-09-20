import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'unpdf', '@electric-sql/pglite', 'tesseract.js', '@napi-rs/canvas'],
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
