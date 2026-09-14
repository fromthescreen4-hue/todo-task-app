/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px'
      },
      colors: {
        pastel: {
          bg: '#f3f2f8',
          card: '#ffffff',
          teal: '#2dd4bf',
          indigo: '#6366f1',
          coral: '#fb7185',
          orange: '#f97316',
          purple: '#c084fc',
          mint: '#a7f3d0',
          yellow: '#fde047'
        }
      },
      boxShadow: {
        'pastel': '0 12px 32px -4px rgba(112, 107, 144, 0.08), 0 4px 12px -2px rgba(112, 107, 144, 0.04)',
        'pastel-hover': '0 16px 40px -4px rgba(112, 107, 144, 0.14)',
        'orange-glow': '0 10px 25px rgba(249, 115, 22, 0.45)'
      }
    },
  },
  plugins: [],
}
