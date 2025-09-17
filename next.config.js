/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番ビルドで ESLint エラーで止まらないように（前の設定を維持）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ← これが肝心：Sanity の CDN を Next/Image に許可
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**", // 画像パス
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/files/**", // 念のためファイル系も許可
      },
    ],
  },
};

module.exports = nextConfig;
