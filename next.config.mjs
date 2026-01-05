/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Diperlukan untuk Electron
  // Disable optimizations yang tidak kompatibel dengan Electron
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
