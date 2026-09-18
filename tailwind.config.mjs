/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ember: { 400: '#e07a3d', 500: '#c45c28', 600: '#a84a1e', 700: '#8a3c1b' },
        dusk: { 800: '#2a2420', 900: '#1a1614', 950: '#0f0d0c' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      letterSpacing: { widestx: '0.2em' },
      animation: {
        'pulse-price': 'pulse-price 2.4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-price': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.04)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
