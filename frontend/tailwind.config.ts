import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet laundry: biru-teal bersih & segar
        brand: {
          50: "#eff9ff",
          100: "#dbf1ff",
          200: "#bfe7ff",
          300: "#92d8ff",
          400: "#5ec0ff",
          500: "#39a3ff",
          600: "#2283f5",
          700: "#1a6ae1",
          800: "#1c56b6",
          900: "#1d4a8f",
        },
        accent: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      // Status cucian → masing-masing punya warna khas
      status: {
        antrian: "#94a3b8", // slate
        cuci: "#3b82f6", // blue
        setrika: "#a855f7", // purple
        siap: "#10b981", // emerald
        diambil: "#64748b", // slate-dark
      },
    },
  },
  plugins: [],
};

export default config;
