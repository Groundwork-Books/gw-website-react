/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      
      fontFamily: {
        'calluna': ['var(--font-calluna)', 'serif'],
        'helvetica': ['var(--font-helvetica)', 'sans-serif'],
      },
      colors: {
        'gw-green': {
          1: '#1D4825',
          2: '#DCE6DD',
        },
        'gw-white': '#ffffff',
        'gw-black': '#0C0C0C',
      }
    },
  },
  plugins: [],
}
