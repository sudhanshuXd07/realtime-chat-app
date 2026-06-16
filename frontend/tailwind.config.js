/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: "#0A0A0A",
          light: "#141414",
          soft: "#1E1E1E",
          muted: "#2A2A2A",
        },
        cream: {
          DEFAULT: "#F5F0E6",
          dark: "#E8DFD0",
          muted: "#C9BEAE",
          dim: "#A89B8A",
        },
        brown: {
          DEFAULT: "#7B4B28",
          light: "#9A6639",
          dark: "#5C381C",
          deeper: "#3D2412",
        },
        // Legacy aliases
        primary: "#7B4B28",
        dark: "#0A0A0A",
        light: "#F5F0E6",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 32px rgba(61, 36, 18, 0.25)",
        glow: "0 0 40px rgba(123, 75, 40, 0.3)",
      },
    },
  },
  plugins: [],
};
