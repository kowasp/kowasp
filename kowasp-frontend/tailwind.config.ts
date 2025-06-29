import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#2563eb", // blue-600
        secondary: "#64748b", // slate-500
        error: "#dc2626", // red-600
        warning: "#d97706", // amber-600
        info: "#0891b2", // cyan-600
        success: "#16a34a", // green-600
      },
    },
  },
  plugins: [],
} satisfies Config;
