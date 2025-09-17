// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {}, // ← tailwindcss ではなく @tailwindcss/postcss を使う！
    autoprefixer: {},
  },
};
