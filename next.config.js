/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any https source (for imageUrl fields)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;
