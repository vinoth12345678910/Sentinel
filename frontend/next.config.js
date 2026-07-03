/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '',
  assetPrefix: '',
  images: { unoptimized: true },
  trailingSlash: false,
  distDir: '.next',
}

module.exports = nextConfig
