/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#04060c',
          900: '#070b15',
          800: '#0b1121',
          700: '#111a30',
          600: '#1a2542',
        },
        gold: {
          DEFAULT: '#f5c518',
          300: '#ffe066',
          400: '#ffd43b',
          500: '#f5c518',
          600: '#d9a800',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(245,197,24,.4), 0 8px 30px -8px rgba(245,197,24,.45)',
        panel: '0 20px 60px -20px rgba(0,0,0,.8)',
      },
      keyframes: {
        slideIn: { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'none' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        pop: { from: { opacity: 0, transform: 'scale(.97) translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'slide-in': 'slideIn .25s ease-out',
        'fade-in': 'fadeIn .2s ease-out',
        pop: 'pop .22s ease-out',
      },
    },
  },
  plugins: [],
}
