import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // ← これ重要
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
