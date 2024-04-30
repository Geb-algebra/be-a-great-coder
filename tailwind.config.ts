import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      colors: {
        "factory-base": "#FFFFFF",
        "factory-card": "#F5F2E8",
        "factory-accent-1": "#561C24",
        "factory-accent-2": "#6D2932",
        "factory-accent-3": "#C7B7A3",
        "factory-border": "#FFFFFF",
        "factory-text-light": "#FFFFFF",
        "factory-text-dark": "#000000",
        "lab-base": "#FFFFFF",
        "lab-card": "#F5F2E8",
        "lab-accent-1": "#265073",
        "lab-accent-2": "#2D9596",
        "lab-accent-3": "#9AD0C2",
        "lab-border": "#FFFFFF",
        "lab-text-light": "#FFFFFF",
        "lab-text-dark": "#000000",
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
