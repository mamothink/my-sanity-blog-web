/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ビルド時に ESLint エラーで止まらないようにする
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
