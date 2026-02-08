/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: { DEFAULT: '#00e5ff' },
        blue: { DEFAULT: '#0077ff' }
      },
      fontFamily: {
        header: ['Orbitron', 'sans-serif'],
        mono: ['Rajdhani', 'monospace'],
        body: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
