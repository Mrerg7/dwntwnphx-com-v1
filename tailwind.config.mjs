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
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
