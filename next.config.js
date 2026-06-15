/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pptxgenjs', 'docx']
  },
  // Ensure API routes that use fs run in Node.js runtime (not Edge)
  serverRuntimeConfig: {
    runtime: 'nodejs',
  },
}

module.exports = nextConfig
