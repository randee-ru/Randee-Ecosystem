import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@randee/ui', '@randee/builder', '@randee/blocks']
}

export default nextConfig
