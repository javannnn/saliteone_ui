/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d6ebff",
          200: "#a8d4ff",
          300: "#73b8ff",
          400: "#3b97ff",
          500: "#147dff",
          600: "#0e63d1",
          700: "#0b4da5",
          800: "#093d82",
          900: "#082f66"
        }
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
}
