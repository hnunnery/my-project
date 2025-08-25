import tailwindcss from "@tailwindcss/postcss";

const config = {
  plugins: [tailwindcss({ config: "./tailwind.config.ts" })],
};

export default config;
