const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gramsathi.ai' },
      { protocol: 'https', hostname: 'api.gramsathi.ai' },
      { protocol: 'https', hostname: 'cdn.gramsathi.ai' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
      {
        source: '/voice/:path*',
        destination: `${process.env.NEXT_PUBLIC_VOICE_API_URL || 'http://localhost:3002/voice'}/:path*`,
      },
    ];
  },
};

export default config;
