/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#e8f1fe',
          100: '#d1e3fd',
          200: '#a3c7fb',
          300: '#75abf8',
          400: '#3d8af2',
          500: '#1470ea',
          600: '#065fdf',
          700: '#054dc0',
          800: '#043ea0',
          900: '#032e78',
          950: '#021c4a',
        },
        accent: {
          400: '#3d8af2',
          500: '#1470ea',
          600: '#065fdf',
        },
      },
      boxShadow: {
        card: '0 10px 30px -18px rgba(6, 95, 223, 0.4)',
        auth: '0 28px 80px -24px rgba(2, 28, 74, 0.28)',
      },
    },
  },
  plugins: [],
};
