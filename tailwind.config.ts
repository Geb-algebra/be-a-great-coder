import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      colors: {
        base: "#FFFFFF",
        card: "#F5F2E8",
        "accent-1": "#265073",
        "accent-2": "#2D9596",
        "accent-3": "#9AD0C2",
        border: "#FFFFFF",
        "text-light": "#FFFFFF",
        "text-dark": "#000000",
        "header-base": "#FFFFFF",
        "header-accent": "#FFFFFF",
        "header-border": "#000000",
        "header-text-light": "#FFFFFF",
        "header-text-dark": "#000000",
      },
    },
    fontFamily: {
      sans: ['"Ubuntu"', '"Noto Sans JP"', "sans-serif"],
      mono: ['"Ubuntu Mono"', '"Noto Sans JP"', "sans-serif"],
    },
  },
  plugins: [],
} satisfies Config;
