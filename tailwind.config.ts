import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0a08",
          900: "#14110d",
          800: "#1f1a14"
        },
        choco: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12"
        },
        cocoa: {
          50: "#fdf7f2",
          100: "#f7e9dd",
          200: "#e9cbb4",
          300: "#d7aa87",
          400: "#c58862",
          500: "#ae6a4b",
          600: "#8d4f38",
          700: "#6b3a29",
          800: "#4b271d",
          900: "#2c1812"
        }
      },
      boxShadow: {
        "comic": "0 0 0 2px rgba(255,255,255,0.9), 0 0 0 6px rgba(0,0,0,0.6), 0 18px 40px rgba(0,0,0,0.55)"
      }
    }
  },
  plugins: []
} satisfies Config;
