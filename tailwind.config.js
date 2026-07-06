/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'Cinzel', 'serif'],
        title: ['Cinzel', 'serif'],
        body: ['Manrope', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          black: '#050505',
          charcoal: '#0b0b0b',
          gold: '#b78f2f',
          amber: '#f59e0b',
          bronze: '#6b4b3a',
          warmGray: '#9b938c'
        }
      },
      letterSpacing: {
        'widest-ss': '0.14em',
        'wide-md': '0.08em',
      },
      lineHeight: {
        'relaxed-xl': '1.18',
        'snug-md': '1.25',
      },
      boxShadow: {
        'premium-lg': '0 20px 80px rgba(2,2,2,0.6), 0 6px 30px rgba(183,143,47,0.06)',
        'premium-sm': '0 8px 24px rgba(2,2,2,0.45)'
      },
      borderRadius: {
        'xl-2': '1.5rem'
      }
    },
  },
  plugins: [],
};
