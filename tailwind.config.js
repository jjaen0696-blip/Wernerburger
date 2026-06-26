/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#c8102e',
          light: '#e21b3c',
          dark: '#8c0a20',
          deep: '#4a0610',
          night: '#1a0508',
        },
        gold: {
          DEFAULT: '#e6b450',
          light: '#f4d68a',
          deep: '#b8860b',
        },
        ink: {
          DEFAULT: '#0b0809',
          800: '#141011',
          700: '#1c1718',
          600: '#26201f',
        },
      },
      fontFamily: {
        display: ['Sora', 'Arial Black', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 50px -24px rgba(0, 0, 0, 0.85)',
        'glow-gold': '0 18px 50px -12px rgba(230, 180, 80, 0.45)',
        'glow-red': '0 18px 50px -12px rgba(200, 16, 46, 0.55)',
        soft: '0 8px 30px -10px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'gold-grad': 'linear-gradient(135deg, #f4d68a 0%, #e6b450 50%, #b8860b 100%)',
        'yellow-cta': 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
      },
    },
  },
  plugins: [],
};
