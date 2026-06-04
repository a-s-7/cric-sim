/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      height: {
        '34': '8.5rem',
        '42': '10.5rem',
      }
    },
  },
  plugins: [],
}


