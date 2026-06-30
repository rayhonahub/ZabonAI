/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#14B8A6', light: '#2DD4BF', dark: '#0D9488' },
        accent: { DEFAULT: '#FBBF24', dark: '#D97706' },
        bg: { DEFAULT: '#061A1C', mid: '#0A2A2E', light: '#0E3A3F' },
        surface: 'rgba(255,255,255,0.04)',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        sora: ["Sora", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(6,26,28,0.4)",
        card: "0 4px 20px rgba(6,26,28,0.15)",
        glow: "0 0 30px rgba(20,184,166,0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pop": "pop 0.25s ease-out",
        "typing": "typing 1.2s infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-up-fade": "slideUpFade 0.35s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideUpFade: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
        typing: {
          "0%, 60%, 100%": { opacity: 0.3 },
          "30%": { opacity: 1 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
