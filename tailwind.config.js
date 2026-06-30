/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1e3a5f",
          dark: "#152a45",
          light: "#2d5580",
        },
        gold: {
          DEFAULT: "#f0a500",
          light: "#ffc233",
          dark: "#c98700",
        },
        primary: {
          DEFAULT: "#6D4FF0",
          dark: "#4730B0",
          light: "#9B82FF",
        },
        accent: {
          DEFAULT: "#FF5C8A",
          dark: "#C7396A",
        },
        ink: "#0F0C28",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        sora: ["Sora", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(30, 58, 95, 0.25)",
        card: "0 4px 20px rgba(30, 58, 95, 0.08)",
        glow: "0 0 30px rgba(109, 79, 240, 0.35)",
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
