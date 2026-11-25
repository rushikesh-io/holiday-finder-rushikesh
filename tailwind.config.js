/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./public/**/*.html', './public/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        night: {
          50: '#f6f7fb',
          100: '#eceef7',
          200: '#d9ddee',
          300: '#b5bcda',
          400: '#8a92b9',
          500: '#646c95',
          600: '#4a5179',
          700: '#343a5f',
          800: '#21264a',
          900: '#161a36',
          950: '#0d1024',
        },
        sun: { 50: '#fff8e6', 100: '#ffefc2', 300: '#fdd57a', 400: '#fbbf3c', 500: '#f4a50f', 600: '#d08306', 700: '#a5650a' },
        lagoon: { 100: '#d4f5ef', 400: '#3ccfb4', 500: '#18b39a', 600: '#0f8f7c', 700: '#0f7265' },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,16,36,.05), 0 10px 30px -14px rgba(13,16,36,.25)',
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(244,165,15,.45)' }, '100%': { boxShadow: '0 0 0 10px rgba(244,165,15,0)' } },
      },
      animation: {
        rise: 'rise .35s ease-out both',
        'pulse-ring': 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};
