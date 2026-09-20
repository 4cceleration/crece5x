import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer', 'unpdf', '@electric-sql/pglite'],
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
