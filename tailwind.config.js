/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#FFFDF5',
          100: '#FFF8E7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FFBF1F',
          500: '#FFAE00',
          600: '#F09B00',
          700: '#D97706',
          800: '#92400E',
          900: '#78350F',
        },
      },
      borderRadius: {
        card: '16px',
        btn:  '12px',
      },
      boxShadow: {
        card:   '0 4px 20px rgba(0, 0, 0, 0.04)',
        accent: '0 4px 16px rgba(255, 174, 0, 0.28)',
        modal:  '0 20px 60px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
