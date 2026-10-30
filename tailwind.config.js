/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f3f5fb',
          100: '#e4e8f4',
          200: '#c8d0e6',
          300: '#9aa6cb',
          400: '#6b7aab',
          500: '#4a5a90',
          600: '#364475',
          700: '#2a3560',
          800: '#1f2850',
          900: '#141b3c',
          950: '#0b1030',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 64, 0.04), 0 4px 14px rgba(16, 24, 64, 0.05)',
      },
    },
  },
  plugins: [],
};
